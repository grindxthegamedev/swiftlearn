document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Animation for service cards on scroll
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        },
        { threshold: 0.1 }
    );

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Form submission animation
    const form = document.querySelector('.contact-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = this.querySelector('.submit-button');
        const formData = new FormData(this);

        try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            button.disabled = true;

            // Update the URL to point to your Firebase Cloud Function
            const response = await fetch('https://learnenplay-47bff.cloudfunctions.net/sendContactForm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Success animation
            button.innerHTML = '<i class="fas fa-check"></i> Sent!';
            button.style.background = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
            form.reset();

        } catch (error) {
            // Error handling
            button.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to send';
            button.style.background = '#dc3545';
            console.error('Error:', error);

        } finally {
            // Reset button after 3 seconds
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                button.style.background = '';
                button.disabled = false;
            }, 3000);
        }
    });

    // Shape generation and collision
    const shapes = [];
    const NUM_SHAPES = 20;
    const SHAPE_TYPES = [
        'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', // pentagon
        'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', // octagon
        'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // hexagon
        'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', // square
        'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', // flat hexagon
        'circle(50% at 50% 50%)' // circle
    ];
    const COLORS = [
        'var(--primary)', 
        'var(--secondary)', 
        'var(--accent)'
    ];

    // Get the floating shapes container
    const floatingShapes = document.querySelector('.floating-shapes');

    // Clear existing shapes
    floatingShapes.innerHTML = '';

    class Shape {
        constructor() {
            this.element = document.createElement('div');
            this.element.className = 'shape';
            this.size = Math.random() * 80 + 40; // 40-120px
            this.x = Math.random() * (window.innerWidth - this.size);
            this.y = Math.random() * (window.innerHeight - this.size);
            this.speedX = (Math.random() - 0.5) * 2;
            this.speedY = (Math.random() - 0.5) * 2;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 2;

            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.element.style.clipPath = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
            this.element.style.opacity = '0.15';
            this.element.style.transition = 'transform 0.016s linear';
            this.updatePosition();
        }

        updatePosition() {
            this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
        }

        move() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;

            // Bounce off walls
            if (this.x <= 0 || this.x >= window.innerWidth - this.size) {
                this.speedX *= -1;
                this.speedX *= 0.9; // Add some friction
            }
            if (this.y <= 0 || this.y >= window.innerHeight - this.size) {
                this.speedY *= -1;
                this.speedY *= 0.9; // Add some friction
            }

            // Add some random acceleration occasionally
            if (Math.random() < 0.01) {
                this.speedX += (Math.random() - 0.5) * 0.5;
                this.speedY += (Math.random() - 0.5) * 0.5;
            }

            // Limit maximum speed
            const maxSpeed = 3;
            this.speedX = Math.max(Math.min(this.speedX, maxSpeed), -maxSpeed);
            this.speedY = Math.max(Math.min(this.speedY, maxSpeed), -maxSpeed);

            this.updatePosition();
        }

        checkCollision(other) {
            const dx = (this.x + this.size/2) - (other.x + other.size/2);
            const dy = (this.y + this.size/2) - (other.y + other.size/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size + other.size) / 2;

            if (distance < minDistance) {
                // Collision detected - reverse directions
                const tempX = this.speedX;
                const tempY = this.speedY;
                this.speedX = other.speedX;
                this.speedY = other.speedY;
                other.speedX = tempX;
                other.speedY = tempY;

                // Add some random variation to prevent shapes from sticking together
                this.speedX += (Math.random() - 0.5) * 0.5;
                this.speedY += (Math.random() - 0.5) * 0.5;
                other.speedX += (Math.random() - 0.5) * 0.5;
                other.speedY += (Math.random() - 0.5) * 0.5;
            }
        }
    }

    // Create new dynamic shapes
    for (let i = 0; i < NUM_SHAPES; i++) {
        const shape = new Shape();
        floatingShapes.appendChild(shape.element);
        shapes.push(shape);
    }

    // Animation loop
    function animate() {
        shapes.forEach(shape => {
            shape.move();
            shapes.forEach(other => {
                if (shape !== other) {
                    shape.checkCollision(other);
                }
            });
        });
        requestAnimationFrame(animate);
    }

    animate();

    // Carousel Implementation
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');
    const dotsNav = document.querySelector('.carousel-dots');
    const dots = Array.from(dotsNav.children);
    
    let currentSlide = 0;
    
    function updateSlides() {
        // Update slide positions
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update active classes
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update button states
        prevButton.style.opacity = currentSlide === 0 ? '0.5' : '1';
        nextButton.style.opacity = currentSlide === slides.length - 1 ? '0.5' : '1';
    }
    
    // Next button click
    nextButton.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateSlides();
        }
    });
    
    // Previous button click
    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlides();
        }
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlides();
        });
    });
    
    // Initialize carousel
    updateSlides();

    // Optional: Auto-advance slides every 5 seconds
    setInterval(() => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
        } else {
            currentSlide = 0;
        }
        updateSlides();
    }, 5000);

    // Auth state observer
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

    // Update nav based on auth state
    window.onAuthStateChanged(auth, (user) => {
        // Get both CTA buttons
        const navCta = document.querySelector('.nav-cta');
        const mainCta = document.querySelector('.cta-button');
        
        if (user) {
            // Update both buttons for logged-in state
            const buttons = [navCta, mainCta].filter(Boolean);
            buttons.forEach(button => {
                button.href = 'profile.html';
                button.innerHTML = button === navCta ? 
                    '<i class="fas fa-user"></i> My Profile' : 
                    '<i class="fas fa-user-circle"></i> View Profile';
            });
        } else {
            // Reset buttons to default state
            if (navCta) {
                navCta.href = 'accounts.html';
                navCta.innerHTML = 'Get Started';
            }
            if (mainCta) {
                mainCta.href = 'accounts.html';
                mainCta.innerHTML = '<i class="fas fa-calendar-check"></i> Book Free Assessment';
            }
        }
    });
});
