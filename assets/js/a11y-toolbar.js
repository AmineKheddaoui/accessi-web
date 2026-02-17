/**
 * Accessibility Toolbar
 * Self-contained module: injects HTML and handles all interactions.
 * Features: font size slider, text-to-speech, high contrast, dyslexia font, reset.
 * Preferences are persisted in localStorage.
 */
(function () {
    'use strict';

    // --- Inject HTML ---
    function injectToolbar() {
        if (document.getElementById('a11y-toolbar')) return;

        var html = '' +
            '<div class="a11y-toolbar" id="a11y-toolbar" aria-label="Outils d\'accessibilite">' +
            '  <button class="a11y-toolbar__toggle" id="a11y-toggle" aria-label="Ouvrir les outils d\'accessibilite" aria-expanded="false" aria-controls="a11y-panel">' +
            '    <span aria-hidden="true">&#9855;</span>' +
            '  </button>' +
            '  <div class="a11y-toolbar__panel" id="a11y-panel" aria-hidden="true">' +
            '    <div class="a11y-toolbar__header"><h3>Outils d\'accessibilite</h3></div>' +
            '    <div class="a11y-toolbar__controls">' +
            '      <div class="a11y-toolbar__fontsize">' +
            '        <label class="a11y-toolbar__label" for="a11y-fontsize">' +
            '          <span aria-hidden="true">Aa</span> <span>Taille du texte</span>' +
            '        </label>' +
            '        <div class="a11y-toolbar__slider-row">' +
            '          <span class="a11y-toolbar__slider-label">A</span>' +
            '          <input type="range" class="a11y-toolbar__slider" id="a11y-fontsize" min="80" max="160" value="100" step="10" aria-label="Taille du texte de 80% a 160%">' +
            '          <span class="a11y-toolbar__slider-label">A</span>' +
            '          <span class="a11y-toolbar__slider-value" id="a11y-fontsize-val">100%</span>' +
            '        </div>' +
            '      </div>' +
            '      <button class="a11y-toolbar__btn" id="a11y-tts" aria-label="Activer la lecture audio">' +
            '        <span class="a11y-toolbar__btn-icon" aria-hidden="true">&#128266;</span> Lecture audio' +
            '      </button>' +
            '      <button class="a11y-toolbar__btn" id="a11y-contrast" aria-label="Activer le mode contraste eleve">' +
            '        <span class="a11y-toolbar__btn-icon" aria-hidden="true">&#9684;</span> Mode contraste' +
            '      </button>' +
            '      <button class="a11y-toolbar__btn" id="a11y-dyslexia" aria-label="Activer la police dyslexie">' +
            '        <span class="a11y-toolbar__btn-icon" aria-hidden="true">Dy</span> Police dyslexie' +
            '      </button>' +
            '      <button class="a11y-toolbar__btn" id="a11y-reset" aria-label="Reinitialiser les parametres">' +
            '        <span class="a11y-toolbar__btn-icon" aria-hidden="true">&#8634;</span> Reinitialiser' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // --- Announce to screen reader ---
    function announce(text) {
        var el = document.getElementById('sr-announcer');
        if (el) el.textContent = text;
    }

    // --- Init ---
    function init() {
        injectToolbar();

        var toolbar = document.getElementById('a11y-toolbar');
        var toggle = document.getElementById('a11y-toggle');
        var panel = document.getElementById('a11y-panel');
        var slider = document.getElementById('a11y-fontsize');
        var sliderVal = document.getElementById('a11y-fontsize-val');
        var ttsBtn = document.getElementById('a11y-tts');
        var contrastBtn = document.getElementById('a11y-contrast');
        var dyslexiaBtn = document.getElementById('a11y-dyslexia');
        var resetBtn = document.getElementById('a11y-reset');

        var fontSize = 100;
        var isReading = false;

        // Toggle panel
        toggle.addEventListener('click', function () {
            var expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            panel.setAttribute('aria-hidden', String(expanded));
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!toolbar.contains(e.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
                toggle.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
                toggle.focus();
            }
        });

        // Font size
        function updateFontSize() {
            document.documentElement.style.fontSize = fontSize + '%';
            sliderVal.textContent = fontSize + '%';
            slider.value = fontSize;
            localStorage.setItem('a11y-font-size', fontSize);
        }

        slider.addEventListener('input', function () {
            fontSize = parseInt(this.value);
            updateFontSize();
            announce('Taille du texte : ' + fontSize + '%');
        });

        // Text-to-speech
        ttsBtn.addEventListener('click', function () {
            if (!('speechSynthesis' in window)) {
                announce('Lecture audio non supportee par votre navigateur');
                return;
            }

            if (isReading) {
                speechSynthesis.cancel();
                isReading = false;
                ttsBtn.classList.remove('is-active');
                announce('Lecture audio arretee');
                return;
            }

            var main = document.getElementById('main-content');
            var text = main ? main.innerText : document.body.innerText;
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.9;

            utterance.onend = function () {
                isReading = false;
                ttsBtn.classList.remove('is-active');
            };

            speechSynthesis.speak(utterance);
            isReading = true;
            ttsBtn.classList.add('is-active');
            announce('Lecture audio demarree');
        });

        // High contrast
        contrastBtn.addEventListener('click', function () {
            var active = document.body.classList.toggle('high-contrast');
            contrastBtn.classList.toggle('is-active', active);
            localStorage.setItem('a11y-high-contrast', active);
            announce(active ? 'Contraste eleve active' : 'Contraste eleve desactive');
        });

        // Dyslexia font
        dyslexiaBtn.addEventListener('click', function () {
            var active = document.body.classList.toggle('dyslexia-font');
            dyslexiaBtn.classList.toggle('is-active', active);
            localStorage.setItem('a11y-dyslexia-font', active);
            announce(active ? 'Police dyslexie activee' : 'Police dyslexie desactivee');
        });

        // Reset
        resetBtn.addEventListener('click', function () {
            fontSize = 100;
            updateFontSize();

            document.body.classList.remove('high-contrast');
            contrastBtn.classList.remove('is-active');

            document.body.classList.remove('dyslexia-font');
            dyslexiaBtn.classList.remove('is-active');

            if (isReading) {
                speechSynthesis.cancel();
                isReading = false;
                ttsBtn.classList.remove('is-active');
            }

            document.documentElement.style.fontSize = '';
            localStorage.removeItem('a11y-font-size');
            localStorage.removeItem('a11y-high-contrast');
            localStorage.removeItem('a11y-dyslexia-font');

            announce('Parametres d\'accessibilite reinitialises');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function (e) {
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                toggle.click();
            }
        });

        // Restore preferences
        var savedSize = localStorage.getItem('a11y-font-size');
        if (savedSize) {
            fontSize = parseInt(savedSize);
            updateFontSize();
        }

        if (localStorage.getItem('a11y-high-contrast') === 'true') {
            document.body.classList.add('high-contrast');
            contrastBtn.classList.add('is-active');
        }

        if (localStorage.getItem('a11y-dyslexia-font') === 'true') {
            document.body.classList.add('dyslexia-font');
            dyslexiaBtn.classList.add('is-active');
        }
    }

    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
