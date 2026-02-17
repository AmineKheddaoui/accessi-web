/* ============================================
   Navbar
   ============================================ */

class Navbar {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.toggle = document.querySelector('.navbar__toggle');
        this.menu = document.querySelector('.navbar__menu');
        this.dropdownBtns = document.querySelectorAll('.navbar__dropdown > button');

        if (!this.navbar) return;

        this.initScroll();
        this.initToggle();
        this.initDropdowns();
        this.setActivePage();
    }

    /* Ombre au scroll */
    initScroll() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.navbar.classList.toggle('navbar--scrolled', window.scrollY > 10);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* Hamburger mobile */
    initToggle() {
        if (!this.toggle || !this.menu) return;

        this.toggle.addEventListener('click', () => {
            const isOpen = this.toggle.getAttribute('aria-expanded') === 'true';
            this.toggle.setAttribute('aria-expanded', String(!isOpen));
            this.menu.classList.toggle('navbar__menu--open', !isOpen);
            document.body.style.overflow = !isOpen ? 'hidden' : '';
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('navbar__menu--open')) {
                this.toggle.setAttribute('aria-expanded', 'false');
                this.menu.classList.remove('navbar__menu--open');
                document.body.style.overflow = '';
                this.toggle.focus();
            }
        });
    }

    /* Dropdowns */
    initDropdowns() {
        this.dropdownBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isOpen = btn.getAttribute('aria-expanded') === 'true';
                // Fermer les autres
                this.dropdownBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
                btn.setAttribute('aria-expanded', String(!isOpen));
            });

            // Navigation clavier dans le submenu
            const submenu = btn.nextElementSibling;
            if (submenu) {
                submenu.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        btn.setAttribute('aria-expanded', 'false');
                        btn.focus();
                    }
                });
            }
        });

        // Fermer au clic exterieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar__dropdown')) {
                this.dropdownBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
            }
        });
    }

    /* Page active */
    setActivePage() {
        const path = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
        const links = this.navbar.querySelectorAll('a[href]');

        links.forEach(link => {
            const href = link.getAttribute('href').replace(/\/$/, '').replace(/\.html$/, '');
            if (
                (href === '/' && (path === '' || path === '/' || path.endsWith('/index'))) ||
                (href !== '/' && path.endsWith(href))
            ) {
                link.setAttribute('aria-current', 'page');
            }
        });
    }
}

// Export
window.Navbar = Navbar;
