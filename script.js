// Auth Logic
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const demoVerifyBtn = document.getElementById('demo-verify-btn');
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

// 1. User submits email
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    if(email) {
        // UI change: Hide button, show mock email sent message
        document.querySelector('#auth-form button[type="submit"]').classList.add('hidden');
        authMessage.classList.remove('hidden');
    }
});

// 2. Demo bypass for email verification click
demoVerifyBtn.addEventListener('click', () => {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
});

// Chat Logic
const appContainer = document.querySelector('.app-container');
const chatMessages = document.getElementById('chat-messages');
const activeChatName = document.getElementById('active-chat-name');
const msgInput = document.getElementById('message-input');
const micIcon = document.getElementById('mic-icon');
const sendIcon = document.getElementById('send-icon');

// 3. Open Chat (Responsive handling)
function openChat(name, initialMsg) {
    activeChatName.textContent = name;
    appContainer.classList.add('chat-active'); // Hides sidebar on mobile
    
    // Clear old mock messages and set new ones
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
    
    const msgHTML = `
        <div class="msg sent">
            ${text}
            <span class="msg-time">${time} <i class="fa-solid fa-check-double" style="color: #53bdeb;"></i></span>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', msgHTML);
    msgInput.value = "";
    micIcon.classList.remove('hidden');
    sendIcon.classList.add('hidden');
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Allow Enter key to send message
msgInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});