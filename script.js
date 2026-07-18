// MEMATIKAN KLIK KANAN BAWAAN (Agar terasa seperti aplikasi native)
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

const diaryTitleDisplay = document.getElementById('diaryTitleDisplay');
const insertPhotoBtn = document.getElementById('insertPhotoBtn');
const photoInput = document.getElementById('photoInput');

const workspace = document.getElementById('workspace');
const mainPaper = document.getElementById('mainPaper');
const saveAndExitBtn = document.getElementById('saveAndExitBtn');

// Elemen Modal Konfirmasi Hapus
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let diaryToDeleteIndex = null; // Menyimpan memori nomor diari yang mau dihapus

function updateHomeButtons() {
    if (storageData && storageData.length > 0) {
        continueDiaryBtn.removeAttribute('disabled');
    } else {
        continueDiaryBtn.setAttribute('disabled', 'true');
    }
}
updateHomeButtons();

createNewDiaryBtn.addEventListener('click', () => {
    customPrompt.classList.remove('hidden');
    promptInput.value = '';
    promptInput.focus();
});

promptCancel.addEventListener('click', () => {
    customPrompt.classList.add('hidden');
});

promptOk.addEventListener('click', () => {
    let title = promptInput.value.trim();
    if (!title) title = "Harian Cantikku"; 
    
    customPrompt.classList.add('hidden');

    let newDiary = {
        title: title,
        content: '<div><br></div>' 
    };
    storageData.push(newDiary);
    activeDiaryIndex = storageData.length - 1;
    
    saveToStorage();
    openEditor();
});

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

// Memanggil Pop-up Hapus Buatan Sendiri
window.deleteDiary = function(event, index) {
    event.stopPropagation();
    diaryToDeleteIndex = index; // Ingat diari mana yang dipilih
    deleteConfirmModal.classList.remove('hidden'); // Munculkan kotaknya
}

// Logika Tombol "Batal"
cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.add('hidden');
    diaryToDeleteIndex = null; // Lupakan pilihan
});

// Logika Tombol "Ya, Hapus"
confirmDeleteBtn.addEventListener('click', () => {
    if (diaryToDeleteIndex !== null) {
        storageData.splice(diaryToDeleteIndex, 1);
        saveToStorage();
        
        deleteConfirmModal.classList.add('hidden');
        diaryToDeleteIndex = null;
        
        if(storageData.length === 0) cancelSelectBtn.click();
        else renderDiaryList();
    }
}

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
    if(e.target === workspace) {
        mainPaper.focus();
    }
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
                let width = img.width;
                let height = img.height;

                if (width > 500) {
                    height = Math.round((height * 500) / width);
                    width = 500;
                }

                canvas.width = width;
                canvas.height = height;
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
        // CEGAH BUG DUPLIKAT: Pastikan foto hanya disuntik fungsi geser 1 kali
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
            
            if (ghostPreview && ghostPreview.parentNode) {
                ghostPreview.parentNode.removeChild(ghostPreview);
            }
            
            dragTarget = null;
            ghostPreview = null;
            saveCurrentContent();
        });
    });
}

mainPaper.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dragTarget && ghostPreview) {
        let range = null;
        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (document.caretPositionFromPoint) { 
            let position = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (position) {
                range = document.createRange();
                range.setStart(position.offsetNode, position.offset);
            }
        }

        if (range) {
            range.insertNode(ghostPreview);
        }
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