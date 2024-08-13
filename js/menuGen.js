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

    // Inicializar configuraciones
    function initSettings() {
        const defaultSettings = {
            features: {
                easyCopyGrades: true,
                easyCopyMembers: true,
                muchoTexto: true,
                otrasRealizaciones: true,
                popupGrading: true,
                resizePreviewPDF: true,
                weekCounter: true,
                pendingTasks: true,
                easyCopyCourseDetails: true,
                collapsableMenus: true,
                pendingNotifications: true,
            },
        };

        if (!getLocalStorageItem("settings")) {
            setLocalStorageItem("settings", defaultSettings);
        }
    }

    // Crear el menú de características
    /**
     * Creates a feature menu based on the settings stored in local storage.
     * @returns {HTMLElement} The created feature menu element.
     */
    function createFeatureMenu() {
        const settings = getLocalStorageItem("settings");
        const features = settings.features;

        const menuElement = document.createElement("div");
        menuElement.id = "feature-menu";

        const featuresList = [
            { id: "easyCopyGrades", name: "Copia Fácil de Notas" },
            { id: "easyCopyMembers", name: "Copia Fácil de Miembros" },
            { id: "muchoTexto", name: "Recortar Texto Largo" },
            { id: "otrasRealizaciones", name: "Otras Realizaciones del Curso" },
            { id: "popupGrading", name: "Ventana Emergente de Calificaciones" },
            { id: "resizePreviewPDF", name: "Redimensionar Vista Previa de PDF" },
            { id: "weekCounter", name: "Contador de Semanas" },
            { id: "pendingTasks", name: "Insignia Tareas Pendientes" },
            { id: "easyCopyCourseDetails", name: "Copia Fácil de Detalles del Curso" },
            { id: "collapsableMenus", name: "Menús Colapsables" },
            { id: "pendingNotifications", name: "Notificaciones Pendientes" },
        ];

        featuresList.forEach(feature => {
            const featureElement = document.createElement("div");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = features[feature.id];
            checkbox.id = feature.id;
            checkbox.addEventListener("change", (e) => {
                features[feature.id] = e.target.checked;
                setLocalStorageItem("settings", settings);
            });

            const label = document.createElement("label");
            label.textContent = feature.name;
            label.setAttribute("for", feature.id);

            featureElement.append(checkbox);
            featureElement.append(label);
            menuElement.append(featureElement);
        });

        return menuElement;
    }

    // Inicializar la página
    function initPage() {
        const errorDisplay = document.querySelector("#error");
        errorDisplay.innerHTML = "";

        const menuTitle = document.querySelector("#navbar > li");
        menuTitle.textContent = "U-Cursedn't";

        const bodyBlankPage = document.querySelector("#body")

        const menuElement = createFeatureMenu();

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Borrar Almacenamiento Local';
        clearButton.id = 'clearLocalStorageButton';

        clearButton.addEventListener('click', function() {
            const clearConfirmed = confirm('¿Estás seguro que quieres borrar el almacenamiento interno? Esta acción no puede revertirse.');
        
            if (clearConfirmed) {
              localStorage.clear();
              console.log('Local storage cleared!');
              initSettings();
              console.log('Settings initialized!');
            } else {
              console.log('Local storage clearing cancelled.');
            }
          });

        bodyBlankPage.append(menuElement);
        bodyBlankPage.append(clearButton)
    }

    // Ejecutar la inicialización al cargar la página
    initSettings();
    initPage();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`Key: ${key}, Value: ${value}`);
    }

})();