// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.account-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(form => form.classList.remove('active'));
            
            tab.classList.add('active');
            const formId = `${tab.dataset.tab}Form`;
            document.getElementById(formId).classList.add('active');
        });
    });

    // Firebase configuration and initialization
    const firebaseConfig = {
        apiKey: "AIzaSyAsDbqmpt1C1CcSzgXI7FGwmpTktXCJ3KI",
        authDomain: "learnenplay-47bff.firebaseapp.com",
        databaseURL: "https://learnenplay-47bff.firebaseio.com/",
        projectId: "learnenplay-47bff",
        storageBucket: "learnenplay-47bff.firebasestorage.app",
        messagingSenderId: "190641439207",
        appId: "1:190641439207:web:954c83a55ae4533981bd42"
    };

    const app = window.initializeApp(firebaseConfig);
    const auth = window.getAuth(app);

    // Loading state function
    function setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text');
        }
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginButton = loginForm.querySelector('button');
        loginButton.setAttribute('data-original-text', loginButton.innerHTML);

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(loginButton, true);

            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                const userCredential = await window.signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'profile.html';
            } catch (error) {
                alert(error.message);
                setLoading(loginButton, false);
            }
        });
    }

    // Register functionality
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const registerButton = registerForm.querySelector('button');
        registerButton.setAttribute('data-original-text', registerButton.innerHTML);

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(registerButton, true);

            const email = registerForm.querySelector('input[type="email"]').value;
            const fullName = registerForm.querySelector('input[type="text"]').value;
            const password = registerForm.querySelectorAll('input[type="password"]')[0].value;
            const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

            if (password !== confirmPassword) {
                alert("Passwords don't match!");
                setLoading(registerButton, false);
                return;
            }

            try {
                const userCredential = await window.createUserWithEmailAndPassword(auth, email, password);
                
                // Initialize Firestore
                const db = getFirestore(app);
                
                // Create user document
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: email,
                    fullName: fullName,
                    createdAt: new Date(),
                    subscription: null,
                    sessions: []
                });
                
                // Update user profile
                await window.updateProfile(userCredential.user, {
                    displayName: fullName
                });

                window.location.href = 'profile.html';
            } catch (error) {
                alert(error.message);
                setLoading(registerButton, false);
            }
        });
    }

    // Password reset functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Enter your email address:');
            if (email) {
                try {
                    await window.sendPasswordResetEmail(auth, email);
                    alert('Password reset email sent!');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }
}); 