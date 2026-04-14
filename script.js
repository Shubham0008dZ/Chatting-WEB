// ==========================================
// CONFIGURATION
// ==========================================
// Your Google Apps Script Web App URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';

// ==========================================
// DOM ELEMENTS - AUTH
// ==========================================
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const demoVerifyBtn = document.getElementById('demo-verify-btn');
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const emailInput = document.getElementById('email-input');
const submitBtn = document.querySelector('#auth-form button[type="submit"]');

// ==========================================
// AUTHENTICATION & API LOGIC
// ==========================================

// 1. User submits email - Send to Google Sheets API
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    
    if(email) {
        // UI Change: Show loading state so user knows process is running
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        // Prepare Data Payload for Google Sheet
        // Ye saare keys (email, action, device, etc.) sheet me apne aap columns ban jayenge
        const payload = {
            action: "register",
            email: email,
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            browser: navigator.vendor || "Unknown",
            status: "Pending Verification"
        };

        // Send POST request using text/plain to bypass Netlify/Google CORS issues
        fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'success') {
                console.log('Success: Data saved to Google Sheet!', data);
                // UI change: Hide button, show success message
                submitBtn.classList.add('hidden');
                authMessage.classList.remove('hidden');
            } else {
                console.error('Backend Error:', data.message);
                alert('Error processing request: ' + data.message);
                resetSubmitButton();
            }
        })
        .catch(error => {
            console.error('Fetch/Network Error:', error);
            alert('Network error. Please check your connection and try again.');
            resetSubmitButton();
        });
    }
});

// Helper function to reset button on error
function resetSubmitButton() {
    submitBtn.innerHTML = 'Send Confirmation Link';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
}

// 2. Demo bypass for email verification click (Keeps previous logic intact)
demoVerifyBtn.addEventListener('click', () => {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
});


// ==========================================
// DOM ELEMENTS - CHAT UI
// ==========================================
const appContainer = document.querySelector('.app-container');
const chatMessages = document.getElementById('chat-messages');
const activeChatName = document.getElementById('active-chat-name');
const msgInput = document.getElementById('message-input');
const micIcon = document.getElementById('mic-icon');
const sendIcon = document.getElementById('send-icon');

// ==========================================
// CHAT INTERACTIVITY LOGIC
// ==========================================

// 3. Open Chat (Responsive handling)
function openChat(name, initialMsg) {
    activeChatName.textContent = name;
    appContainer.classList.add('chat-active'); // Hides sidebar on mobile
    
    // Clear old mock messages and set new ones with current time
    chatMessages.innerHTML = `
        <div class="msg received">
            ${initialMsg}
            <span class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
}

// 4. Close Chat (Back button for mobile)
function closeChat() {
    appContainer.classList.remove('chat-active');
}

// 5. Input field logic (Swap Mic and Send icon)
msgInput.addEventListener('input', () => {
    if(msgInput.value.trim() !== "") {
        micIcon.classList.add('hidden');
        sendIcon.classList.remove('hidden');
    } else {
        micIcon.classList.remove('hidden');
        sendIcon.classList.add('hidden');
    }
});

// 6. Send Message Logic
function sendMessage() {
    const text = msgInput.value.trim();
    if(text === "") return;

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Append sent message to chat area
    const msgHTML = `
        <div class="msg sent">
            ${text}
            <span class="msg-time">${time} <i class="fa-solid fa-check-double" style="color: #53bdeb;"></i></span>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', msgHTML);
    
    // Reset input area
    msgInput.value = "";
    micIcon.classList.remove('hidden');
    sendIcon.classList.add('hidden');
    
    // Auto scroll to bottom of chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 7. Allow Enter key to send message
msgInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
