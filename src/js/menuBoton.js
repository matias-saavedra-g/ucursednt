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

    // Función para establecer un dato en Chrome Storage
    

    // Función para obtener un dato de Chrome Storage
    /**
     * Retrieves the value associated with the specified key from the Chrome storage.
     * @param {string} key - The key to retrieve the value for.
     * @returns {any} - The value associated with the key, or null if the key does not exist.
     */
    

    // Verificar si estamos en la URL del homepage de u-cursos
    const currentUrl2 = window.location.href;
    const regex1 = /^https:\/\/www\.u-cursos\.cl\/usuario\/.*$/;
    const regex2 = /^https:\/\/www\.u-cursos\.cl\/ucursednt\/.*$/;
    const regex3 = /^https:\/\/www\.u-cursos\.cl\/logros\/.*$/;

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
        UcursedntUtils.DOM.safeSetHTML(button, `
            <img src="https://www.u-cursos.cl/d/images/cargos/alumno.svg" alt="Imagen">
            <span>U-Cursedn't</span>
        `);

        // Añadir funcionalidad al botón
        button.addEventListener('click', async () => {
            // Obtener partes de la URL actual
            const newUrl = `https://www.u-cursos.cl/ucursednt`;

            // Redirigir a la nueva URL
            window.location.href = newUrl;

            // Mostrar una alerta la primera vez que se hace clic en el botón
            let firstClick = await UcursedntUtils.Storage.get("menuBotonFirstClick") !== true;
            if (firstClick) {
                window.showExtensionAlert("Este es el menú de configuración de U-Cursedn't.");
                await UcursedntUtils.Storage.set("menuBotonFirstClick", true); // Marcar que ya se mostró la alerta
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