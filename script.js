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
            
            // Agir sur le texte "Vous arrivez à lire ça?"
            const lowContrastElements = document.querySelectorAll('.low-contrast-demo');
            lowContrastElements.forEach(element => {
                if (mode === 'after') {
                    // Mode accessible : texte bien visible
                    element.classList.add('accessible-version');
                } else {
                    // Mode non accessible : texte difficile à lire
                    element.classList.remove('accessible-version');
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

// Outils d'accessibilité
function initAccessibilityTools() {
    console.log('🦽 Initializing accessibility tools...');
    console.log('🦽 Current DOM readyState:', document.readyState);
    const toolbar = document.getElementById('accessibility-toolbar');
    const toggle = document.getElementById('accessibility-toggle');
    const panel = document.getElementById('accessibility-panel');
    const textToSpeech = document.getElementById('text-to-speech');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    const highContrast = document.getElementById('high-contrast');
    const dyslexiaFont = document.getElementById('dyslexia-font');
    const resetAccessibility = document.getElementById('reset-accessibility');

    console.log('🦽 Elements found:', {
        toolbar: !!toolbar,
        toggle: !!toggle,
        panel: !!panel,
        textToSpeech: !!textToSpeech,
        fontSizeSlider: !!fontSizeSlider,
        fontSizeValue: !!fontSizeValue,
        highContrast: !!highContrast,
        dyslexiaFont: !!dyslexiaFont,
        resetAccessibility: !!resetAccessibility
    });

    if (!toolbar) {
        console.error('🦽 Accessibility toolbar not found!');
        return;
    }

    let fontSize = 100; // Taille de base en pourcentage
    let isReading = false;
    let currentUtterance = null;

    // Toggle du panneau
    toggle.addEventListener('click', () => {
        console.log('🦽 Accessibility toggle clicked!');
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        console.log('🦽 Current state - isExpanded:', isExpanded);
        toggle.setAttribute('aria-expanded', !isExpanded);
        panel.setAttribute('aria-hidden', isExpanded);
        console.log('🦽 New state - aria-expanded:', !isExpanded, 'aria-hidden:', isExpanded);
    });

    // Fermer le panneau en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!toolbar.contains(e.target)) {
            toggle.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
        }
    });

    // Lecture audio
    if (textToSpeech && 'speechSynthesis' in window) {
        textToSpeech.addEventListener('click', () => {
            if (isReading) {
                speechSynthesis.cancel();
                isReading = false;
                textToSpeech.classList.remove('active');
                textToSpeech.setAttribute('aria-label', 'Activer la lecture audio');
                // Supprimer la surbrillance
                document.querySelectorAll('.reading-text').forEach(el => {
                    el.classList.remove('reading-text');
                });
            } else {
                readCurrentSlide();
            }
        });

        function readCurrentSlide() {
            const currentSlide = document.querySelector('.slide');
            if (!currentSlide) return;

            const textElements = currentSlide.querySelectorAll('h1, h2, h3, h4, p, span, li');
            let textToRead = '';
            
            textElements.forEach(element => {
                if (element.textContent.trim() && 
                    !element.hasAttribute('aria-hidden') && 
                    getComputedStyle(element).display !== 'none') {
                    textToRead += element.textContent.trim() + '. ';
                }
            });

            if (textToRead) {
                currentUtterance = new SpeechSynthesisUtterance(textToRead);
                currentUtterance.lang = 'fr-FR';
                currentUtterance.rate = 0.9;
                
                currentUtterance.onstart = () => {
                    isReading = true;
                    textToSpeech.classList.add('active');
                    textToSpeech.setAttribute('aria-label', 'Arrêter la lecture audio');
                };
                
                currentUtterance.onend = () => {
                    isReading = false;
                    textToSpeech.classList.remove('active');
                    textToSpeech.setAttribute('aria-label', 'Activer la lecture audio');
                    document.querySelectorAll('.reading-text').forEach(el => {
                        el.classList.remove('reading-text');
                    });
                };

                speechSynthesis.speak(currentUtterance);
            }
        }
    }

    // Gestion du slider de taille de police
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', (e) => {
            fontSize = parseInt(e.target.value);
            updateFontSize();
        });

        fontSizeSlider.addEventListener('change', (e) => {
            fontSize = parseInt(e.target.value);
            updateFontSize();
            // Annoncer le changement pour les lecteurs d'écran
            announceToScreenReader(`Taille du texte ajustée à ${fontSize}%`);
        });
    }

    function updateFontSize() {
        // Appliquer la taille de police de manière fluide
        document.documentElement.style.fontSize = `${fontSize}%`;
        
        // Mettre à jour l'affichage de la valeur
        if (fontSizeValue) {
            fontSizeValue.textContent = `${fontSize}%`;
        }
        
        // Mettre à jour le slider
        if (fontSizeSlider) {
            fontSizeSlider.value = fontSize;
        }
        
        // Sauvegarder la préférence
        localStorage.setItem('accessibility-font-size', fontSize);
    }

    // Contraste élevé
    highContrast.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('high-contrast');
        highContrast.classList.toggle('active', isActive);
        highContrast.setAttribute('aria-label', 
            isActive ? 'Désactiver le contraste élevé' : 'Activer le contraste élevé'
        );
        
        // Sauvegarder la préférence
        localStorage.setItem('accessibility-high-contrast', isActive);
    });

    // Police dyslexia
    dyslexiaFont.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('dyslexia-font');
        dyslexiaFont.classList.toggle('active', isActive);
        dyslexiaFont.setAttribute('aria-label', 
            isActive ? 'Désactiver la police dyslexia' : 'Activer la police dyslexia'
        );
        
        // Sauvegarder la préférence
        localStorage.setItem('accessibility-dyslexia-font', isActive);
        
        // Annoncer le changement
        announceToScreenReader(
            isActive ? 'Police dyslexia activée' : 'Police dyslexia désactivée'
        );
    });

    // Réinitialiser
    resetAccessibility.addEventListener('click', () => {
        fontSize = 100;
        updateFontSize();
        
        document.body.classList.remove('high-contrast');
        highContrast.classList.remove('active');
        highContrast.setAttribute('aria-label', 'Activer/désactiver le mode haute contraste');
        
        document.body.classList.remove('dyslexia-font');
        dyslexiaFont.classList.remove('active');
        dyslexiaFont.setAttribute('aria-label', 'Activer/désactiver la police dyslexia');
        
        if (isReading) {
            speechSynthesis.cancel();
            isReading = false;
            textToSpeech.classList.remove('active');
            textToSpeech.setAttribute('aria-label', 'Activer/désactiver la lecture audio');
        }

        // Réinitialiser les styles de fontSize
        document.documentElement.style.fontSize = '';

        // Supprimer les préférences sauvegardées
        localStorage.removeItem('accessibility-font-size');
        localStorage.removeItem('accessibility-high-contrast');
        localStorage.removeItem('accessibility-dyslexia-font');
        
        announceToScreenReader('Paramètres d\'accessibilité réinitialisés');
    });

    // Restaurer les préférences au chargement
    function restorePreferences() {
        const savedFontSize = localStorage.getItem('accessibility-font-size');
        if (savedFontSize) {
            fontSize = parseInt(savedFontSize);
            updateFontSize();
        }

        const savedHighContrast = localStorage.getItem('accessibility-high-contrast');
        if (savedHighContrast === 'true') {
            document.body.classList.add('high-contrast');
            highContrast.classList.add('active');
            highContrast.setAttribute('aria-label', 'Activer/désactiver le mode haute contraste');
        }

        const savedDyslexiaFont = localStorage.getItem('accessibility-dyslexia-font');
        if (savedDyslexiaFont === 'true') {
            document.body.classList.add('dyslexia-font');
            dyslexiaFont.classList.add('active');
            dyslexiaFont.setAttribute('aria-label', 'Désactiver la police dyslexia');
        }
    }

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Alt + A pour ouvrir les outils d'accessibilité
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            toggle.click();
            toggle.focus();
        }
        // Alt + R pour la lecture audio
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            textToSpeech.click();
        }
        // Alt + + pour augmenter la taille
        if (e.altKey && e.key === '+') {
            e.preventDefault();
            if (fontSizeSlider && fontSize < 160) {
                fontSize += 10;
                updateFontSize();
                announceToScreenReader(`Taille du texte augmentée à ${fontSize}%`);
            }
        }
        // Alt + - pour diminuer la taille
        if (e.altKey && e.key === '-') {
            e.preventDefault();
            if (fontSizeSlider && fontSize > 80) {
                fontSize -= 10;
                updateFontSize();
                announceToScreenReader(`Taille du texte réduite à ${fontSize}%`);
            }
        }
        // Alt + C pour le contraste
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            highContrast.click();
        }
    });

    restorePreferences();
    console.log('🦽 Accessibility tools initialized successfully!');
}

// Exposer la fonction globalement
window.initAccessibilityTools = initAccessibilityTools;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    setupDemoInteractions();
    enhanceFocusLinks();
    initAccessibilityTools();
});