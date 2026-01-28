// CONFIGURATION
const REPO_URL = "https://yourusername.github.io/b10-epaper"; // Update this after deployment

// MOCK DATA (In a real app, you might fetch a manifest.json)
// Format: "DD-MM-YYYY": { pages: total_pages, pdf: "filename.pdf" }
const editions = {
    "27-01-2026": { pages: 8, pdf: "full.pdf" },
    "26-01-2026": { pages: 6, pdf: "full.pdf" },
    "25-01-2026": { pages: 8, pdf: "full.pdf" }
};

// STATE
let currentDateStr = "27-01-2026"; // Default start
let currentPage = 1;
let totalPages = 1;

// INITIALIZATION
window.onload = function() {
    setupDateDisplay();
    loadEdition(currentDateStr);
    setupFooter();
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

// 5. CLIPPER (MVP)
function toggleClipper() {
    const modal = document.getElementById('clipperOverlay');
    const clipImg = document.getElementById('clipperImage');
    
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
        clipImg.src = document.getElementById('pageImage').src;
    }
}

// 6. FOOTER
function setupFooter() {
    // Already handled by toggleFooter
}

function toggleFooter() {
    const panel = document.getElementById('footerPanel');
    const icon = document.getElementById('footerIcon');
    panel.classList.toggle('show');
    
    if(panel.classList.contains('show')) {
        icon.classList.remove('fa-caret-up');
        icon.classList.add('fa-caret-down');
    } else {
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-up');
    }
}