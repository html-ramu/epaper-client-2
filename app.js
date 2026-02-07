// CONFIGURATION
const REPO_URL = "https://html-ramu.github.io/epaper-client-2"; 

// DATA 
const editions = {
    // ROBOT_ENTRY_POINT
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
    // Modal Close Logic
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
    const liveDateEl = document.getElementById('liveDate');
    
    // SMART STARTUP: Pick newest edition
    const sortedDates = getSortedDates();
    if (sortedDates.length > 0) {
        currentDateStr = sortedDates[0]; 
        loadEdition(currentDateStr);
        populateDateDropdown();
    } else {
        // CLEAN SLATE MODE: No editions yet
        if(liveDateEl) liveDateEl.innerText = "No Papers";
        const indicator = document.getElementById('pageIndicator');
        if(indicator) indicator.innerText = "Waiting for Update...";
        
        // Hide controls gracefully
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const btnPdf = document.getElementById('btnPdf');
        
        if(btnPrev) btnPrev.disabled = true;
        if(btnNext) btnNext.disabled = true;
        if(btnPdf) btnPdf.style.display = 'none';
    }
}

function loadEdition(dateStr) {
    if (!editions[dateStr]) return;

    currentDateStr = dateStr;
    currentPage = 1;
    totalPages = editions[dateStr].pages;
    
    const liveDateEl = document.getElementById('liveDate');
    if(liveDateEl) liveDateEl.innerText = dateStr;
    
    // --- UNIFIED PDF LOGIC ---
    const pdfBtn = document.getElementById('btnPdf');
    if (pdfBtn) {
        const pdfUrl = `papers/${dateStr}/full.pdf`;

        pdfBtn.onclick = null; 
        pdfBtn.href = pdfUrl;
        pdfBtn.setAttribute("download", `Client-2-Paper-${dateStr}.pdf`);
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
    
    if(imgElement) {
        imgElement.style.opacity = "0.5";
        imgElement.src = imgPath;
        imgElement.onload = function() { imgElement.style.opacity = "1"; };
        imgElement.onerror = function() { imgElement.style.opacity = "1"; };
    }
    
    if(indicator) indicator.innerText = `Page ${currentPage} / ${totalPages}`;

    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if(btnPrev) btnPrev.disabled = (currentPage === 1);
    if(btnNext) btnNext.disabled = (currentPage === totalPages);
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
    if(sidebar) sidebar.style.width = (sidebar.style.width === "250px") ? "0" : "250px";
}

function resetViewer() {
    const sorted = getSortedDates();
    if(sorted.length > 0) loadEdition(sorted[0]);
}

function openInfoModal(modalId) {
    const modal = document.getElementById(modalId);
    const sidebar = document.getElementById("sidebar");
    if(modal) modal.style.display = "block";
    if(sidebar) sidebar.style.width = "0";
}

function closeInfoModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = "none";
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
    if(select && currentDateStr) select.value = currentDateStr;
    const modal = document.getElementById('editionModal');
    if(modal) modal.style.display = "block"; 
}

function closeEditionSelector() { 
    const modal = document.getElementById('editionModal');
    if(modal) modal.style.display = "none"; 
}

function loadSelectedEdition() {
    const select = document.getElementById('dateSelect');
    if(select) {
        loadEdition(select.value);
        closeEditionSelector();
    }
}

// 5. CLIPPER LOGIC
function toggleClipper() {
    if (!cropper && (!currentDateStr || totalPages === 0)) return; 
    
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

    const headerHeight = Math.round(100 * scale); 
    const footerHeight = Math.round(80 * scale); 
    const finalHeight = cropCanvas.height + headerHeight + footerHeight;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const ctx = finalCanvas.getContext('2d');

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Header Text (Since no Logo Logic provided for canvas)
    ctx.fillStyle = "#333333";
    ctx.font = `bold ${Math.round(24 * scale)}px Arial`;
    ctx.fillText("Client-2 ePaper", 20 * scale, headerHeight / 2);
    
    // Date
    ctx.font = `normal ${Math.round(18 * scale)}px Arial`;
    ctx.fillText(currentDateStr, 20 * scale, headerHeight / 2 + (30 * scale));

    // Image
    const cropX = (finalWidth - cropCanvas.width) / 2;
    ctx.drawImage(cropCanvas, cropX, headerHeight);

    // Footer
    ctx.fillStyle = "#222"; 
    ctx.fillRect(0, finalHeight - footerHeight, finalWidth, footerHeight);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff"; 
    const fontMain = Math.round(16 * scale); 
    ctx.font = `bold ${fontMain}px Arial`;
    ctx.fillText("Read full NEWS at html-ramu.github.io/epaper-client-2", finalWidth / 2, finalHeight - (footerHeight * 0.4));

    return finalCanvas;
}

async function shareClip() {
    const brandedCanvas = getBrandedCanvas();
    if (!brandedCanvas) return;
    brandedCanvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], "news-clip.png", { type: "image/png" });
            try { await navigator.share({ files: [file], title: 'News Clip', text: 'Read full NEWS at Client-2' }); } 
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
        a.download = `News-Clip-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}