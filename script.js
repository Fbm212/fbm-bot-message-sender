// ================================
// BOT CONFIGURATION
// ================================
const BOT_TOKEN = "7673657711:AAG9aHlpI8_Egvwi0fY9rxA4qyEfqOw16nU";

// ================================
// LOCAL STORAGE KEYS
// ================================
const STORAGE_KEYS = {
    CHAT_IDS: 'telegram_sender_chat_ids',
    CUSTOM_MESSAGE: 'telegram_sender_custom_message',
    CUSTOM_BUTTONS: 'telegram_sender_custom_buttons',
    FILE_NAME: 'telegram_sender_file_name'
};

// ================================
// STATE VARIABLES
// ================================
let isSending = false;
let successIDs = [];
let failedIDs = [];
let totalIDsCount = 0;
let isStatusVisible = false; // Initially hidden

// ================================
// INITIALIZATION
// ================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize OTP
    generateRandomOTP();
    
    // Setup event listeners
    setupEventListeners();
    
    // Clear status boxes initially
    clearStatusBoxes();
    
    // Initialize status counters
    updateStatusCounters();
    
    // Initially hide status section
    hideStatusSection();
});

// ================================
// EVENT LISTENERS SETUP
// ================================
function setupEventListeners() {
    // Formatting tools
    setupFormattingTools();
    
    // File upload preview system
    setupFileUpload();
}

// ================================
// FORMATTING TOOLS SETUP
// ================================
function setupFormattingTools() {
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleFormatting(this.dataset.format);
        });
    });
}

// ================================
// FILE UPLOAD SETUP
// ================================
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const previewBtn = document.getElementById('previewBtn');
    const removeBtn = document.getElementById('remove-pr-Btn');
    const previewPopup = document.getElementById('previewPopup');
    const previewImage = document.getElementById('previewImage');
    const closePopup = document.getElementById('close-PR-Popup');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileName.textContent = file.name;
                previewBtn.hidden = false;
                removeBtn.hidden = false;
                
                // NO AUTO PREVIEW - Only when preview button is clicked
            }
        });
    }
    
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileReader = new FileReader();
                fileReader.onload = function() {
                    previewImage.src = fileReader.result;
                };
                fileReader.readAsDataURL(file);
                previewPopup.classList.remove('hidden');
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            fileInput.value = "";
            fileName.textContent = "No file chosen";
            previewBtn.hidden = true;
            removeBtn.hidden = true;
        });
    }
    
    if (closePopup) {
        closePopup.addEventListener('click', function() {
            previewPopup.classList.add('hidden');
        });
    }
}

// ================================
// ALERT SYSTEM
// ================================
function showAlert(message, type = 'info') {
    const alertBox = document.getElementById("customAlert");
    const alertMessage = document.getElementById("alertMessage");
    
    if (!alertBox || !alertMessage) return;
    
    // Set alert type color
    const colors = {
        'success': '#4CAF50',
        'error': '#f44336',
        'warning': '#FF9800',
        'info': '#2196F3'
    };
    
    alertBox.style.borderColor = colors[type] || colors['info'];
    alertMessage.textContent = message;
    alertBox.classList.add("show");
    
    setTimeout(() => {
        alertBox.classList.remove("show");
    }, 2000);
}

