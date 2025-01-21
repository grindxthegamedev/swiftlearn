import { auth } from './firebase-config.js';
import { showModal, hideModal } from './modal-utils.js';
import { 
    collection,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Auth state observer
    window.onAuthStateChanged(auth, (user) => {
        if (user) {
            updateUIWithUserInfo(user);
        } else {
            window.location.href = 'accounts.html';
        }
    });

    // Add modal HTML dynamically
    const modalHTML = `
        <div class="modal-backdrop" id="passwordModal">
            <div class="modal neumorphic">
                <h3>Change Password</h3>
                <form id="passwordForm">
                    <div class="form-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" placeholder="Current Password" required id="currentPassword">
                    </div>
                    <div class="form-group">
                        <i class="fas fa-key"></i>
                        <input type="password" placeholder="New Password" required id="newPassword">
                    </div>
                    <div class="form-group">
                        <i class="fas fa-key"></i>
                        <input type="password" placeholder="Confirm New Password" required id="confirmPassword">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="modal-button secondary" id="cancelPasswordBtn">Cancel</button>
                        <button type="submit" class="modal-button primary">Update Password</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal-backdrop" id="profileModal">
            <div class="modal neumorphic">
                <h3>Update Profile</h3>
                <form id="profileForm">
                    <div class="form-group">
                        <i class="fas fa-user"></i>
                        <input type="text" placeholder="Full Name" required id="fullName">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="modal-button secondary" id="cancelProfileBtn">Cancel</button>
                        <button type="submit" class="modal-button primary">Update Profile</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Update the modal functionality
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        // Add visible class after a small delay to trigger animation
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('visible');
        // Remove display:none after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match transition duration
    }

    // Add click outside to close for modals
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            hideModal(e.target.id);
        }
    });

    // Add escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModal = document.querySelector('.modal-backdrop[style*="display: block"]');
            if (visibleModal) {
                hideModal(visibleModal.id);
            }
        }
    });

    // Update profile functionality
    document.getElementById('updateProfileBtn').addEventListener('click', () => {
        const currentName = document.getElementById('userName').textContent;
        if (currentName !== 'Not set') {
            document.getElementById('fullName').value = currentName;
        }
        showModal('profileModal');
    });

    document.getElementById('cancelProfileBtn').addEventListener('click', () => {
        hideModal('profileModal');
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        try {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            submitButton.disabled = true;
            
            await updateProfile(auth.currentUser, {
                displayName: fullName
            });
            document.getElementById('userName').textContent = fullName;
            updateWelcomeMessage(fullName);
            hideModal('profileModal');
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerHTML = '<i class="fas fa-check-circle"></i> Profile updated successfully!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } finally {
            submitButton.innerHTML = 'Update Profile';
            submitButton.disabled = false;
        }
    });

    // Password change functionality
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        showModal('passwordModal');
    });

    document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
        hideModal('passwordModal');
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitButton = e.target.querySelector('button[type="submit"]');

        if (newPassword !== confirmPassword) {
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> New passwords don\'t match!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
            return;
        }

        try {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            submitButton.disabled = true;

            // Reauthenticate user
            const credential = window.EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await window.reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await window.updatePassword(auth.currentUser, newPassword);
            hideModal('passwordModal');
            e.target.reset();
            
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerHTML = '<i class="fas fa-check-circle"></i> Password updated successfully!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${
                error.code === 'auth/wrong-password' ? 
                'Current password is incorrect' : 
                error.message
            }`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } finally {
            submitButton.innerHTML = 'Update Password';
            submitButton.disabled = false;
        }
    });

    // Update UI with user info
    function updateUIWithUserInfo(user) {
        // Basic info
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userName').textContent = user.displayName || 'Not set';
        document.getElementById('memberSince').textContent = new Date(user.metadata.creationTime).toLocaleDateString();
        updateWelcomeMessage(user.displayName);

        // Check subscription status
        checkSubscriptionStatus(user.uid);

        // Fetch upcoming sessions
        fetchUpcomingSessions(user.uid);
    }

    // Add this new function to check subscription status
    async function checkSubscriptionStatus(userId) {
        try {
            const response = await fetch(`http://localhost:3000/check-subscription/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const statusElement = document.getElementById('membershipStatus');
            
            if (data.subscription) {
                const { type, status, currentPeriodEnd } = data.subscription;
                const badge = document.createElement('span');
                badge.className = `status-badge ${type} active`;
                badge.textContent = type === 'group' ? 'Group Sessions' : '1-on-1 Sessions';
                
                const details = document.createElement('div');
                details.className = 'membership-details';
                details.textContent = `Next payment: ${new Date(currentPeriodEnd * 1000).toLocaleDateString()}`;
                
                statusElement.innerHTML = '';
                statusElement.appendChild(badge);
                statusElement.appendChild(details);
            } else {
                statusElement.innerHTML = '<span class="status-badge">No Active Subscription</span>';
            }
        } catch (error) {
            console.error('Error checking subscription:', error.message);
            if (error.message.includes('Failed to fetch')) {
                document.getElementById('membershipStatus').innerHTML = 
                    '<span class="status-badge">Server offline - please try again later</span>';
            } else {
                document.getElementById('membershipStatus').innerHTML = 
                    '<span class="status-badge">Error loading subscription status</span>';
            }
        }
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await window.signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });

    // Add this helper function at the top level
    function updateWelcomeMessage(name) {
        const welcomeHeading = document.querySelector('.profile-header h2');
        welcomeHeading.innerHTML = `Welcome, ${name || 'Student'}! <span class="welcome-subtitle">Manage your account below</span>`;
    }

    async function fetchUpcomingSessions(userId) {
        const sessionsList = document.getElementById('sessionsList');
        
        try {
            console.log('Fetching sessions for user:', userId);
            console.log('Current time:', new Date());
            const sessionsRef = collection(db, 'sessions');
            const q = query(
                sessionsRef,
                where('userId', '==', userId),
                where('dateTime', '>', new Date()),
                orderBy('dateTime', 'asc'),
                limit(5)
            );
            
            console.log('Query created, fetching snapshot...');
            const snapshot = await getDocs(q);
            console.log('Snapshot received:', snapshot.size, 'documents');
            
            if (snapshot.empty) {
                console.log('No sessions found');
                sessionsList.innerHTML = '<p class="no-sessions">No upcoming sessions scheduled</p>';
                return;
            }
            
            let sessionsHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('Session found:', {
                    id: doc.id,
                    dateTime: data.dateTime,
                    type: data.type,
                    topic: data.topic,
                    userId: data.userId
                });
                const sessionDate = new Date(data.dateTime.toDate());
                
                sessionsHTML += `
                    <div class="session-card neumorphic">
                        <div class="session-actions">
                            <button class="delete-session" data-session-id="${doc.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="session-type ${data.type}">
                            ${data.type === 'group' ? 'Group Session' : '1-on-1 Session'}
                        </div>
                        <div class="session-details">
                            <div class="session-date">
                                <i class="fas fa-calendar"></i>
                                ${sessionDate.toLocaleDateString()}
                            </div>
                            <div class="session-time">
                                <i class="fas fa-clock"></i>
                                ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div class="session-topic">
                                <i class="fas fa-book"></i>
                                ${data.topic}
                            </div>
                            ${data.zoomLink ? `
                                <a href="${data.zoomLink}" target="_blank" class="zoom-link">
                                    <i class="fas fa-video"></i>
                                    Join Zoom
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            sessionsList.innerHTML = sessionsHTML;
            
            // Add delete handlers
            document.querySelectorAll('.delete-session').forEach(button => {
                button.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this session?')) {
                        const sessionId = e.currentTarget.dataset.sessionId;
                        try {
                            const sessionRef = doc(db, 'sessions', sessionId);
                            await deleteDoc(sessionRef);
                            
                            // Show success message
                            const toast = document.createElement('div');
                            toast.className = 'toast success';
                            toast.innerHTML = '<i class="fas fa-check-circle"></i> Session deleted successfully!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 3000);
                            
                            // Refresh sessions list
                            fetchUpcomingSessions(userId);
                        } catch (error) {
                            console.error('Error deleting session:', error);
                            const toast = document.createElement('div');
                            toast.className = 'toast error';
                            toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error deleting session';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 3000);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching sessions:', error);
            sessionsList.innerHTML = '<p class="error-message">Error loading sessions</p>';
        }
    }
}); 