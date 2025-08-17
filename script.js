let uploadedFile = null;
let currentFileId = null;
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
    loadMinecraftItems();
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
        console.log('Uploading file:', file.name);
        showNotification('Fájl feltöltése...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Sending upload request...');
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });
        
        console.log('Upload response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.success) {
            uploadedFile = file;
            currentFileId = result.file_id;
            
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
        console.error('Upload error:', error);
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

function clearFile() {
    uploadedFile = null;
    currentFileId = null;
    
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
            bg_color: backgroundColor.value
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

function showLoading() {
    loadingSection.style.display = 'block';
    loadingSection.classList.add('fade-in');
    resultSection.style.display = 'none';
    
    loadingSection.scrollIntoView({ behavior: 'smooth' });
}

async function createAnimationVideo() {
    const title = animationTitle.value || 'Animáció';
    const duration = parseFloat(animationDuration.value);
    const wait = parseFloat(waitTime.value);
    const bgColor = backgroundColor.value;
    
    progressFill.style.width = '10%';
    updateLoadingMessage('Canvas beállítása...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    progressFill.style.width = '20%';
    updateLoadingMessage('SVG elemzése...');
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('Invalid SVG content');
    progressFill.style.width = '30%';
    updateLoadingMessage('Animáció renderelése...');

    const stream = canvas.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
    });
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };
        mediaRecorder.onerror = reject;
        mediaRecorder.start();
        animateOutlineScene(ctx, canvas, svgElement, title, duration, wait, bgColor, () => {
            progressFill.style.width = '100%';
            updateLoadingMessage('Videó finalizálása...');
            mediaRecorder.stop();
        });
    });
}

function animateOutlineScene(ctx, canvas, svgElement, title, duration, wait, bgColor, onComplete) {
    const paths = Array.from(svgElement.querySelectorAll('path'));
    if (paths.length === 0) {
        Array.from(svgElement.children).forEach(el => { if (el.tagName !== 'defs') paths.push(el); });
    }
    let vb = svgElement.getAttribute('viewBox');
    let [vbX, vbY, vbW, vbH] = vb ? vb.split(/\s+/).map(Number) : [0,0,
        Number(svgElement.getAttribute('width'))||100,
        Number(svgElement.getAttribute('height'))||100];
    const fps = 60;
    const writeFrames = Math.floor(duration * fps);
    const waitFrames = Math.floor(wait * fps);
    const totalFrames = writeFrames + waitFrames + fps;
    let currentFrame = 0;
    const pathLengths = paths.map(p => {
        try {
            const d = p.getAttribute('d');
            if (!d) return 0;
            const temp = document.createElementNS('http://www.w3.org/2000/svg','path');
            temp.setAttribute('d', d);
            return temp.getTotalLength();
        } catch { return 0; }
    });
    function drawFrame() {
        ctx.save();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        const scale = Math.min(canvas.width/vbW, canvas.height/vbH)*0.6;
        const offsetX = (canvas.width - vbW*scale)/2;
        const offsetY = (canvas.height - vbH*scale)/2 - canvas.height*0.1;
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        for (let i=0; i<paths.length; ++i) {
            const p = paths[i];
            const d = p.getAttribute('d');
            if (!d) continue;
            const len = pathLengths[i];
            ctx.save();
            ctx.beginPath();
            const path2d = new Path2D(d);
            let drawLen = len * Math.min(1, currentFrame/writeFrames);
            ctx.setLineDash([drawLen, len-drawLen]);
            ctx.lineDashOffset = 0;
            ctx.strokeStyle = p.getAttribute('stroke') || '#fff';
            ctx.lineWidth = (parseFloat(p.getAttribute('stroke-width'))||2)/scale;
            ctx.stroke(path2d);
            ctx.restore();
        }
        ctx.restore();
        ctx.save();
        ctx.font = `bold ${Math.round(canvas.height*0.06)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#fff';
        let textY = canvas.height*0.7;
        let textToShow = '';
        if (currentFrame < writeFrames) {
            let chars = Math.floor(title.length * (currentFrame/writeFrames));
            textToShow = title.substring(0, chars);
        } else {
            textToShow = title;
        }
        ctx.fillText(textToShow, canvas.width/2, textY);
        ctx.restore();
        ctx.restore();
        currentFrame++;
        const overallProgress = 30 + (currentFrame / totalFrames) * 60;
        progressFill.style.width = `${overallProgress}%`;
        if (currentFrame < totalFrames) {
            requestAnimationFrame(drawFrame);
        } else {
            onComplete();
        }
    }
    drawFrame();
}

function updateLoadingMessage(message) {
    const loadingText = loadingSection.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function sanitizeFileName(name) {
    return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
}

async function copyCode() {
    try {
        await navigator.clipboard.writeText(generatedCode.textContent);
        showNotification('Kód sikeresen vágólapra másolva!', 'success');
        
        copyCodeBtn.innerHTML = '<i class="fas fa-check"></i> Másolva!';
        setTimeout(() => {
            copyCodeBtn.innerHTML = '<i class="fas fa-copy"></i> Kód Másolása';
        }, 2000);
    } catch (err) {
        showNotification('Hiba a vágólapra másolás során!', 'error');
    }
}

function downloadPythonFile() {
    if (!window.currentVideoBlob) {
        showNotification('Nincs elérhető videó a letöltéshez!', 'error');
        return;
    }
    
    const fileName = `${sanitizeFileName(uploadedFile.name)}_animation.webm`;
    
    const url = URL.createObjectURL(window.currentVideoBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Animáció videó letöltése megkezdődött!', 'success');
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
    const itemsTab = document.getElementById('itemsTab');
    const uploadContent = document.getElementById('uploadContent');
    const itemsContent = document.getElementById('itemsContent');

    if (tabName === 'upload') {
        uploadTab.classList.add('active');
        itemsTab.classList.remove('active');
        uploadContent.style.display = 'block';
        itemsContent.style.display = 'none';
    } else {
        itemsTab.classList.add('active');
        uploadTab.classList.remove('active');
        itemsContent.style.display = 'block';
        uploadContent.style.display = 'none';
    }
}

async function loadMinecraftItems() {
    try {
        const response = await fetch('/api/items');
        if (response.ok) {
            const items = await response.json();
            displayItems(items);
        }
    } catch (error) {
        console.log('Items folder not available');
        document.getElementById('itemsGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #b0b0b0; padding: 40px;">
                <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Az 'items' mappa nem található.</p>
                <p>Hozz létre egy 'items' mappát SVG fájlokkal.</p>
            </div>
        `;
    }
}

function displayItems(items) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = items.map(item => `
        <div class="item-card" onclick="selectItem('${item.filename}', '${item.name}')">
            <img src="/api/items/${item.filename}" alt="${item.name}" loading="lazy">
            <div class="item-name">${item.name}</div>
        </div>
    `).join('');
}

function filterItems() {
    const searchTerm = document.getElementById('itemSearch').value.toLowerCase();
    const items = document.querySelectorAll('.item-card');
    
    items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function selectItem(filename, name) {
    try {
        document.querySelectorAll('.item-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        event.target.closest('.item-card').classList.add('selected');
        
        const response = await fetch(`/api/items/${filename}`);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/svg+xml' });
        
        await uploadFileToBackend(file);
        
        showNotification(`${name} kiválasztva!`, 'success');
    } catch (error) {
        console.error('Item selection error:', error);
        showNotification('Hiba az item kiválasztásakor!', 'error');
    }
}
