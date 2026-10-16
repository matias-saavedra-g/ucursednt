// Auto-injected extension alert wrapper (Tour Guide feature)
if (typeof window.showExtensionAlert === 'undefined') {
    window.showExtensionAlert = function(message) {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.get(['settings']).then(res => {
                // Suppress the alert if tourGuide is explicitly disabled
                if (res && res.settings && res.settings.features && res.settings.features.tourGuide === false) {
                    return; 
                }
                alert(message);
            }).catch(() => alert(message));
        } else {
            alert(message);
        }
    };
}

// Función para copiar texto al portapapeles utilizando el API del navegador


document.addEventListener('DOMContentLoaded', () => {
    // Populate extension version
    const versionEl = document.getElementById('version-info');
    if (versionEl) {
        const manifest = browser.runtime.getManifest();
        versionEl.textContent = `v${manifest.version}`;
    }
});



