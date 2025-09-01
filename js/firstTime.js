// content.js - Handles first-time visit logic

(async function() {

// Función para establecer un dato en Chrome Storage
async function setChromeStorageItem(key, value) {
    try {
        await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
        console.error('Error setting Chrome storage item:', error);
    }
}

// Función para obtener un dato de Chrome Storage
async function getChromeStorageItem(key) {
    try {
        const result = await chrome.storage.sync.get([key]);
        return result[key] || null;
    } catch (error) {
        console.error('Error getting Chrome storage item:', error);
        return null;
    }
}

// Function to build the correct tasks URL
async function getTasksUrl() {
    const userId = await getChromeStorageItem('userId');
    
    if (userId) {
        return `https://www.u-cursos.cl/usuario/${userId}/tareas_usuario/`;
    }
    
    // Fallback URLs if userId is not available
    return null;
}

// Note: User data extraction is now handled by userDataCapture.js
// This file only handles first-time visit logic

// Verificar si es la primera visita
const firstVisit = await getChromeStorageItem('firstVisit');

if (!firstVisit) {
    // Redirigir a la página especificada
    window.location.href = "https://www.u-cursos.cl/ucursednt/";
    
    // Establecer el indicador de primera visita en Chrome Storage
    await setChromeStorageItem('firstVisit', true);
    
    // Mostrar el changelog popup
    showChangeLogPopup();
}

// Función para mostrar el popup del changelog
/**
 * Opens a popup window to display the changelog.
 */
function showChangeLogPopup() {
    const popupUrl = chrome.runtime.getURL('changelog.html');
    const popupWindow = window.open(popupUrl, 'Changelog', 'width=400,height=600');
    if (popupWindow) {
        popupWindow.focus();
    } else {
        alert('Please allow popups for this website to see the changelog.');
    }
}

})();