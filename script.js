let uploadedFile = null;
let currentFileId = null;
let isMinecraftItem = false;
let minecraftData = [];
let selectedCategories = { blocks: true, items: true };
const API_BASE = 'http://localhost:5000/api';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFile = document.getElementById('removeFile');
const previewSection = document.getElementById('previewSection');
const svgPreview = document.getElementById('svgPreview');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const progressFill = document.getElementById('progressFill');

const animationDuration = document.getElementById('animationDuration');
const backgroundColor = document.getElementById('backgroundColor');
const colorHex = document.getElementById('colorHex');
const durationValue = document.getElementById('durationValue');

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateRangeValues();
    updateColorPicker();
    loadMinecraftData();
    checkBackendStatus();
});

async function checkBackendStatus() {
    try {
        console.log('Checking backend status...');
        const response = await fetch(`${API_BASE}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Status response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Backend status:', data);
            showNotification('Backend kapcsolat OK!', 'success');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Backend connection error:', error);
        showNotification(`Backend kapcsolat hiba! Indítsd el: python app.py\nHiba: ${error.message}`, 'error');
    }
}

function initializeEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', function(e) {
        if (!e.target.closest('.upload-btn')) {
            fileInput.click();
        }
    });
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    removeFile.addEventListener('click', clearFile);
    
    animationDuration.addEventListener('input', updateRangeValues);
    backgroundColor.addEventListener('change', updateColorPicker);
    colorHex.addEventListener('input', updateColorFromHex);
    
    generateBtn.addEventListener('click', generateAnimation);
    downloadBtn.addEventListener('click', downloadVideo);
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
        await uploadFileToBackend(file);
    } else {
        showNotification('Kérjük, válasszon egy érvényes SVG fájlt!', 'error');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
}

async function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'image/svg+xml') {
            await uploadFileToBackend(file);
        } else {
            showNotification('Kérjük, húzzon be egy érvényes SVG fájlt!', 'error');
        }
    }
}

async function uploadFileToBackend(file) {
    try {
        showNotification('Fájl feltöltése...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            uploadedFile = file;
            currentFileId = result.file_id;
            isMinecraftItem = Boolean(result.is_minecraft_item);
            
            fileName.textContent = result.filename;
            fileSize.textContent = formatFileSize(file.size);
            
            uploadArea.style.display = 'none';
            fileInfo.style.display = 'block';
            
            showPreview(file);
            enableGeneration();
            
            showNotification(result.message, 'success');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        showNotification(`Feltöltési hiba: ${error.message}`, 'error');
    }
}

function enableGeneration() {
    generateBtn.disabled = false;
    generateBtn.classList.add('fade-in');
}

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        svgPreview.innerHTML = e.target.result;
        previewSection.style.display = 'block';
        previewSection.classList.add('fade-in');
        
        const svg = svgPreview.querySelector('svg');
        if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.maxHeight = '300px';
            svg.style.filter = 'drop-shadow(0 0 10px rgba(138, 43, 226, 0.3))';
        }
    };
    reader.readAsText(file);
}

async function uploadMinecraftItem(filename, type) {
    try {
        showNotification(`Minecraft ${type} kiválasztása...`, 'info');
        
        const response = await fetch(`${API_BASE}/upload-minecraft-item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: filename, type: type })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            currentFileId = result.file_id;
            isMinecraftItem = Boolean(result.is_minecraft_item);
            
            const apiUrl = type === 'block' ? `/api/blocks/${filename}` : `/api/items/${filename}`;
            const response2 = await fetch(apiUrl);
            const blob = await response2.blob();
            uploadedFile = new File([blob], result.filename, { type: 'image/svg+xml' });
            
            fileName.textContent = result.filename;
            fileSize.textContent = formatFileSize(blob.size);
            
            uploadArea.style.display = 'none';
            fileInfo.style.display = 'block';
            
            showPreview(uploadedFile);
            enableGeneration();
            
            showNotification(result.message, 'success');
        } else {
            throw new Error(result.error || 'Minecraft item selection failed');
        }
    } catch (error) {
        showNotification(`Minecraft ${type} hiba: ${error.message}`, 'error');
    }
}

function clearFile() {
    uploadedFile = null;
    currentFileId = null;
    isMinecraftItem = false;
    
    uploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    previewSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    generateBtn.disabled = true;
    
    fileInput.value = '';
}

function updateRangeValues() {
    durationValue.textContent = `${animationDuration.value} mp`;
}

function updateColorPicker() {
    const color = backgroundColor.value;
    colorHex.value = color;
}

function updateColorFromHex() {
    const hexValue = colorHex.value;
    if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
        backgroundColor.value = hexValue;
    }
}

function showLoading() {
    loadingSection.style.display = 'block';
    loadingSection.classList.add('fade-in');
    resultSection.style.display = 'none';
    
    progressFill.style.width = '0%';
    updateLoadingMessage('Animáció generálása elkezdődött...');
    
    loadingSection.scrollIntoView({ behavior: 'smooth' });
}

