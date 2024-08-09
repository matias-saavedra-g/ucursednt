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

        // Obtener el contenido de texto del elemento
        return courseNameElement.textContent.trim();
    }

    // Función para obtener el código del curso
    function getCourseCode() {
        // Obtener el elemento que coincide
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > h2");

        // Obtener el contenido de texto del elemento y luego truncar el string justo después del primer espacio
        return courseNameElement.textContent.trim().split(' ')[0];
    }

    // Añadir botones para copiar justo a la derecha de ambos elementos.
    // Estos botones usan el ícono <i class="fa-regular fa-paste"></i>
    function añadirBotones() {
        const courseName = getCourseName();
        const courseCode = getCourseCode();

        const courseNameButton = document.createElement("button");
        courseNameButton.classList.add("btn", "btn-default", "btn-sm");
        courseNameButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        // Centra el innerHTML del botón en el centro
        courseNameButton.style.alignItems = "center";
        courseNameButton.onclick = () => copyToClipboard(courseName);
        // Hace el botón de 5 px y el fondo color #222 y opacidad 0.8
        courseNameButton.style.backgroundColor = "#222";
        courseNameButton.style.opacity = "0.8";
        // Remueve el borde de botón
        courseNameButton.style.border = "none";

        const courseCodeButton = document.createElement("button");
        courseCodeButton.classList.add("btn", "btn-default", "btn-sm");
        courseCodeButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        courseCodeButton.style.alignItems = "center";
        courseCodeButton.onclick = () => copyToClipboard(courseCode);
        courseCodeButton.style.backgroundColor = "#222";
        courseCodeButton.style.opacity = "0.8";
        courseCodeButton.style.border = "none";

        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > h1 > span");
        courseNameElement.parentNode.appendChild(courseNameButton);

        const courseCodeElement = document.querySelector("#navigation-wrapper > div.curso > div > h2");
        courseCodeElement.parentNode.appendChild(courseCodeButton);
    }

    const easyCopyCourseDetailsConfig = JSON.parse(localStorage.getItem("settings")).features.easyCopyCourseDetails
    if (getLocalStorageItem("settings")) {
        if (!easyCopyCourseDetailsConfig) {return}
    }

    // Ejecutar la función para añadir los botones
    añadirBotones();

})();