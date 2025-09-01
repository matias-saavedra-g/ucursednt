// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g el 2024.07.16

(async function() {

    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to get an item from Chrome Storage
    /**
     * Retrieves the value associated with the specified key from the Chrome storage.
     * @param {string} key - The key to retrieve the value for.
     * @returns {Promise<any>} The value associated with the key, or null if the key does not exist.
     */
    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get([key], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : null);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    const settings = await getChromeStorageItem("settings");
    if (settings) {
        const popupGradingConfig = settings.features.popupGrading;
        if (!popupGradingConfig) {return}
    }

    // Obtener todos los elementos <a> que contienen enlace a historial de evaluación
    var elem = document.querySelectorAll('a[href*="historial?id_evaluacion="]');

    // Iterar sobre cada elemento encontrado
    for (let i = 0; i < elem.length; i++){
        var link = elem[i].attributes[0].nodeValue; // Obtener el valor del atributo href
        elem[i].setAttribute("target", "popup"); // Establecer el atributo target como "popup"
        elem[i].setAttribute("onclick", "window.open('" + link + "','popup','width=600,height=600'); return false;"); // Agregar onclick para abrir en ventana emergente
    }

})();