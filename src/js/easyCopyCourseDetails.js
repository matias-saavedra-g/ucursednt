(async function() {

    // Function to set an item in Chrome Storage
    

    // Function to get an item from Chrome Storage
    

    // Función para copiar texto al portapapeles
    

    // Función para obtener el nombre del curso
    

    // Función para obtener el código del curso
    function getCourseCode() {
        // Obtener el elemento que coincide
        const courseCodeElement = document.querySelector("#navigation-wrapper > div.curso > div > div > h2");

        // Verificar si el elemento existe
        if (!courseCodeElement) {return "No se pudo encontrar el código del curso"}

        // Obtener el contenido de texto del elemento y luego truncar el string justo después del primer espacio
        return courseCodeElement.firstChild.textContent.trim().split(' ')[0];
    }

    // Añadir botones para copiar justo a la derecha de ambos elementos.
    // Estos botones usan el ícono <i class="fa-regular fa-paste"></i>
    function añadirBotones() {
        const courseName = UcursedntUtils.Ucursos.getCourseName();
        const courseCode = getCourseCode();

        // Crear botones
        const courseNameButton = document.createElement("button");
        courseNameButton.classList.add("btn", "btn-default", "btn-sm");
        courseNameButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        // Centra el innerHTML del botón en el centro
        courseNameButton.style.alignItems = "center";
        courseNameButton.onclick = () => {
            UcursedntUtils.DOM.copyToClipboard(courseName);
            courseNameButton.innerHTML = `<i class="fa-regular fa-check"></i>`;
            setTimeout(() => {
                courseNameButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
            }, 1000);
        };
        // Hace el fondo color #222 y opacidad 0.2
        courseNameButton.style.backgroundColor = "rgba(34, 34, 34, 0)";
        // Remueve el borde de botón
        courseNameButton.style.border = "none";
        // Hace el boton completo más pequeño
        courseNameButton.style.padding = "7px";
        // Inherits the color of the text
        courseNameButton.style.color = "inherit";

        const courseCodeButton = document.createElement("button");
        courseCodeButton.classList.add("btn", "btn-default", "btn-sm");
        courseCodeButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
        courseCodeButton.style.alignItems = "center";
        courseCodeButton.onclick = () => {
            UcursedntUtils.DOM.copyToClipboard(courseCode);
            courseCodeButton.innerHTML = `<i class="fa-regular fa-check"></i>`;
            setTimeout(() => {
                courseCodeButton.innerHTML = `<i class="fa-regular fa-paste"></i>`;
            }, 1000);
        };
        courseCodeButton.style.backgroundColor = "rgba(34, 34, 34, 0)";
        courseCodeButton.style.border = "none";
        courseCodeButton.style.padding = "4px";
        courseCodeButton.style.color = "inherit";

        // Añadir botones justo a la derecha de los elementos
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > div > h1");
        // Verificar si el elemento existe
        if (courseNameElement) {courseNameElement.firstChild.parentNode.appendChild(courseNameButton)};

        const courseCodeElement = document.querySelector("#navigation-wrapper > div.curso > div > div > h2");
        if (courseCodeElement) {courseCodeElement.firstChild.parentNode.appendChild(courseCodeButton)};
    }
    
    // Verificar si la configuración de easyCopyCourseDetails está activada
    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings) {
        const easyCopyCourseDetailsConfig = settings.features.easyCopyCourseDetails;
        if (!easyCopyCourseDetailsConfig) {return}
    }

    // Ejecutar la función para añadir los botones
    añadirBotones();

})();
