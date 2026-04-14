const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';
const frontendURL = 'https://wondrous-frangollo-ad2a42.netlify.app'; 

let currentUserEmail = ""; 
let currentUserName = "";
let currentChatUserEmail = ""; // Naya variable target user ke liye
let messagePollInterval = null; // Auto-refresh ke liye

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyEmail = urlParams.get('verify');
    if (verifyEmail) {
        document.getElementById('verify-loader')?.classList.remove('hidden');
    }
};

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

// REGISTER
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
            action: "register", email: email, username: username, frontendUrl: frontendURL
        })
    }).then(() => {
        btn.classList.add('hidden');
        document.getElementById('reg-msg').classList.remove('hidden');
    });
});

// LOGIN
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
        body: JSON.stringify({ action: "login", email: email, password: password })
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

function loginSuccess() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('hidden');
    const appScreen = document.getElementById('app-screen');
    appScreen.classList.remove('hidden'); 
    appScreen.classList.add('active');
    
    document.getElementById('my-profile-name').innerHTML = `<i class="fa-solid fa-user-check" style="color:var(--g-blue)"></i> ${currentUserName}`;
    window.history.replaceState({}, document.title, "/");
    
    // Jaise hi login ho, baaki verified users ko mangwa lo
    fetchUsersList();
}

// ==========================================
// NEW LOGIC: FETCH USERS FOR SIDEBAR
// ==========================================
function fetchUsersList() {
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "get_users", email: currentUserEmail })
    })
    .then(res => res.json())
    .then(data => {
        const listContainer = document.getElementById('chat-list-container');
        listContainer.innerHTML = ''; // Purana loading text hatao
        
        if(data.status === 'success' && data.data.length > 0) {
            data.data.forEach(user => {
                const item = `
                    <div class="chat-item" onclick="openChat('${user.email}', '${user.username}')">
                        <div class="avatar"><img src="https://ui-avatars.com/api/?name=${user.username}&background=random" alt="Av"></div>
                        <span>${user.username}</span>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', item);
            });
        } else {
            listContainer.innerHTML = '<p style="padding:10px; color:#9aa0a6; font-size:13px;">No other users found.</p>';
        }
    });
}

// ==========================================
// NEW LOGIC: CHAT INTERACTION & FETCH MESSAGES
// ==========================================
const emptyState = document.getElementById('empty-state');
const chatArea = document.getElementById('chat-area');
const requestsArea = document.getElementById('requests-area');
const activeChatName = document.getElementById('active-chat-name');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('message-input');

function showUsersList() {
    emptyState.classList.remove('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.add('hidden');
    clearInterval(messagePollInterval); // Stop auto-refresh if not in chat
}

function showRequests() {
    emptyState.classList.add('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.remove('hidden');
    clearInterval(messagePollInterval);
}

function openChat(targetEmail, targetName) {
    emptyState.classList.add('hidden');
    requestsArea.classList.add('hidden');
    chatArea.classList.remove('hidden');
    activeChatName.textContent = targetName;
    currentChatUserEmail = targetEmail;
    
    chatMessages.innerHTML = '<div style="text-align:center; padding:20px; color:#9aa0a6;">Loading messages...</div>';
    
    // Pehli baar messages lao
    fetchMessages();
    
    // Uske baad har 3 seconds me naye messages check karo (Live Chat Logic)
    if(messagePollInterval) clearInterval(messagePollInterval);
    messagePollInterval = setInterval(fetchMessages, 3000);
}

function fetchMessages() {
    if(!currentChatUserEmail) return;

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "get_messages", 
            email: currentUserEmail, 
            targetEmail: currentChatUserEmail 
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            chatMessages.innerHTML = '';
            if(data.data.length === 0) {
                chatMessages.innerHTML = `<div style="text-align:center; color:#9aa0a6; margin-top:20px;">Say Hi to ${activeChatName.textContent}!</div>`;
            } else {
                data.data.forEach(msg => {
                    const isMe = msg.sender === currentUserEmail;
                    const msgClass = isMe ? 'msg sent' : 'msg';
                    // Splitting DD-MM-YYYY HH:MM to show only time nicely
                    const timeOnly = msg.timestamp.split(' ')[1]; 
                    
                    const html = `
                        <div class="${msgClass}">
                            ${msg.message}
                            <span class="msg-time">${timeOnly}</span>
                        </div>
                    `;
                    chatMessages.insertAdjacentHTML('beforeend', html);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll to bottom
            }
        }
    });
}

// ==========================================
// NEW LOGIC: SEND MESSAGE TO DATABASE
// ==========================================
function sendMessage() {
    const text = msgInput.value.trim();
    if(text === "" || !currentChatUserEmail) return;

    // Temporary dikhane ke liye (optimistic UI update)
    const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const tempHtml = `<div class="msg sent" style="opacity:0.7">${text}<span class="msg-time">${timeNow}</span></div>`;
    chatMessages.insertAdjacentHTML('beforeend', tempHtml);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    msgInput.value = "";

    // Backend me bhejo
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "send_message", 
            email: currentUserEmail, 
            receiver: currentChatUserEmail,
            message: text
        })
    }).then(() => {
        // Successful hone pe original chat fetch kar lo
        fetchMessages();
    });
}

msgInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { sendMessage(); }
});

// ==========================================
// INVITE LOGIC
// ==========================================
const inviteModal = document.getElementById('invite-modal');
function openInviteModal() { inviteModal.classList.remove('hidden'); }
function closeInviteModal() { inviteModal.classList.add('hidden'); document.getElementById('invite-email').value = ""; }

function sendInvite() {
    const targetEmail = document.getElementById('invite-email').value.trim();
    if(!targetEmail) return;
    
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "invite", targetEmail: targetEmail, fromEmail: currentUserEmail, 
            fromName: currentUserName, frontendUrl: frontendURL
        })
    }).then(() => {
        alert("Invitation sent to " + targetEmail);
        closeInviteModal();
    });
}
