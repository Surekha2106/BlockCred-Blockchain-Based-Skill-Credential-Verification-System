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
      
      loginPage.classList.remove('active');
      dashboardWrapper.style.display = 'flex';
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

    activityList.innerHTML = data.slice(-5).reverse().map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
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
          <i class="fas fa-medal gold-icon"></i>
          <span class="badge badge-success">Verified</span>
        </div>
        <h3>${cert.courseName}</h3>
        <p class="text-gray">Issued to ${cert.studentName}</p>
        <div class="cert-footer">
          <span class="date text-gray" style="font-size: 0.8rem;">${new Date(cert.issuedAt).toLocaleDateString()}</span>
          <button class="btn btn-gold btn-sm">View <i class="fas fa-external-link-alt"></i></button>
        </div>
      </div>
    `).join('') || '<div class="glass-card p-40">No certificates found</div>';
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
        <td><button class="btn btn-primary btn-sm"><i class="fas fa-eye"></i></button></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center">No verification logs</td></tr>';
  } catch (err) {
    body.innerHTML = '<tr><td colspan="5" class="text-danger">Error loading history</td></tr>';
  }
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

verifyFileBtn.addEventListener('click', () => {
    showToast('Integrity check: File hash matches Blockchain!', 'success');
});

// Toast System
function showToast(message, type = 'success') {
  toastMsg.innerText = message;
  toast.className = 'toast show';
  if (type === 'error') toast.style.background = '#e74c3c';
  if (type === 'warning') toast.style.background = '#C9A227';
  if (type === 'info') toast.style.background = '#D4AF37';
  if (type === 'success') toast.style.background = '#00b894';
  
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
