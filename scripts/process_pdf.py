import os
import sys
import shutil
import subprocess
import glob
import re
from PIL import Image  # This is the new "Scissors" tool

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

    pdf_path = pdfs[0]
    filename = os.path.basename(pdf_path)
    date_str = filename.replace(".pdf", "")
    
    print(f"Processing Edition: {date_str}")

    # 2. Create Output Directory
    output_dir = os.path.join(PAPERS_DIR, date_str)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # 3. Convert PDF to Images
    subprocess.run([
        "pdftoppm", 
        "-png", 
        pdf_path, 
        os.path.join(output_dir, "")
    ], check=True)

    # 4. Rename images
    images = sorted(glob.glob(os.path.join(output_dir, "*.png")))
    page_count = len(images)
    
    for i, img_path in enumerate(images):
        new_name = os.path.join(output_dir, f"{i + 1}.png")
        os.rename(img_path, new_name)
    
    print(f"Converted {page_count} pages.")

    # 5. Update app.js
    update_app_js(date_str, page_count)

    # 6. Create Smart Preview (The New Feature)
    first_page_path = os.path.join(output_dir, "1.png")
    if os.path.exists(first_page_path):
        create_smart_preview(date_str, first_page_path)

    # 7. Clean up (DISABLED: Keep PDF for WhatsApp Sharing)
    # os.remove(pdf_path)
    print("PDF processed. Kept original file for WhatsApp sharing.")

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
            print(f"Entry for {date_key} already exists")

def create_smart_preview(date_str, source_image_path):
    target_cover = os.path.join(ASSETS_DIR, "latest-cover.png")
    
    # --- SMART CROP LOGIC START ---
    # We open Page 1 and cut out the TOP 45% (Logo + Headlines)
    with Image.open(source_image_path) as img:
        width, height = img.size
        # Crop: (Left, Top, Right, Bottom)
        # We take the full width, but only the top 45% of the height
        crop_height = int(height * 0.45) 
        
        cropped_img = img.crop((0, 0, width, crop_height))
        cropped_img.save(target_cover)
        print(f"Created Smart Crop (Top 45%) for WhatsApp preview")
    # --- SMART CROP LOGIC END ---

    # Update index.html
    with open(INDEX_HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    new_image_url = f"{DOMAIN_URL}/assets/latest-cover.png?v={date_str}"

    pattern_og = r'(<meta property="og:image" content=")([^"]+)(")'
    html_content = re.sub(pattern_og, f'\\g<1>{new_image_url}\\g<3>', html_content)

    pattern_tw = r'(<meta name="twitter:image" content=")([^"]+)(")'
    html_content = re.sub(pattern_tw, f'\\g<1>{new_image_url}\\g<3>', html_content)

    with open(INDEX_HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("Updated index.html social tags.")

if __name__ == "__main__":
    main()