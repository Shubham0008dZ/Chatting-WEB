const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';
const frontendURL = 'https://wondrous-frangollo-ad2a42.netlify.app'; 

let currentUserEmail = ""; 
let currentUserName = "";
let currentChatUserEmail = ""; 
let messagePollInterval = null; 

// ==========================================
// PERSISTENT LOGIN
// ==========================================
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyEmail = urlParams.get('verify');
    if (verifyEmail) {
        document.getElementById('verify-loader')?.classList.remove('hidden');
        return;
    }

    const savedEmail = localStorage.getItem('chatUserEmail');
    const savedName = localStorage.getItem('chatUserName');

    if (savedEmail && savedName) {
        currentUserEmail = savedEmail;
        currentUserName = savedName;
        loginSuccess();
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
        body: JSON.stringify({ action: "register", email: email, username: username, frontendUrl: frontendURL })
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
            localStorage.setItem('chatUserEmail', currentUserEmail);
            localStorage.setItem('chatUserName', currentUserName);
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

function logoutUser() {
    localStorage.removeItem('chatUserEmail');
    localStorage.removeItem('chatUserName');
    window.location.reload(); 
}

function loginSuccess() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('hidden');
    const appScreen = document.getElementById('app-screen');
    appScreen.classList.remove('hidden'); 
    appScreen.classList.add('active');
    
    document.getElementById('my-profile-name').innerHTML = `<i class="fa-solid fa-circle-user"></i> <span>${currentUserName}</span>`;
    window.history.replaceState({}, document.title, "/");
    fetchUsersList();
}

// ==========================================
// EMOJI PICKER LOGIC
// ==========================================
const emojiBtn = document.getElementById('emoji-btn');
const emojiPickerContainer = document.getElementById('emoji-picker-container');
const msgInput = document.getElementById('message-input');

emojiBtn.addEventListener('click', () => {
    emojiPickerContainer.classList.toggle('hidden');
});

document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
    msgInput.value += event.detail.unicode;
    msgInput.style.height = 'auto';
    msgInput.style.height = (msgInput.scrollHeight) + 'px';
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPickerContainer.contains(e.target)) {
        emojiPickerContainer.classList.add('hidden');
    }
});

// ==========================================
// FETCH USERS FOR SIDEBAR
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
        listContainer.innerHTML = ''; 
        
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
            listContainer.innerHTML = '<p class="loading-text">No active users yet.</p>';
        }
    });
}

// ==========================================
// CHAT UI CONTROLS
// ==========================================
const emptyState = document.getElementById('empty-state');
const chatArea = document.getElementById('chat-area');
const requestsArea = document.getElementById('requests-area');
const activeChatName = document.getElementById('active-chat-name');
const chatMessages = document.getElementById('chat-messages');
const mainContainer = document.getElementById('main-container');
const activeChatStatus = document.getElementById('active-chat-status');

function showUsersList() {
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu .menu-item')[0].classList.add('active');
    emptyState.classList.remove('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.add('hidden');
    clearInterval(messagePollInterval);
    closeChatMobile(); 
}

function showRequests() {
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu .menu-item')[1].classList.add('active');
    emptyState.classList.add('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.remove('hidden');
    clearInterval(messagePollInterval);
    mainContainer.classList.add('chat-active'); 
}

function openChat(targetEmail, targetName) {
    emptyState.classList.add('hidden');
    requestsArea.classList.add('hidden');
    chatArea.classList.remove('hidden');
    mainContainer.classList.add('chat-active');
    
    activeChatName.textContent = targetName;
    currentChatUserEmail = targetEmail;
    activeChatStatus.textContent = "Connecting...";
    activeChatStatus.classList.remove('online');
    
    chatMessages.innerHTML = '<p class="loading-text">Loading messages...</p>';
    fetchMessages();
    
    if(messagePollInterval) clearInterval(messagePollInterval);
    messagePollInterval = setInterval(fetchMessages, 3000);
}

function closeChatMobile() {
    mainContainer.classList.remove('chat-active');
    clearInterval(messagePollInterval);
}

// TEXTAREA RESIZE & ENTER LOGIC
msgInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

msgInput.addEventListener('keydown', function (e) {
    const isMobile = window.innerWidth <= 768;
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
        e.preventDefault(); 
        sendMessage();
    }
});

// ==========================================
// DATE PARSER FOR LAST ACTIVE STATUS
// ==========================================
function parseDDMMYYYY(dateStr) {
    // format: DD-MM-YYYY HH:MM
    if(!dateStr || dateStr === "Offline") return null;
    try {
        const parts = dateStr.split(' ');
        const dParts = parts[0].split('-');
        const tParts = parts[1].split(':');
        return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1]);
    } catch(e) {
        return null;
    }
}

// ==========================================
// FETCH MESSAGES & RENDER
// ==========================================
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
            
            // ONLINE STATUS LOGIC
            if(data.targetStatus) {
                const lastActiveDate = parseDDMMYYYY(data.targetStatus);
                if(lastActiveDate) {
                    const now = new Date();
                    const diffMs = now - lastActiveDate;
                    // If active within last 2 minutes (120000 ms), show Online
                    if(diffMs < 120000) {
                        activeChatStatus.textContent = "Online";
                        activeChatStatus.classList.add('online');
                    } else {
                        // Show time from the timestamp
                        const timeStr = data.targetStatus.split(' ')[1];
                        activeChatStatus.textContent = `last seen today at ${timeStr}`;
                        activeChatStatus.classList.remove('online');
                    }
                } else {
                    activeChatStatus.textContent = "Offline";
                    activeChatStatus.classList.remove('online');
                }
            }

            chatMessages.innerHTML = '';
            if(data.data.length === 0) {
                chatMessages.innerHTML = `<div class="loading-text" style="background:var(--panel-bg); border-radius:10px; align-self:center; margin-top:20px;">🔒 Messages are end-to-end encrypted. Say Hi!</div>`;
            } else {
                data.data.forEach(msg => {
                    const isMe = msg.sender === currentUserEmail;
                    const msgClass = isMe ? 'msg sent' : 'msg received';
                    const timeOnly = msg.timestamp.split(' ')[1]; 
                    
                    let statusIcon = '';
                    if (isMe) {
                        if (msg.status === 'read') {
                            statusIcon = '<i class="fa-solid fa-check-double" style="color:#53bdeb;"></i>';
                        } else {
                            statusIcon = '<i class="fa-solid fa-check"></i>'; 
                        }
                    }
                    
                    const html = `
                        <div class="${msgClass}">
                            <div class="msg-content">${msg.message}</div>
                            <div class="msg-meta">
                                <span>${timeOnly}</span>
                                ${statusIcon}
                            </div>
                        </div>
                    `;
                    chatMessages.insertAdjacentHTML('beforeend', html);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    });
}

// ==========================================
// SEND MESSAGE
// ==========================================
function sendMessage() {
    const text = msgInput.value.trim();
    if(text === "" || !currentChatUserEmail) return;

    emojiPickerContainer.classList.add('hidden'); // Hide picker on send

    const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const tempHtml = `
        <div class="msg sent" style="opacity:0.8">
            <div class="msg-content">${text}</div>
            <div class="msg-meta">
                <span>${timeNow}</span>
                <i class="fa-regular fa-clock"></i>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', tempHtml);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    msgInput.value = "";
    msgInput.style.height = 'auto';

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
        fetchMessages();
    });
}

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
