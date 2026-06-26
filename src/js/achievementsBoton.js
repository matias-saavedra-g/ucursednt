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
     * Retrieves the value associated with the specified key from the Chrome storage.
     * @param {string} key - The key to retrieve the value for.
     * @returns {Promise<any>} - The value associated with the key, or null if the key does not exist.
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

    // Verificar si estamos en la URL del homepage de u-cursos
    const currentUrl2 = window.location.href;
    const regex1 = /^https:\/\/www\.u-cursos\.cl\/usuario\/.*$/;
    const regex2 = /^https:\/\/www\.u-cursos\.cl\/logros\/.*$/;
    const regex3 = /^https:\/\/www\.u-cursos\.cl\/ucursednt\/.*$/;

    if (regex1.test(currentUrl2) || regex2.test(currentUrl2) || regex3.test(currentUrl2)) {
                // Crear el botón
        const listItem = document.createElement('li');
        listItem.className = 'servicio';

        if (regex2.test(currentUrl2)) {
            const servicioSel = document.querySelector('.servicio.sel');
            servicioSel.className = 'servicio';
            listItem.className = 'servicio sel';
        }

        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.innerHTML = `
            <img src="https://static.u-cursos.cl/images/servicios/novedades_v33873.svg" alt="Imagen">
            <span>Logros</span>
        `;

        // Añadir funcionalidad al botón
        button.addEventListener('click', async () => {
            // Obtener partes de la URL actual
            const newUrl = `https://www.u-cursos.cl/logros`;

            // Redirigir a la nueva URL
            window.location.href = newUrl;

            // Mostrar una alerta la primera vez que se hace clic en el botón
            let firstClick = await getStorageItem("achievementsBotonFirstClick") !== true;
            if (firstClick) {
                window.showExtensionAlert("¡Bienvenido a tu colección de trofeos!");
                await setStorageItem("achievementsBotonFirstClick", true); // Marcar que ya se mostró la alerta
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