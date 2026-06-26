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

// content.js - Handles first-time visit logic

(async function() {

// Función para establecer un dato en Chrome Storage


// Función para obtener un dato de Chrome Storage


// Function to build the correct tasks URL


// Note: User data extraction is now handled by userDataCapture.js
// This file only handles first-time visit logic

// Verificar si es la primera visita
const firstVisit = await UcursedntUtils.Storage.get('firstVisit');

if (!firstVisit) {
    // Redirigir a la página especificada
    window.location.href = "https://www.u-cursos.cl/ucursednt/";
    
    // Establecer el indicador de primera visita en Chrome Storage
    await UcursedntUtils.Storage.set('firstVisit', true);
    
    // Mostrar el changelog popup
    showChangeLogPopup();
}

// Función para mostrar el popup del changelog
/**
 * Opens a popup window to display the changelog.
 */
function showChangeLogPopup() {
    const popupUrl = browser.runtime.getURL('changelog.html');
    const popupWindow = window.open(popupUrl, 'Changelog', 'width=400,height=600');
    if (popupWindow) {
        popupWindow.focus();
    } else {
        window.showExtensionAlert('Please allow popups for this website to see the changelog.');
    }
}

})();