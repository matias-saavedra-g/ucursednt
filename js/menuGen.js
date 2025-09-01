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

    // Function to get all Chrome Storage items
    function getAllChromeStorageItems() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(null, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to remove an item from Chrome Storage
    function removeChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.remove([key], () => {
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

    // Function to clear all Chrome Storage
    function clearChromeStorage() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.clear(() => {
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

    // Inicializar configuraciones
    async function initSettings() {
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
                renameCourses: true,
                navigationAnimations: true,
            },
        };

        if (!await getChromeStorageItem("settings")) {
            await setChromeStorageItem("settings", defaultSettings);
        }
    }

    // Add modern CSS styles to the page
    function addModernStyles() {
        // Add FontAwesome if not already present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }

        const style = document.createElement('style');
        style.textContent = `
            /* Modern U-Cursos-like styling for the settings menu */
            #feature-menu {
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin: 20px 0;
                max-width: 800px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            }

            .feature-group {
                margin-bottom: 16px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #007bff;
                transition: all 0.2s ease-in-out;
                cursor: pointer;
            }

            .feature-group:hover {
                background: #e9ecef;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                transform: translateY(-1px);
            }

            .feature-group.enabled {
                border-left-color: #28a745;
                background: #d4edda;
            }

            .feature-group.enabled:hover {
                background: #c3e6cb;
            }

            .feature-checkbox {
                margin-right: 12px;
                width: 18px;
                height: 18px;
                accent-color: #007bff;
                cursor: pointer;
            }

            .feature-label {
                font-size: 14px;
                font-weight: 500;
                color: #495057;
                cursor: pointer;
                display: flex;
                align-items: center;
                user-select: none;
            }

            .feature-group.enabled .feature-label {
                color: #155724;
            }

            .feature-status {
                margin-left: auto;
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .feature-status.enabled {
                background: #28a745;
                color: white;
            }

            .feature-status.disabled {
                background: #6c757d;
                color: white;
            }

            .settings-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
            }

            .settings-title {
                font-size: 24px;
                font-weight: 600;
                color: #212529;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }

            .settings-subtitle {
                font-size: 14px;
                color: #6c757d;
                font-weight: 400;
            }

            .action-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }

            .modern-button {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease-in-out;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                min-width: 140px;
                justify-content: center;
            }

            .btn-primary {
                background: #007bff;
                color: white;
            }

            .btn-primary:hover {
                background: #0056b3;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background: #545b62;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
            }

            .btn-danger {
                background: #dc3545;
                color: white;
            }

            .btn-danger:hover {
                background: #c82333;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
            }

            .storage-list {
                background: #f8f9fa;
                border-radius: 6px;
                margin-top: 20px;
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #dee2e6;
            }

            .storage-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #dee2e6;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                background: white;
                transition: background-color 0.2s ease;
            }

            .storage-item:hover {
                background: #e9ecef;
            }

            .storage-item:last-child {
                border-bottom: none;
            }

            .storage-key {
                font-weight: 600;
                color: #495057;
                margin-right: 8px;
            }

            .storage-value {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 300px;
                color: #6c757d;
            }

            .delete-storage-btn {
                padding: 4px 8px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .delete-storage-btn:hover {
                background: #c82333;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                #feature-menu {
                    margin: 10px;
                    padding: 16px;
                }

                .action-buttons {
                    flex-direction: column;
                    align-items: center;
                }

                .modern-button {
                    width: 100%;
                    max-width: 300px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Crear el menú de características
    /**
     * Creates a feature menu based on the settings stored in Chrome storage.
     * @returns {Promise<HTMLElement>} The created feature menu element.
     */
    async function createFeatureMenu() {
        const settings = await getChromeStorageItem("settings");
        const features = settings.features;

        const menuElement = document.createElement("div");
        menuElement.id = "feature-menu";

        // Add header
        const header = document.createElement("div");
        header.className = "settings-header";
        
        const title = document.createElement("div");
        title.className = "settings-title";
        title.innerHTML = `<i class="fas fa-cogs"></i> Configuración de U-Cursedn't`;
        
        const subtitle = document.createElement("div");
        subtitle.className = "settings-subtitle";
        subtitle.textContent = "Personaliza las características de la extensión según tus necesidades";
        
        header.appendChild(title);
        header.appendChild(subtitle);
        menuElement.appendChild(header);

        const featuresList = [
            { id: "easyCopyGrades", name: "Copia Fácil de Notas", icon: "📋", description: "Botones para copiar notas en diferentes formatos" },
            { id: "easyCopyMembers", name: "Copia Fácil de Miembros", icon: "👥", description: "Copiar listado de miembros del curso" },
            { id: "muchoTexto", name: "Recortar Texto Largo", icon: "➕", description: "Colapsar textos largos en foros" },
            { id: "otrasRealizaciones", name: "Otras Realizaciones del Curso", icon: "🌐", description: "Acceso rápido a otras realizaciones" },
            { id: "popupGrading", name: "Ventana Emergente de Calificaciones", icon: "🎓", description: "Editor de calificaciones en popup" },
            { id: "resizePreviewPDF", name: "Redimensionar Vista Previa de PDF", icon: "📑", description: "Ajustar tamaño de vista previa PDF" },
            { id: "weekCounter", name: "Contador de Semanas", icon: "📆", description: "Mostrar semana actual del semestre" },
            { id: "pendingTasks", name: "Insignia Tareas Pendientes", icon: "🔔", description: "Contador de tareas pendientes" },
            { id: "easyCopyCourseDetails", name: "Copia Fácil de Detalles del Curso", icon: "🏷", description: "Copiar nombre y código del curso" },
            { id: "collapsableMenus", name: "Menús Colapsables", icon: "💥", description: "Colapsar secciones en página principal" },
            { id: "pendingNotifications", name: "Notificaciones Pendientes", icon: "🔔", description: "Contador de notificaciones pendientes" },
            { id: "renameCourses", name: "Renombrar Cursos", icon: "📚", description: "Personalizar nombres de cursos" },
            { id: "navigationAnimations", name: "Animaciones de Navegación", icon: "✨", description: "Efectos visuales suaves en el menú de navegación" },
        ];

        featuresList.forEach(feature => {
            const featureElement = document.createElement("div");
            featureElement.className = `feature-group ${features[feature.id] ? 'enabled' : ''}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = features[feature.id];
            checkbox.id = feature.id;
            checkbox.className = "feature-checkbox";
            checkbox.addEventListener("change", async (e) => {
                features[feature.id] = e.target.checked;
                await setChromeStorageItem("settings", settings);
                featureElement.className = `feature-group ${e.target.checked ? 'enabled' : ''}`;
                statusSpan.textContent = e.target.checked ? 'Activado' : 'Desactivado';
                statusSpan.className = `feature-status ${e.target.checked ? 'enabled' : 'disabled'}`;
            });

            const label = document.createElement("label");
            label.className = "feature-label";
            label.setAttribute("for", feature.id);
            label.innerHTML = `
                <span style="margin-right: 8px; font-size: 16px;">${feature.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 2px;">${feature.name}</div>
                    <div style="font-size: 12px; color: #6c757d; font-weight: 400;">${feature.description}</div>
                </div>
            `;

            const statusSpan = document.createElement("span");
            statusSpan.className = `feature-status ${features[feature.id] ? 'enabled' : 'disabled'}`;
            statusSpan.textContent = features[feature.id] ? 'Activado' : 'Desactivado';

            label.appendChild(statusSpan);

            featureElement.appendChild(checkbox);
            featureElement.appendChild(label);
            
            // Make the entire card clickable
            featureElement.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.click();
                }
            });

            menuElement.appendChild(featureElement);
        });

        return menuElement;
    }

    // Inicializar la página
    async function initPage() {
        addModernStyles(); // Add modern CSS styles
        
        const errorDisplay = document.querySelector("#error");
        errorDisplay.innerHTML = "";

        const menuTitle = document.querySelector("#navbar > li");
        menuTitle.textContent = "U-Cursedn't";

        const bodyBlankPage = document.querySelector("#body")

        const menuElement = await createFeatureMenu();

        // Create action buttons container
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-buttons';

        const clearButton = document.createElement('button');
        clearButton.innerHTML = '<i class="fas fa-trash-alt"></i> Borrar Almacenamiento Local';
        clearButton.className = 'modern-button btn-danger';
        clearButton.id = 'clearChromeStorageButton';

        clearButton.addEventListener('click', async function() {
            const clearConfirmed = confirm('¿Estás seguro que quieres borrar el almacenamiento interno? Esta acción no puede revertirse.');
        
            if (clearConfirmed) {
                await clearChromeStorage();
                console.log('Chrome storage cleared!');
                await initSettings();
                console.log('Settings initialized!');
                location.reload(); // Refresh to show updated settings
            } else {
                console.log('Chrome storage clearing cancelled.');
            }
        });

        // Crea un botón que hace alterna el mostrar el Chrome storage
        const showChromeStorageButton = document.createElement('button');
        const chromeStorageList = document.createElement('ul');
        showChromeStorageButton.innerHTML = '<i class="fas fa-database"></i> Mostrar Almacenamiento Local';
        showChromeStorageButton.className = 'modern-button btn-secondary';
        showChromeStorageButton.id = 'showChromeStorageButton';

        chromeStorageList.className = 'storage-list';

        // Función para actualizar la lista del almacenamiento Chrome
        async function updateChromeStorageList() {
            chromeStorageList.innerHTML = '';
            const storageItems = await getAllChromeStorageItems();
            
            Object.keys(storageItems).forEach(key => {
                const value = JSON.stringify(storageItems[key]);
                
                const storageItem = document.createElement('li');
                storageItem.className = 'storage-item';
                
                const keySpan = document.createElement('span');
                keySpan.className = 'storage-key';
                keySpan.textContent = key;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'storage-value';
                valueSpan.textContent = value;
                valueSpan.title = value; // Show full value on hover
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-storage-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.title = 'Eliminar este elemento';
                deleteBtn.addEventListener('click', async function(e) {
                    e.stopPropagation();
                    const deleteConfirmed = confirm(`¿Estás seguro que quieres borrar "${key}" del almacenamiento local?`);
                    if (deleteConfirmed) {
                        await removeChromeStorageItem(key);
                        await updateChromeStorageList();
                    }
                });
                
                storageItem.appendChild(keySpan);
                storageItem.appendChild(valueSpan);
                storageItem.appendChild(deleteBtn);
                chromeStorageList.appendChild(storageItem);
            });
        }

        // Agrega funcionalidad al botón
        showChromeStorageButton.addEventListener('click', async function() {
            if (!bodyBlankPage.contains(chromeStorageList)) {
                showChromeStorageButton.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Almacenamiento Local';
                await updateChromeStorageList();
                bodyBlankPage.appendChild(chromeStorageList);
            } else {
                showChromeStorageButton.innerHTML = '<i class="fas fa-database"></i> Mostrar Almacenamiento Local';
                chromeStorageList.remove();
            }
        });

        actionContainer.appendChild(showChromeStorageButton);
        actionContainer.appendChild(clearButton);

        bodyBlankPage.appendChild(menuElement);
        bodyBlankPage.appendChild(actionContainer);
    }

    // Ejecutar la inicialización al cargar la página
    await initSettings();
    await initPage();

    // Log all storage items for debugging
    const storageItems = await getAllChromeStorageItems();
    Object.keys(storageItems).forEach(key => {
        const value = JSON.stringify(storageItems[key]);
        console.log(`Key: ${key}, Value: ${value}`);
    });

})();