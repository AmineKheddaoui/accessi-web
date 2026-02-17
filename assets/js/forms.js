/* ============================================
   Gestion des formulaires
   ============================================ */

function initForms() {
    document.querySelectorAll('form[data-endpoint]').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const endpoint = form.dataset.endpoint;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const successEl = form.closest('section').querySelector('.form-success');

    // Disable
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
        const formData = new FormData(form);
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            // Show success
            form.style.display = 'none';
            if (successEl) {
                successEl.classList.add('is-visible');
            }
            // Screen reader announcement
            const announcer = document.getElementById('sr-announcer');
            if (announcer) {
                announcer.textContent = data.message || 'Formulaire envoye avec succes.';
            }
        } else {
            showFormError(form, data.message || 'Une erreur est survenue.');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showFormError(form, 'Erreur de connexion. Veuillez reessayer.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function showFormError(form, message) {
    // Remove previous error
    const prev = form.querySelector('.form-alert');
    if (prev) prev.remove();

    const alert = document.createElement('div');
    alert.className = 'form-alert';
    alert.setAttribute('role', 'alert');
    alert.style.cssText = 'background: var(--color-warning-light); color: var(--color-warning); border: 1px solid var(--color-warning); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg); font-size: var(--fs-small);';
    alert.textContent = message;
    form.prepend(alert);

    // Auto-remove after 5s
    setTimeout(() => alert.remove(), 5000);
}

// Export
window.initForms = initForms;
