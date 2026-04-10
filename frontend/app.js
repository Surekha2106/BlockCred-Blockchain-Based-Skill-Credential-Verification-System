const API_BASE = '/api';

// Simplified state management
let currentUser = null;
let token = null;

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const loginForm = document.getElementById('login-form');
const sidebarItems = document.querySelectorAll('.sidebar-nav li');
const pages = document.querySelectorAll('.page-content');
const roleBtns = document.querySelectorAll('.role-btn');
const issueForm = document.getElementById('issue-form');
const successModal = document.getElementById('success-modal');
const closeModalBtn = document.getElementById('close-modal');
const logoutBtn = document.getElementById('logout-btn');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');
const statCards = document.querySelectorAll('.stat-card h3');

// Navigation Logic
function switchPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update sidebar active state
  sidebarItems.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render specific page content if needed
  if (pageId === 'my-certificates') renderCertificates();
  if (pageId === 'recent-verifications') renderHistory();
}

// Public "Verify Now" Button on Landing Page
document.getElementById('public-verify').addEventListener('click', () => {
  // For this demo, let's just pre-fill a sample ID or switch to the login first
  // If they aren't logged in, they can still verify if we expose it
  document.getElementById('goto-signup').click(); // Guide them or we can show a specific public page
  showToast('Please Login or sign up to use the full verification terminal', 'info');
});

sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    switchPage(item.getAttribute('data-page'));
  });
});

// Login Logic
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  showToast('Authenticating with Core Service...', 'info');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      token = data.token;

      // Normalize role to UPPERCASE for internal checks
      currentUser.role = currentUser.role.toUpperCase();

      // Update UI with user info
      document.getElementById('nav-user-name').innerText = currentUser.fullName;
      document.getElementById('nav-user-avatar').src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.fullName}&backgroundColor=7c3aed`;
      document.getElementById('profile-full-name').value = currentUser.fullName;
      document.getElementById('profile-email').value = currentUser.email;
      document.getElementById('profile-display-name').innerText = currentUser.fullName;
      document.getElementById('profile-role-badge').innerText = `Verified ${currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}`;
      document.getElementById('profile-img-display').src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.fullName}&backgroundColor=7c3aed`;
      document.getElementById('welcome-user-name').innerText = currentUser.fullName.split(' ')[0];

      const walletHash = '0x' + btoa(currentUser.email).substring(0, 40).replace(/[^a-fA-F0-0]/g, 'f');
      document.getElementById('profile-wallet-address').value = walletHash;
      document.getElementById('profile-member-since').innerText = '2026';
      loginPage.classList.remove('active');
      dashboardWrapper.style.display = 'flex';

      // --- RBAC: Hide 'Issue Certificate' if user is a Student ---
      const issueNavBtn = document.querySelector('[data-page="issue-certificate"]');
      if (currentUser.role === 'STUDENT') {
        issueNavBtn.style.display = 'none';
      } else {
        issueNavBtn.style.display = 'flex';
      }

      switchPage('dashboard');
      renderDashboard();
      showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Backend services unreachable', 'error');
  }
});

// Top-right Profile Navigation
document.querySelector('.user-avatar').addEventListener('click', () => {
  switchPage('profile');
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  token = null;
  dashboardWrapper.style.display = 'none';
  loginPage.classList.add('active');
  showToast('Logged out safely', 'info');
});

// Role Selector
roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    roleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const signupRoleBtns = document.querySelectorAll('.role-btn-signup');
signupRoleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    signupRoleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Auth Page Switching
document.getElementById('goto-signup').addEventListener('click', (e) => {
  e.preventDefault();
  loginPage.classList.remove('active');
  document.getElementById('signup-page').classList.add('active');
});

document.getElementById('goto-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('signup-page').classList.remove('active');
  loginPage.classList.add('active');
});

// Signup Logic
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  // Get the selected role and normalize to UPPERCASE
  const roleBtn = document.querySelector('.role-btn-signup.active');
  const role = roleBtn ? roleBtn.getAttribute('data-role').toUpperCase() : 'STUDENT';

  if (!fullName || !email || !password) {
    return showToast('Please fill in all fields', 'warning');
  }

  showToast('Creating Blockchain Account...', 'info');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('✅ Account Created! Please login.', 'success');
      document.getElementById('goto-login').click();
    } else {
      // Show the EXACT message from server (e.g. "Email already registered" or Java service error)
      showToast(data.message || `Registration failed (Status: ${res.status})`, 'error');
    }
  } catch (err) {
    showToast('❌ Cannot reach the gateway server at port 5000', 'error');
  }
});


// Issue Certificate Logic - File Selection Feedback
const certFileInput = document.getElementById('certFile');
const certFileLabel = document.querySelector('.file-label p');

if (certFileInput) {
  certFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      certFileLabel.innerHTML = `File Selected: <br> <strong style="color: var(--accent-primary);">${fileName}</strong>`;
      showToast(`File "${fileName}" ready for issuance`, 'info');
    }
  });
}

