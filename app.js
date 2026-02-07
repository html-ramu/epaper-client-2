// CONFIGURATION
const REPO_URL = "https://epaperb10vartha.in"; 

// DATA 
const editions = {
    // ROBOT_ENTRY_POINT
    "07-02-2026": { pages: 5, pdf: "full.pdf" },

    "06-02-2026": { pages: 5, pdf: "full.pdf" },

    "05-02-2026": { pages: 4, pdf: "full.pdf" },

    

    "04-02-2026": { pages: 4, pdf: "full.pdf" },

    "03-02-2026": { pages: 5, pdf: "full.pdf" },

    "02-02-2026": { pages: 6, pdf: "full.pdf" },

    "01-02-2026": { pages: 6, pdf: "full.pdf" },

    "31-01-2026": { pages: 5, pdf: "full.pdf" },

    "30-01-2026": { pages: 4, pdf: "full.pdf" },

};

// --- HELPER FUNCTION: Sort dates (Newest First) ---
function getSortedDates() {
    return Object.keys(editions).sort((a, b) => {
        const [d1, m1, y1] = a.split('-').map(Number);
        const [d2, m2, y2] = b.split('-').map(Number);
        const dateA = new Date(y1, m1 - 1, d1);
        const dateB = new Date(y2, m2 - 1, d2);
        return dateB - dateA; 
    });
}

// STATE
let currentDateStr = ""; 
let currentPage = 1;
let totalPages = 1;
let cropper = null; 

// INITIALIZATION
window.onload = function() {
    setupDateDisplay();
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    }
};

// 1. DATE & DISPLAY LOGIC
function setupDateDisplay() {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const todayStr = `${d}-${m}-${y}`;
    
    // Attempt to set header date
    const headerDateEl = document.getElementById('headerDate');
    if (headerDateEl) headerDateEl.innerText = todayStr;
    
    // SMART STARTUP: Pick newest edition
    const sortedDates = getSortedDates();
    if (sortedDates.length > 0) {
        currentDateStr = sortedDates[0]; 
        loadEdition(currentDateStr);
        populateDateDropdown();
    } else {
        // CLEAN SLATE MODE: No editions yet
        document.getElementById('liveDate').innerText = "Coming Soon";
        document.getElementById('pageIndicator').innerText = "Waiting for Update...";
        // Hide controls gracefully
        document.getElementById('btnPrev').disabled = true;
        document.getElementById('btnNext').disabled = true;
        document.getElementById('btnPdf').style.display = 'none';
    }
}

function loadEdition(dateStr) {
    if (!editions[dateStr]) return;

    currentDateStr = dateStr;
    currentPage = 1;
    totalPages = editions[dateStr].pages;
    
    document.getElementById('liveDate').innerText = dateStr;
    
    // --- UNIFIED PDF LOGIC ---
    const pdfBtn = document.getElementById('btnPdf');
    if (pdfBtn) {
        const pdfUrl = `papers/${dateStr}/full.pdf`;

        pdfBtn.onclick = null; 
        pdfBtn.href = pdfUrl;
        pdfBtn.setAttribute("download", `B10-Vartha-${dateStr}.pdf`);
        pdfBtn.target = "_blank"; 
        pdfBtn.style.display = "inline-block"; 
        pdfBtn.innerText = "PDF"; 
    }
    
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
    imgElement.onerror = function() { imgElement.style.opacity = "1"; };

    document.getElementById('btnPrev').disabled = (currentPage === 1);
    document.getElementById('btnNext').disabled = (currentPage === totalPages);
}

// 2. NAVIGATION
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        try {
            const audio = new Audio('assets/page-flip-4.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio waiting for interaction"));
        } catch (err) { console.log("Audio error", err); }

        currentPage = newPage;
        updateViewer();
        window.scrollTo(0, 120); 
    }
}

// 3. MENU & UI INTERACTIONS
function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    sidebar.style.width = (sidebar.style.width === "250px") ? "0" : "250px";
}

function setActive(element) {
    document.querySelectorAll('.cat-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

function openInfoModal(modalId) {
    document.getElementById(modalId).style.display = "block";
    document.getElementById("sidebar").style.width = "0";
}

function closeInfoModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// 4. EDITION SELECTOR
function populateDateDropdown() {
    const select = document.getElementById('dateSelect');
    if (!select) return;
    select.innerHTML = "";
    
    const sortedDates = getSortedDates(); 
    sortedDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.text = date;
        select.appendChild(option);
    });
    select.value = currentDateStr;
}

function openEditionSelector() { 
    const select = document.getElementById('dateSelect');
    if(select) select.value = currentDateStr;
    document.getElementById('editionModal').style.display = "block"; 
}
function closeEditionSelector() { document.getElementById('editionModal').style.display = "none"; }
function loadSelectedEdition() {
    loadEdition(document.getElementById('dateSelect').value);
    closeEditionSelector();
}

// 5. CLIPPER LOGIC
function toggleClipper() {
    if (!cropper && (!currentDateStr || totalPages === 0)) return; // Prevent clipper if no paper
    
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
                viewMode: 1, dragMode: 'move', autoCropArea: 0.5, movable: true, zoomable: true
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

    const headerHeight = Math.round(160 * scale); 
    const footerHeight = Math.round(110 * scale); 
    const finalHeight = cropCanvas.height + headerHeight + footerHeight;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const ctx = finalCanvas.getContext('2d');

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Big Logo
    const logoImg = document.querySelector('.logo-area img'); 
    if (logoImg) {
        const logoH = Math.round(120 * scale); 
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
        const logoX = (finalWidth - logoW) / 2;
        const logoY = (headerHeight - logoH) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    }

    // Edition Date
    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    ctx.font = `bold ${Math.round(20 * scale)}px Arial`;
    ctx.fillText(currentDateStr, 20 * scale, headerHeight / 2 + (8 * scale));

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
    ctx.fillText("Read full NEWS at epaperb10vartha.in", finalWidth / 2, finalHeight - (footerHeight * 0.6));

    const fontSub = Math.round(16 * scale); 
    ctx.font = `normal ${fontSub}px Arial`;
    ctx.fillText("Built by html-ramu", finalWidth / 2, finalHeight - (footerHeight * 0.25));

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


