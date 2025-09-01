(async function() {

    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set({ [key]: value }, () => {
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
    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([key], (result) => {
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

    // Función para copiar texto al portapapeles
    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        navigator.clipboard.writeText(textArea.value)
            .then(() => {
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Error in copying text: ', err);
            });
        document.body.removeChild(textArea);

        // Cambia el ícono del botón de acuerdo con su texto (course code or course name) a un checkmark por 2 segundos
        const courseNameButton = document.querySelector("#navigation-wrapper > div.curso > div > div > h1 > button");
        const courseCodeButton = document.querySelector("#navigation-wrapper > div.curso > div > div > h2 > button");
        const checkmarkIcon = `<i class="fa-solid fa-check"></i>`;

        if (text === getCourseName()) {
            courseNameButton.innerHTML = checkmarkIcon;
            setTimeout(() => {courseNameButton.innerHTML = `<i class="fa-solid fa-paste"></i>`}, 2000);
        } else if (text === getCourseCode()) {
            courseCodeButton.innerHTML = checkmarkIcon;
            setTimeout(() => {courseCodeButton.innerHTML = `<i class="fa-solid fa-paste"></i>`}, 2000);
        } else {
            // Renamed courses, override
            courseNameButton.innerHTML = checkmarkIcon;
            setTimeout(() => {courseNameButton.innerHTML = `<i class="fa-solid fa-paste"></i>`}, 2000);
        }
    }

    // Función para obtener el nombre del curso
    function getCourseName() {
        // Obtener el elemento que coincide
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > div > h1");

        // Verificar si el elemento existe
        if (!courseNameElement) {return "No se pudo encontrar el nombre del curso"}

        // Obtener el contenido de texto del elemento
        return courseNameElement.firstChild.textContent.trim();
    }

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
    // Estos botones usan el ícono <i class="fa-solid fa-paste"></i>
    function añadirBotones() {
        const courseName = getCourseName();
        const courseCode = getCourseCode();

        // Crear botones
        const courseNameButton = document.createElement("button");
        courseNameButton.classList.add("btn", "btn-default", "btn-sm");
        courseNameButton.innerHTML = `<i class="fa-solid fa-paste"></i>`;
        // Centra el innerHTML del botón en el centro
        courseNameButton.style.alignItems = "center";
        courseNameButton.onclick = () => copyToClipboard(courseName);
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
        courseCodeButton.innerHTML = `<i class="fa-solid fa-paste"></i>`;
        courseCodeButton.style.alignItems = "center";
        courseCodeButton.onclick = () => copyToClipboard(courseCode);
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
    const settings = await getChromeStorageItem("settings");
    if (settings) {
        const easyCopyCourseDetailsConfig = settings.features.easyCopyCourseDetails;
        if (!easyCopyCourseDetailsConfig) {return}
    }

    // Ejecutar la función para añadir los botones
    añadirBotones();

})();
