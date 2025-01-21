export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    // Add visible class after a small delay to trigger animation
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('visible');
    // Remove display:none after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match transition duration
} 