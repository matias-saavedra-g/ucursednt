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

    // Función para copiar texto al portapapeles
    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Texto copiado al portapapeles');
    }

    // Función para obtener el nombre del curso
    function getCourseName() {
        // Obtener el elemento que coincide
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > h1 > span");

        // Verificar si el elemento existe
        if (!courseNameElement) {return "No se pudo encontrar el nombre del curso"}

        // Obtener el contenido de texto del elemento
        return courseNameElement.textContent.trim();
    }

    // Función para obtener el código del curso
    function getCourseCode() {
        // Obtener el elemento que coincide
        const courseCodeElement = document.querySelector("#navigation-wrapper > div.curso > div > h2");

        // Verificar si el elemento existe
        if (!courseCodeElement) {return "No se pudo encontrar el código del curso"}

        // Obtener el contenido de texto del elemento y luego truncar el string justo después del primer espacio
        return courseCodeElement.textContent.trim().split(' ')[0];
    }

    // Añadir botones para copiar justo a la derecha de ambos elementos.
    // Estos botones usan el ícono <i class="fa-regular fa-paste"></i>
    function añadirBotones() {
        const courseName = getCourseName();
        const courseCode = getCourseCode();

        // Crear botones
        const courseNameButton = document.createElement("button");
        courseNameButton.classList.add("btn", "btn-default", "btn-sm");
        courseNameButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        // Centra el innerHTML del botón en el centro
        courseNameButton.style.alignItems = "center";
        courseNameButton.onclick = () => copyToClipboard(courseName);
        // Hace el fondo color #222 y opacidad 0.5
        courseNameButton.style.backgroundColor = "#222";
        courseNameButton.style.opacity = "0.5";
        // Remueve el borde de botón
        courseNameButton.style.border = "none";
        // Hace el boton completo más pequeño
        courseNameButton.style.padding = "7px";

        const courseCodeButton = document.createElement("button");
        courseCodeButton.classList.add("btn", "btn-default", "btn-sm");
        courseCodeButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        courseCodeButton.style.alignItems = "center";
        courseCodeButton.onclick = () => copyToClipboard(courseCode);
        courseCodeButton.style.backgroundColor = "#222";
        courseCodeButton.style.opacity = "0.5";
        courseCodeButton.style.border = "none";
        courseCodeButton.style.padding = "4px";

        // Añadir botones justo a la derecha de los elementos
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > h1 > span");
        // Verificar si el elemento existe
        if (courseNameElement) {courseNameElement.parentNode.appendChild(courseNameButton)};

        const courseCodeElement = document.querySelector("#navigation-wrapper > div.curso > div > h2");
        if (courseCodeElement) {courseCodeElement.parentNode.appendChild(courseCodeButton)};
    }
    
    // Verificar si la configuración de easyCopyCourseDetails está activada
    const easyCopyCourseDetailsConfig = JSON.parse(localStorage.getItem("settings")).features.easyCopyCourseDetails
    if (getLocalStorageItem("settings")) {
        if (!easyCopyCourseDetailsConfig) {return}
    }

    // Ejecutar la función para añadir los botones
    añadirBotones();

})();
