/**
 * Simulator - Color blindness simulation and before/after demos
 */

(function () {
    'use strict';

    // Vision simulator
    function initSimulator() {
        const controls = document.querySelectorAll('.simulator-btn[data-filter]');
        const preview = document.getElementById('simulatorPreview');
        const label = document.getElementById('simulatorLabel');

        if (!controls.length || !preview) return;

        const labels = {
            none: 'Vision normale - Aucun filtre applique',
            protanopia: 'Protanopie - Difficulte a percevoir le rouge',
            deuteranopia: 'Deuteranopie - Difficulte a percevoir le vert',
            tritanopia: 'Tritanopie - Difficulte a percevoir le bleu',
            achromatopsia: 'Achromatopsie - Vision en nuances de gris'
        };

        controls.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = this.getAttribute('data-filter');

                // Update active state
                controls.forEach(function (b) {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('is-active');
                this.setAttribute('aria-checked', 'true');

                // Remove all filter classes
                preview.className = 'simulator-preview__content';

                // Apply filter
                if (filter !== 'none') {
                    preview.classList.add('filter-' + filter);
                }

                // Update label
                if (label) {
                    label.textContent = labels[filter] || labels.none;
                }

                // Announce to screen reader
                var announcer = document.getElementById('sr-announcer');
                if (announcer) {
                    announcer.textContent = labels[filter] || labels.none;
                }
            });
        });
    }

    // Before/After demo tabs
    function initDemoTabs() {
        var demoCards = document.querySelectorAll('.demo-card');

        demoCards.forEach(function (card) {
            var tabs = card.querySelectorAll('.demo-card__tab');
            var panels = card.querySelectorAll('.demo-card__panel');

            tabs.forEach(function (tab) {
                tab.addEventListener('click', function () {
                    var panelId = this.getAttribute('data-panel');

                    // Update tabs
                    tabs.forEach(function (t) { t.classList.remove('is-active'); });
                    this.classList.add('is-active');

                    // Update panels
                    panels.forEach(function (p) { p.classList.remove('is-active'); });
                    var target = document.getElementById(panelId);
                    if (target) {
                        target.classList.add('is-active');
                    }
                });
            });
        });
    }

    // Init
    document.addEventListener('DOMContentLoaded', function () {
        initSimulator();
        initDemoTabs();
    });
})();
