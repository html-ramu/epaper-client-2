// CONFIGURATION
const REPO_URL = "https://sekharbyiram-max.github.io/b10-epaper"; 

// MOCK DATA (In a real app, you might fetch a manifest.json)
const editions = {
    "28-01-2026": { pages: 5, pdf: "full.pdf" },
    // ROBOT_ENTRY_POINT
    "27-01-2026": { pages: 8, pdf: "full.pdf" },
    "26-01-2026": { pages: 6, pdf: "full.pdf" },
    "25-01-2026": { pages: 8, pdf: "full.pdf" }
};

// STATE
let currentDateStr = "27-01-2026"; 
let currentPage = 1;
let totalPages = 1;
let cropper = null; 

// INITIALIZATION
window.onload = function() {
    setupDateDisplay();
    loadEdition(currentDateStr);
};

// 1. DATE & DISPLAY LOGIC
function setupDateDisplay() {
    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getFullYear();
    document.getElementById('headerDate').innerText = dateStr;
    
    if(editions[dateStr]) {
        currentDateStr = dateStr;
    } else {
        currentDateStr = Object.keys(editions)[0];
    }
    
    populateDateDropdown();
}

function loadEdition(dateStr) {
    if (!editions[dateStr]) {
        alert("Edition not found");
        return;
    }
    currentDateStr = dateStr;
    currentPage = 1;
    totalPages = editions[dateStr].pages;
    
    document.getElementById('liveDate').innerText = dateStr;
    document.getElementById('btnPdf').href = `papers/${dateStr}/${editions[dateStr].pdf}`;
    
    updateViewer();
}

function updateViewer() {
    const imgPath = `papers/${currentDateStr}/${currentPage}.png`;
    const imgElement = document.getElementById('pageImage');
    const indicator = document.getElementById('pageIndicator');
    
    imgElement.style.opacity = "0.5";
    imgElement.src = imgPath;
    indicator.innerText = `Page ${currentPage} / ${totalPages}`;

    imgElement.onload = function() { imgElement.style.opacity = "1"; };
    imgElement.onerror = function() { imgElement.alt = "Page not found or uploading..."; };

    document.getElementById('btnPrev').disabled = (currentPage === 1);
    document.getElementById('btnNext').disabled = (currentPage === totalPages);
}

// 2. NAVIGATION
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateViewer();
        window.scrollTo(0, 120); 
    }
}

// 3. MENU & UI INTERACTIONS
function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    } else {
        sidebar.style.width = "250px";
    }
}

function setActive(element) {
    const items = document.querySelectorAll('.cat-item');
    items.forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

// 4. EDITION SELECTOR
function populateDateDropdown() {
    const select = document.getElementById('dateSelect');
    select.innerHTML = "";
    Object.keys(editions).forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.text = date;
        select.appendChild(option);
    });
    select.value = currentDateStr;
}

function openEditionSelector() { document.getElementById('editionModal').style.display = "block"; }
function closeEditionSelector() { document.getElementById('editionModal').style.display = "none"; }
function loadSelectedEdition() {
    const selectedDate = document.getElementById('dateSelect').value;
    loadEdition(selectedDate);
    closeEditionSelector();
}

// 5. ADVANCED CLIPPER (WITH BRANDING)
function toggleClipper() {
    const modal = document.getElementById('clipperOverlay');
    const pageImg = document.getElementById('pageImage');
    const clipImg = document.getElementById('clipperImage');
    
    if (modal.style.display === "flex") {
        modal.style.display = "none";
        if (cropper) { cropper.destroy(); cropper = null; }
    } else {
        modal.style.display = "flex"; 
        clipImg.src = pageImg.src;

        setTimeout(() => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(clipImg, {
                viewMode: 1, 
                dragMode: 'move', 
                autoCropArea: 0.5, 
                guides: true, 
                background: false, 
                movable: true,
                zoomable: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
            });
        }, 100);
    }
}

// --- NEW HELPER: Creates the branded image ---
function getBrandedCanvas() {
    if (!cropper) return null;

    // 1. Get the raw cropped image
    const cropCanvas = cropper.getCroppedCanvas();
    if (!cropCanvas) return null;

    // 2. Settings for the final image
    const headerHeight = 80;
    const footerHeight = 50;
    const minWidth = 600; // Minimum width to ensure logo/text fits nicely

    // Calculate dimensions
    // We make sure the canvas is at least 'minWidth' wide
    const finalWidth = Math.max(cropCanvas.width, minWidth);
    const finalHeight = cropCanvas.height + headerHeight + footerHeight;

    // 3. Create the new canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const ctx = finalCanvas.getContext('2d');

    // 4. Fill White Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // 5. Draw Top Logo (Centered)
    // We grab the existing logo from your page to draw it
    const logoImg = document.querySelector('.logo-area img'); 
    if (logoImg) {
        // Maintain aspect ratio of logo
        const logoH = 50; 
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
        const logoX = (finalWidth - logoW) / 2;
        ctx.drawImage(logoImg, logoX, 15, logoW, logoH); // 15px padding top
    }

    // 6. Draw Separator Line (Optional)
    ctx.beginPath();
    ctx.moveTo(20, headerHeight - 5);
    ctx.lineTo(finalWidth - 20, headerHeight - 5);
    ctx.strokeStyle = "#eeeeee";
    ctx.stroke();

    // 7. Draw the Cropped Image (Centered horizontally)
    const cropX = (finalWidth - cropCanvas.width) / 2;
    ctx.drawImage(cropCanvas, cropX, headerHeight);

    // 8. Draw Footer Text
    ctx.fillStyle = "#333333"; // Text Color
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Read full NEWS at epaperb10vartha.in", finalWidth / 2, finalHeight - 25);
    
    ctx.fillStyle = "#888888"; // Lighter Copyright
    ctx.font = "10px Arial";
    ctx.fillText("Copyright © 2026 B10Vartha", finalWidth / 2, finalHeight - 10);

    return finalCanvas;
}

// Updated Share Function
async function shareClip() {
    const brandedCanvas = getBrandedCanvas();
    if (!brandedCanvas) return;

    brandedCanvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], "b10-news-clip.png", { type: "image/png" });
            try {
                await navigator.share({
                    files: [file],
                    title: 'B10 Vartha News',
                    text: 'Read full NEWS at epaperb10vartha.in'
                });
            } catch (err) { console.log("Error sharing:", err); }
        } else {
            alert("Sharing is best on Mobile. On Desktop, use 'Download'.");
            downloadClip(); // Fallback
        }
    });
}

// Updated Download Function
function downloadClip() {
    const brandedCanvas = getBrandedCanvas();
    if (!brandedCanvas) return;
    
    brandedCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `B10-News-Clip-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// 6. FOOTER LOGIC
function toggleFooter() {
    const footer = document.getElementById("sliding-footer");
    footer.classList.toggle("active");
}