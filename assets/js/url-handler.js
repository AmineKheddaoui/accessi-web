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
                case '/': return 'frontend/index.html';
                case '/essential': return 'frontend/essential.html';
                case '/business': return 'frontend/business.html';
                case '/enterprise': return 'frontend/enterprise.html';
                case '/contact': return 'frontend/contact.html';
                default: return 'frontend/' + page + '.html';
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

        // Intercepter les requêtes fetch pour le mode démo
        if (this.isLocal) {
            this.setupFetchInterceptor();
        }
    }

    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options) => {
            // Détecter les requêtes vers les endpoints PHP
            if (typeof url === 'string' && (url.includes('process-order.php') || url.includes('process-contact.php'))) {
                console.log('🚀 Mode démo local activé - Simulation de la soumission du formulaire');
                
                // Simuler un délai de traitement
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Simuler une réponse réussie
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        message: '✅ DÉMO LOCAL: Formulaire soumis avec succès ! En production, un email serait envoyé.',
                        order_id: Math.floor(Math.random() * 1000),
                        demo_mode: true
                    })
                };
            }
            
            // Corriger les chemins des requêtes en production
            if (typeof url === 'string' && !this.isLocal) {
                // Si l'URL ne commence pas par / ou http, la préfixer avec /
                if (!url.startsWith('/') && !url.startsWith('http')) {
                    url = '/' + url;
                }
            }
            
            // Pour toutes les autres requêtes, utiliser fetch normal
            return originalFetch(url, options);
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