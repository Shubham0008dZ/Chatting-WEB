const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';
const frontendURL = 'https://wondrous-frangollo-ad2a42.netlify.app'; 

let currentUserEmail = ""; 
let currentUserName = "";
let currentChatUserEmail = ""; 
let messagePollInterval = null; 
let activeUsersCache = []; 
let lastMsgDataHash = ""; 

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

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim(); 
    const btn = document.getElementById('login-submit-btn');
    const msg = document.getElementById('login-msg');

    btn.innerHTML = 'Authenticating...'; btn.disabled = true;
    msg.classList.add('hidden'); 

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "login", email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
        btn.innerHTML = 'Secure Login'; btn.disabled = false;
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
        btn.innerHTML = 'Secure Login'; btn.disabled = false;
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
    setTimeout(() => { document.getElementById('auth-screen').classList.add('hidden'); }, 500); 
    
    const appScreen = document.getElementById('app-screen');
    appScreen.classList.remove('hidden'); 
    setTimeout(() => { appScreen.classList.add('active'); }, 50);
    
    document.getElementById('my-profile-name').onclick = () => { window.location.href = 'settings.html'; };

    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "get_settings", email: currentUserEmail }) })
    .then(res => res.json()).then(data => {
        let dpSrc = `https://ui-avatars.com/api/?name=${currentUserName}&background=random`;
        if(data.data && data.data.profile_pic) dpSrc = data.data.profile_pic;
        document.getElementById('my-profile-name').innerHTML = `<img src="${dpSrc}" style="width:35px;height:35px;border-radius:50%;object-fit:cover;"> <span style="margin-left:10px;">${currentUserName}</span>`;
    });

    window.history.replaceState({}, document.title, "/");
    fetchUsersList();
    setInterval(fetchUsersList, 5000); 
}

// ATTACHMENT LOGIC WITH COMPRESSION
document.getElementById('attachment-btn').addEventListener('click', () => { document.getElementById('file-input').click(); });
document.getElementById('file-input').addEventListener('change', function() {
    const file = this.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedPayload = canvas.toDataURL('image/jpeg', 0.6);
            sendAttachmentMessage("ATTACHMENT_IMAGE:" + compressedPayload); 
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// STATUS FEATURE LOGIC (WhatsApp Style)
function openStatusView() {
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('status-screen').classList.remove('hidden');
    document.getElementById('status-screen').classList.add('active');
    
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "get_settings", email: currentUserEmail }) })
    .then(res => res.json()).then(data => {
        let dpSrc = `https://ui-avatars.com/api/?name=${currentUserName}&background=random`;
        if(data.data && data.data.profile_pic) dpSrc = data.data.profile_pic;
        document.getElementById('my-status-dp').src = dpSrc;
    });
    fetchStatuses();
}

function closeStatusView() {
    document.getElementById('status-screen').classList.add('hidden');
    document.getElementById('status-screen').classList.remove('active');
    document.getElementById('app-screen').classList.remove('hidden');
}

function triggerStatusUpload() { document.getElementById('status-upload-input').click(); }

document.getElementById('status-upload-input').addEventListener('change', function() {
    const file = this.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            document.getElementById('status-viewer-content').innerHTML = `<h2>Uploading Status... <i class="fa-solid fa-spinner fa-spin"></i></h2>`;
            fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    action: "add_status", email: currentUserEmail, username: currentUserName,
                    profile_pic: document.getElementById('my-status-dp').src, status_image: compressedBase64, status_text: "Status Update"
                })
            }).then(() => { fetchStatuses(); });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

function fetchStatuses() {
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "get_statuses" }) })
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('status-list-container');
        list.innerHTML = '<p class="section-title" style="padding:0 20px;">Recent updates</p>';
        if(data.status === 'success' && data.data.length > 0) {
            data.data.forEach(st => {
                const item = `
                    <div class="status-item" onclick="viewStatus('${st.status_image}', '${st.username}', '${st.timestamp}')">
                        <div class="avatar status-ring" style="width:55px; height:55px;"><img src="${st.profile_pic}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div>
                        <div><span style="font-size:16px; font-weight:500;">${st.username}</span><span style="display:block; font-size:13px; color:var(--text-secondary);">${st.timestamp}</span></div>
                    </div>`;
                list.insertAdjacentHTML('beforeend', item);
            });
        } else {
            list.insertAdjacentHTML('beforeend', '<p class="text-muted" style="padding:15px 20px;">No recent updates.</p>');
        }
    });
}

