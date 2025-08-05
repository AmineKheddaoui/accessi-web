// Gestionnaire d'URLs pour développement local et production
class URLHandler {
    constructor() {
        this.isLocal = this.detectLocalEnvironment();
        this.setupClickHandlers();
    }

    detectLocalEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            protocol === 'file:'
        );
    }

    getURL(page) {
        if (this.isLocal) {
            // En local, utiliser les fichiers .html
            switch(page) {
                case '/': return 'index.html';
                case '/essential': return 'essential.html';
                case '/business': return 'business.html';
                case '/enterprise': return 'enterprise.html';
                case '/contact': return 'contact.html';
                default: return page + '.html';
            }
        } else {
            // En production, utiliser les URLs propres
            return page;
        }
    }

    setupClickHandlers() {
        // Intercepter tous les clics sur les liens internes
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && this.isLocal) {
                e.preventDefault();
                const href = link.getAttribute('href');
                const newURL = this.getURL(href);
                
                if (link.target === '_blank') {
                    window.open(newURL, '_blank');
                } else {
                    window.location.href = newURL;
                }
            }
        });

        // Intercepter les window.open dans les boutons
        const originalOpen = window.open;
        window.open = (url, target, features) => {
            if (this.isLocal && url.startsWith('/')) {
                url = this.getURL(url);
            }
            return originalOpen.call(window, url, target, features);
        };
    }

    // Méthode utilitaire pour les développeurs
    navigate(page) {
        window.location.href = this.getURL(page);
    }
}

// Initialiser le gestionnaire d'URLs
document.addEventListener('DOMContentLoaded', () => {
    new URLHandler();
});

// Exporter pour usage global
window.URLHandler = URLHandler;