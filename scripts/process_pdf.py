import os
import sys
import shutil
import subprocess
import glob
import re

# CONFIGURATION
UPLOADS_DIR = "uploads"
PAPERS_DIR = "papers"
ASSETS_DIR = "assets"
APP_JS_FILE = "app.js"
INDEX_HTML_FILE = "index.html"
DOMAIN_URL = "https://epaperb10vartha.in"

def main():
    # 1. Find the PDF
    pdfs = glob.glob(os.path.join(UPLOADS_DIR, "*.pdf"))
    if not pdfs:
        print("No PDF found in uploads/ folder.")
        return

    pdf_path = pdfs[0] # Take the first PDF found
    filename = os.path.basename(pdf_path)
    date_str = filename.replace(".pdf", "") # Assumes format DD-MM-YYYY.pdf
    
    print(f"Processing Edition: {date_str}")

    # 2. Create Output Directory
    output_dir = os.path.join(PAPERS_DIR, date_str)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir) # Clear if exists (re-upload fix)
    os.makedirs(output_dir)

    # 3. Convert PDF to Images (Using pdftoppm)
    # Output format will be 1.png, 2.png...
    subprocess.run([
        "pdftoppm", 
        "-png", 
        pdf_path, 
        os.path.join(output_dir, "")
    ], check=True)

    # 4. Rename images (pdftoppm outputs -01.png, we want 1.png)
    images = sorted(glob.glob(os.path.join(output_dir, "*.png")))
    page_count = len(images)
    
    for i, img_path in enumerate(images):
        new_name = os.path.join(output_dir, f"{i + 1}.png")
        os.rename(img_path, new_name)
    
    print(f"Converted {page_count} pages.")

    # 5. Update app.js
    update_app_js(date_str, page_count)

    # 6. Update Social Media Preview (The New Feature)
    first_page_path = os.path.join(output_dir, "1.png")
    if os.path.exists(first_page_path):
        update_social_preview(date_str, first_page_path)

    # 7. Clean up
    os.remove(pdf_path)
    print("PDF processed, preview updated, and file removed.")

def update_app_js(date_key, pages):
    with open(APP_JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    new_entry = f'    "{date_key}": {{ pages: {pages} }},\n'
    marker = "// ROBOT_ENTRY_POINT"

    if marker in content:
        if f'"{date_key}"' not in content:
            new_content = content.replace(marker, marker + "\n" + new_entry)
            with open(APP_JS_FILE, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated app.js with {date_key}")
        else:
            print(f"Entry for {date_key} already exists in app.js")
    else:
        print("ERROR: Marker // ROBOT_ENTRY_POINT not found in app.js")

def update_social_preview(date_str, first_page_source):
    # A. Copy Page 1 to assets/latest-cover.png
    target_cover = os.path.join(ASSETS_DIR, "latest-cover.png")
    shutil.copy(first_page_source, target_cover)
    print(f"Updated assets/latest-cover.png with Page 1 of {date_str}")

    # B. Update index.html to force WhatsApp to see the new image
    # We add ?v=DATE to the URL. This tricks WhatsApp into thinking it's a new file.
    
    with open(INDEX_HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    # The new image link with a version tag
    new_image_url = f"{DOMAIN_URL}/assets/latest-cover.png?v={date_str}"

    # Regex to replace the og:image content
    # Looks for: <meta property="og:image" content="...">
    pattern_og = r'(<meta property="og:image" content=")([^"]+)(")'
    html_content = re.sub(pattern_og, f'\\g<1>{new_image_url}\\g<3>', html_content)

    # Regex to replace the twitter:image content
    pattern_tw = r'(<meta name="twitter:image" content=")([^"]+)(")'
    html_content = re.sub(pattern_tw, f'\\g<1>{new_image_url}\\g<3>', html_content)

    with open(INDEX_HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("Updated index.html social tags.")

if __name__ == "__main__":
    main()