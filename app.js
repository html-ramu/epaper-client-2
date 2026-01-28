// CONFIGURATION
const REPO_URL = "https://sekharbyiram-max.github.io/b10-epaper"; 

// MOCK DATA 
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

    // BUTTON STATES (Bottom Bar)
    document.getElementById('btnPrev').disabled = (currentPage === 1);
    document.getElementById('btnNext').disabled = (currentPage === totalPages);

    // BUTTON STATES (Side Arrows)
    // We use querySelector because they are classes
    const leftArr = document.querySelector('.left-arrow');
    const rightArr = document.querySelector('.right-arrow');
    if (leftArr) leftArr.disabled = (currentPage === 1);
    if (rightArr) rightArr.disabled = (currentPage === totalPages);
}

// 2. NAVIGATION (Updated with Sound)
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        // PLAY SOUND
        // We use try/catch because browsers block audio if user hasn't interacted yet
        try {
            const audio = new Audio('assets/page-flip-4.mp3');
            audio.volume = 0.5; // 50% volume
            audio.play().catch(e => console.log("Audio waiting for interaction"));
        } catch (err) {
            console.log("Audio error", err);
        }

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

// 5. ADVANCED CLIPPER (WITH BRANDING & DYNAMIC DATE)
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
                viewMode: 1, dragMode: 'move', autoCropArea: 0.5, 
                guides: true, background: false, movable: true,
                zoomable: true, cropBoxMovable: true, cropBoxResizable: true,
            });
        }, 100);
    }
}

function getBrandedCanvas() {
    if (!cropper) return null;
    const cropCanvas = cropper.getCroppedCanvas();
    if (!cropCanvas) return null;

    const minWidth = 600; 
    const finalWidth = Math.max(cropCanvas.width, minWidth);
    const scale = finalWidth / 800;

    const headerHeight = Math.round(100 * scale); 
    const footerHeight = Math.round(70 * scale); 
    const finalHeight = cropCanvas.height + headerHeight + footerHeight;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const ctx = finalCanvas.getContext('2d');

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Header Logo
    const logoImg = document.querySelector('.logo-area img'); 
    if (logoImg) {
        const logoH = Math.round(60 * scale); 
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
        const logoX = (finalWidth - logoW) / 2;
        const logoY = (headerHeight - logoH) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    }

    // Header Date
    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getFullYear();
    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    ctx.font = `bold ${Math.round(20 * scale)}px Arial`;
    ctx.fillText(dateStr, 20 * scale, headerHeight / 2 + (8 * scale));

    // Separator
    ctx.beginPath();
    ctx.moveTo(20 * scale, headerHeight - 2);
    ctx.lineTo(finalWidth - (20 * scale), headerHeight - 2);
    ctx.strokeStyle = "#eeeeee";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Image
    const cropX = (finalWidth - cropCanvas.width) / 2;
    ctx.drawImage(cropCanvas, cropX, headerHeight);

    // Footer
    ctx.fillStyle = "#008000"; 
    ctx.fillRect(0, finalHeight - footerHeight, finalWidth, footerHeight);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff"; 
    const fontMain = Math.round(24 * scale); 
    ctx.font = `bold ${fontMain}px Arial`;
    ctx.fillText("Read full NEWS at epaperb10vartha.in", finalWidth / 2, finalHeight - (footerHeight / 2) + (8 * scale));

    return finalCanvas;
}

async function shareClip() {
    const brandedCanvas = getBrandedCanvas();
    if (!brandedCanvas) return;
    brandedCanvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], "b10-news-clip.png", { type: "image/png" });
            try { await navigator.share({ files: [file], title: 'B10 Vartha News', text: 'Read full NEWS at epaperb10vartha.in' }); } 
            catch (err) { console.log("Error sharing:", err); }
        } else {
            alert("Sharing is best on Mobile. On Desktop, use 'Download'.");
            downloadClip();
        }
    });
}

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