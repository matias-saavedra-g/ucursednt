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

    const otrasRealizacionesConfig = JSON.parse(localStorage.getItem("settings")).features.otrasRealizaciones
    if (getLocalStorageItem("settings")) {
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
        button.addEventListener('click', () => {
            // Obtener partes de la URL actual
            const parts = currentUrl.split('/');
            const faculty = parts[3];
            const courseCode = parts[6];
            const newUrl = `https://www.u-cursos.cl/${faculty}/${courseCode}/datos_ramo/`;

            // Redirigir a la nueva URL
            window.location.href = newUrl;

            // Mostrar una alerta la primera vez que se hace clic en el botón
            let firstClick = getLocalStorageItem("otherRealizationsFirstClick") !== true;
            if (firstClick) {
                alert("¡Nuevo atajo desbloqueado!");
                setLocalStorageItem("otherRealizationsFirstClick", true); // Marcar que ya se mostró la alerta
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