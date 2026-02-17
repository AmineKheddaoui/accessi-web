// Chargeur inline pour toutes les pages
(function() {
    // Détecter le chemin de base selon l'URL
    const currentPath = window.location.pathname;
    const isCleanURL = currentPath.match(/^\/(essential|business|enterprise|contact)$/);
    const basePath = isCleanURL ? '../' : '';
    
    console.log('Inline loader - Current path:', currentPath, 'Base path:', basePath);
    
    // Charger CSS immédiatement avec cache busting
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    const version = new Date().getTime();
    css.href = basePath + 'assets/css/styles.css?v=' + version;
    css.onerror = function() {
        console.log('CSS failed with', this.href, 'trying without basePath');
        this.href = 'assets/css/styles.css?v=' + version;
    };
    document.head.appendChild(css);
    
    // Fonction pour charger les scripts avec cache busting
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = basePath + src + '?v=' + version;
        script.onload = callback;
        script.onerror = function() {
            console.log('Script failed with', this.src, 'trying without basePath');
            this.src = src + '?v=' + version;
        };
        document.head.appendChild(script);
    }
    
    // Charger les scripts dans l'ordre
    loadScript('assets/js/asset-loader.js', function() {
        loadScript('assets/js/script.js', function() {
            console.log('All scripts loaded');
            // Forcer la réinitialisation des interactions après chargement
            setTimeout(function() {
                if (typeof window.initVisionSimulator === 'function') {
                    window.initVisionSimulator();
                }
                if (typeof window.initBeforeAfterToggle === 'function') {
                    window.initBeforeAfterToggle();
                }
                // Initialiser les outils d'accessibilité
                if (typeof window.initAccessibilityTools === 'function') {
                    window.initAccessibilityTools();
                }
            }, 100);
        });
    });
    
    // Setup fetch avec gestion spécifique OVH
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.includes('.php')) {
            // Mode démo pour développement local
            const isLocal = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.protocol === 'file:' ||
                           window.location.port !== '';
            
            if (isLocal && (url.includes('process-order.php') || url.includes('process-contact.php'))) {
                console.log('🚀 Local demo mode activated');
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            status: 200,
                            json: () => Promise.resolve({
                                success: true,
                                message: '✅ DÉMO LOCAL: Formulaire soumis avec succès !',
                                order_id: Math.floor(Math.random() * 1000),
                                demo_mode: true
                            })
                        });
                    }, 1000);
                });
            }
            
            // Configuration pour production OVH
            let finalUrl = url;
            let finalOptions = options || {};
            
            // Corriger l'URL selon le contexte
            if (isCleanURL) {
                // Sur une URL propre (/essential, /business, etc.)
                if (url.startsWith('/')) {
                    finalUrl = url.substring(1); // Enlever le slash initial
                } else if (!url.startsWith('http')) {
                    finalUrl = url; // Garder tel quel si relatif
                }
            } else {
                // Sur la racine, utiliser l'URL telle quelle
                if (url.startsWith('/')) {
                    finalUrl = url.substring(1); // Enlever le slash initial pour OVH
                }
            }
            
            // Headers spécifiques pour OVH
            finalOptions.headers = {
                ...finalOptions.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            };
            
            // Mode non-CORS pour OVH
            finalOptions.mode = 'same-origin';
            
            console.log('🌐 Production fetch:', { 
                original: url, 
                final: finalUrl, 
                isCleanURL: isCleanURL,
                hostname: window.location.hostname 
            });
            
            return originalFetch.call(this, finalUrl, finalOptions)
                .then(response => {
                    console.log('✅ Fetch response:', response.status, response.ok);
                    return response;
                })
                .catch(error => {
                    console.error('❌ Fetch error:', error);
                    // Fallback : essayer avec un chemin différent
                    const fallbackUrl = url.replace(/^\//, '');
                    console.log('🔄 Trying fallback URL:', fallbackUrl);
                    return originalFetch.call(this, fallbackUrl, finalOptions);
                });
        }
        return originalFetch.call(this, url, options);
    };
})();