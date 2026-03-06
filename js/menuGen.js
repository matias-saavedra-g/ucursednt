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
                forumInteraction: true,
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
                taskSubmissionSound: true,
                footerCredit: true,
                aiChatPopup: true,
            },
        };

        if (!await getChromeStorageItem("settings")) {
            await setChromeStorageItem("settings", defaultSettings);
        }
    }

    // Add modern CSS styles to the page
    function addModernStyles() {

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

            /* AI Configuration Section Styles */
            .ai-config-section {
                margin-top: 30px;
                padding: 20px;
                background: #f0f7ff;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }

            .ai-config-header {
                margin-bottom: 20px;
                text-align: center;
            }

            .ai-config-header h3 {
                color: #007bff;
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .ai-config-header p {
                color: #6c757d;
                margin: 0;
                font-size: 14px;
            }

            .config-group {
                margin-bottom: 16px;
            }

            .config-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #495057;
                font-size: 14px;
            }

            .config-select,
            .config-input,
            .config-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                transition: border-color 0.2s ease;
                font-family: inherit;
                height: 45px;
            }

            .config-select:focus,
            .config-input:focus,
            .config-textarea:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
            }

            .config-textarea {
                resize: vertical;
                min-height: 120px;
            }

            .system-buttons-container {
                margin-top: 8px;
                display: flex;
                justify-content: flex-end;
            }

            .reset-default-btn {
                font-size: 12px;
                padding: 6px 12px;
                margin-bottom: 8px;
            }

            .config-helper {
                margin-top: 4px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
                border-left: 3px solid #17a2b8;
            }

            .config-helper small {
                color: #6c757d;
                font-size: 11px;
                line-height: 1.4;
            }

            .api-warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 12px;
                margin-top: 15px;
                font-size: 13px;
                line-height: 1.4;
                color: #856404;
            }

            .api-warning strong {
                color: #d32f2f;
            }

            .gemini-info ul {
                margin: 8px 0;
                padding-left: 20px;
            }

            .gemini-info li {
                margin-bottom: 6px;
                line-height: 1.4;
            }

            .api-key-container {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .api-key-input {
                flex: 1;
            }

            .toggle-key-btn {
                padding: 10px 12px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                background: #f8f9fa;
                color: #6c757d;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toggle-key-btn:hover {
                background: #e9ecef;
                color: #495057;
            }

            .save-ai-config-btn {
                width: 100%;
                margin-top: 16px;
            }

            .btn-success {
                background: #28a745;
                color: white;
            }

            .btn-success:hover {
                background: #218838;
            }

            /* Sound Configuration Section Styles */
            .sound-config-section {
                margin-top: 30px;
                padding: 20px;
                background: #f0fff4;
                border-radius: 8px;
                border-left: 4px solid #28a745;
            }

            .sound-config-header {
                margin-bottom: 20px;
                text-align: center;
            }

            .sound-config-header h3 {
                color: #28a745;
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .sound-config-header p {
                color: #6c757d;
                margin: 0;
                font-size: 14px;
            }

            .save-sound-config-btn {
                width: 100%;
                margin-top: 16px;
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
        title.innerHTML = `<i class="fa-regular fa-cogs"></i> Configuración de U-Cursedn't`;
        
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
            { id: "forumInteraction", name: "Interacción con Foros", icon: "💬", description: "Copiar y enviar posts/hilos del foro al chat IA" },
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
            { id: "taskSubmissionSound", name: "Sonido de Entrega de Tareas", icon: "🔊", description: "Sonido de dopamina al entregar tareas" },
            { id: "footerCredit", name: "Crédito en el Pie de Página", icon: "❤️", description: "Mostrar crédito del desarrollador en el pie de página" },
            { id: "aiChatPopup", name: "Chat IA Flotante", icon: "🤖", description: "Popup flotante con UCursitos para chat con IA" },
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

        // Add AI Chat Configuration Section
        const aiConfigSection = await createAIConfigSection();
        menuElement.appendChild(aiConfigSection);

        // Add Sound Configuration Section
        const soundConfigSection = await createSoundConfigSection();
        menuElement.appendChild(soundConfigSection);

        return menuElement;
    }

    // Create AI Chat Configuration Section
    async function createAIConfigSection() {
        const aiConfigContainer = document.createElement('div');
        aiConfigContainer.className = 'ai-config-section';
        
        // Section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'ai-config-header';
        sectionHeader.innerHTML = `
            <h3><i class="fa-regular fa-robot"></i> Configuración de Chat IA - Gemini</h3>
            <p>Configura tu API key de Google AI Studio para usar el chat flotante con Gemini</p>
            <div class="gemini-info">
                <p><strong>📝 Cómo obtener tu API key:</strong></p>
                <ul>
                    <li>Ve a <a href="https://aistudio.google.com" target="_blank" style="color: #4285f4; text-decoration: underline;">AI Studio</a></li>
                    <li>Inicia sesión con tu cuenta de Google</li>
                    <li>Ve a "Get API key" en el menú lateral</li>
                    <li>Crea una nueva API key</li>
                    <li>Copia la key y pégala abajo</li>
                </ul>
                <div class="api-warning">
                    <strong>⚠️ Advertencia:</strong> Exponer una clave de API en una aplicación del lado del cliente no es una práctica recomendada para su uso en producción, ya que puede ser sustraída por actores maliciosos. Este método solo es adecuado para pruebas iniciales y la creación de prototipos.
                </div>
            </div>
        `;

        // API Key input
        const apiKeyGroup = document.createElement('div');
        apiKeyGroup.className = 'config-group';
        
        const apiKeyLabel = document.createElement('label');
        apiKeyLabel.className = 'config-label';
        apiKeyLabel.innerHTML = '<i class="fa-regular fa-key"></i> API Key de Gemini:';

        const apiKeyContainer = document.createElement('div');
        apiKeyContainer.className = 'api-key-container';

        const apiKeyInput = document.createElement('input');
        apiKeyInput.type = 'password';
        apiKeyInput.className = 'config-input api-key-input';
        apiKeyInput.id = 'ai-api-key';
        apiKeyInput.placeholder = 'Ingresa tu API key de Google AI Studio...';

        const toggleKeyBtn = document.createElement('button');
        toggleKeyBtn.className = 'toggle-key-btn';
        toggleKeyBtn.type = 'button';
        toggleKeyBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        toggleKeyBtn.title = 'Mostrar/Ocultar API Key';

        // System Instructions
        const systemGroup = document.createElement('div');
        systemGroup.className = 'config-group';
        systemGroup.id = 'system-group';
        
        const systemLabel = document.createElement('label');
        systemLabel.className = 'config-label';
        systemLabel.innerHTML = '<i class="fa-regular fa-robot"></i> Instrucciones del Sistema:';

        const systemTextarea = document.createElement('textarea');
        systemTextarea.className = 'config-textarea';
        systemTextarea.id = 'ai-system-instructions';
        systemTextarea.placeholder = 'Instrucciones para el comportamiento del asistente IA...';
        systemTextarea.rows = 8;

        const systemButtonsContainer = document.createElement('div');
        systemButtonsContainer.className = 'system-buttons-container';

        const resetToDefaultBtn = document.createElement('button');
        resetToDefaultBtn.className = 'modern-button btn-secondary reset-default-btn';
        resetToDefaultBtn.type = 'button';
        resetToDefaultBtn.innerHTML = '<i class="fa-regular fa-undo"></i> Restaurar Recomendadas';
        resetToDefaultBtn.title = 'Restaurar las instrucciones recomendadas para U-Cursos';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'modern-button btn-primary save-ai-config-btn';
        saveBtn.innerHTML = '<i class="fa-regular fa-save"></i> Guardar Configuración';

        // Load existing settings
        const aiSettings = await getChromeStorageItem('aiChatSettings') || {};
        const defaultSystemInstructions = window.aiChatPopup?.getDefaultSystemInstructions?.() || `System Prompt: Asistente Virtual de U-Cursos

1. PERSONA
Eres "Asistente U-Cursos", un asistente virtual experto integrado en la plataforma U-Cursos de la Universidad de Chile. Tu propósito principal es ayudar a estudiantes y académicos a navegar y utilizar la plataforma de manera eficiente, resolviendo sus dudas y facilitando su experiencia académica. Eres un guía amigable, conocedor y siempre dispuesto a ayudar. Tu identidad está ligada exclusivamente a la Universidad de Chile y sus procesos internos gestionados a través de U-Cursos.

2. TAREA
Tu tarea es responder preguntas y proporcionar orientación sobre las funcionalidades y el contenido de la plataforma U-Cursos. Debes ser capaz de:
- Responder preguntas directas: Contestar dudas específicas sobre cómo usar la plataforma (ej: "¿Cómo puedo enviar una tarea?", "¿Dónde veo mis calificaciones?").
- Proporcionar guías paso a paso: Ofrecer instrucciones claras y secuenciales para realizar acciones dentro de la plataforma.
- Resumir información: Sintetizar el contenido de anuncios, foros o materiales si se te proporciona el contexto.
- Localizar información: Ayudar a los usuarios a encontrar dónde se ubican ciertas secciones o materiales dentro de sus cursos.
- Resolver problemas comunes: Ofrecer soluciones a problemas frecuentes que los usuarios puedan encontrar.

Límites y restricciones:
- No inventes información: Si no tienes la respuesta o la información no está disponible en el contexto proporcionado, indícalo claramente. Sugiere al usuario consultar directamente con su docente o con el soporte técnico de U-Cursos.
- Privacidad: No tienes acceso a información personal, privada o sensible de los usuarios, como calificaciones específicas, mensajes privados o datos de contacto. No debes solicitarla ni procesarla.
- Mantente en el tema: Limita tus respuestas al ecosistema de U-Cursos y la vida académica en la Universidad de Chile. Evita responder preguntas de conocimiento general que no estén relacionadas.

3. CONTEXTO
Tu conocimiento se basa en la estructura y funcionalidades de la plataforma U-Cursos. La información clave que debes manejar es:
- Plataforma: U-Cursos, un campus virtual y sistema de gestión de aprendizaje desarrollado por el Centro Tecnológico Ucampus para la Universidad de Chile.
- Audiencia: Estudiantes y académicos de la Universidad de Chile.
- Funcionalidades Clave:
  * Sitios de Cursos: Cada curso tiene un sitio web dedicado y administrado por el profesor.
  * Materiales Educativos: Los estudiantes pueden ver y descargar apuntes, bibliografía y otros materiales. Los profesores pueden subir contenido en múltiples formatos.
  * Herramientas de Comunicación: Foros para interactuar y sistema de correo para que los profesores envíen anuncios a todo el curso.
  * Gestión de Tareas y Calificaciones: Los estudiantes pueden enviar tareas y consultar sus notas parciales. Los profesores pueden administrar y calificar estas entregas.
  * Calendario y Planificación: Agenda electrónica para planificar y visualizar las actividades del curso.
  * Aplicación Móvil: Existe una app oficial para Android y iOS que envía notificaciones push en tiempo real.
  * Perfil Personal: Cada usuario puede gestionar su perfil, revisar sus tareas, cursos, calendario y configurar notificaciones.

4. FORMATO
- Claridad y Concisión: Responde de manera directa y fácil de entender.
- Estructura: Utiliza listas (con viñetas o numeradas) para desglosar pasos o enumerar características.
- Énfasis: Usa negrita para resaltar acciones clave, nombres de secciones o botones (ej: "Ve a la sección **Tareas** y haz clic en **Enviar**").
- Lenguaje: Responde siempre en español de Chile, utilizando terminología común en el ámbito académico chileno (ej: "ramo" en lugar de "asignatura", "nota" en lugar de "calificación").

5. TONO
- Servicial y Profesional: Mantén un tono amable, respetuoso y formal, adecuado para un entorno universitario.
- Seguro y Confiable: Proporciona información con seguridad, pero sé humilde cuando no conoces una respuesta.
- Proactivo y Orientador: No te limites a responder; si es pertinente, ofrece consejos adicionales o sugiere funcionalidades relacionadas que podrían ser útiles para el usuario.`;
        
        apiKeyInput.value = aiSettings.apiKey || '';
        systemTextarea.value = aiSettings.systemInstructions || defaultSystemInstructions;

        // Event listeners
        toggleKeyBtn.addEventListener('click', () => {
            const isPassword = apiKeyInput.type === 'password';
            apiKeyInput.type = isPassword ? 'text' : 'password';
            toggleKeyBtn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });

        resetToDefaultBtn.addEventListener('click', () => {
            const confirmReset = confirm('¿Estás seguro de que quieres restaurar las instrucciones recomendadas para U-Cursos? Esto sobrescribirá tus instrucciones personalizadas actuales.');
            if (confirmReset) {
                if (window.aiChatPopup?.resetToDefaultInstructions) {
                    const defaultInstructions = window.aiChatPopup.resetToDefaultInstructions();
                    systemTextarea.value = defaultInstructions;
                } else {
                    systemTextarea.value = defaultSystemInstructions;
                }
                
                // Show success message temporarily
                resetToDefaultBtn.innerHTML = '<i class="fa-regular fa-check"></i> ¡Restaurado!';
                resetToDefaultBtn.classList.remove('btn-secondary');
                resetToDefaultBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    resetToDefaultBtn.innerHTML = '<i class="fa-regular fa-undo"></i> Restaurar Recomendadas';
                    resetToDefaultBtn.classList.remove('btn-success');
                    resetToDefaultBtn.classList.add('btn-secondary');
                }, 2000);
            }
        });

        saveBtn.addEventListener('click', async () => {
            const settings = {
                apiKey: apiKeyInput.value,
                systemInstructions: systemTextarea.value.trim() || defaultSystemInstructions,
                isMinimized: true
            };

            await setChromeStorageItem('aiChatSettings', settings);
            
            // Update the chat popup if it exists
            if (window.aiChatPopup) {
                window.aiChatPopup.setApiKey(settings.apiKey);
                window.aiChatPopup.setSystemInstructions(settings.systemInstructions);
            }

            // Show success message
            saveBtn.innerHTML = '<i class="fa-regular fa-check"></i> ¡Guardado!';
            saveBtn.classList.remove('btn-primary');
            saveBtn.classList.add('btn-success');
            
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fa-regular fa-save"></i> Guardar Configuración';
                saveBtn.classList.remove('btn-success');
                saveBtn.classList.add('btn-primary');
            }, 2000);
        });

        // Assemble the components
        apiKeyContainer.appendChild(apiKeyInput);
        apiKeyContainer.appendChild(toggleKeyBtn);

        apiKeyGroup.appendChild(apiKeyLabel);
        apiKeyGroup.appendChild(apiKeyContainer);

        systemGroup.appendChild(systemLabel);
        systemGroup.appendChild(systemTextarea);
        systemGroup.appendChild(systemButtonsContainer);

        systemButtonsContainer.appendChild(resetToDefaultBtn);

        aiConfigContainer.appendChild(sectionHeader);
        aiConfigContainer.appendChild(apiKeyGroup);
        aiConfigContainer.appendChild(systemGroup);
        aiConfigContainer.appendChild(saveBtn);

        return aiConfigContainer;
    }

    // Extract YouTube video ID from a URL or plain ID
    function extractYouTubeVideoId(input) {
        const urlMatch = input.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (urlMatch) return urlMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
        return null;
    }

    // Create Sound Configuration Section
    async function createSoundConfigSection() {
        const container = document.createElement('div');
        container.className = 'sound-config-section';

        const defaultVideoId = '_Z3ra0CxCE0';
        const soundSettings = await getChromeStorageItem('taskSubmissionSoundSettings') || {};
        const currentVideoId = soundSettings.videoId || defaultVideoId;

        const header = document.createElement('div');
        header.className = 'sound-config-header';
        header.innerHTML = `
            <h3><i class="fa-regular fa-music"></i> Configuración de Sonido de Entrega</h3>
            <p>Personaliza el sonido que se reproduce al entregar una tarea. Ingresa una URL o ID de YouTube.</p>
        `;

        const urlGroup = document.createElement('div');
        urlGroup.className = 'config-group';

        const urlLabel = document.createElement('label');
        urlLabel.className = 'config-label';
        urlLabel.innerHTML = '<i class="fa-brands fa-youtube"></i> URL o ID del video de YouTube:';

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.className = 'config-input';
        urlInput.id = 'sound-youtube-url';
        urlInput.placeholder = `https://www.youtube.com/watch?v=${defaultVideoId}`;
        urlInput.value = currentVideoId !== defaultVideoId
            ? `https://www.youtube.com/watch?v=${currentVideoId}`
            : '';

        const helper = document.createElement('div');
        helper.className = 'config-helper';
        helper.innerHTML = `<small>
            <strong>Por defecto:</strong> <a href="https://www.youtube.com/watch?v=${defaultVideoId}" target="_blank" style="color: #17a2b8;">https://www.youtube.com/watch?v=${defaultVideoId}</a><br>
            Acepta URLs completas de YouTube o solo el ID del video (11 caracteres). Dejar vacío para usar el sonido por defecto.
        </small>`;

        const saveBtn = document.createElement('button');
        saveBtn.className = 'modern-button btn-success save-sound-config-btn';
        saveBtn.innerHTML = '<i class="fa-regular fa-save"></i> Guardar Sonido';

        saveBtn.addEventListener('click', async () => {
            const input = urlInput.value.trim();
            let videoId = defaultVideoId;
            if (input) {
                const extracted = extractYouTubeVideoId(input);
                if (extracted) {
                    videoId = extracted;
                } else {
                    alert('URL o ID de YouTube inválido. Por favor, verifica el enlace.');
                    return;
                }
            }
            await setChromeStorageItem('taskSubmissionSoundSettings', { videoId });
            saveBtn.innerHTML = '<i class="fa-regular fa-check"></i> ¡Guardado!';
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-primary');
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fa-regular fa-save"></i> Guardar Sonido';
                saveBtn.classList.remove('btn-primary');
                saveBtn.classList.add('btn-success');
            }, 2000);
        });

        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);
        urlGroup.appendChild(helper);
        container.appendChild(header);
        container.appendChild(urlGroup);
        container.appendChild(saveBtn);

        return container;
    }

    // Inicializar la página
    async function initPage() {
        addModernStyles(); // Add modern CSS styles
        
        const errorDisplay = document.querySelector("#error");
        errorDisplay.style.display = "none";

        const menuTitle = document.querySelector("#navbar > li");
        menuTitle.textContent = "U-Cursedn't";

        const bodyBlankPage = document.querySelector("#body")

        const menuElement = await createFeatureMenu();

        // Create action buttons container
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-buttons';

        const clearButton = document.createElement('button');
        clearButton.innerHTML = '<i class="fa-regular fa-trash-alt"></i> Borrar Almacenamiento Local';
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
        showChromeStorageButton.innerHTML = '<i class="fa-regular fa-database"></i> Mostrar Almacenamiento Local';
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
                deleteBtn.innerHTML = '<i class="fa-regular fa-trash"></i>';
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
                showChromeStorageButton.innerHTML = '<i class="fa-regular fa-eye-slash"></i> Ocultar Almacenamiento Local';
                await updateChromeStorageList();
                bodyBlankPage.appendChild(chromeStorageList);
            } else {
                showChromeStorageButton.innerHTML = '<i class="fa-regular fa-database"></i> Mostrar Almacenamiento Local';
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