function viewStatus(imgSrc, userName, time) {
    document.getElementById('status-screen').classList.add('viewing-active'); // For mobile
    const viewer = document.getElementById('status-viewer-content');
    viewer.innerHTML = `
        <div style="position:absolute; top:20px; left:20px; display:flex; align-items:center; gap:15px; background:rgba(0,0,0,0.5); padding:10px 20px; border-radius:10px; z-index:10;">
            <i class="fa-solid fa-arrow-left back-btn" style="display:block; cursor:pointer;" onclick="document.getElementById('status-screen').classList.remove('viewing-active');"></i>
            <span style="color:white; font-size:18px; font-weight:bold;">${userName}</span>
            <span style="color:#aaa; font-size:14px;">${time}</span>
        </div>
        <img src="${imgSrc}" class="status-display-img">
    `;
}

// EMOJI PICKER
const emojiBtn = document.getElementById('emoji-btn');
const emojiPickerContainer = document.getElementById('emoji-picker-container');
const msgInput = document.getElementById('message-input');

emojiBtn.addEventListener('click', () => { emojiPickerContainer.classList.toggle('hidden'); });
document.querySelector('emoji-picker').addEventListener('emoji-click', event => { msgInput.value += event.detail.unicode; });
document.addEventListener('click', (e) => { if (!emojiBtn.contains(e.target) && !emojiPickerContainer.contains(e.target)) { emojiPickerContainer.classList.add('hidden'); } });

// GET USERS
function fetchUsersList() {
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "get_users", email: currentUserEmail }) })
    .then(res => res.json())
    .then(data => {
        const listContainer = document.getElementById('chat-list-container');
        listContainer.innerHTML = ''; 
        if(data.status === 'success' && data.data.length > 0) {
            activeUsersCache = data.data.map(u => u.email); 
            data.data.forEach(user => {
                let badgeHtml = user.unread > 0 ? `<span class="unread-badge">${user.unread}</span>` : "";
                const dpSrc = user.profile_pic ? user.profile_pic : `https://ui-avatars.com/api/?name=${user.username}&background=random`;
                const item = `<div class="chat-item" onclick="openChat('${user.email}', '${user.username}', '${dpSrc}')">
                        <div class="avatar"><img src="${dpSrc}"></div><span>${user.username}</span>${badgeHtml}</div>`;
                listContainer.insertAdjacentHTML('beforeend', item);
            });
        } else { listContainer.innerHTML = '<p class="loading-text">No active users yet.</p>'; }
    });
}

// CHAT UI CONTROLS
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
    emptyState.classList.remove('hidden'); chatArea.classList.add('hidden'); requestsArea.classList.add('hidden');
    clearInterval(messagePollInterval); closeChatMobile(); fetchUsersList(); 
}

function showRequests() {
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu .menu-item')[1].classList.add('active');
    emptyState.classList.add('hidden'); chatArea.classList.add('hidden'); requestsArea.classList.remove('hidden');
    clearInterval(messagePollInterval); mainContainer.classList.add('chat-active'); 
}

