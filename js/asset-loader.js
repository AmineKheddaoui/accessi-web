// Chargeur d'assets universel pour tous les environnements
class AssetLoader {
    constructor() {
        this.basePath = this.detectBasePath();
        this.isLocal = this.detectLocalEnvironment();
        console.log('AssetLoader initialized:', { basePath: this.basePath, isLocal: this.isLocal });
    }

    detectLocalEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            protocol === 'file:' ||
            window.location.port !== ''
        );
    }

    detectBasePath() {
        const path = window.location.pathname;
        
        // Si on est sur une URL comme /essential, /business, etc.
        if (path.match(/^\/(essential|business|enterprise|contact)$/)) {
            return window.location.origin + '/';
        }
        
        // Si on est dans un sous-dossier
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length > 1 && !pathParts[pathParts.length - 1].includes('.')) {
            return window.location.origin + '/' + pathParts.slice(0, -1).join('/') + '/';
        }
        
        // Par défaut, racine du site
        return window.location.origin + '/';
    }

    getAssetPath(asset) {
        // Enlever le slash initial si présent
        asset = asset.replace(/^\//, '');
        
        if (this.isLocal) {
            // En local, utiliser des chemins relatifs depuis la racine
            const currentPath = window.location.pathname;
            if (currentPath.includes('/') && !currentPath.endsWith('/') && !currentPath.includes('.html')) {
                // On est sur une URL propre, remonter d'un niveau
                return '../' + asset;
            }
            return asset;
        } else {
            // En production, utiliser le basePath
            return this.basePath + asset;
        }
    }

    loadCSS(href) {
        const finalHref = this.getAssetPath(href);
        console.log('Loading CSS:', finalHref);
        
        // Vérifier si le CSS n'est pas déjà chargé
        const existing = document.querySelector(`link[href*="${href.replace(/.*\//, '')}"]`);
        if (existing) {
            console.log('CSS already loaded');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = finalHref;
            
            link.onload = () => {
                console.log('CSS loaded successfully:', finalHref);
                resolve();
            };
            
            link.onerror = () => {
                console.error('Failed to load CSS:', finalHref);
                // Essayer avec un chemin alternatif
                const altPath = href.replace(/^\//, '');
                if (finalHref !== altPath) {
                    console.log('Trying alternative path:', altPath);
                    link.href = altPath;
                } else {
                    reject(new Error('CSS load failed'));
                }
            };
            
            document.head.appendChild(link);
        });
    }

    loadJS(src) {
        const finalSrc = this.getAssetPath(src);
        console.log('Loading JS:', finalSrc);
        
        // Vérifier si le script n'est pas déjà chargé
        const existing = document.querySelector(`script[src*="${src.replace(/.*\//, '')}"]`);
        if (existing) {
            console.log('JS already loaded');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = finalSrc;
            
            script.onload = () => {
                console.log('JS loaded successfully:', finalSrc);
                resolve();
            };
            
            script.onerror = () => {
                console.error('Failed to load JS:', finalSrc);
                // Essayer avec un chemin alternatif
                const altPath = src.replace(/^\//, '');
                if (finalSrc !== altPath) {
                    console.log('Trying alternative path:', altPath);
                    script.src = altPath;
                } else {
                    reject(new Error('JS load failed'));
                }
            };
            
            document.head.appendChild(script);
        });
    }

    setupFetch() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options) {
            let finalUrl = url;
            
            if (typeof url === 'string') {
                // Pour les endpoints PHP
                if (url.includes('.php')) {
                    finalUrl = self.getAssetPath(url);
                    console.log('Fetch to:', finalUrl);
                }
                
                // Mode démo en local
                if (self.isLocal && (url.includes('process-order.php') || url.includes('process-contact.php'))) {
                    console.log('🚀 Mode démo local - Simulation');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            success: true,
                            message: '✅ DÉMO LOCAL: Formulaire soumis avec succès !',
                            order_id: Math.floor(Math.random() * 1000),
                            demo_mode: true
                        })
                    };
                }
            }
            
            return originalFetch.call(this, finalUrl, options);
        };
    }

    async loadAllAssets() {
        try {
            console.log('🚀 Loading all assets...');
            
            // Charger CSS
            await this.loadCSS('styles.css');
            
            // Charger JS
            await this.loadJS('js/url-handler.js');
            await this.loadJS('script.js');
            
            // Setup fetch
            this.setupFetch();
            
            console.log('✅ All assets loaded successfully');
            
            // Déclencher un événement personnalisé
            window.dispatchEvent(new CustomEvent('assetsLoaded'));
            
        } catch (error) {
            console.error('❌ Asset loading failed:', error);
        }
    }
}

// Auto-initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const loader = new AssetLoader();
    await loader.loadAllAssets();
});

// Export global
window.AssetLoader = AssetLoader;