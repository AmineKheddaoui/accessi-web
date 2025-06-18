// Variables globales
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const navDots = document.querySelectorAll('.nav-dot');

// Fonction principale de navigation
function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    
    currentSlide = index;
    slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
    updateNavigation();
    
    // Annoncer le changement pour les lecteurs d'écran
    const slideTitle = slides[currentSlide].querySelector('h1, h2').textContent;
    announceToScreenReader(`Slide ${currentSlide + 1} : ${slideTitle}`);
}

// Navigation vers la slide suivante
function nextSlide() {
    const nextIndex = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
    goToSlide(nextIndex);
}

// Navigation vers la slide précédente
function previousSlide() {
    const prevIndex = currentSlide > 0 ? currentSlide - 1 : slides.length - 1;
    goToSlide(prevIndex);
}

// Mise à jour de la navigation
function updateNavigation() {
    navDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
        dot.setAttribute('aria-current', index === currentSlide ? 'true' : 'false');
    });
}

// Fonction pour annoncer aux lecteurs d'écran
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Navigation au clavier améliorée
document.addEventListener('keydown', (e) => {
    // Éviter la navigation si l'utilisateur est dans un élément interactif
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch(e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
            e.preventDefault();
            nextSlide();
            break;
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            previousSlide();
            break;
        case 'Home':
            e.preventDefault();
            goToSlide(0);
            break;
        case 'End':
            e.preventDefault();
            goToSlide(slides.length - 1);
            break;
        case 'Escape':
            // Permettre de revenir au début
            goToSlide(0);
            break;
    }
});

// Détection du scroll pour mettre à jour la navigation
let ticking = false;
function updateSlideOnScroll() {
    const scrollPosition = window.scrollY;
    const slideHeight = window.innerHeight;
    const newSlide = Math.round(scrollPosition / slideHeight);

    if (newSlide !== currentSlide && newSlide >= 0 && newSlide < slides.length) {
        currentSlide = newSlide;
        updateNavigation();
    }
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateSlideOnScroll);
        ticking = true;
    }
});

// Gestion du focus pour l'accessibilité
document.addEventListener('focusin', (e) => {
    // Si un élément reçoit le focus dans une slide différente, naviguer vers cette slide
    const focusedSlide = e.target.closest('.slide');
    if (focusedSlide) {
        const slideIndex = Array.from(slides).indexOf(focusedSlide);
        if (slideIndex !== -1 && slideIndex !== currentSlide) {
            currentSlide = slideIndex;
            updateNavigation();
        }
    }
});

// Support des gestes tactiles pour mobile
let startX = null;
let startY = null;

document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!startX || !startY) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const diffX = startX - endX;
    const diffY = startY - endY;

    // Détecter si c'est un swipe horizontal (et non vertical)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
            // Swipe vers la gauche = slide suivante
            nextSlide();
        } else {
            // Swipe vers la droite = slide précédente
            previousSlide();
        }
    }

    startX = null;
    startY = null;
});

// Amélioration pour les utilisateurs avec des préférences de mouvement réduit
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Redéfinir goToSlide pour désactiver le scroll smooth
    const originalGoToSlide = goToSlide;
    goToSlide = function(index) {
        if (index < 0 || index >= slides.length) return;
        
        currentSlide = index;
        slides[currentSlide].scrollIntoView({ behavior: 'auto' });
        updateNavigation();
        
        const slideTitle = slides[currentSlide].querySelector('h1, h2').textContent;
        announceToScreenReader(`Slide ${currentSlide + 1} : ${slideTitle}`);
    };
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});