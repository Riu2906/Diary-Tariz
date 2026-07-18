document.addEventListener('contextmenu', event => event.preventDefault());

let storageData = [];
try {
    const rawData = localStorage.getItem('cuteDiariesDataV7');
    if (rawData) storageData = JSON.parse(rawData);
} catch (error) {
    storageData = []; 
}

let activeDiaryIndex = null;
let dragTarget = null;
let ghostPreview = null; 
let savedCursorRange = null; 

const homeScreen = document.getElementById('home-screen');
const selectScreen = document.getElementById('select-screen');
const editorScreen = document.getElementById('editor-screen');

const createNewDiaryBtn = document.getElementById('createNewDiaryBtn');
const continueDiaryBtn = document.getElementById('continueDiaryBtn');
const diaryListContainer = document.getElementById('diaryListContainer');
const cancelSelectBtn = document.getElementById('cancelSelectBtn');

const customPrompt = document.getElementById('custom-prompt');
const promptInput = document.getElementById('promptInput');
const promptOk = document.getElementById('promptOk');
const promptCancel = document.getElementById('promptCancel');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let diaryToDeleteIndex = null; 

const diaryTitleDisplay = document.getElementById('diaryTitleDisplay');
const insertPhotoBtn = document.getElementById('insertPhotoBtn');
const photoInput = document.getElementById('photoInput');

const workspace = document.getElementById('workspace');
const mainPaper = document.getElementById('mainPaper');
const saveAndExitBtn = document.getElementById('saveAndExitBtn');

// Elemen Modal Credit
const creditBtn = document.getElementById('creditBtn');
const creditModal = document.getElementById('credit-modal');
const closeCreditBtn = document.getElementById('closeCreditBtn');

// Elemen Modal Changelog
const changelogBtn = document.getElementById('changelogBtn');
const changelogModal = document.getElementById('changelog-modal');
const closeChangelogBtn = document.getElementById('closeChangelogBtn');

// Elemen Modal Exit
const exitAppBtn = document.getElementById('exitAppBtn');
const exitConfirmModal = document.getElementById('exit-confirm-modal');
const cancelExitBtn = document.getElementById('cancelExitBtn');
const confirmExitBtn = document.getElementById('confirmExitBtn');

function updateHomeButtons() {
    if (storageData && storageData.length > 0) {
        continueDiaryBtn.removeAttribute('disabled');
    } else {
        continueDiaryBtn.setAttribute('disabled', 'true');
    }
}
updateHomeButtons();

// --- LOGIKA POP-UP CREDIT ---
creditBtn.addEventListener('click', () => {
    creditModal.classList.remove('modal-hidden');
});

closeCreditBtn.addEventListener('click', () => {
    creditModal.classList.add('modal-hidden');
});

// --- LOGIKA POP-UP CHANGELOG ---
changelogBtn.addEventListener('click', () => {
    changelogModal.classList.remove('modal-hidden');
});

closeChangelogBtn.addEventListener('click', () => {
    changelogModal.classList.add('modal-hidden');
});

// --- LOGIKA POP-UP BUAT DIARI BARU (MENGGUNAKAN ANIMASI HALUS) ---
createNewDiaryBtn.addEventListener('click', () => {
    customPrompt.classList.remove('modal-hidden');
    promptInput.value = '';
    promptInput.focus();
});

promptCancel.addEventListener('click', () => {
    customPrompt.classList.add('modal-hidden');
});

promptOk.addEventListener('click', () => {
    let title = promptInput.value.trim();
    if (!title) title = "Diary Cantikku"; 
    
    customPrompt.classList.add('modal-hidden');

    let newDiary = { title: title, content: '<div><br></div>' };
    storageData.push(newDiary);
    activeDiaryIndex = storageData.length - 1;
    
    saveToStorage();
    openEditor();
});

// --- LOGIKA LANJUTKAN & HAPUS DIARI ---
continueDiaryBtn.addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    selectScreen.classList.remove('hidden');
    renderDiaryList();
});

cancelSelectBtn.addEventListener('click', () => {
    selectScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    updateHomeButtons();
});

function renderDiaryList() {
    diaryListContainer.innerHTML = '';
    storageData.forEach((diary, index) => {
        const li = document.createElement('li');
        li.className = 'diary-item';
        li.innerHTML = `
            <span style="font-weight:bold; color:#6d4c41;">📖 ${diary.title}</span>
            <button class="btn-tool" style="background:#ff4766; color:white; border:none; padding:5px 12px;" onclick="deleteDiary(event, ${index})">Hapus</button>
        `;
        li.addEventListener('click', () => {
            activeDiaryIndex = index;
            selectScreen.classList.add('hidden');
            openEditor();
        });
        diaryListContainer.appendChild(li);
    });
}

