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
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
        // Alerta cuando se ha copiado correctamente el texto
        window.showExtensionAlert('Texto copiado al portapapeles');
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
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await openExtensionSidePanel(tab.id );
                window.close(); // Close the popup after launching the panel
            }
        } catch (err) {
            console.error('Could not open side panel:', err);
            // Fallback: open as a full page tab
            browser.tabs.create({ url: browser.runtime.getURL('sidepanel.html') });
            window.close();
        }
    });

    // Populate extension version
    const versionEl = document.getElementById('version-info');
    if (versionEl) {
        const manifest = browser.runtime.getManifest();
        versionEl.textContent = `v${manifest.version}`;
    }
});


// Auto-injected cross-browser side panel opener
async function openExtensionSidePanel(tabId) {
    if (typeof browser !== 'undefined' && browser.sidebarAction) {
        await browser.sidebarAction.open();
    } else if (typeof chrome !== 'undefined' && chrome.sidePanel) {
        await chrome.sidePanel.open({ tabId: tabId });
    }
}
