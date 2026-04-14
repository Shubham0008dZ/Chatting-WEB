// ==========================================
// CONFIGURATION
// ==========================================
const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';
const frontendURL = 'https://wondrous-frangollo-ad2a42.netlify.app'; 

let currentUserEmail = ""; 
let currentUserName = "";

// ==========================================
// ON LOAD LOGIC: CHECK URL FOR VERIFICATION
// ==========================================
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyEmail = urlParams.get('verify');
    
    if (verifyEmail) {
        document.getElementById('verify-loader')?.classList.remove('hidden');
    }
};

// ==========================================
// AUTH UI LOGIC
// ==========================================
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if(tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

// ==========================================
// REGISTRATION FUNCTION
// ==========================================
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('reg-submit-btn');
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    
    btn.innerHTML = 'Sending...'; btn.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "register", 
            email: email, 
            username: username, 
            frontendUrl: frontendURL
        })
    }).then(() => {
        btn.classList.add('hidden');
        document.getElementById('reg-msg').classList.remove('hidden');
    });
});

// ==========================================
// REAL LOGIN FUNCTION
// ==========================================
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim(); 
    const btn = document.getElementById('login-submit-btn');
    const msg = document.getElementById('login-msg');

    btn.innerHTML = 'Logging in...'; btn.disabled = true;
    msg.classList.add('hidden'); 

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "login", 
            email: email, 
            password: password 
        })
    })
    .then(res => res.json())
    .then(data => {
        btn.innerHTML = 'Login'; btn.disabled = false;
        
        if(data.status === 'success') {
            currentUserEmail = email;
            currentUserName = data.username;
            loginSuccess();
        } else {
            msg.textContent = data.message;
            msg.classList.remove('hidden');
        }
    }).catch(() => {
        btn.innerHTML = 'Login'; btn.disabled = false;
        msg.textContent = "Network Error!";
        msg.classList.remove('hidden');
    });
});

// ==========================================
// LOGIN SUCCESS (WITH BLANK SCREEN FIX)
// ==========================================
function loginSuccess() {
    // 1. Auth screen ko hide karo
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('hidden');
    
    // 2. App screen ko unhide karo (Bug fix applied here)
    const appScreen = document.getElementById('app-screen');
    appScreen.classList.remove('hidden'); 
    appScreen.classList.add('active');
    
    // 3. Update Name
    document.getElementById('active-chat-name').textContent = "Welcome, " + currentUserName;
    
    // 4. Clean URL
    window.history.replaceState({}, document.title, "/");
}

// ==========================================
// CHAT & INVITE UI LOGIC
// ==========================================
const emptyState = document.getElementById('empty-state');
const chatArea = document.getElementById('chat-area');
const requestsArea = document.getElementById('requests-area');
const activeChatName = document.getElementById('active-chat-name');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('message-input');
const inviteModal = document.getElementById('invite-modal');

function openChat(name, initialMsg) {
    emptyState.classList.add('hidden');
    requestsArea.classList.add('hidden');
    chatArea.classList.remove('hidden');
    activeChatName.textContent = name;
    
    chatMessages.innerHTML = `
        <div class="msg">
            Hi, this is ${name}! Let's chat.
            <span class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
}

function closeChat() {
    chatArea.classList.add('hidden');
    emptyState.classList.remove('hidden');
}

function showRequests() {
    emptyState.classList.add('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.remove('hidden');
}

function openInviteModal() { 
    inviteModal.classList.remove('hidden'); 
}
function closeInviteModal() { 
    inviteModal.classList.add('hidden'); 
    document.getElementById('invite-email').value = "";
}

// ==========================================
// SEND CHAT INVITATION LOGIC
// ==========================================
function sendInvite() {
    const targetEmail = document.getElementById('invite-email').value.trim();
    const btn = document.querySelector('.modal-actions .btn-primary');
    if(!targetEmail) return;

    btn.innerHTML = 'Sending...'; btn.disabled = true;
    
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "invite", 
            targetEmail: targetEmail,
            fromEmail: currentUserEmail,
            fromName: currentUserName,
            frontendUrl: frontendURL
        })
    }).then(() => {
        btn.innerHTML = 'Send Request'; btn.disabled = false;
        alert("Invitation sent to " + targetEmail);
        closeInviteModal();
    }).catch(err => {
        btn.innerHTML = 'Send Request'; btn.disabled = false;
        alert("Failed to send invite.");
    });
}

// ==========================================
// SEND MESSAGE LOGIC
// ==========================================
function sendMessage() {
    const text = msgInput.value.trim();
    if(text === "") return;

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgHTML = `
        <div class="msg sent">
            ${text}
            <span class="msg-time">${time}</span>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', msgHTML);
    msgInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

msgInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { sendMessage(); }
});
