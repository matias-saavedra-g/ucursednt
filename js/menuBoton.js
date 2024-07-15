(function() {

    // Función para establecer un dato en LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Función para obtener un dato de LocalStorage
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    // Verificar si estamos en la URL del homepage de u-cursos
    const currentUrl2 = window.location.href;
    const regex1 = /^https:\/\/www\.u-cursos\.cl\/usuario\/.*$/;
    const regex2 = /^https:\/\/www\.u-cursos\.cl\/ucursednt\/.*$/;

    if (regex1.test(currentUrl2) || regex2.test(currentUrl2)) {
        // Crear el botón
        const listItem = document.createElement('li');
        listItem.className = 'servicio';

        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.innerHTML = `
            <img src="https://www.u-cursos.cl/d/images/cargos/alumno.svg" alt="Imagen">
            <span>U-Cursedn't</span>
        `;

        // Añadir funcionalidad al botón
        button.addEventListener('click', () => {
            // Obtener partes de la URL actual
            const newUrl = `https://www.u-cursos.cl/ucursednt`;

            // Redirigir a la nueva URL
            window.location.href = newUrl;

            // Mostrar una alerta la primera vez que se hace clic en el botón
            let firstClick = getLocalStorageItem("menuBotonFirstClick") !== true;
            if (firstClick) {
                alert("Este es el menú de configuración de U-Cursedn't.");
                setLocalStorageItem("menuBotonFirstClick", true); // Marcar que ya se mostró la alerta
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