// Issue Certificate Logic
issueForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const student = document.getElementById('studentName').value;
  const course = document.getElementById('courseName').value;
  const institution = document.getElementById('institutionName').value;
  const file = document.getElementById('certFile').files[0];

  if (!student || !course || !institution || !file) {
    return showToast('Complete all fields & upload a file', 'warning');
  }

  const formData = new FormData();
  formData.append('studentName', student);
  formData.append('courseName', course);
  formData.append('institutionName', institution);
  formData.append('certFile', file);

  showToast('Broadcasting to Blockchain...', 'info');

  try {
    const res = await fetch(`${API_BASE}/certificates/issue`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('display-cert-id').innerText = data.certId;
      document.getElementById('tx-hash').innerText = data.txHash;
      document.querySelector('.qr-preview img').src = data.qrCode;
      successModal.style.display = 'flex';
      showToast('Block Mined Successfully!', 'success');
    } else {
      showToast(data.message || 'Issuance failed', 'error');
    }
  } catch (err) {
    showToast('Issuance service error', 'error');
  }
});

closeModalBtn.addEventListener('click', () => {
  successModal.style.display = 'none';
  issueForm.reset();
  switchPage('dashboard');
});

// Render Functions
async function renderDashboard() {
  const activityList = document.querySelector('.activity-card');
  try {
    const res = await fetch(`${API_BASE}/certificates`);
    const data = await res.json();

    // Update stats
    statCards[0].innerText = data.length;
    statCards[1].innerText = data.length; // Simplified
    statCards[2].innerText = data.filter(c => new Date(c.issuedAt).getMonth() === new Date().getMonth()).length;

    // Update profile stats if on profile page or globally
    const profCertCount = document.getElementById('profile-cert-count');
    if (profCertCount) profCertCount.innerText = data.length;

    activityList.innerHTML = data.slice(-5).reverse().map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(174, 198, 207, 0.12);">
        <div style="display: flex; align-items: center; gap: 15px;">
          <i class="fas fa-check-circle" style="color: #00b894;"></i>
          <div>
            <p style="font-weight: 600;">${c.studentName}</p>
            <span class="text-gray" style="font-size: 0.8rem;">Issued ${c.courseName}</span>
          </div>
        </div>
        <span class="text-gray" style="font-size: 0.75rem;">${new Date(c.issuedAt).toLocaleDateString()}</span>
      </div>
    `).join('') || '<p class="text-gray">No certificates issued yet.</p>';
  } catch (err) {
    activityList.innerHTML = '<p class="text-danger">Failed to load activity.</p>';
  }
}

async function renderCertificates() {
  const grid = document.querySelector('.certificate-grid');
  try {
    const res = await fetch(`${API_BASE}/certificates`);
    const data = await res.json();

    grid.innerHTML = data.map(cert => `
      <div class="glass-card certificate-card">
        <div class="cert-header">
          <i class="fas fa-certificate text-accent"></i>
          <span class="badge badge-success">Verified</span>
        </div>
        <h3>${cert.courseName}</h3>
        <p class="text-gray">Issued to ${cert.studentName}</p>
        <div class="cert-footer">
          <span class="date text-gray" style="font-size: 0.8rem;">${new Date(cert.issuedAt).toLocaleDateString()}</span>
          <button class="btn btn-accent btn-sm" onclick="viewCertificate('${cert.id}')">View <i class="fas fa-external-link-alt"></i></button>
        </div>
      </div>
    `).join('') || '<div class="glass-card p-40" style="grid-column: 1 / -1; width: 100%;">No certificates found</div>';
  } catch (err) {
    grid.innerHTML = '<p class="text-danger">Failed to load certificates.</p>';
  }
}

async function renderHistory() {
  const body = document.getElementById('history-body');
  try {
    const res = await fetch(`${API_BASE}/certificates`);
    const data = await res.json();

    body.innerHTML = data.reverse().map(h => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${h.studentName}" style="width: 30px; height: 30px; border-radius: 50%;">
            ${h.studentName}
          </div>
        </td>
        <td class="text-gray">${h.courseName}</td>
        <td><span class="badge badge-success">Verified</span></td>
        <td class="text-gray">${new Date(h.issuedAt).toLocaleString()}</td>
        <td><button class="btn btn-primary btn-sm" onclick="viewCertificate('${h.id}')"><i class="fas fa-eye"></i></button></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center">No verification logs</td></tr>';
  } catch (err) {
    body.innerHTML = '<tr><td colspan="5" class="text-danger">Error loading history</td></tr>';
  }
}

// Verify Certificate Logic - File Selection Feedback
const verifyFileInput = document.getElementById('verify-file');
const verifyFileLabel = document.querySelector('label[for="verify-file"]');

if (verifyFileInput) {
  verifyFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      verifyFileLabel.innerText = `${fileName.substring(0, 15)}...`;
      showToast(`Verification file "${fileName}" loaded`, 'info');
    }
  });
}

// Verify Certificate Logic
const verifyIdBtn = document.getElementById('btn-verify-id');
const verifyInput = document.getElementById('verify-id-input');
const verifyFileBtn = document.getElementById('btn-verify-file');

verifyIdBtn.addEventListener('click', async () => {
  const id = verifyInput.value;
  if (!id) return showToast('Please enter a certificate ID', 'warning');

  showToast('Consulting Blockchain ledger...', 'info');

  try {
    const res = await fetch(`${API_BASE}/certificates/verify/${id}`);
    const data = await res.json();

    if (data.verified) {
      showToast(`Verified! Issued to ${data.certificate.studentName}`, 'success');
      // Auto-switch to certificates or show info
    } else {
      showToast('Certificate not found or invalid hash', 'error');
    }
  } catch (err) {
    showToast('Verification failed', 'error');
  }
});

verifyFileBtn.addEventListener('click', async () => {
  const file = document.getElementById('verify-file').files[0];
  if (!file) return showToast('Please select a certificate file', 'warning');

  const formData = new FormData();
  formData.append('certFile', file);

  showToast('Hashing and checking Blockchain integrity...', 'info');

  try {
    const res = await fetch(`${API_BASE}/certificates/verify-pdf`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.verified) {
      showToast(`Integrity Verified! Issued to ${data.certificate.studentName}`, 'success');
    } else {
      showToast(data.message || 'File integrity check failed', 'error');
    }
  } catch (err) {
    showToast('Verification service error', 'error');
  }
});


// Auto-handle QR Code Verification URLs
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const certId = urlParams.get('id');
  if (certId) {
    // We'll show the login page first but if they are logged in or just want to verify publicly
    // For public verification, they shouldn't need a login. 
    // But for this demo, let's just pre-fill and switch page if they are logged in or redirect
    switchPage('verify-certificate');
    verifyInput.value = certId;
    verifyIdBtn.click();
  }
});

// Profile Tabs Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsContents = document.querySelectorAll('.settings-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');

    // Update active buttons
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update visible content
    settingsContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `section-${tabId}`) {
        content.classList.add('active');
      }
    });
  });
});

// Notifications Dropdown Logic
const bellIcon = document.getElementById('bell-icon');
const notifDropdown = document.getElementById('notif-dropdown');
const markAllReadBtn = document.querySelector('.notif-header a');
const notifList = document.getElementById('notif-list');
const notifBadge = document.querySelector('.notification-icon .badge');

bellIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  notifDropdown.classList.toggle('active');
});

markAllReadBtn.addEventListener('click', (e) => {
  e.preventDefault();
  notifList.innerHTML = '<p class="text-gray" style="text-align: center; padding: 20px;">No new notifications</p>';
  if (notifBadge) notifBadge.style.display = 'none';
  showToast('All notifications marked as read', 'info');
});

document.addEventListener('click', () => {
  notifDropdown.classList.remove('active');
});

notifDropdown.addEventListener('click', (e) => e.stopPropagation());

// Profile Picture Upload Logic (Simulated)
const avatarEditBtn = document.querySelector('.avatar-edit-btn');
const profileImgDisplay = document.getElementById('profile-img-display');
const navUserAvatar = document.getElementById('nav-user-avatar');

avatarEditBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newSrc = e.target.result;
        profileImgDisplay.src = newSrc;
        navUserAvatar.src = newSrc;
        showToast('Profile picture updated locally', 'success');
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
});

// Theme Management
const themeSwitch = document.getElementById('theme-switch');
let currentTheme = localStorage.getItem('theme') || 'dark';

document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

themeSwitch.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
  showToast(`${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} Mode Enabled`, 'info');
});

function updateThemeIcon() {
  const icon = themeSwitch.querySelector('i');
  if (currentTheme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

// Toast System
function showToast(message, type = 'success') {

  toastMsg.innerText = message;
  toast.className = 'toast show';
  if (type === 'error') toast.style.background = '#ff6b6b';
  if (type === 'warning') toast.style.background = '#7bafd4';
  if (type === 'info') toast.style.background = '#1a3a6b';
  if (type === 'success') toast.style.background = '#AEC6CF';
  if (type === 'success') toast.style.color = '#060c1a'; else toast.style.color = '#fff';

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Add CSS for failed badge
const style = document.createElement('style');
style.textContent = `
  .badge-danger { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
  .col-6 { width: calc(50% - 10px); }
  .row { display: flex; gap: 20px; }
`;
document.head.appendChild(style);

// View Certificate Helper
window.viewCertificate = function (id) {
  if (!id || id === 'undefined') {
    return showToast('Certificate ID not found', 'error');
  }
  // Switch to verification page and auto-verify
  switchPage('verify-certificate');
  document.getElementById('verify-id-input').value = id;
  document.getElementById('btn-verify-id').click();
};
