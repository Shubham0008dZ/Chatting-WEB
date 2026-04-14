// ==========================================
// CONFIGURATION
// ==========================================
// 1. Apna naya Google Apps Script URL yaha dalein
const scriptURL = 'YOUR_NEW_GOOGLE_SCRIPT_URL_HERE'; 
// 2. Apni Netlify website ka URL yaha dalein (For Email Links)
const frontendURL = 'https://your-netlify-site-name.netlify.app';

let currentUserEmail = ""; 
let currentUserName = "";

// ==========================================
// ON LOAD LOGIC: CHECK URL FOR VERIFICATION
// ==========================================
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyEmail = urlParams.get('verify');
    
    if (verifyEmail) {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.querySelector('.auth-tabs').classList.add('hidden');
        document.getElementById('verify-loader').classList.remove('hidden');
        
        // Backend ko bolo account verify kare
        fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: "verify", email: verifyEmail })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                alert("Account Verified Successfully!");
                currentUserEmail = verifyEmail;
                loginSuccess();
            } else {
                alert("Verification failed: " + data.message);
                window.location.href = "/"; // Reload
            }
        });
    }
};

// ==========================================
// AUTH UI LOGIC
// ==========================================
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
    
    if(tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

// REGISTER FUNCTION
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('reg-submit-btn');
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    
    btn.innerHTML = 'Sending...'; btn.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "register", 
            email: email, 
            username: username,
            frontendUrl: frontendURL // Send this so backend knows where to link back
        })
    }).then(() => {
        btn.classList.add('hidden');
        document.getElementById('reg-msg').classList.remove('hidden');
    });
});

// LOGIN FUNCTION (Mock for now, assumes user is verified)
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUserEmail = document.getElementById('login-email').value;
    loginSuccess();
});

function loginSuccess() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    // Clean URL so refresh doesn't trigger verification again
    window.history.replaceState({}, document.title, "/");
}

// ==========================================
// CHAT & INVITE LOGIC (Old logic preserved + expanded)
// ==========================================
const emptyState = document.getElementById('empty-state');
const chatArea = document.getElementById('chat-area');
const requestsArea = document.getElementById('requests-area');
const activeChatName = document.getElementById('active-chat-name');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('message-input');
const inviteModal = document.getElementById('invite-modal');

// Old Logic Kept Intact
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

// Old Logic Kept Intact
function closeChat() {
    chatArea.classList.add('hidden');
    emptyState.classList.remove('hidden');
}

function showRequests() {
    emptyState.classList.add('hidden');
    chatArea.classList.add('hidden');
    requestsArea.classList.remove('hidden');
}

function openInviteModal() { inviteModal.classList.remove('hidden'); }
function closeInviteModal() { inviteModal.classList.add('hidden'); document.getElementById('invite-msg').classList.add('hidden'); }

// NEW LOGIC: Send Invitation
function sendInvite() {
    const targetEmail = document.getElementById('invite-email').value;
    const btn = document.querySelector('.modal-actions .btn-primary');
    if(!targetEmail) return;

    btn.innerHTML = 'Sending...';
    
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: "invite", 
            targetEmail: targetEmail,
            fromEmail: currentUserEmail,
            fromName: "Current User", // Aap isko state se le sakte hain
            frontendUrl: frontendURL
        })
    }).then(() => {
        btn.innerHTML = 'Send Request';
        document.getElementById('invite-msg').textContent = "Invitation sent to " + targetEmail;
        document.getElementById('invite-msg').classList.remove('hidden');
        setTimeout(closeInviteModal, 2000);
    });
}

// Old Send Message Logic
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
