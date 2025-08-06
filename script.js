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

// Fonctions pour la démo interactive
function setupDemoInteractions() {
    // Initialiser le simulateur de daltonisme
    initVisionSimulator();
    
    // Initialiser les boutons avant/après
    initBeforeAfterToggle();
    
    // Animation des statistiques d'impact au scroll
    const impactStats = document.querySelectorAll('.impact-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    impactStats.forEach(stat => observer.observe(stat));
}

// Animation des compteurs de statistiques
function animateCounter(element) {
    if (element.dataset.animated) return; // Éviter les animations multiples
    
    const text = element.textContent;
    const number = parseInt(text.replace(/[^\d]/g, ''));
    const duration = 2000; // 2 secondes
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function pour une animation fluide
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentNumber = Math.floor(number * easeOutQuart);
        
        element.textContent = text.replace(/\d+/, currentNumber);
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.dataset.animated = 'true';
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Fonction utilitaire pour améliorer l'accessibilité des liens de focus
function enhanceFocusLinks() {
    const focusLinks = document.querySelectorAll('.good-focus');
    focusLinks.forEach(link => {
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.style.background = 'rgba(0, 245, 255, 0.2)';
                setTimeout(() => {
                    this.style.background = '';
                }, 200);
            }
        });
    });
}

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

// Fonction d'initialisation du simulateur de daltonisme
function initVisionSimulator() {
    console.log('Initializing vision simulator...');
    const visionButtons = document.querySelectorAll('.vision-btn');
    
    if (visionButtons.length === 0) {
        console.log('No vision buttons found');
        return;
    }
    
    // Supprimer les anciens event listeners si ils existent
    visionButtons.forEach(button => {
        if (button._visionHandler) {
            button.removeEventListener('click', button._visionHandler);
        }
    });
    
    visionButtons.forEach(button => {
        const handler = function() {
            console.log('Vision button clicked:', this.dataset.filter);
            
            // Retirer la classe active de tous les boutons
            visionButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Retirer toutes les classes de filtre du body
            document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
            
            // Ajouter la nouvelle classe de filtre si nécessaire
            const filter = this.dataset.filter;
            if (filter !== 'normal') {
                document.body.classList.add(filter);
            }
            
            // Annoncer le changement pour les lecteurs d'écran
            const filterName = {
                'normal': 'Vision normale',
                'protanopia': 'Simulation daltonisme rouge',
                'deuteranopia': 'Simulation daltonisme vert',
                'tritanopia': 'Simulation daltonisme bleu'
            }[filter];
            
            announceToScreenReader(`Filtre appliqué : ${filterName}`);
        };
        
        // Stocker le handler pour pouvoir le supprimer plus tard
        button._visionHandler = handler;
        button.addEventListener('click', handler);
    });
}

// Exposer la fonction globalement
window.initVisionSimulator = initVisionSimulator;

// Fonction d'initialisation du toggle avant/après
function initBeforeAfterToggle() {
    console.log('Initializing before/after toggle...');
    const demoButtons = document.querySelectorAll('.demo-btn');
    const demoItems = document.querySelectorAll('.demo-item');
    
    console.log('Found demo buttons:', demoButtons.length);
    console.log('Found demo items:', demoItems.length);
    
    if (demoButtons.length === 0) {
        console.log('No demo buttons found');
        return;
    }
    
    // Supprimer les anciens event listeners si ils existent
    demoButtons.forEach(button => {
        if (button._demoHandler) {
            button.removeEventListener('click', button._demoHandler);
        }
    });
    
    demoButtons.forEach(button => {
        const handler = function() {
            console.log('Demo button clicked:', this.dataset.mode);
            
            // Retirer la classe active de tous les boutons
            demoButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Récupérer le mode sélectionné
            const mode = this.dataset.mode;
            
            // Mettre à jour l'affichage des exemples
            demoItems.forEach(item => {
                item.classList.remove('active');
                if (item.classList.contains(mode)) {
                    item.classList.add('active');
                }
            });
            
            // Annoncer le changement pour les lecteurs d'écran
            const modeName = mode === 'before' ? 'Avant - Non accessible' : 'Après - Accessible';
            announceToScreenReader(`Affichage changé : ${modeName}`);
        };
        
        // Stocker le handler pour pouvoir le supprimer plus tard
        button._demoHandler = handler;
        button.addEventListener('click', handler);
    });
}

// Exposer la fonction globalement
window.initBeforeAfterToggle = initBeforeAfterToggle;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    setupDemoInteractions();
    enhanceFocusLinks();
});