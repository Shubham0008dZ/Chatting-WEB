const scriptURL = 'https://script.google.com/macros/s/AKfycbwTbzIlQDwFuFh7pBFM_xsOHeJkNBa-nlNBEs__j0377rak2zHW-IwbEDgUuM-HOJx3/exec';
const currentUserEmail = localStorage.getItem('chatUserEmail');

window.onload = function() {
    if(!currentUserEmail) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('setting-email').value = currentUserEmail;
    fetchUserSettings();
};

function goBackToChat() {
    window.location.href = 'index.html';
}

function logoutUser() {
    localStorage.removeItem('chatUserEmail');
    localStorage.removeItem('chatUserName');
    window.location.href = 'index.html';
}

function openTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    if(element) {
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        
        // For mobile: hide sidebar when a tab is clicked
        if(window.innerWidth <= 768) {
            document.querySelector('.settings-sidebar').classList.add('hide-mobile');
        }
    }
}

// Fetch existing data
function fetchUserSettings() {
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "get_settings", email: currentUserEmail })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success' && data.data) {
            const user = data.data;
            document.getElementById('sidebar-name').textContent = user.username || 'User';
            document.getElementById('setting-name').value = user.username || '';
            document.getElementById('setting-about').value = user.about || 'Available';
            document.getElementById('sidebar-about').textContent = user.about || 'Available';
            
            const dpSrc = user.profile_pic ? user.profile_pic : `https://ui-avatars.com/api/?name=${user.username}&background=random`;
            document.getElementById('sidebar-dp').src = dpSrc;
            document.getElementById('main-dp-preview').src = dpSrc;
            
            // Apply toggles if they exist in JSON
            if(user.privacy_settings) {
                try { const p = JSON.parse(user.privacy_settings); document.getElementById('toggle-read-receipts').checked = p.readReceipts; } catch(e){}
            }
            if(user.chat_settings) {
                try { const c = JSON.parse(user.chat_settings); document.getElementById('toggle-spellcheck').checked = c.spellCheck; document.getElementById('toggle-enter-send').checked = c.enterIsSend; } catch(e){}
            }
        }
    });
}

function enableEdit(id) {
    const el = document.getElementById(id);
    el.disabled = false;
    el.focus();
}

// DP Upload Logic
let uploadedBase64Dp = null;
function triggerDpUpload() { document.getElementById('dp-upload-input').click(); }

document.getElementById('dp-upload-input').addEventListener('change', function() {
    const file = this.files[0];
    if(!file) return;
    if(file.size > 1000000) { alert("Please select an image smaller than 1MB for profile pic."); return; }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedBase64Dp = e.target.result;
        document.getElementById('main-dp-preview').src = uploadedBase64Dp;
        document.getElementById('sidebar-dp').src = uploadedBase64Dp;
    };
    reader.readAsDataURL(file);
});

function saveProfile() {
    const btn = document.getElementById('save-profile-btn');
    btn.innerHTML = 'Saving...'; btn.disabled = true;
    
    const payload = {
        action: "update_profile",
        email: currentUserEmail,
        username: document.getElementById('setting-name').value,
        about: document.getElementById('setting-about').value,
        profile_pic: uploadedBase64Dp // Will be null if not changed
    };

    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(data => {
        btn.innerHTML = 'Save Changes'; btn.disabled = false;
        alert("Profile Updated!");
        localStorage.setItem('chatUserName', payload.username);
        fetchUserSettings();
    });
}

function savePrivacy() {
    const payload = {
        action: "update_settings_json",
        email: currentUserEmail,
        column: "privacy_settings",
        dataObj: JSON.stringify({ readReceipts: document.getElementById('toggle-read-receipts').checked })
    };
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).then(()=>alert('Privacy Saved'));
}

function saveChatSettings() {
    const payload = {
        action: "update_settings_json",
        email: currentUserEmail,
        column: "chat_settings",
        dataObj: JSON.stringify({ 
            spellCheck: document.getElementById('toggle-spellcheck').checked,
            enterIsSend: document.getElementById('toggle-enter-send').checked
        })
    };
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).then(()=>alert('Chat Settings Saved'));
}

function saveNotificationSettings() {
    const payload = {
        action: "update_settings_json",
        email: currentUserEmail,
        column: "notification_settings",
        dataObj: JSON.stringify({ 
            showPreviews: document.getElementById('toggle-previews').checked,
            playSounds: document.getElementById('toggle-sounds').checked
        })
    };
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).then(()=>alert('Notifications Saved'));
}
