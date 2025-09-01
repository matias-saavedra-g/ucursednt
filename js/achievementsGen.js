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

    // Add modern CSS styles for achievements
    function addModernAchievementStyles() {
        // Add FontAwesome if not already present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }

        const style = document.createElement('style');
        style.textContent = `
            /* Modern achievements UI styling */
            #advancements-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            }

            .achievements-header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                color: white;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .achievements-title {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }

            .achievements-subtitle {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 400;
            }

            .progress-section {
                background: white;
                border-radius: 12px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            }

            .progress-bar-container {
                margin-bottom: 25px;
            }

            .progress-bar {
                width: 100%;
                height: 12px;
                background: #e9ecef;
                border-radius: 6px;
                overflow: hidden;
                position: relative;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #20c997);
                border-radius: 6px;
                transition: width 0.8s ease-in-out;
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .progress-text {
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                color: #495057;
                margin-bottom: 15px;
            }

            .progress-percentage {
                font-size: 24px;
                font-weight: 700;
                color: #28a745;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 25px;
            }

            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .stat-card.total {
                border-left-color: #007bff;
                background: linear-gradient(135deg, #e3f2fd, #f8f9fa);
            }

            .stat-card.unlocked {
                border-left-color: #28a745;
                background: linear-gradient(135deg, #e8f5e8, #f8f9fa);
            }

            .stat-card.locked {
                border-left-color: #dc3545;
                background: linear-gradient(135deg, #ffebee, #f8f9fa);
            }

            .stat-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .stat-number {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .stat-label {
                font-size: 14px;
                color: #6c757d;
                font-weight: 500;
            }

            .completion-message {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                border-radius: 8px;
                font-size: 18px;
                font-weight: 600;
                color: #495057;
                border-left: 4px solid #007bff;
            }

            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }

            .achievement-card {
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                border: 2px solid transparent;
                position: relative;
                overflow: hidden;
            }

            .achievement-card.unlocked {
                border-color: #28a745;
                background: linear-gradient(135deg, #ffffff, #f8fff8);
            }

            .achievement-card.locked {
                border-color: #e9ecef;
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                opacity: 0.7;
            }

            .achievement-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            }

            .achievement-card.unlocked::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                border-left: 40px solid transparent;
                border-top: 40px solid #28a745;
            }

            .achievement-card.unlocked::after {
                content: '✓';
                position: absolute;
                top: 5px;
                right: 5px;
                color: white;
                font-weight: bold;
                font-size: 16px;
            }

            .achievement-icon {
                font-size: 48px;
                margin-bottom: 16px;
                text-align: center;
                transition: transform 0.3s ease;
            }

            .achievement-card.unlocked .achievement-icon {
                color: #28a745;
            }

            .achievement-card.locked .achievement-icon {
                color: #adb5bd;
            }

            .achievement-card:hover .achievement-icon {
                transform: scale(1.1);
            }

            .achievement-name {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
                text-align: center;
                line-height: 1.4;
            }

            .achievement-card.unlocked .achievement-name {
                color: #155724;
            }

            .achievement-card.locked .achievement-name {
                color: #6c757d;
            }

            .achievement-description {
                font-size: 14px;
                text-align: center;
                line-height: 1.5;
                color: #6c757d;
            }

            .achievement-rarity {
                position: absolute;
                top: 12px;
                left: 12px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .rarity-common {
                background: #e9ecef;
                color: #495057;
            }

            .rarity-rare {
                background: #cce5ff;
                color: #0056b3;
            }

            .rarity-epic {
                background: #e1bee7;
                color: #6a1b9a;
            }

            .rarity-legendary {
                background: #ffecb3;
                color: #f57c00;
            }

            /* Category sections */
            .category-section {
                margin-bottom: 40px;
            }

            .category-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                padding: 16px 20px;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }

            .category-icon {
                font-size: 24px;
                color: #007bff;
            }

            .category-title {
                font-size: 20px;
                font-weight: 600;
                color: #495057;
                margin: 0;
            }

            .category-count {
                margin-left: auto;
                background: #007bff;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                #advancements-container {
                    padding: 10px;
                }

                .achievements-header {
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .achievements-title {
                    font-size: 24px;
                    flex-direction: column;
                    gap: 8px;
                }

                .progress-section {
                    padding: 20px;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .achievements-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .achievement-card {
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Función para crear el showroom de logros
    async function createAdvancementsShowroom() {
        const settings = await getChromeStorageItem('settings');
        const storageItems = await getAllChromeStorageItems();
        
        const achievements = [
            { id: "easyCopyGrades", name: "Copia Fácil de Notas", description: "Logro por activar la copia fácil de notas", icon: "fa-clipboard", unlocked: settings.features.easyCopyGrades, category: "features", rarity: "common" },
            { id: "easyCopyMembers", name: "Copia Fácil de Miembros", description: "Logro por activar la copia fácil de miembros", icon: "fa-users", unlocked: settings.features.easyCopyMembers, category: "features", rarity: "common" },
            { id: "muchoTexto", name: "Recortar Texto Largo", description: "Logro por activar la funcionalidad de recortar texto largo", icon: "fa-cut", unlocked: settings.features.muchoTexto, category: "features", rarity: "common" },
            { id: "otrasRealizaciones", name: "Otras Realizaciones del Curso", description: "Logro por activar otras realizaciones del curso", icon: "fa-tasks", unlocked: settings.features.otrasRealizaciones, category: "features", rarity: "common" },
            { id: "popupGrading", name: "Ventana Emergente de Calificaciones", description: "Logro por activar la ventana emergente de calificaciones", icon: "fa-window-restore", unlocked: settings.features.popupGrading, category: "features", rarity: "rare" },
            { id: "resizePreviewPDF", name: "Redimensionar Vista Previa de PDF", description: "Logro por activar la redimensión de vista previa de PDF", icon: "fa-expand", unlocked: settings.features.resizePreviewPDF, category: "features", rarity: "rare" },
            { id: "weekCounter", name: "Contador de Semanas", description: "Logro por activar el contador de semanas", icon: "fa-calendar-alt", unlocked: settings.features.weekCounter, category: "features", rarity: "common" },
            { id: "pendingTasks", name: "Notificación de Tareas Pendientes", description: "Logro por activar la notificación de tareas pendientes", icon: "fa-bell", unlocked: settings.features.pendingTasks, category: "features", rarity: "common" },
            { id: "easyCopyCourseDetails", name: "Copia Fácil de Datos del Curso", description: "Logro por activar la copia fácil de datos del curso", icon: "fa-info-circle", unlocked: settings.features.easyCopyCourseDetails, category: "features", rarity: "common" },
            { id: "collapsableMenus", name: "Secciones colapsables", description: "Logro por activar las secciones colapsables", icon: "fa-bars", unlocked: settings.features.collapsableMenus, category: "features", rarity: "common" },
            { id: "pendingNotifications", name: "Notificación de Pendientes", description: "Logro por activar la notificación de pendientes", icon: "fa-bell", unlocked: settings.features.pendingNotifications, category: "features", rarity: "common" },
            { id: "renameCourses", name: "Renombrar Cursos", description: "Logro por activar la funcionalidad de renombrar cursos", icon: "fa-edit", unlocked: settings.features.renameCourses, category: "features", rarity: "epic" },
            { id: "menuBotonFirstClick", name: "Primer Click en Menú", description: "Logro por hacer el primer click en el botón del menú", icon: "fa-mouse-pointer", unlocked: storageItems['menuBotonFirstClick'] === true, category: "interactions", rarity: "rare" },
            { id: "showMoreFirstClick", name: "Primer Click en Mostrar Más", description: "Logro por hacer el primer click en mostrar más", icon: "fa-plus-circle", unlocked: storageItems['showMoreFirstClick'] === true, category: "interactions", rarity: "rare" },
            { id: "resizableFirstHover", name: "Primer Hover en Redimensionable", description: "Logro por hacer el primer hover en un elemento redimensionable", icon: "fa-arrows-alt", unlocked: storageItems['resizableFirstHover'] === true, category: "interactions", rarity: "rare" },
            { id: "otherRealizationsFirstClick", name: "Primer Click en Otras Realizaciones", description: "Logro por hacer el primer click en otras realizaciones", icon: "fa-external-link-alt", unlocked: storageItems['otherRealizationsFirstClick'] === true, category: "interactions", rarity: "epic" },
            { id: "pendingTasksFirstHover", name: "Primer Hover en Tareas Pendientes", description: "Logro por hacer el primer hover en tareas pendientes", icon: "fa-tasks", unlocked: storageItems['pendingTasksFirstHover'] === true, category: "interactions", rarity: "rare" },
            { id: "achievementsBotonFirstClick", name: "Primer Click en Botón de Logros", description: "Logro por hacer el primer click en el botón de logros", icon: "fa-trophy", unlocked: storageItems['achievementsBotonFirstClick'] === true, category: "interactions", rarity: "legendary" },
            { id: "scheduleDateFirstHover", name: "Primer Hover en Fecha de Programación", description: "Logro por hacer el primer hover en la fecha de programación", icon: "fa-calendar", unlocked: storageItems['scheduleDateFirstHover'] === true, category: "interactions", rarity: "epic" },
            { id: "collapsableMenusFirstClick", name: "Primer Click en Menús Colapsables", description: "Logro por hacer el primer click en menús colapsables", icon: "fa-hand-pointer", unlocked: storageItems['collapsableMenusFirstClick'] === true, category: "interactions", rarity: "rare" }
        ];
    
        const totalAchievements = achievements.length;
        const unlockedAchievements = achievements.filter(achievement => achievement.unlocked).length;
        const lockedAchievements = totalAchievements - unlockedAchievements;
        const completionPercentage = Math.floor((unlockedAchievements / totalAchievements) * 100);

        let completionMessage = '';
        if (completionPercentage === 100) {
            completionMessage = '🎓👑 ¡Eres el dios de U-Cursos! Ya te puedes titular de la carrera.';
        } else if (completionPercentage >= 90) {
            completionMessage = '🚀 ¡Increíble! Has completado más del 90% de los logros.';
        } else if (completionPercentage >= 80) {
            completionMessage = '🎉 ¡Genial! Has completado más del 80% de los logros.';
        } else if (completionPercentage >= 70) {
            completionMessage = '💪 ¡Muy bien! Has completado más del 70% de los logros.';
        } else if (completionPercentage >= 60) {
            completionMessage = '👍 ¡Buen trabajo! Has completado más del 60% de los logros.';
        } else if (completionPercentage >= 50) {
            completionMessage = '👏 ¡Bien hecho! Has completado más del 50% de los logros.';
        } else if (completionPercentage >= 40) {
            completionMessage = '🏃‍♂️ ¡Sigue así! Has completado más del 40% de los logros.';
        } else if (completionPercentage >= 30) {
            completionMessage = '🛤️ ¡No te detengas! Has completado más del 30% de los logros.';
        } else if (completionPercentage >= 20) {
            completionMessage = '🚶‍♂️ ¡Estás en buen camino! Has completado más del 20% de los logros.';
        } else if (completionPercentage >= 10) {
            completionMessage = '🌱 ¡Buen comienzo! Has completado más del 10% de los logros.';
        } else {
            completionMessage = '🏁 ¡Empieza a desbloquear logros!';
        }

        const advancementsContainer = document.createElement('div');
        advancementsContainer.id = 'advancements-container';

        // Header section
        const header = document.createElement('div');
        header.className = 'achievements-header';
        header.innerHTML = `
            <div class="achievements-title">
                <i class="fas fa-trophy"></i>
                <span>Colección de Logros</span>
            </div>
            <div class="achievements-subtitle">
                Desbloquea logros explorando y usando las características de U-Cursedn't
            </div>
        `;

        // Progress section
        const progressSection = document.createElement('div');
        progressSection.className = 'progress-section';

        // Progress bar
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';
        progressBarContainer.innerHTML = `
            <div class="progress-text">
                Progreso de Logros
                <span class="progress-percentage">${completionPercentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionPercentage}%"></div>
            </div>
        `;

        // Statistics grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        statsGrid.innerHTML = `
            <div class="stat-card total">
                <div class="stat-icon" style="color: #007bff;"><i class="fas fa-trophy"></i></div>
                <div class="stat-number" style="color: #007bff;">${totalAchievements}</div>
                <div class="stat-label">Total de Logros</div>
            </div>
            <div class="stat-card unlocked">
                <div class="stat-icon" style="color: #28a745;"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number" style="color: #28a745;">${unlockedAchievements}</div>
                <div class="stat-label">Logros Desbloqueados</div>
            </div>
            <div class="stat-card locked">
                <div class="stat-icon" style="color: #dc3545;"><i class="fas fa-lock"></i></div>
                <div class="stat-number" style="color: #dc3545;">${lockedAchievements}</div>
                <div class="stat-label">Logros Bloqueados</div>
            </div>
        `;

        // Completion message
        const messageElement = document.createElement('div');
        messageElement.className = 'completion-message';
        messageElement.textContent = completionMessage;

        progressSection.appendChild(progressBarContainer);
        progressSection.appendChild(statsGrid);
        progressSection.appendChild(messageElement);

        // Group achievements by category
        const categories = {
            features: { title: 'Características de la Extensión', icon: 'fas fa-cogs' },
            interactions: { title: 'Interacciones y Descubrimientos', icon: 'fas fa-hand-pointer' }
        };

        advancementsContainer.appendChild(header);
        advancementsContainer.appendChild(progressSection);

        Object.entries(categories).forEach(([categoryKey, categoryData]) => {
            const categoryAchievements = achievements.filter(a => a.category === categoryKey);
            const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;

            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `
                <div class="category-icon"><i class="${categoryData.icon}"></i></div>
                <h3 class="category-title">${categoryData.title}</h3>
                <div class="category-count">${categoryUnlocked}/${categoryAchievements.length}</div>
            `;

            const achievementsGrid = document.createElement('div');
            achievementsGrid.className = 'achievements-grid';

            categoryAchievements.forEach((achievement) => {
                const achievementCard = document.createElement('div');
                achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                
                achievementCard.innerHTML = `
                    <div class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity}</div>
                    <div class="achievement-icon">
                        <i class="fas ${achievement.icon}"></i>
                    </div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                `;

                achievementsGrid.appendChild(achievementCard);
            });

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(achievementsGrid);
            advancementsContainer.appendChild(categorySection);
        });

        return advancementsContainer;
    }

    // Inicializar la página
    async function initPage() {
        addModernAchievementStyles(); // Add modern CSS styles
        
        const errorDisplay = document.querySelector("#error");
        errorDisplay.innerHTML = "";

        const menuTitle = document.querySelector("#navbar > li");
        menuTitle.textContent = "Logros";

        const bodyBlankPage = document.querySelector("#body")
        const menuElement = await createAdvancementsShowroom();
        bodyBlankPage.appendChild(menuElement);
    }

    // Ejecutar la inicialización al cargar la página
    await initPage();

    // Log all storage items for debugging
    const storageItems = await getAllChromeStorageItems();
    Object.keys(storageItems).forEach(key => {
        const value = JSON.stringify(storageItems[key]);
        console.log(`Key: ${key}, Value: ${value}`);
    });

})();