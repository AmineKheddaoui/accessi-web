/* ============================================
   Accessi-web - Main JS Entry Point
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Navbar (toutes les pages)
    if (typeof Navbar !== 'undefined') {
        new Navbar();
    }

    // Accessibility toolbar (toutes les pages)
    if (typeof initAccessibilityTools === 'function') {
        initAccessibilityTools();
    }

    // Animations (page accueil)
    if (typeof initScrollAnimations === 'function') {
        initScrollAnimations();
    }

    // Forms (pages avec formulaires)
    if (typeof initForms === 'function') {
        initForms();
    }

    // Simulateur (page simulateur)
    if (typeof initVisionSimulator === 'function') {
        initVisionSimulator();
    }
    if (typeof initBeforeAfterToggle === 'function') {
        initBeforeAfterToggle();
    }

});
