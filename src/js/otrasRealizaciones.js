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

(async function() {

    // Function to set an item in Chrome Storage
    function setStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                browser.storage.sync.set({ [key]: value }, () => {
                    if (browser.runtime.lastError) {
                        reject(browser.runtime.lastError);
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
     * Retrieves an item from the Chrome storage based on the provided key.
     * @param {string} key - The key of the item to retrieve from the Chrome storage.
     * @returns {Promise<any>} - The retrieved item, or null if the item does not exist.
     */
    function getStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                browser.storage.sync.get([key], (result) => {
                    if (browser.runtime.lastError) {
                        reject(browser.runtime.lastError);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : null);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    const settings = await getStorageItem("settings");
    if (settings) {
        const otrasRealizacionesConfig = settings.features.otrasRealizaciones;
        if (!otrasRealizacionesConfig) {return}
    }

    // Verificar si estamos en la URL del curso
    const currentUrl = window.location.href;
    const regex = /https:\/\/www\.u-cursos\.cl\/[^\/]+\/\d{4}\/[12]\/[^\/]+\/.*/;

    if (regex.test(currentUrl)) {
        // Crear el botón
        const listItem = document.createElement('li');
        listItem.className = 'servicio';

        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.innerHTML = `
            <img alt src="https://static.u-cursos.cl/images/servicios/todos_cursos_v8677.svg">
            <span>Otras Realizaciones</span>
        `;

        // Añadir funcionalidad al botón
        button.addEventListener('click', async () => {
            // Obtener partes de la URL actual
            const parts = currentUrl.split('/');
            const faculty = parts[3];
            const courseCode = parts[6];
            const newUrl = `https://www.u-cursos.cl/${faculty}/${courseCode}/datos_ramo/`;

            // Redirigir a la nueva URL
            window.location.href = newUrl;

            // Mostrar una alerta la primera vez que se hace clic en el botón
            let firstClick = await getStorageItem("otherRealizationsFirstClick") !== true;
            if (firstClick) {
                window.showExtensionAlert("¡Nuevo atajo desbloqueado!");
                await setStorageItem("otherRealizationsFirstClick", true); // Marcar que ya se mostró la alerta
            }
        });

        listItem.appendChild(button);

        // Insertar el botón en el contenedor de módulos
        const menu = document.querySelector('ul.modulos');
        if (menu) {
            menu.appendChild(listItem);
        }
    }

})();