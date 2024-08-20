(function() {
    // Function to set an item in LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Function to get an item from LocalStorage
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    // Function to count pending tasks
    function countPendingTasks() {
        const pendingTasks = document.querySelectorAll("tbody > tr > td.rel > h1");
        let count = 0;
        pendingTasks.forEach(task => {
            const text = task.innerText.trim();
            if (text === "En Plazo" || text === "On time") {
                count++;
            }
        });
        console.log(count);
        return count;
    }

    // Function to notify about pending tasks
    function notifyPendingTasks(count) {
        const navigationItems = document.querySelectorAll("#navigation-wrapper > ul > li.servicio");
        navigationItems.forEach(item => {
            const navText = item.innerText.trim();
            if (navText === "Homeworks" || navText === "Tareas") {
                let notificationElement = item.querySelector("#pending-tasks-notification");
                if (count > 0) {
                    if (!notificationElement) {
                        notificationElement = document.createElement("div");
                        notificationElement.id = "pending-tasks-notification";
                        notificationElement.style.cssText = `
                            position: absolute;
                            top: 0;
                            right: 0;
                            width: 20px;
                            height: 20px;
                            background-color: red;
                            border-radius: 50%;
                            color: white;
                            text-align: center;
                            font-size: 12px;
                            line-height: 20px;
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                        `;
                        if (count > 99) {notificationElement.style.cssText = `
                            position: absolute;
                            top: 0;
                            right: 0;
                            width: 20px;
                            height: 20px;
                            background-color: red;
                            border-radius: 50%;
                            color: white;
                            text-align: center;
                            font-size: 8px;
                            line-height: 20px;
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            `};
                        item.appendChild(notificationElement);
                    }
                    notificationElement.textContent = count;
                } else if (notificationElement) {
                    notificationElement.remove();
                }

                // Add mouseover event for alert
                let firstHover = getLocalStorageItem("pendingTasksFirstHover") !== true;
                item.addEventListener('mouseover', function() {
                    if (firstHover) {
                        alert('¡Ahora te notificamos de tus tareas pendientes! Sugerimos definir "Tareas" como la página de inicio de U-Cursos.');
                        setLocalStorageItem("pendingTasksFirstHover", true); // Mark that the alert has been shown
                        firstHover = false; // Update the local variable to prevent further alerts
                    }
                });
            }
        });
    }

    const settings = getLocalStorageItem("settings");
    if (settings && settings.features && settings.features.pendingTasks) {
        const currentUrl = /https:\/\/www\.u-cursos\.cl\/\w+\/\w+\/tareas_usuario\/+/;
        if (currentUrl.test(window.location.href)) {
            const pendingCount = countPendingTasks();
            setLocalStorageItem("pendingTasksCount", pendingCount);
        }
        notifyPendingTasks(getLocalStorageItem("pendingTasksCount")); // Notify about pending tasks;
    }
})();