// ================================
// FORMATTING TOOLS HANDLER
// ================================
function handleFormatting(formatType) {
    const messageField = document.getElementById('custom-message');
    if (!messageField) return;
    
    const start = messageField.selectionStart;
    const end = messageField.selectionEnd;
    const selectedText = messageField.value.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = start;
    
    switch(formatType) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            newCursorPos = start + 2 + selectedText.length;
            break;
        case 'italic':
            formattedText = `_${selectedText}_`;
            newCursorPos = start + 1 + selectedText.length;
            break;
        case 'mono':
            formattedText = `\`${selectedText}\``;
            newCursorPos = start + 1 + selectedText.length;
            break;
        case 'quote':
            formattedText = `> ${selectedText}`;
            newCursorPos = start + 2 + selectedText.length;
            break;
        case 'spoiler':
            formattedText = `||${selectedText}||`;
            newCursorPos = start + 2 + selectedText.length;
            break;
        case 'strikethrough':
            formattedText = `~${selectedText}~`;
            newCursorPos = start + 1 + selectedText.length;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            newCursorPos = start + 2 + selectedText.length;
            break;
        case 'link':
            const url = prompt('Enter URL:', 'https://');
            if (url) {
                const linkText = selectedText || 'Click here';
                formattedText = `[${linkText}](${url})`;
                newCursorPos = start + linkText.length + 2 + url.length + 3;
            } else {
                return;
            }
            break;
        case 'clear':
            // Remove all formatting
            formattedText = selectedText
                .replace(/\*\*/g, '')
                .replace(/_/g, '')
                .replace(/`/g, '')
                .replace(/^>\s*/gm, '')
                .replace(/\|\|/g, '')
                .replace(/~/g, '')
                .replace(/__/g, '')
                .replace(/\[.*?\]\(.*?\)/g, (match) => {
                    const textMatch = match.match(/\[(.*?)\]/);
                    return textMatch ? textMatch[1] : match;
                });
            newCursorPos = start + formattedText.length;
            break;
        default:
            return;
    }
    
    messageField.value = messageField.value.substring(0, start) + 
                        formattedText + 
                        messageField.value.substring(end);
    
    // Restore cursor position
    messageField.focus();
    messageField.setSelectionRange(newCursorPos, newCursorPos);
}

// ================================
// MESSAGE SENDING FUNCTION
// ================================
async function sendMessage() {
    if (isSending) {
        showAlert("Please wait, messages are already being sent.", 'warning');
        return;
    }
    
    // Get input values
    const chatIds = document.getElementById("chat-ids").value.trim();
    const customMessage = document.getElementById("custom-message").value.trim();
    const uploadFile = document.getElementById("fileInput").files[0];
    const customButtons = document.getElementById("custom-button").value.trim();
    
    // Validate inputs
    if (!chatIds) {
        showAlert("Please enter at least one Chat ID.", 'error');
        return;
    }
    if (!customMessage && !uploadFile) {
        showAlert("Please enter a custom message or upload an image.", 'error');
        return;
    }
    
    // Validate file type
    if (uploadFile && !uploadFile.type.startsWith("image/")) {
        showAlert("Only image files are allowed. Please upload a valid image.", 'error');
        return;
    }
    
    // Prepare chat IDs
    const chatIdArray = Array.from(new Set(
        chatIds.split(/[\n,]+/)
            .map(id => id.trim())
            .filter(id => id && !isNaN(id))
    ));
    
    if (chatIdArray.length === 0) {
        showAlert("No valid Chat IDs found. Please check your input.", 'error');
        return;
    }
    
    // Reset status
    resetSendingStatus();
    totalIDsCount = chatIdArray.length;
    updateStatusCounters();
    
    // Show status section when sending starts
    showStatusSection();
    
    // Start sending
    isSending = true;
    const sendButton = document.querySelector('.send-button');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
    }
    
    // Send messages
    for (let i = 0; i < chatIdArray.length; i++) {
        if (!isSending) break; // Allow cancellation
        
        const chatId = chatIdArray[i];
        
        try {
            const success = await sendSingleMessage(chatId, customMessage, uploadFile, customButtons);
            
            if (success) {
                successIDs.push(chatId);
                addIDToList('success', chatId);
            } else {
                failedIDs.push(chatId);
                addIDToList('failed', chatId);
            }
        } catch (error) {
            failedIDs.push(chatId);
            addIDToList('failed', chatId);
        }
        
        // Update status counters
        updateStatusCounters();
        
        // Update button text with progress
        if (sendButton) {
            const progress = Math.round(((i + 1) / chatIdArray.length) * 100);
            sendButton.textContent = `Sending... ${progress}% (${i + 1}/${chatIdArray.length})`;
        }
    }
    
    // Sending complete
    isSending = false;
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = 'Send Message';
    }
    
    // Show summary
    if (successIDs.length > 0) {
        showAlert(`Successfully sent ${successIDs.length} out of ${chatIdArray.length} messages!`, 'success');
    }
    
    if (failedIDs.length > 0) {
        showAlert(`${failedIDs.length} messages failed to send. Check failed IDs list.`, 'warning');
    }
}

// ================================
// SINGLE MESSAGE SENDER
// ================================
async function sendSingleMessage(chatId, customMessage, uploadFile, customButtons) {
    try {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        
        // Prepare message with Telegram formatting
        const formattedMessage = customMessage
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/_(.*?)_/g, '<i>$1</i>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^>\s*(.*?)$/gm, '<blockquote>$1</blockquote>')
            .replace(/\|\|(.*?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>')
            .replace(/~(.*?)~/g, '<s>$1</s>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        
        if (uploadFile) {
            formData.append("photo", uploadFile);
            if (formattedMessage) {
                formData.append("caption", formattedMessage);
                formData.append("parse_mode", "HTML");
            }
        } else {
            formData.append("text", formattedMessage);
            formData.append("parse_mode", "HTML");
        }
        
        // Add inline keyboard if buttons provided (using + as separator)
        if (customButtons) {
            try {
                const inlineKeyboard = customButtons.split("\n").map(buttonLine => {
                    return buttonLine.split("+").map(button => {
                        const [text, url] = button.split(" - ").map(part => part.trim());
                        return { text: text || "Button", url: url || "#" };
                    }).filter(btn => btn.text && btn.url);
                }).filter(row => row.length > 0);
                
                if (inlineKeyboard.length > 0) {
                    formData.append("reply_markup", JSON.stringify({ inline_keyboard: inlineKeyboard }));
                }
            } catch (error) {
                console.error("Error parsing buttons:", error);
            }
        }
        
        const endpoint = uploadFile
            ? `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
            : `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });
        
        const data = await response.json();
        return data.ok === true;
        
    } catch (error) {
        console.error("Error sending message to", chatId, ":", error);
        return false;
    }
}

// ================================
// STATUS SECTION TOGGLE
// ================================
function toggleStatusSection() {
    const statusContent = document.getElementById('statusContent');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    const icon = toggleBtn.querySelector('i');
    
    if (isStatusVisible) {
        hideStatusSection();
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show';
        isStatusVisible = false;
    } else {
        showStatusSection();
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        isStatusVisible = true;
    }
}

function showStatusSection() {
    const statusContent = document.getElementById('statusContent');
    if (statusContent) {
        statusContent.style.display = 'block';
        isStatusVisible = true;
    }
}

function hideStatusSection() {
    const statusContent = document.getElementById('statusContent');
    if (statusContent) {
        statusContent.style.display = 'none';
        isStatusVisible = false;
    }
}

// ================================
// STATUS MANAGEMENT FUNCTIONS
// ================================
function resetSendingStatus() {
    successIDs = [];
    failedIDs = [];
    totalIDsCount = 0;
    clearStatusBoxes();
    updateStatusCounters();
}

function clearStatusBoxes() {
    const successList = document.getElementById('successList');
    const failedList = document.getElementById('failedList');
    
    if (successList) {
        successList.innerHTML = '<div class="empty-message">No successful IDs yet</div>';
    }
    
    if (failedList) {
        failedList.innerHTML = '<div class="empty-message">No failed IDs yet</div>';
    }
}

function addIDToList(type, chatId) {
    const listId = type === 'success' ? 'successList' : 'failedList';
    const listElement = document.getElementById(listId);
    
    if (!listElement) return;
    
    // Remove empty message if present
    const emptyMessage = listElement.querySelector('.empty-message');
    if (emptyMessage) {
        listElement.removeChild(emptyMessage);
    }
    
    // Create new ID item
    const idItem = document.createElement('div');
    idItem.className = 'id-item';
    idItem.textContent = chatId;
    
    // Add to top of list
    listElement.insertBefore(idItem, listElement.firstChild);
    
    // Limit to 50 items and remove oldest if needed
    const items = listElement.querySelectorAll('.id-item');
    if (items.length > 50) {
        listElement.removeChild(items[items.length - 1]);
    }
    
    // Scroll to top
    listElement.scrollTop = 0;
}

function updateStatusCounters() {
    const successElement = document.getElementById('successCount');
    const failedElement = document.getElementById('failedCount');
    const totalElement = document.getElementById('totalCount');
    
    if (successElement) successElement.textContent = successIDs.length;
    if (failedElement) failedElement.textContent = failedIDs.length;
    if (totalElement) totalElement.textContent = totalIDsCount;
}

// ================================
// COPY FUNCTIONS FOR STATUS BOXES
// ================================
function copySuccessIDs() {
    if (successIDs.length === 0) {
        showAlert("No successful IDs to copy.", 'warning');
        return;
    }
    
    // Format for Google Sheets (one ID per line)
    const textToCopy = successIDs.join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showAlert(`${successIDs.length} successful IDs copied to clipboard!`, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showAlert("Failed to copy IDs. Please try again.", 'error');
    });
}

function copyFailedIDs() {
    if (failedIDs.length === 0) {
        showAlert("No failed IDs to copy.", 'warning');
        return;
    }
    
    // Format for Google Sheets (one ID per line)
    const textToCopy = failedIDs.join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showAlert(`${failedIDs.length} failed IDs copied to clipboard!`, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showAlert("Failed to copy IDs. Please try again.", 'error');
    });
}

// ================================
// LOCAL STORAGE FUNCTIONS
// ================================
function saveDraft() {
    try {
        const chatIds = document.getElementById('chat-ids').value;
        const customMessage = document.getElementById('custom-message').value;
        const customButtons = document.getElementById('custom-button').value;
        const fileName = document.getElementById('fileName').textContent;
        
        // Clear previous storage
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Save new data
        localStorage.setItem(STORAGE_KEYS.CHAT_IDS, chatIds);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MESSAGE, customMessage);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BUTTONS, customButtons);
        localStorage.setItem(STORAGE_KEYS.FILE_NAME, fileName === "No file chosen" ? "" : fileName);
        
        showAlert('Draft saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving draft:', error);
        showAlert('Error saving draft. Please try again.', 'error');
    }
}

function loadDraft() {
    try {
        const chatIds = localStorage.getItem(STORAGE_KEYS.CHAT_IDS) || '';
        const customMessage = localStorage.getItem(STORAGE_KEYS.CUSTOM_MESSAGE) || '';
        const customButtons = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUTTONS) || '';
        const fileName = localStorage.getItem(STORAGE_KEYS.FILE_NAME) || '';
        
        if (!chatIds && !customMessage && !customButtons && !fileName) {
            showAlert('No saved draft found.', 'warning');
            return;
        }
        
        document.getElementById('chat-ids').value = chatIds;
        document.getElementById('custom-message').value = customMessage;
        document.getElementById('custom-button').value = customButtons;
        
        if (fileName) {
            document.getElementById('fileName').textContent = fileName;
            const previewBtn = document.getElementById('previewBtn');
            const removeBtn = document.getElementById('remove-pr-Btn');
            if (previewBtn) previewBtn.hidden = false;
            if (removeBtn) removeBtn.hidden = false;
        }
        
        showAlert('Draft loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading draft:', error);
        showAlert('Error loading draft. Please try again.', 'error');
    }
}

// ================================
// FORM FUNCTIONS
// ================================
function resetForm() {
    if (isSending) {
        if (!confirm('Messages are currently being sent. Are you sure you want to cancel and reset?')) {
            return;
        }
        isSending = false;
    }
    
    // Reset form fields
    document.getElementById('chat-ids').value = '';
    document.getElementById('custom-message').value = '';
    document.getElementById('custom-button').value = '';
    
    // Reset file upload
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const previewBtn = document.getElementById('previewBtn');
    const removeBtn = document.getElementById('remove-pr-Btn');
    
    if (fileInput) fileInput.value = "";
    if (fileName) fileName.textContent = "No file chosen";
    if (previewBtn) previewBtn.hidden = true;
    if (removeBtn) removeBtn.hidden = true;
    
    // Reset status
    resetSendingStatus();
    
    // Enable send button
    const sendButton = document.querySelector('.send-button');
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = 'Send Message';
    }
    
    showAlert('Form cleared successfully!', 'success');
}

// ================================
// OTP FUNCTIONS
// ================================
function generateRandomOTP() {
    const randomOTP = Math.floor(100000 + Math.random() * 900000); // 6 digits
    const otpDisplay = document.getElementById('otpDisplay');
    if (otpDisplay) {
        otpDisplay.innerText = randomOTP;
        otpDisplay.classList.add('shake');
        setTimeout(() => {
            otpDisplay.classList.remove('shake');
        }, 300);
    }
}

function copyOTP() {
    const otp = document.getElementById('otpDisplay').innerText;
    navigator.clipboard.writeText(otp).then(() => {
        const copyBtn = document.querySelector('.button.copy');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
        showAlert('OTP copied to clipboard!', 'success');
    });
}

function toggleCustomInput() {
    const inputBox = document.getElementById('customInputBox');
    const customBtn = document.getElementById('customBtn');
    
    if (inputBox.style.display === 'block') {
        inputBox.style.display = 'none';
        customBtn.innerHTML = '<i class="fas fa-edit"></i> Custom';
        customBtn.style.background = 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
    } else {
        inputBox.style.display = 'block';
        customBtn.innerHTML = '<i class="fas fa-times"></i> Close';
        customBtn.style.background = 'linear-gradient(135deg, #FF5722 0%, #D84315 100%)';
        document.getElementById('customOTP').focus();
    }
}

function setCustomOTP(event) {
    if (event.key === 'Enter') {
        const customOTP = document.getElementById('customOTP').value.trim();
        if (customOTP !== '' && !isNaN(customOTP)) {
            document.getElementById('otpDisplay').innerText = customOTP;
            toggleCustomInput();
            document.getElementById('customOTP').value = '';
            showAlert('Custom OTP set successfully!', 'success');
        } else {
            showAlert('Please enter a valid numeric OTP.', 'error');
        }
    }
}

// ================================
// NOTE PADE FUNCTIONS
// ================================
// DOM Elements
const mainNoteBtn = document.getElementById("mainNoteBtn");
const btnIcon = document.getElementById("btnIcon");
const noteContainer = document.querySelector(".note-container");
const subButtons = document.getElementById("subButtons");
const embedModal = document.getElementById("embedModal");
const closeModal = document.getElementById("closeModal");
const embeddedFrame = document.getElementById("embeddedFrame");
const subBtns = document.querySelectorAll(".sub-btn");

// 1. Toggle Main Button (Icon Change) + Sub Buttons
if (mainNoteBtn) {
    mainNoteBtn.addEventListener("click", function () {
        noteContainer.classList.toggle("active");
        btnIcon.classList.toggle("fa-notes");
        btnIcon.classList.toggle("fa-times");
    });
}

// 2. Open Modal with Embedded Page
if (subBtns.length > 0) {
    subBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            const embedSrc = this.getAttribute("data-embed-src");
            embeddedFrame.src = embedSrc;
            embedModal.style.display = "block";
        });
    });
}

// 3. Close Modal
if (closeModal) {
    closeModal.addEventListener("click", function () {
        embedModal.style.display = "none";
        embeddedFrame.src = "";
    });
}

// 4. Close Modal if Clicked Outside
window.addEventListener("click", function (event) {
    if (event.target === embedModal) {
        embedModal.style.display = "none";
        embeddedFrame.src = "";
    }
});

// 5. Close noteContainer if clicked outside when it's active
window.addEventListener("click", function (event) {
    const isClickInside = mainNoteBtn && (mainNoteBtn.contains(event.target) || noteContainer.contains(event.target));
    
    if (!isClickInside && noteContainer && noteContainer.classList.contains("active")) {
        noteContainer.classList.remove("active");
        if (btnIcon) {
            btnIcon.classList.add("fa-notes");
            btnIcon.classList.remove("fa-times");
        }
    }
});

// ================================
// UTILITY FUNCTIONS
// ================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================
// EXPORT FUNCTIONS FOR HTML ONCLICK
// ================================
// Make functions available globally for onclick attributes
window.sendMessage = sendMessage;
window.copyOTP = copyOTP;
window.toggleCustomInput = toggleCustomInput;
window.generateRandomOTP = generateRandomOTP;
window.setCustomOTP = setCustomOTP;
window.resetForm = resetForm;
window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.copySuccessIDs = copySuccessIDs;
window.copyFailedIDs = copyFailedIDs;
window.toggleStatusSection = toggleStatusSection;
