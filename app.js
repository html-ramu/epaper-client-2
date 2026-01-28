// CONFIGURATION
const REPO_URL = "https://sekharbyiram-max.github.io/b10-epaper"; 

// MOCK DATA (In a real app, you might fetch a manifest.json)
// Format: "DD-MM-YYYY": { pages: total_pages, pdf: "filename.pdf" }
const editions = {
    "28-01-2026": { pages: 5, pdf: "full.pdf" },
    // ROBOT_ENTRY_POINT
    "27-01-2026": { pages: 8, pdf: "full.pdf" },
    "26-01-2026": { pages: 6, pdf: "full.pdf" },
    "25-01-2026": { pages: 8, pdf: "full.pdf" }
};

// STATE
let currentDateStr = "27-01-2026"; // Default start
let currentPage = 1;
let totalPages = 1;
let cropper = null; // Store the cropper instance

// INITIALIZATION
window.onload = function() {
    setupDateDisplay();
    loadEdition(currentDateStr);
};

// 1. DATE & DISPLAY LOGIC
function setupDateDisplay() {
    const today = new Date();
    // Format: DD-MM-YYYY
    const dateStr = today.getDate().toString().padStart(2, '0') + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getFullYear();
    document.getElementById('headerDate').innerText = dateStr;
    
    // Check if today exists in editions, else load latest
    if(editions[dateStr]) {
        currentDateStr = dateStr;
    } else {
        // Fallback to first key in editions (latest mock data)
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
    
    // Update UI
    document.getElementById('liveDate').innerText = dateStr;
    document.getElementById('btnPdf').href = `papers/${dateStr}/${editions[dateStr].pdf}`;
    
    updateViewer();
}

function updateViewer() {
    const imgPath = `papers/${currentDateStr}/${currentPage}.png`;
    const imgElement = document.getElementById('pageImage');
    const indicator = document.getElementById('pageIndicator');
    
    // Hide image, show loading
    imgElement.style.opacity = "0.5";
    
    imgElement.src = imgPath;
    indicator.innerText = `Page ${currentPage} / ${totalPages}`;

    imgElement.onload = function() {
        imgElement.style.opacity = "1";
    };

    imgElement.onerror = function() {
        imgElement.alt = "Page not found or uploading...";
    };

    // Button States
    document.getElementById('btnPrev').disabled = (currentPage === 1);
    document.getElementById('btnNext').disabled = (currentPage === totalPages);
}

// 2. NAVIGATION
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateViewer();
        window.scrollTo(0, 120); // Scroll to top of viewer roughly
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
    // Remove active class from all
    const items = document.querySelectorAll('.cat-item');
    items.forEach(item => item.classList.remove('active'));
    // Add to clicked
    element.classList.add('active');
    // Note: The href in HTML handles the redirection
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

function openEditionSelector() {
    document.getElementById('editionModal').style.display = "block";
}

function closeEditionSelector() {
    document.getElementById('editionModal').style.display = "none";
}

function loadSelectedEdition() {
    const selectedDate = document.getElementById('dateSelect').value;
    loadEdition(selectedDate);
    closeEditionSelector();
}

// 5. ADVANCED CLIPPER LOGIC (NEW)
function toggleClipper() {
    const modal = document.getElementById('clipperOverlay');
    const pageImg = document.getElementById('pageImage');
    const clipImg = document.getElementById('clipperImage');
    
    if (modal.style.display === "flex") {
        // CLOSE
        modal.style.display = "none";
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    } else {
        // OPEN
        modal.style.display = "flex"; // Must be flex for centering
        clipImg.src = pageImg.src;

        // Initialize Cropper after a tiny delay
        setTimeout(() => {
            if (cropper) cropper.destroy();
            
            cropper = new Cropper(clipImg, {
                viewMode: 1, // Restrict crop box to image size
                dragMode: 'move', // Allow dragging the image
                autoCropArea: 0.5, // Start with 50% selection box
                guides: true, // Show dashed lines
                background: false, // Hide grid background
                movable: true,
                zoomable: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
            });
        }, 100);
    }
}

// Share Function (WhatsApp, FB, System)
async function shareClip() {
    if (!cropper) return;

    // 1. Convert crop to Image Blob
    cropper.getCroppedCanvas().toBlob(async (blob) => {
        // 2. Check if device supports native sharing (Mobile)
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], "b10-news-clip.png", { type: "image/png" });
            try {
                await navigator.share({
                    files: [file],
                    title: 'B10 Vartha News',
                    text: 'Read full NEWS at epaperb10vartha.in'
                });
            } catch (err) {
                console.log("Error sharing:", err);
            }
        } else {
            // Fallback for Desktop
            alert("Sharing is best on Mobile. On Desktop, use 'Download'.");
            downloadClip();
        }
    });
}

// Download Function
function downloadClip() {
    if (!cropper) return;
    
    cropper.getCroppedCanvas().toBlob((blob) => {
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