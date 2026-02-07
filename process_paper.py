import os
import datetime
import shutil
import re
from pdf2image import convert_from_path

# --- CONFIGURATION ---
UPLOAD_FOLDER = "pdf-upload"
PAPERS_FOLDER = "papers"
APP_JS_FILE = "app.js"
INDEX_HTML_FILE = "index.html"

def main():
    # 1. Check if a PDF exists in the upload folder
    if not os.path.exists(UPLOAD_FOLDER):
        print("No upload folder found.")
        return

    files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith(".pdf")]
    if not files:
        print("No PDF found in pdf-upload folder.")
        return

    pdf_filename = files[0]
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
    print(f"Processing: {pdf_filename}")

    # 2. Get Date (IST - Indian Standard Time)
    utc_now = datetime.datetime.utcnow()
    ist_now = utc_now + datetime.timedelta(hours=5, minutes=30)
    folder_date = ist_now.strftime("%d-%m-%Y")
    
    # 3. Create Date Folder
    target_folder = os.path.join(PAPERS_FOLDER, folder_date)
    if os.path.exists(target_folder):
        shutil.rmtree(target_folder) # Overwrite if exists
    os.makedirs(target_folder)

    # 4. Convert PDF to Images
    print("Converting PDF to images...")
    try:
        images = convert_from_path(pdf_path, dpi=200) # 200 DPI is good balance
        
        page_count = 0
        for i, image in enumerate(images):
            page_count += 1
            image_name = f"{page_count}.png"
            image.save(os.path.join(target_folder, image_name), "PNG")
        
        print(f"Created {page_count} pages.")
    except Exception as e:
        print(f"Error converting PDF: {e}")
        return

    # 5. Move the PDF to the target folder
    shutil.move(pdf_path, os.path.join(target_folder, "full.pdf"))

    # 6. Update app.js
    print("Updating app.js...")
    with open(APP_JS_FILE, "r", encoding="utf-8") as f:
        js_content = f.read()

    # Create the new entry string
    new_entry = f'    "{folder_date}": {{ pages: {page_count}, pdf: "full.pdf" }},'
    
    # Inject it right after "const editions = {"
    # Using the special marker we added in app.js
    if "// ROBOT_ENTRY_POINT" in js_content:
        # Check if entry already exists to avoid duplicates
        if new_entry.strip() not in js_content:
            js_content = js_content.replace("// ROBOT_ENTRY_POINT", "// ROBOT_ENTRY_POINT\n" + new_entry)
            with open(APP_JS_FILE, "w", encoding="utf-8") as f:
                f.write(js_content)
    else:
        print("ERROR: ROBOT_ENTRY_POINT not found in app.js")
    
    # 7. Clean index.html (Remove "Coming Soon" if present)
    print("Cleaning index.html...")
    with open(INDEX_HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Regex to find the "Coming Soon" div we added earlier
    # Matches the exact style you used
    pattern = r'