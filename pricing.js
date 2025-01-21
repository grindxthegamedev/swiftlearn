document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyAsDbqmpt1C1CcSzgXI7FGwmpTktXCJ3KI",
        authDomain: "learnenplay-47bff.firebaseapp.com",
        projectId: "learnenplay-47bff",
        storageBucket: "learnenplay-47bff.firebasestorage.app",
        messagingSenderId: "190641439207",
        appId: "1:190641439207:web:954c83a55ae4533981bd42"
    };

    const app = window.initializeApp(firebaseConfig);
    const auth = window.getAuth(app);

    // Initialize Stripe
    const stripe = Stripe('pk_test_51PtYbhKYQc6tIRkjiI0C6HJ8tOdK0cHCevlcXE1w8ASN0nGV6BOEwRrLbBbdQN5KsPJJXsj2GOzetctigDOBImym00MnkTyu7J');

    // Handle enrollment button clicks
    document.querySelectorAll('.enroll-button').forEach(button => {
        button.addEventListener('click', async () => {
            const package = button.dataset.package;
            const priceInCents = button.dataset.price;

            // Disable the button and show loading state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            // Check if user is logged in
            const user = auth.currentUser;
            if (!user) {
                // Save selected package to sessionStorage
                sessionStorage.setItem('selectedPackage', package);
                sessionStorage.setItem('selectedPrice', priceInCents);
                
                // Redirect to login page
                window.location.href = 'accounts.html';
                return;
            }

            // If user is logged in, proceed to payment
            try {
                // Create a checkout session on your server
                const response = await fetch('http://localhost:3000/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        package,
                        priceInCents,
                        userId: user.uid,
                        userEmail: user.email
                    }),
                });

                const session = await response.json();
                if (!session.id) {
                    throw new Error('Failed to create checkout session');
                }

                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }
            } catch (error) {
                console.error('Payment error:', error);
                // Show error message
                const toast = document.createElement('div');
                toast.className = 'toast error';
                toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);

                // Reset button state
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-arrow-right"></i> Enroll Now';
            }
        });
    });

    // Update nav based on auth state
    window.onAuthStateChanged(auth, (user) => {
        const navCta = document.querySelector('.nav-cta');
        if (user) {
            navCta.href = 'profile.html';
            navCta.innerHTML = '<i class="fas fa-user"></i> My Profile';

            // Check for stored package selection after login
            const storedPackage = sessionStorage.getItem('selectedPackage');
            const storedPrice = sessionStorage.getItem('selectedPrice');
            if (storedPackage && storedPrice) {
                // Clear stored data
                sessionStorage.removeItem('selectedPackage');
                sessionStorage.removeItem('selectedPrice');
                
                // Find and click the corresponding enroll button
                const button = document.querySelector(
                    `.enroll-button[data-package="${storedPackage}"][data-price="${storedPrice}"]`
                );
                if (button) button.click();
            }
        } else {
            navCta.href = 'accounts.html';
            navCta.innerHTML = 'Get Started';
        }
    });
}); 