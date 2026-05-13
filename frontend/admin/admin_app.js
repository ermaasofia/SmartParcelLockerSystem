const API_BASE = "http://localhost:8000";

// --- Navigation & UI ---
function showAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

function hideAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

// --- API Calls ---

// Emergency Open (Fig 27)
async function emergencyOpen() {
    console.log("[admin_app.js] emergencyOpen() triggered.");
    const lockerId = document.getElementById('emergencyLockerId').value;
    const reason = document.getElementById('emergencyReason').value;

    if(!lockerId) {
        console.warn("[admin_app.js] emergencyOpen() aborted: No Locker ID provided.");
        return alert("Please enter a Locker ID");
    }

    try {
        const response = await fetch(`${API_BASE}/admin/override/${lockerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason })
        });

        if (response.ok) {
            alert(`EMERGENCY OVERRIDE: Locker ${lockerId} is now OPEN.`);
        } else {
            alert("Error: Could not trigger override.");
        }
    } catch (err) {
        console.error(err);
        alert("Server connection failed.");
    }
}

// Save Manual Parcel (Fig 25)
async function saveParcel() {
    console.log("[admin_app.js] saveParcel() triggered.");
    const data = {
        lockerID: parseInt(document.getElementById('modalLockerId').value),
        studentID: document.getElementById('modalStudentId').value,
        parcelPIN: Math.floor(1000 + Math.random() * 9000).toString(),
        hasPenalty: false
    };
    console.log("[admin_app.js] Sending Parcel data:", data);

    try {
        const response = await fetch(`${API_BASE}/parcels/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Parcel Added Successfully");
            hideAddModal();
            location.reload();
        } else {
            alert("Error adding parcel.");
        }
    } catch (err) {
        console.error(err);
    }
}

// Send Notification (Fig 26)
function sendNotification(studentId) {
    console.log(`[admin_app.js] sendNotification() triggered for student: ${studentId}`);
    alert(`Notification sent to Student ${studentId}: Your parcel is OVERDUE! Please collect it immediately.`);
}

// --- Data Loading Logic ---