window.deleteDiary = function(event, index) {
    event.stopPropagation();
    diaryToDeleteIndex = index; 
    deleteConfirmModal.classList.remove('modal-hidden'); 
}

cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.add('modal-hidden');
    diaryToDeleteIndex = null; 
});

confirmDeleteBtn.addEventListener('click', () => {
    if (diaryToDeleteIndex !== null) {
        storageData.splice(diaryToDeleteIndex, 1);
        saveToStorage();
        
        deleteConfirmModal.classList.add('modal-hidden');
        diaryToDeleteIndex = null;
        
        if(storageData.length === 0) cancelSelectBtn.click();
        else renderDiaryList();
    }
});

// --- LOGIKA EDITOR, FOTO, & RUANG KERJA ---
function openEditor() {
    homeScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');
    diaryTitleDisplay.textContent = "📖 " + storageData[activeDiaryIndex].title;
    
    mainPaper.innerHTML = storageData[activeDiaryIndex].content || '<div><br></div>';
    attachPhotoEventsToPaper(); 
    
    setTimeout(() => {
        mainPaper.focus();
        document.execCommand('selectAll', false, null);
        document.getSelection().collapseToEnd();
    }, 50);
}

saveAndExitBtn.addEventListener('click', () => {
    saveCurrentContent();
    editorScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    updateHomeButtons();
});

mainPaper.addEventListener('input', saveCurrentContent);

workspace.addEventListener('click', (e) => {
    if(e.target === workspace) mainPaper.focus();
});

document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node.nodeType === 3) node = node.parentNode;
        if (node && node.closest && node.closest('#mainPaper')) {
            savedCursorRange = sel.getRangeAt(0);
        }
    }
});

function saveCurrentContent() {
    if (activeDiaryIndex === null) return;
    const strayGhosts = mainPaper.querySelectorAll('.ghost-preview');
    strayGhosts.forEach(g => g.remove());
    storageData[activeDiaryIndex].content = mainPaper.innerHTML;
    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem('cuteDiariesDataV7', JSON.stringify(storageData));
}

insertPhotoBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                if (width > 500) { height = Math.round((height * 500) / width); width = 500; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
                const imgHtml = `<img src="${compressedBase64}" class="diary-photo" draggable="true" style="float: left;">`;
                
                mainPaper.focus();
                if (savedCursorRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedCursorRange);
                }
                
                document.execCommand('insertHTML', false, imgHtml);
                attachPhotoEventsToPaper();
                saveCurrentContent();
                photoInput.value = "";
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function attachPhotoEventsToPaper() {
    const photos = mainPaper.querySelectorAll('.diary-photo:not(.ghost-preview)');
    photos.forEach(photo => {
        if (photo.dataset.isDraggable) return;
        photo.dataset.isDraggable = "true";

        photo.ondblclick = (e) => {
            e.stopPropagation();
            photo.style.float = (photo.style.float === 'right') ? 'left' : 'right';
            saveCurrentContent();
        };

        photo.addEventListener('dragstart', (e) => {
            dragTarget = photo;
            setTimeout(() => dragTarget.style.opacity = '0.3', 0);
            ghostPreview = photo.cloneNode(true);
            ghostPreview.classList.add('ghost-preview');
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
        });

        photo.addEventListener('dragend', (e) => {
            if (dragTarget) dragTarget.style.opacity = '1'; 
            if (ghostPreview && ghostPreview.parentNode) ghostPreview.parentNode.removeChild(ghostPreview);
            dragTarget = null; ghostPreview = null;
            saveCurrentContent();
        });
    });
}

mainPaper.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dragTarget && ghostPreview) {
        let range = null;
        if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(e.clientX, e.clientY);
        else if (document.caretPositionFromPoint) { 
            let position = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (position) {
                range = document.createRange();
                range.setStart(position.offsetNode, position.offset);
            }
        }
        if (range) range.insertNode(ghostPreview);
    }
});

mainPaper.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragTarget && ghostPreview && ghostPreview.parentNode) {
        ghostPreview.parentNode.replaceChild(dragTarget, ghostPreview);
        dragTarget.style.opacity = '1';
        saveCurrentContent();
    }
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// ================= LOGIKA MUSIK (WEB AUDIO API - ANTI LAG) =================
const bgMusic = document.getElementById('bg-music');
let audioCtx, gainNode, source;

// Inisialisasi AudioContext (Harus dilakukan setelah klik user)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        source = audioCtx.createMediaElementSource(bgMusic);
        gainNode = audioCtx.createGain();
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = 0; // Mulai dari sunyi
    }
}

// Fade In menggunakan fungsi bawaan browser (Tanpa setInterval)
function fadeInMusic() {
    initAudio();
    bgMusic.play().catch(e => console.log("Audio waiting"));
    // RampToValueAtTime membuat perubahan volume sangat halus di level hardware
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);
}