function openChat(targetEmail, targetName, targetDp) {
    emptyState.classList.add('hidden'); requestsArea.classList.add('hidden'); chatArea.classList.remove('hidden');
    mainContainer.classList.add('chat-active');
    activeChatName.textContent = targetName; currentChatUserEmail = targetEmail; activeChatStatus.textContent = "Connecting...";
    document.querySelector('.chat-title .avatar').innerHTML = `<img src="${targetDp}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    lastMsgDataHash = ""; chatMessages.innerHTML = '<p class="loading-text">Loading secure connection...</p>';
    fetchMessages();
    if(messagePollInterval) clearInterval(messagePollInterval);
    messagePollInterval = setInterval(fetchMessages, 3000);
}

function closeChatMobile() { mainContainer.classList.remove('chat-active'); clearInterval(messagePollInterval); fetchUsersList(); }

msgInput.addEventListener('keydown', function (e) {
    const isMobile = window.innerWidth <= 768;
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); sendMessage(); }
});

function parseDDMMYYYY(dateStr) {
    if(!dateStr || dateStr === "Offline") return null;
    try {
        const p = dateStr.split(' '); const d = p[0].split('-'); const t = p[1].split(':');
        return new Date(d[2], d[1] - 1, d[0], t[0], t[1]);
    } catch(e) { return null; }
}

// FETCH MESSAGES (FLICKER FIX)
function fetchMessages() {
    if(!currentChatUserEmail) return;
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "get_messages", email: currentUserEmail, targetEmail: currentChatUserEmail }) })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            if(data.targetStatus) {
                const lastDate = parseDDMMYYYY(data.targetStatus);
                if(lastDate && (new Date() - lastDate < 120000)) { activeChatStatus.textContent = "Online"; activeChatStatus.classList.add('online'); } 
                else { activeChatStatus.textContent = lastDate ? `last seen at ${data.targetStatus.split(' ')[1]}` : "Offline"; activeChatStatus.classList.remove('online'); }
            }
            const currentHash = JSON.stringify(data.data);
            if(currentHash === lastMsgDataHash) return; 
            lastMsgDataHash = currentHash; 

            const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;

            chatMessages.innerHTML = '';
            if(data.data.length === 0) { chatMessages.innerHTML = `<div class="loading-text" style="background:var(--panel-bg); border-radius:10px; align-self:center; margin-top:20px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">🔒 End-to-end encrypted. Say Hi!</div>`; } 
            else {
                data.data.forEach(msg => {
                    const isMe = msg.sender === currentUserEmail; const msgClass = isMe ? 'msg sent' : 'msg received';
                    const timeOnly = msg.timestamp.split(' ')[1]; 
                    let statusIcon = '';
                    if (isMe) { statusIcon = msg.status === 'read' ? '<i class="fa-solid fa-check-double" style="color:#53bdeb;"></i>' : '<i class="fa-solid fa-check"></i>'; }
                    let contentHtml = msg.message.startsWith("ATTACHMENT_IMAGE:") ? `<img src="${msg.message.replace("ATTACHMENT_IMAGE:", "")}" class="msg-attachment" alt="Image">` : `<div class="msg-content">${msg.message}</div>`;
                    chatMessages.insertAdjacentHTML('beforeend', `<div class="${msgClass}">${contentHtml}<div class="msg-meta"><span>${timeOnly}</span>${statusIcon}</div></div>`);
                });
                if(isScrolledToBottom) { chatMessages.scrollTop = chatMessages.scrollHeight; }
            }
        }
    });
}

function sendMessage() {
    const text = msgInput.value.trim();
    if(text === "" || !currentChatUserEmail) return;
    emojiPickerContainer.classList.add('hidden'); 
    const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    chatMessages.insertAdjacentHTML('beforeend', `<div class="msg sent" style="opacity:0.8"><div class="msg-content">${text}</div><div class="msg-meta"><span>${timeNow}</span><i class="fa-regular fa-clock"></i></div></div>`);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    msgInput.value = "";
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "send_message", email: currentUserEmail, receiver: currentChatUserEmail, message: text }) })
    .then(() => { lastMsgDataHash = ""; fetchMessages(); }); 
}

function sendAttachmentMessage(base64Payload) {
    if(!currentChatUserEmail) return;
    const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    chatMessages.insertAdjacentHTML('beforeend', `<div class="msg sent" style="opacity:0.6"><img src="${base64Payload.replace("ATTACHMENT_IMAGE:", "")}" class="msg-attachment"><div class="msg-meta"><span>${timeNow}</span><i class="fa-solid fa-spinner fa-spin"></i></div></div>`);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "send_message", email: currentUserEmail, receiver: currentChatUserEmail, message: base64Payload }) })
    .then(() => { lastMsgDataHash = ""; fetchMessages(); });
}

// INVITE LOGIC (With Validation)
const inviteModal = document.getElementById('invite-modal');
function openInviteModal() { inviteModal.classList.remove('hidden'); }
function closeInviteModal() { inviteModal.classList.add('hidden'); document.getElementById('invite-email').value = ""; }
document.querySelector('.btn-invite').addEventListener('click', openInviteModal);

function sendInvite() {
    const targetEmail = document.getElementById('invite-email').value.trim();
    if(!targetEmail) return;
    if(activeUsersCache.includes(targetEmail)) { alert("This user is already in your Active Users list!"); return; }
    
    const btn = document.querySelector('.modal-actions .btn-primary');
    btn.innerHTML = 'Sending...'; btn.disabled = true;
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "invite", targetEmail: targetEmail, fromEmail: currentUserEmail, fromName: currentUserName, frontendUrl: frontendURL }) })
    .then(() => { btn.innerHTML = 'Send Invite'; btn.disabled = false; alert("Premium Invitation sent to " + targetEmail); closeInviteModal(); });
}
