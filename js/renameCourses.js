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

    // Función para obtener el nombre del curso
    function getCourseName() {
        // Obtener el elemento que coincide
        const courseNameElement = document.querySelector("#navigation-wrapper > div.curso > div > div > h1");

        // Verificar si el elemento existe
        if (!courseNameElement) {return "No se pudo encontrar el nombre del curso"}

        // Obtener el contenido de texto del elemento
        return courseNameElement.firstChild.textContent.trim();
    }

    // Función para renombrar todos los nombres de curso
    function renameCourse() {
        const courseName = getCourseName();
        const newCourseName = prompt("Introduce el nuevo nombre del curso:", courseName);

        // Verificar si el usuario canceló la operación
        if (!newCourseName) {return}
     
        // Obtener el objeto de cursos renombrados desde LocalStorage
        let renamedCourses = getLocalStorageItem("renamedCourses") || {};

        // Añadir o actualizar el nombre del curso en el objeto
        renamedCourses[courseName] = newCourseName;

        // Guardar el objeto actualizado en LocalStorage
        setLocalStorageItem("renamedCourses", renamedCourses);

        // Reemplazar el nombre del curso en todo el documento
        replaceCourseName();
    }

    function replaceCourseName() {
        const courseName = getCourseName();
        const renamedCourses = getLocalStorageItem("renamedCourses");
        const newCourseName = renamedCourses[courseName];
        
        // Verificar si el nombre del curso actual está renombrado
        if (!renamedCourses[courseName]) { return }
        
        // Reemplazar el nombre del curso en todo el documento
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            node.nodeValue = node.nodeValue.replaceAll(courseName, newCourseName);
        }
    }

    // Función para reemplazar todo el texto que coincida con algún nombre del curso
    function replaceCourseNames() {
        const renamedCourses = getLocalStorageItem("renamedCourses");
        
        // Verificar si hay cursos renombrados guardados
        if (!renamedCourses) { return }
        
        // Iterar sobre cada nombre de curso guardado
        Object.keys(renamedCourses).forEach(courseName => {
            const newCourseName = renamedCourses[courseName];
        
            // Reemplazar el nombre del curso en todo el documento
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                node.nodeValue = node.nodeValue.replaceAll(courseName, newCourseName);
            }
        });    
    }

    // Añadir botón para renombrar el curso
    function añadirBotones() {
        const renameCourseButton = document.createElement("button");
        renameCourseButton.classList.add("btn", "btn-default", "btn-sm");
        renameCourseButton.innerHTML = `<i class="fa-solid fa-pencil"></i><span> Renombrar</span>`;
        renameCourseButton.style.alignItems = "center";
        renameCourseButton.onclick = renameCourse;
        renameCourseButton.style.backgroundColor = "rgba(34, 34, 34, 0)";
        renameCourseButton.style.border = "none";
        renameCourseButton.style.padding = "4px";
        renameCourseButton.style.color = "inherit";

        const courseDetails = document.querySelector("#navigation-wrapper > div.curso > div > div");
        if (courseDetails) {courseDetails.appendChild(renameCourseButton)};
    }
    
    // Verificar si la configuración de renameCourses está activada
    const renameCoursesSetting = JSON.parse(localStorage.getItem("settings")).features.renameCourses
    if (getLocalStorageItem("settings")) {
        if (!renameCoursesSetting) {return}
    }

    // Ejecutar la función para añadir botones
    añadirBotones();

    // Ejecutar la función para renombrar el curso
    replaceCourseNames();
})();