// Fade Out menggunakan fungsi bawaan browser
function fadeOutMusic() {
    if (!gainNode) return;
    // Turunkan volume ke 0 dalam waktu 2 detik
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    
    setTimeout(() => {
        bgMusic.currentTime = 0;
        bgMusic.play();
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);
    }, 2000);
}

// Deteksi lagu habis
bgMusic.addEventListener('timeupdate', () => {
    if (!isNaN(bgMusic.duration) && (bgMusic.duration - bgMusic.currentTime <= 2.1)) {
        // Panggil fadeOut hanya sekali
        if (bgMusic.dataset.fading !== "true") {
            bgMusic.dataset.fading = "true";
            fadeOutMusic();
        }
    } else {
        bgMusic.dataset.fading = "false";
    }
});
// ===========================================================================

// LOGIKA LAYAR PEMBUKA (3 FASE)
const splashScreen = document.getElementById('splash-screen');
const startTrigger = document.getElementById('start-trigger');
const splashContent = document.getElementById('splash-content');
const splashText = document.getElementById('splash-text');
const splashHint = document.getElementById('splash-hint');
const mainApp = document.getElementById('main-app');

const textToType = "Logo ini dibuat oleh Eca pada Sabtu, 18 Juli 2026. Meski tampil dengan desain yang sederhana, setiap bagiannya memiliki makna yang mendalam. Logo ini lahir dari ketulusan dan kasih sayang yang diwujudkan dalam bentuk yang sederhana, namun penuh arti. Seperti bunga dandelion yang tumbuh dan mekar karena cahaya matahari, logo ini melambangkan cinta yang tumbuh dengan kehangatan, keikhlasan, dan harapan. Kesederhanaannya justru menjadi sumber keindahan yang mampu menghadirkan rasa nyaman, kebahagiaan, dan makna bagi setiap orang yang melihatnya.";
let typingIndex = 0;
let isTyping = false;
let typingTimer;
let hasStarted = false; // Sensor Fase

function typeWriter() {
    if (typingIndex < textToType.length) {
        isTyping = true;
        splashText.innerHTML += textToType.charAt(typingIndex);
        typingIndex++;
        typingTimer = setTimeout(typeWriter, 40); 
    } else {
        isTyping = false;
        splashHint.classList.add('show-hint'); 
    }
}

splashScreen.addEventListener('click', () => {
    if (!hasStarted) {
        // FASE 1: Klik pertama untuk memutar musik & memulai animasi
        hasStarted = true;
        startTrigger.classList.add('hidden-content');
        splashContent.classList.remove('hidden-content');
        
        fadeInMusic(); // Musik langsung diputar dari detik ini!
        
        setTimeout(typeWriter, 2000); // Teks mulai mengetik setelah logo membesar
    } 
    else if (isTyping) {
        // FASE 2: Jika sedang mengetik, klik akan mempercepat (Skip) tulisan
        clearTimeout(typingTimer);
        splashText.innerHTML = textToType;
        typingIndex = textToType.length;
        isTyping = false;
        splashHint.classList.add('show-hint');
    } 
    else {
        // FASE 3: Tulisan selesai, klik akan menutup layar pembuka
        splashScreen.classList.add('splash-hidden');
        mainApp.classList.remove('app-blurred'); 
    }
});

// ================= DETEKSI PLATFORM (WEB VS WINDOWS EXE) =================
const downloadExeLink = document.getElementById('downloadExeLink');

// Membaca "KTP Digital" sistem
const userAgent = navigator.userAgent.toLowerCase();
const isElectron = userAgent.indexOf('electron') > -1;

if (isElectron) {
    // ======== MODE APLIKASI WINDOWS (.EXE) ========
    if (downloadExeLink) downloadExeLink.style.display = 'none';
    
    // Aktifkan Background 60 FPS
    document.body.classList.add('bg-anim-app');

    if (exitAppBtn) {
        exitAppBtn.style.display = 'inline-block';
        exitAppBtn.addEventListener('click', () => {
            exitConfirmModal.classList.remove('modal-hidden');
        });
    }
} else {
    // ======== MODE WEB BROWSER ========
    if (exitAppBtn) exitAppBtn.style.display = 'none';
    
    // Aktifkan Background 30 FPS pada SELURUH HALAMAN
    document.body.classList.add('bg-anim-web');
}

// Logika Batal Keluar (Menutup pop-up lucu)
if (cancelExitBtn) {
    cancelExitBtn.addEventListener('click', () => {
        exitConfirmModal.classList.add('modal-hidden');
    });
}

// Logika Jadi Keluar (Menutup Aplikasi)
if (confirmExitBtn) {
    confirmExitBtn.addEventListener('click', () => {
        confirmExitBtn.innerHTML = "Sampai Jumpa... ❤️";
        setTimeout(() => {
            window.close();
        }, 800);
    });
}