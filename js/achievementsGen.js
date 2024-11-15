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

    // Función para crear el showroom de logros
    function createAdvancementsShowroom() {
        const settings = JSON.parse(localStorage.getItem('settings'));
        const achievements = [
            { id: "easyCopyGrades", name: "Copia Fácil de Notas", description: "Logro por activar la copia fácil de notas", icon: "fa-clipboard", unlocked: settings.features.easyCopyGrades },
            { id: "easyCopyMembers", name: "Copia Fácil de Miembros", description: "Logro por activar la copia fácil de miembros", icon: "fa-users", unlocked: settings.features.easyCopyMembers },
            { id: "muchoTexto", name: "Recortar Texto Largo", description: "Logro por activar la funcionalidad de recortar texto largo", icon: "fa-cut", unlocked: settings.features.muchoTexto },
            { id: "otrasRealizaciones", name: "Otras Realizaciones del Curso", description: "Logro por activar otras realizaciones del curso", icon: "fa-tasks", unlocked: settings.features.otrasRealizaciones },
            { id: "popupGrading", name: "Ventana Emergente de Calificaciones", description: "Logro por activar la ventana emergente de calificaciones", icon: "fa-window-restore", unlocked: settings.features.popupGrading },
            { id: "resizePreviewPDF", name: "Redimensionar Vista Previa de PDF", description: "Logro por activar la redimensión de vista previa de PDF", icon: "fa-expand", unlocked: settings.features.resizePreviewPDF },
            { id: "weekCounter", name: "Contador de Semanas", description: "Logro por activar el contador de semanas", icon: "fa-calendar-alt", unlocked: settings.features.weekCounter },
            { id: "pendingTasks", name: "Notificación de Tareas Pendientes", description: "Logro por activar la notificación de tareas pendientes", icon: "fa-tasks", unlocked: settings.features.pendingTasks },
            { id: "easyCopyCourseDetails", name: "Copia Fácil de Datos del Curso", description: "Logro por activar la copia fácil de datos del curso", icon: "fa-info-circle", unlocked: settings.features.easyCopyCourseDetails },
            { id: "collapsableMenus", name: "Secciones colapsables", description: "Logro por activar las secciones colapsables", icon: "fa-bars", unlocked: settings.features.collapsableMenus },
            { id: "pendingNotifications", name: "Notificación de Pendientes", description: "Logro por activar la notificación de pendientes", icon: "fa-bell", unlocked: settings.features.pendingNotifications },
            { id: "renameCourses", name: "Renombrar Cursos", description: "Logro por activar la funcionalidad de renombrar cursos", icon: "fa-edit", unlocked: settings.features.renameCourses },
            { id: "menuBotonFirstClick", name: "Primer Click en Menú", description: "Logro por hacer el primer click en el botón del menú", icon: "fa-mouse-pointer", unlocked: localStorage.getItem('menuBotonFirstClick') === 'true' },
            { id: "showMoreFirstClick", name: "Primer Click en Mostrar Más", description: "Logro por hacer el primer click en mostrar más", icon: "fa-plus-circle", unlocked: localStorage.getItem('showMoreFirstClick') === 'true' },
            { id: "resizableFirstHover", name: "Primer Hover en Redimensionable", description: "Logro por hacer el primer hover en un elemento redimensionable", icon: "fa-arrows-alt", unlocked: localStorage.getItem('resizableFirstHover') === 'true' },
            { id: "otherRealizationsFirstClick", name: "Primer Click en Otras Realizaciones", description: "Logro por hacer el primer click en otras realizaciones", icon: "fa-tasks", unlocked: localStorage.getItem('otherRealizationsFirstClick') === 'true' },
            { id: "pendingTasksFirstHover", name: "Primer Hover en Tareas Pendientes", description: "Logro por hacer el primer hover en tareas pendientes", icon: "fa-tasks", unlocked: localStorage.getItem('pendingTasksFirstHover') === 'true' },
            { id: "achievementsBotonFirstClick", name: "Primer Click en Botón de Logros", description: "Logro por hacer el primer click en el botón de logros", icon: "fa-trophy", unlocked: localStorage.getItem('achievementsBotonFirstClick') === 'true' },
            { id: "scheduleDateFirstHover", name: "Primer Hover en Fecha de Programación", description: "Logro por hacer el primer hover en la fecha de programación", icon: "fa-calendar", unlocked: localStorage.getItem('scheduleDateFirstHover') === 'true' },
            { id: "collapsableMenusFirstHover", name: "Primer Hover en Menús Colapsables", description: "Logro por hacer el primer hover en menús colapsables", icon: "fa-bars", unlocked: localStorage.getItem('collapsableMenusFirstHover') === 'true' },
            { id: "collapsableMenusFirstClick", name: "Primer Click en Menús Colapsables", description: "Logro por hacer el primer click en menús colapsables", icon: "fa-bars", unlocked: localStorage.getItem('collapsableMenusFirstClick') === 'true' }
        ];
    
        const totalAchievements = achievements.length;
        const unlockedAchievements = achievements.filter(achievement => achievement.unlocked).length;
        const lockedAchievements = totalAchievements - unlockedAchievements;
        const completionPercentage = Math.floor((unlockedAchievements / totalAchievements) * 100);

        let completionMessage = '';
        if (completionPercentage === 100) {
            completionMessage = '¡Eres el dios de U-Cursos! Ya te puedes titular de la carrera. 🎓👑';
        } else if (completionPercentage >= 90) {
            completionMessage = '¡Increíble! Has completado más del 90% de los logros. 🚀';
        } else if (completionPercentage >= 80) {
            completionMessage = '¡Genial! Has completado más del 80% de los logros. 🎉';
        } else if (completionPercentage >= 70) {
            completionMessage = '¡Muy bien! Has completado más del 70% de los logros. 💪';
        } else if (completionPercentage >= 60) {
            completionMessage = '¡Buen trabajo! Has completado más del 60% de los logros. 👍';
        } else if (completionPercentage >= 50) {
            completionMessage = '¡Bien hecho! Has completado más del 50% de los logros. 👏';
        } else if (completionPercentage >= 40) {
            completionMessage = '¡Sigue así! Has completado más del 40% de los logros. 🏃‍♂️';
        } else if (completionPercentage >= 30) {
            completionMessage = '¡No te detengas! Has completado más del 30% de los logros. 🛤️';
        } else if (completionPercentage >= 20) {
            completionMessage = '¡Estás en buen camino! Has completado más del 20% de los logros. 🚶‍♂️';
        } else if (completionPercentage >= 10) {
            completionMessage = '¡Buen comienzo! Has completado más del 10% de los logros. 🌱';
        } else {
            completionMessage = '¡Empieza a desbloquear logros! 🏁';
        }

        const advancementsContainer = document.createElement('div');
        advancementsContainer.id = 'advancements-container';
    
        const counterElement = document.createElement('div');
        counterElement.id = 'achievements-counter';
        counterElement.style.display = 'flex';
        counterElement.style.justifyContent = 'space-around';
        counterElement.style.marginBottom = '20px';
        
        const totalAchievementsElement = document.createElement('div');
        totalAchievementsElement.innerHTML = `
            <p style="color: #007bff; font-size: 1.2em;">
                <i class="fas fa-trophy"></i> Total de logros: ${totalAchievements}
            </p>
        `;
        
        const unlockedAchievementsElement = document.createElement('div');
        unlockedAchievementsElement.innerHTML = `
            <p style="color: #28a745; font-size: 1.2em;">
                <i class="fas fa-check-circle"></i> Logros desbloqueados: ${unlockedAchievements}
            </p>
        `;
        
        const lockedAchievementsElement = document.createElement('div');
        lockedAchievementsElement.innerHTML = `
            <p style="color: #dc3545; font-size: 1.2em;">
                <i class="fas fa-times-circle"></i> Logros faltantes: ${lockedAchievements}
            </p>
        `;
        
        counterElement.appendChild(totalAchievementsElement);
        counterElement.appendChild(unlockedAchievementsElement);
        counterElement.appendChild(lockedAchievementsElement);
        
        advancementsContainer.appendChild(counterElement);

        const messageElement = document.createElement('div');
        messageElement.id = 'completion-message';
        messageElement.style.textAlign = 'center';
        messageElement.style.marginBottom = '20px';
        messageElement.style.fontSize = '1.2em';
        messageElement.style.color = '#007bff';
        messageElement.textContent = completionMessage;
        advancementsContainer.appendChild(messageElement);

        achievements.forEach((achievement) => {
            const advancementElement = document.createElement('div');
            advancementElement.className = 'advancement';
            advancementElement.style.border = '1px solid #007bff';
    
            const iconElement = document.createElement('i');
            iconElement.className = `fas ${achievement.icon}`;
            iconElement.style.color = achievement.unlocked ? '#007bff' : '#555';
            iconElement.style.fontSize = '3em';
            iconElement.style.padding = '10px';
    
            const nameElement = document.createElement('h3');
            nameElement.textContent = achievement.name;
            nameElement.style.color = achievement.unlocked ? '#007bff' : '#555';
            nameElement.style.padding = '10px';
    
            const descriptionElement = document.createElement('h4');
            descriptionElement.textContent = achievement.description;
            descriptionElement.style.color = achievement.unlocked ? '#007bff' : '#555';
            descriptionElement.style.padding = '10px';
    
            advancementElement.appendChild(nameElement);
            advancementElement.appendChild(iconElement);
            advancementElement.appendChild(descriptionElement);
    
            advancementsContainer.appendChild(advancementElement);
        });
    
        return advancementsContainer;
    }

    // Inicializar la página
    function initPage() {
        const errorDisplay = document.querySelector("#error");
        errorDisplay.innerHTML = "";

        const menuTitle = document.querySelector("#navbar > li");
        menuTitle.textContent = "Logros";

        const bodyBlankPage = document.querySelector("#body")

        // Crea un espacio para espaciar los elementos dentro de la página
        const spacer = document.createElement('div');
        spacer.style.height = '20px';

        const menuElement = createAdvancementsShowroom();


        bodyBlankPage.append(menuElement);
        bodyBlankPage.append(spacer);

        // Create a new spacer element
        const newSpacer = spacer.cloneNode(true);
        bodyBlankPage.append(newSpacer);
    }

    // Ejecutar la inicialización al cargar la página
    initPage();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`Key: ${key}, Value: ${value}`);
    }

})();