function updateLoadingMessage(message) {
    const loadingText = loadingSection.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function showResults(result) {
    loadingSection.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');
    
    progressFill.style.width = '100%';
    
    const videoContainer = document.querySelector('.video-preview');
    videoContainer.innerHTML = `
        <h4><i class="fas fa-play-circle"></i> Animáció Előnézet:</h4>
        <video controls style="width: 100%; max-width: 600px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <source src="${API_BASE}/preview/${currentFileId}" type="video/mp4">
            A böngésző nem támogatja a videó lejátszást.
        </video>
        <p style="color: #b0b0b0; margin-top: 10px; font-size: 0.9rem;">
            Felbontás: 1920x1080 (Full HD) • Formátum: MP4 • Manim renderelés
        </p>
        <details style="margin-top: 15px; color: #b0b0b0;">
            <summary style="cursor: pointer; font-weight: 600;">Generált Manim Kód</summary>
            <pre style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto; font-size: 0.9rem; color: #e0e0e0;">${result.script_content}</pre>
        </details>
    `;
    
    resultSection.scrollIntoView({ behavior: 'smooth' });
    
    showNotification(result.message, 'success');
}

async function downloadVideo() {
    if (!currentFileId) {
        showNotification('Nincs elérhető videó a letöltéshez!', 'error');
        return;
    }
    
    try {
        showNotification('Videó letöltése...', 'info');
        
        const downloadUrl = `${API_BASE}/download/${currentFileId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${uploadedFile.name.replace('.svg', '')}_animation.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Videó letöltése megkezdődött!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Letöltési hiba!', 'error');
    }
}

async function generateAnimation() {
    if (!currentFileId) {
        showNotification('Kérjük, töltsön fel egy SVG fájlt!', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const animationData = {
            file_id: currentFileId,
            filename: uploadedFile.name,
            duration: parseFloat(animationDuration.value),
            bg_color: backgroundColor.value,
            is_minecraft_item: isMinecraftItem
        };
        
        console.log('Sending generation request:', animationData);
        
        simulateProgress();
        
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(animationData)
        });
        
        console.log('Generation response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Generation result:', result);
        
        if (result.success) {
            showResults(result);
        } else {
            throw new Error(result.error || 'Generation failed');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        showNotification(`Generálási hiba: ${error.message}`, 'error');
        loadingSection.style.display = 'none';
    }
}

function simulateProgress() {
    const steps = [
        { progress: 20, message: 'SVG fájl feldolgozása...', delay: 1000 },
        { progress: 40, message: 'Manim script generálása...', delay: 1500 },
        { progress: 60, message: 'Animáció renderelése...', delay: 3000 },
        { progress: 80, message: 'Videó optimalizálása...', delay: 2000 },
        { progress: 95, message: 'Befejezés...', delay: 1000 }
    ];
    
    let currentStep = 0;
    
    function updateStep() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progressFill.style.width = `${step.progress}%`;
            updateLoadingMessage(step.message);
            currentStep++;
            setTimeout(updateStep, step.delay);
        }
    }
    
    updateStep();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: auto;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(45deg, #22c55e, #16a34a)';
        case 'error': return 'linear-gradient(45deg, #ef4444, #dc2626)';
        case 'warning': return 'linear-gradient(45deg, #f59e0b, #d97706)';
        default: return 'linear-gradient(45deg, #3b82f6, #2563eb)';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.upload-section, .settings-section, .preview-section, .result-section');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        fileInput.click();
    }
    
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        if (!generateBtn.disabled) {
            generateAnimation();
        }
    }
    
    if (e.key === 'Escape' && uploadedFile) {
        clearFile();
    }
});

window.addEventListener('load', function() {
    document.documentElement.style.scrollBehavior = 'smooth';
});

function switchTab(tabName) {
    const uploadTab = document.getElementById('uploadTab');
    const minecraftTab = document.getElementById('minecraftTab');
    const uploadContent = document.getElementById('uploadContent');
    const minecraftContent = document.getElementById('minecraftContent');

    if (tabName === 'upload') {
        uploadTab.classList.add('active');
        minecraftTab.classList.remove('active');
        uploadContent.style.display = 'block';
        minecraftContent.style.display = 'none';
    } else if (tabName === 'minecraft') {
        minecraftTab.classList.add('active');
        uploadTab.classList.remove('active');
        minecraftContent.style.display = 'block';
        uploadContent.style.display = 'none';
    }
}

async function loadMinecraftData() {
    try {
        const response = await fetch('/api/minecraft');
        if (response.ok) {
            minecraftData = await response.json();
            displayMinecraft();
        }
    } catch (error) {
        console.log('Minecraft data not available');
        document.getElementById('minecraftGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #b0b0b0; padding: 40px;">
                <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Az 'items' vagy 'blocks' mappa nem található.</p>
                <p>Hozz létre 'items' és 'blocks' mappákat SVG fájlokkal.</p>
            </div>
        `;
    }
}

function displayMinecraft() {
    const grid = document.getElementById('minecraftGrid');
    const filteredData = filterByCategories(minecraftData);
    
    if (filteredData.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #b0b0b0; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Nincs találat a kiválasztott kategóriákban.</p>
            </div>
        `;
        return;
    }
    
    const itemsHTML = filteredData.map(item => {
        const imgSrc = `/api/${item.type === 'block' ? 'blocks' : 'items'}/${item.filename}`;
        return `
            <div class="item-card" onclick="selectMinecraft(this, '${item.filename}', '${item.name}', '${item.type}')">
                <div class="item-image-container" data-type="${item.type}" data-filename="${item.filename}">
                    <img src="${imgSrc}" alt="${item.name}" loading="lazy" style="width:32px;height:32px;display:block;">
                </div>
                <div class="item-name">${item.name}</div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = itemsHTML;

    const blockImages = grid.querySelectorAll('.item-image-container[data-type="block"] img');
    blockImages.forEach((img) => {
        img.addEventListener('load', () => {
            try {
                img.style.width = '32px';
                img.style.height = '32px';
                img.style.display = 'block';
            } catch (e) {
            }
        });

        img.addEventListener('error', async () => {
            try {
                const response = await fetch(img.src);
                const svgText = await response.text();

                const container = img.parentElement;
                container.innerHTML = svgText;

                const svg = container.querySelector('svg');
                if (svg) {
                    svg.style.width = '32px';
                    svg.style.height = '32px';
                    svg.style.display = 'block';
                }
            } catch (error) {
                console.error('Failed to load block SVG (onerror fallback):', error);
            }
        });
    });
}

function filterByCategories(data) {
    return data.filter(item => {
        if (item.type === 'block' && !selectedCategories.blocks) return false;
        if (item.type === 'item' && !selectedCategories.items) return false;
        return true;
    });
}

function toggleCategory(category) {
    selectedCategories[category] = !selectedCategories[category];
    
    const btn = document.getElementById(category + 'Btn');
    if (selectedCategories[category]) {
        btn.classList.add('active');
        btn.classList.remove('disabled');
    } else {
        btn.classList.remove('active');
        btn.classList.add('disabled');
    }
    
    displayMinecraft();
}

function filterMinecraft() {
    const searchTerm = document.getElementById('minecraftSearch').value.toLowerCase();
    
    if (!searchTerm.trim()) {
        displayMinecraft();
        return;
    }
    
    const searchResults = minecraftData.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    
    const hasBlocks = searchResults.some(item => item.type === 'block');
    const hasItems = searchResults.some(item => item.type === 'item');
    
    selectedCategories.blocks = hasBlocks;
    selectedCategories.items = hasItems;
    
    const blocksBtn = document.getElementById('blocksBtn');
    const itemsBtn = document.getElementById('itemsBtn');
    
    if (hasBlocks) {
        blocksBtn.classList.add('active');
        blocksBtn.classList.remove('disabled');
    } else {
        blocksBtn.classList.remove('active');
        blocksBtn.classList.add('disabled');
    }
    
    if (hasItems) {
        itemsBtn.classList.add('active');
        itemsBtn.classList.remove('disabled');
    } else {
        itemsBtn.classList.remove('active');
        itemsBtn.classList.add('disabled');
    }
    
    const grid = document.getElementById('minecraftGrid');
    const filteredResults = filterByCategories(searchResults);
    
    if (filteredResults.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #b0b0b0; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Nincs találat: "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    const itemsHTML = filteredResults.map(item => {
        const imgSrc = `/api/${item.type === 'block' ? 'blocks' : 'items'}/${item.filename}`;
        return `
            <div class="item-card" onclick="selectMinecraft(this, '${item.filename}', '${item.name}', '${item.type}')">
                <div class="item-image-container" data-type="${item.type}" data-filename="${item.filename}">
                    <img src="${imgSrc}" alt="${item.name}" loading="lazy" style="width:32px;height:32px;display:block;">
                </div>
                <div class="item-name">${item.name}</div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = itemsHTML;

    const blockImages = grid.querySelectorAll('.item-image-container[data-type="block"] img');
    blockImages.forEach((img) => {
        img.addEventListener('load', () => {
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.display = 'block';
        });

        img.addEventListener('error', async () => {
            try {
                const response = await fetch(img.src);
                const svgText = await response.text();

                const container = img.parentElement;
                container.innerHTML = svgText;

                const svg = container.querySelector('svg');
                if (svg) {
                    svg.style.width = '32px';
                    svg.style.height = '32px';
                    svg.style.display = 'block';
                }
            } catch (error) {
                console.error('Failed to load block SVG (onerror fallback):', error);
            }
        });
    });
}

async function selectMinecraft(el, filename, name, type) {
    try {
        document.querySelectorAll('.item-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        if (el && el.classList) {
            el.classList.add('selected');
        }

        await uploadMinecraftItem(filename, type);
        
        showNotification(`${name} (${type}) kiválasztva! (2x méretben animálva)`, 'success');
    } catch (error) {
        console.error('Minecraft selection error:', error);
        showNotification(`Hiba a ${type} kiválasztásakor!`, 'error');
    }
}
