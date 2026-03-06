// Función para copiar texto al portapapeles utilizando el API del navegador
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
        // Alerta cuando se ha copiado correctamente el texto
        alert('Texto copiado al portapapeles');
    }, function (err) {
        // Manejo de errores en caso de fallo al copiar
        console.error('Error al copiar el texto: ', err);
    });
}

// Open the AI side panel when the user clicks the "Abrir Chat IA" button.
// chrome.sidePanel.open() must be called in response to a user gesture.
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('open-sidepanel-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await chrome.sidePanel.open({ tabId: tab.id });
                window.close(); // Close the popup after launching the panel
            }
        } catch (err) {
            console.error('Could not open side panel:', err);
            // Fallback: open as a full page tab
            chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
            window.close();
        }
    });

    // Populate extension version
    const versionEl = document.getElementById('version-info');
    if (versionEl) {
        const manifest = chrome.runtime.getManifest();
        versionEl.textContent = `v${manifest.version}`;
    }
});
