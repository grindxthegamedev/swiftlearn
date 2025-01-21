import { collection, addDoc, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { showModal, hideModal } from './modal-utils.js';

const ADMIN_PASSWORD = 'YOUCANTKEEPGETTINGAWAYWITHTHIS1111'; // Change this!


document.getElementById('createSessionBtn').addEventListener('click', () => {
    showModal('adminModal');
});

document.getElementById('cancelAdminBtn').addEventListener('click', () => {
    hideModal('adminModal');
    document.getElementById('adminForm').reset();
    document.querySelector('.admin-content').style.display = 'none';
});

document.getElementById('adminPassword').addEventListener('input', function() {
    if (this.value === ADMIN_PASSWORD) {
        document.querySelector('.admin-content').style.display = 'block';
        this.style.borderColor = 'green';
        loadUsers();
    } else {
        document.querySelector('.admin-content').style.display = 'none';
        this.style.borderColor = '';
    }
});

async function loadUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const userSelect = document.getElementById('userSelect');
    
    userSelect.innerHTML = '<option value="">Select User</option>';
    snapshot.forEach(doc => {
        const user = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${user.fullName} (${user.email})`;
        userSelect.appendChild(option);
    });
}

document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (document.getElementById('adminPassword').value !== ADMIN_PASSWORD) {
        alert('Invalid admin password');
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const sessionData = {
            userId: document.getElementById('userSelect').value,
            dateTime: Timestamp.fromDate(new Date(document.getElementById('sessionDateTime').value)),
            type: document.getElementById('sessionType').value,
            topic: document.getElementById('sessionTopic').value,
            zoomLink: document.getElementById('zoomLink').value || null
        };
        
        await addDoc(collection(db, 'sessions'), sessionData);
        
        hideModal('adminModal');
        e.target.reset();
        document.querySelector('.admin-content').style.display = 'none';
        
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = '<i class="fas fa-check-circle"></i> Session created successfully!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        
        // Refresh sessions list if creating for current user
        if (sessionData.userId === auth.currentUser.uid) {
            fetchUpcomingSessions(auth.currentUser.uid);
        }
    } catch (error) {
        console.error('Error creating session:', error);
        alert('Error creating session: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Session';
    }
}); 