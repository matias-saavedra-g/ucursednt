// renameCourses.js - Permite renombrar los cursos localmente

(async function() {
    'use strict';

    // ── 1. Chequear la Configuración del Usuario ─────────────────────────────
    if (typeof UcursedntUtils === 'undefined') {
        console.error('UcursedntUtils is not defined. Make sure utilities.js is loaded first.');
        return;
    }

    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && settings.features.renameCourses === false) {
        return; 
    }

    // ── 2. Lógica de Extracción Limpia ───────────────────────────────────────
    // Extrae SOLO el texto directo del h1, ignorando los menús y botones hijos


    // ── 3. Lógica de Reemplazo en el DOM ─────────────────────────────────────
    function replaceCourseName(originalName, newName) {
        if (!originalName || !newName) return;

        // Reemplazar también en el título de la pestaña
        if (document.title.includes(originalName)) {
            document.title = document.title.replaceAll(originalName, newName);
        }

        // TreeWalker seguro que ignora scripts y estilos
        const walker = document.createTreeWalker(
            document.body, 
            NodeFilter.SHOW_TEXT, 
            {
                acceptNode: function(node) {
                    const parentTag = node.parentNode.tagName.toLowerCase();
                    if (['script', 'style', 'noscript'].includes(parentTag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let node;
        const nodesToReplace = [];
        
        // Recolectar nodos primero para no alterar el walker mientras iteramos
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes(originalName)) {
                nodesToReplace.push(node);
            }
        }
        
        // Aplicar el reemplazo
        nodesToReplace.forEach(n => {
            n.nodeValue = n.nodeValue.replaceAll(originalName, newName);
        });
    }

    async function replaceAllSavedCourseNames() {
        const renamedCourses = await UcursedntUtils.Storage.get('courseMappings');
        if (!renamedCourses) return;
    
        // Iterar sobre cada nombre de curso guardado y reemplazarlo
        Object.keys(renamedCourses).forEach(originalName => {
            const newName = renamedCourses[originalName];
            replaceCourseName(originalName, newName);
        });
    }

    // ── 4. Lógica de Interacción del Usuario ─────────────────────────────────
    async function handleRenameClick() {
        const courseName = window.UcursedntUtils.Ucursos.getCourseName();
        if (!courseName) return;

        const newCourseName = prompt("Introduce el nuevo nombre del curso:", courseName);
    
        // Verificar si el usuario canceló o dejó el mismo nombre
        if (!newCourseName || newCourseName === courseName) return;
    
        // Guardar el nuevo nombre del curso en Chrome Storage
        let courseMappings = await UcursedntUtils.Storage.get('courseMappings') || {};
        courseMappings[courseName] = newCourseName;
        await UcursedntUtils.Storage.set('courseMappings', courseMappings);
    
        // Reemplazar visualmente el nombre del curso de inmediato
        replaceCourseName(courseName, newCourseName);
    }

    // ── 5. Inyección del Botón en la Interfaz ────────────────────────────────
    function injectRenameButton() {
        const courseDetails = document.querySelector("#navigation-wrapper > div.curso > div > div");
        if (!courseDetails) return;

        // Evitar duplicar el botón si el script se ejecuta dos veces
        if (document.getElementById('ucursednt-rename-btn')) return;

        const renameCourseButton = document.createElement("button");
        renameCourseButton.id = "ucursednt-rename-btn";
        renameCourseButton.classList.add("btn", "btn-default", "btn-sm");
        UcursedntUtils.DOM.safeSetHTML(renameCourseButton, `<i class="fa-regular fa-pencil"></i><span> Renombrar</span>`);
        renameCourseButton.style.alignItems = "center";
        renameCourseButton.style.backgroundColor = "rgba(34, 34, 34, 0)";
        renameCourseButton.style.border = "none";
        renameCourseButton.style.padding = "4px";
        renameCourseButton.style.color = "inherit";
        renameCourseButton.style.cursor = "pointer";
        
        renameCourseButton.onclick = handleRenameClick;

        courseDetails.appendChild(renameCourseButton);
    }
    
    // ── 6. Inicialización ────────────────────────────────────────────────────
    
    // Primero, aplicar los nombres guardados al cargar la página
    await replaceAllSavedCourseNames();
    
    // Luego, inyectar el botón para futuras modificaciones
    injectRenameButton();

})();