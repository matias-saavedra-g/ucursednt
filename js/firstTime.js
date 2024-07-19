// content.js

// Función para establecer un dato en LocalStorage
function setLocalStorageItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Función para obtener un dato de LocalStorage
function getLocalStorageItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
}

// Verificar si es la primera visita
const firstVisit = getLocalStorageItem('firstVisit');

if (!firstVisit) {
    // Redirigir a la página especificada
    window.location.href = "https://www.u-cursos.cl/ucursednt/";
    
    // Establecer el indicador de primera visita en localStorage
    setLocalStorageItem('firstVisit', true);
    
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