async function loadRequestTable() {
    console.log("[admin_app.js] loadRequestTable() triggered.");
    const tbody = document.getElementById('requestTableBody');
    if (!tbody) {
        console.log("[admin_app.js] requestTableBody not found. Skipping.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/requests`);
        const requests = await response.json();
        
        tbody.innerHTML = requests.map(r => `
            <tr>
                <td>P${r.parcelID || '-'}</td>
                <td>R${r.requestID}</td>
                <td>S${r.studentID}</td>
                <td>${new Date(r.timestamp).toLocaleDateString()}</td>
                <td><span class="status-tag status-pending">${r.requestStatus}</span></td>
                <td>
                    <button onclick="updateStatus(${r.parcelID}, 'Stored')" style="cursor:pointer">Approve</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6">No pending requests</td></tr>';
    } catch (err) {
        console.error("Failed to load requests:", err);
    }
}

async function loadParcelTable() {
    console.log("[admin_app.js] loadParcelTable() triggered.");
    const tbody = document.getElementById('parcelTableBody');
    if (!tbody) {
        console.log("[admin_app.js] parcelTableBody not found. Skipping.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/parcels`);
        const parcels = await response.json();
        
        tbody.innerHTML = parcels.map(p => `
            <tr>
                <td>L${p.lockerID}</td>
                <td>P${p.parcelID}</td>
                <td>S${p.studentID}</td>
                <td><span class="status-tag status-active">Active</span></td>
                <td>
                    <button onclick="updateStatus(${p.parcelID}, 'Clear')" style="cursor:pointer; background:#f44336; color:white; border:none; padding:5px 10px; border-radius:3px;">Clear</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5">No parcels found</td></tr>';
    } catch (err) {
        console.error("Failed to load parcels:", err);
    }
}

async function loadMonitorTable() {
    console.log("[admin_app.js] loadMonitorTable() triggered.");
    const tbody = document.getElementById('monitorTableBody');
    if (!tbody) {
        console.log("[admin_app.js] monitorTableBody not found. Skipping.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/parcels`);
        const parcels = await response.json();
        
        tbody.innerHTML = parcels.map(p => {
            const entryDate = new Date(p.storageTime);
            const now = new Date();
            const diffTime = Math.abs(now - entryDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            return `
                <tr>
                    <td>L${p.lockerID}</td>
                    <td>P${p.parcelID}</td>
                    <td>S${p.studentID}</td>
                    <td>${entryDate.toLocaleDateString()}</td>
                    <td>${entryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>${diffDays}</td>
                    <td><span class="status-tag status-active">Active</span></td>
                    <td>${p.hasPenalty ? 'Penalty Applied' : '-'}</td>
                    <td>
                        <button onclick="sendNotification('${p.studentID}')" style="cursor:pointer; background:#2196F3; color:white; border:none; padding:5px 10px; border-radius:3px;">Notify</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="9">No storage data</td></tr>';
    } catch (err) {
        console.error("Failed to load monitor data:", err);
    }
}

async function updateStatus(parcelId, newStatus) {
    console.log(`[admin_app.js] updateStatus() triggered for parcelId: ${parcelId}, newStatus: ${newStatus}`);
    if(!parcelId) {
        console.warn("[admin_app.js] updateStatus() aborted: No Parcel ID.");
        return alert("No Parcel ID associated with this request.");
    }
    try {
        console.log(`[admin_app.js] Sending PUT request to ${API_BASE}/admin/parcels/${parcelId}/status`);
        const response = await fetch(`${API_BASE}/admin/parcels/${parcelId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            alert(`Status updated to ${newStatus}`);
            location.reload();
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Admin Profile Display ---
function displayAdminProfile() {
    const adminName = localStorage.getItem('adminName');
    if (!adminName) {
        // Not logged in — redirect to staff login
        window.location.href = "staff_login.html";
        return;
    }
    
    // Update all profile links in the header
    const profileLinks = document.querySelectorAll('.admin-links');
    profileLinks.forEach(container => {
        container.innerHTML = `
            <span style="color: #4CAF50; font-weight: bold;">👤 ${adminName}</span>
            <a href="#" onclick="adminLogout()">LOGOUT</a>
        `;
    });
}

function adminLogout() {
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminID');
    window.location.href = "staff_login.html";
}

// Initial Data Load
async function loadAdminData() {
    console.log("[admin_app.js] loadAdminData() started.");
    loadSidebar();
    displayAdminProfile();
    loadRequestTable();
    loadParcelTable();
    loadMonitorTable();
    if(document.getElementById('lockerGrid')) {
        loadLockerDashboard();
    }
}

async function loadLockerDashboard() {
    console.log("[admin_app.js] loadLockerDashboard() triggered.");
    const grid = document.getElementById('lockerGrid');
    if (!grid) {
        console.log("[admin_app.js] lockerGrid not found. Skipping.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/lockers`);
        const lockers = await response.json();
        
        grid.innerHTML = lockers.map(l => {
            let icon = "📦";
            if (l.lockerStatus === "Available") icon = "🟢";
            if (l.lockerStatus === "Alarm") icon = "🚨";
            
            return `
                <div class="locker-card ${l.lockerStatus.toLowerCase()}">
                    <div class="locker-icon">${icon}</div>
                    <div class="locker-info">
                        <h3>Locker ${l.lockerID}</h3>
                        <p>Status: ${l.lockerStatus}</p>
                        ${l.parcelID ? `<p>Parcel ID: P${l.parcelID}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('') || '<p>No lockers found.</p>';
    } catch (err) {
        console.error("Failed to load locker dashboard:", err);
    }
}

function loadSidebar() {
    console.log("[admin_app.js] loadSidebar() triggered.");
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        console.log("[admin_app.js] .sidebar not found. Skipping.");
        return;
    }

    const path = window.location.pathname;
    const page = path.split('/').pop() || 'dashboard.html';

    const navItems = [
        { href: 'dashboard.html', label: 'DASHBOARD' },
        { href: 'request_mgmt.html', label: 'MANAGE REQUEST' },
        { href: 'parcel_mgmt.html', label: 'MANAGE PARCEL' },
        { href: 'storage_monitor.html', label: 'MONITOR PARCEL' },
        { href: 'emergency_access.html', label: 'EMERGENCY ACCESS' }
    ];

    const menuHtml = navItems.map(item => {
        const isActive = page === item.href ? 'class="active"' : '';
        return `<li ${isActive}><a href="${item.href}">${item.label}</a></li>`;
    }).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h2>MENU</h2>
        </div>
        <ul class="sidebar-menu">
            ${menuHtml}
        </ul>
    `;
}

window.onload = loadAdminData;
