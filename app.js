// CONFIGURATION
const REPO_URL = "https://sekharbyiram-max.github.io/b10-epaper"; 

// MOCK DATA - The robot will add new dates here
const editions = {
    "28-01-2026": { pages: 5, pdf: "full.pdf" },
    // ROBOT_ENTRY_POINT
    "30-01-2026": { pages: 5 },
    "29-01-2026": { pages: 5 },
    "27-01-2026": { pages: 8, pdf: "full.pdf" },
    "26-01-2026": { pages: 6, pdf: "full.pdf" },
    "25-01-2026": { pages: 8, pdf: "full.pdf" }
};

// --- NEW HELPER FUNCTION: Sort dates (Newest First) ---
function getSortedDates() {
    return Object.keys(editions).sort((a, b) => {
        // Convert "DD-MM-YYYY" string to a comparable Date object
        const [d1, m1, y1] = a.split('-').map(Number);
        const [d2, m2, y2] = b.split('-').map(Number);
        const dateA = new Date(y1, m1 - 1, d1);
        const dateB = new Date(y2, m2 - 1, d2);
        return dateB - dateA; // Sort in descending order (Newest first)
    });
}

// STATE
let currentDateStr = ""; // Will be set on load
let currentPage = 1;
let totalPages = 1;
let cropper = null; 

// INITIALIZATION
window.onload = function() {
    setupDateDisplay();
    
    // Add generic outside click to close modals
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    }
};

// 1. DATE & DISPLAY LOGIC
function setupDateDisplay() {
    const today = new Date();
    const todayStr = today.getDate().toString().padStart(2, '0') + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getFullYear();
    
    // Set Header to Today's Date (Calendar date)
    document.getElementById('headerDate').innerText = todayStr;
    
    // --- SMART DATE SELECTION LOGIC ---
    const sortedDates = getSortedDates();

    if (sortedDates.length > 0) {
        // Always pick the newest available edition
        currentDateStr = sortedDates[0]; 
    } else {
        // Fallback if no editions exist
        currentDateStr = todayStr;
        alert("No editions available.");
    }
    
    // Load the selected edition and populate the dropdown
    loadEdition(currentDateStr);
    populateDateDropdown();
}

function loadEdition(dateStr) {
    if (!editions[dateStr]) {
        alert("Edition not found for date: " + dateStr);
        return;
    }
    currentDateStr = dateStr;
    currentPage = 1;
    totalPages = editions[dateStr].pages;
    
    // Update the "LIVE" date in the header
    document.getElementById('liveDate').innerText = dateStr;
    
    // PDF Button Logic
    const pdfBtn = document.getElementById('btnPdf');
    if(editions[dateStr].pdf) {
        pdfBtn.href = `papers/${dateStr}/${editions[dateStr].pdf}`;
        pdfBtn.style.display = "inline-block";
    } else {
        pdfBtn.style.display = "none"; // Hide if no PDF defined
    }
    
    updateViewer();
}

function updateViewer() {
    const imgPath = `papers/${currentDateStr}/${currentPage}.png`;
    const imgElement = document.getElementById('pageImage');
    const indicator = document.getElementById('pageIndicator');
    
    // Show loading state
    imgElement.style.opacity = "0.5";
    imgElement.src = imgPath;
    indicator.innerText = `Page ${currentPage} / ${totalPages}`;

    // On successful load
    imgElement.onload = function() { 
        imgElement.style.opacity = "1"; 
    };
    
    // On error (e.g., missing image)
    imgElement.onerror = function() { 
        imgElement.style.opacity = "1";
        // You could display a placeholder image here if you want
        // imgElement.src = 'assets/no-page.png'; 
    };

    // Update navigation buttons
    document.getElementById('btnPrev').disabled = (currentPage === 1);
    document.getElementById('btnNext').disabled = (currentPage === totalPages);

    // Update arrow buttons if they exist
    const leftArr = document.querySelector('.left-arrow');
    const rightArr = document.querySelector('.right-arrow');
    if (leftArr) leftArr.disabled = (currentPage === 1);
    if (rightArr) rightArr.disabled = (currentPage === totalPages);
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

// 4. INFO MODALS LOGIC (About, Contact, etc.)
function openInfoModal(modalId) {
    document.getElementById(modalId).style.display = "block";
    const sidebar = document.getElementById("sidebar");
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    }
}

function closeInfoModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// 5. EDITION SELECTOR (Fixed Sorting & Selection)
function populateDateDropdown() {
    const select = document.getElementById('dateSelect');
    if (!select) return;
    select.innerHTML = "";
    
    // Use the sorted dates list
    const sortedDates = getSortedDates(); 

    sortedDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.text = date;
        select.appendChild(option);
    });
    
    // Ensure the currently selected date is highlighted in the dropdown
    select.value = currentDateStr;
}

function openEditionSelector() { 
    // Refresh dropdown selection before showing
    const select = document.getElementById('dateSelect');
    if(select) select.value = currentDateStr;
    document.getElementById('editionModal').style.display = "block"; 
}

function closeEditionSelector() { document.getElementById('editionModal').style.display = "none"; }

function loadSelectedEdition() {
    const selectedDate = document.getElementById('dateSelect').value;
    loadEdition(selectedDate);
    closeEditionSelector();
}

// 6. CLIPPER LOGIC
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

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    const logoImg = document.querySelector('.logo-area img'); 
    if (logoImg) {
        const logoH = Math.round(60 * scale); 
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
        const logoX = (finalWidth - logoW) / 2;
        const logoY = (headerHeight - logoH) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    }

    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getFullYear();
    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    ctx.font = `bold ${Math.round(20 * scale)}px Arial`;
    ctx.fillText(dateStr, 20 * scale, headerHeight / 2 + (8 * scale));

    ctx.beginPath();
    ctx.moveTo(20 * scale, headerHeight - 2);
    ctx.lineTo(finalWidth - (20 * scale), headerHeight - 2);
    ctx.strokeStyle = "#eeeeee";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    const cropX = (finalWidth - cropCanvas.width) / 2;
    ctx.drawImage(cropCanvas, cropX, headerHeight);

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

// 7. FOOTER LOGIC
function toggleFooter() {
    const footer = document.getElementById("sliding-footer");
    footer.classList.toggle("active");
}