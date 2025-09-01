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

    // Function to request background fetch of notifications (removed - no background worker)
    async function requestBackgroundFetch() {
        // Background worker removed - this function is now a no-op
        console.log('Background fetch disabled - no background worker');
    }

    // Function to count pending tasks (used when on the tasks page)
    function countPendingTasks() {
        const pendingTasks = document.querySelectorAll("tbody > tr > td.rel > h1");
        let count = 0;
        pendingTasks.forEach(task => {
            const text = task.innerText.trim();
            if (text === "En Plazo" || text === "On time") {
                count++;
            }
        });
        console.log('Content: Found', count, 'pending tasks on page');
        return count;
    }

    // Function to notify about pending tasks
    async function notifyPendingTasks(count) {
        const navigationItems = document.querySelectorAll("#navigation-wrapper > ul > li.servicio");
        navigationItems.forEach(async (item) => {
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
                let firstHover = await getChromeStorageItem("pendingTasksFirstHover") !== true;
                item.addEventListener('mouseover', async function() {
                    if (firstHover) {
                        alert('¡Ahora te notificamos de tus tareas pendientes! Sugerimos definir "Tareas" como la página de inicio de U-Cursos.');
                        await setChromeStorageItem("pendingTasksFirstHover", true); // Mark that the alert has been shown
                        firstHover = false; // Update the local variable to prevent further alerts
                    }
                });
            }
        });
    }

    // Function to refresh notifications display
    async function refreshNotifications() {
        const pendingTasksCount = await getChromeStorageItem("pendingTasksCount");
        if (pendingTasksCount !== null) {
            await notifyPendingTasks(pendingTasksCount);
        }
    }

    // Listen for updates from background worker (removed - no background worker)
    // chrome.runtime.onMessage.addListener removed

    const settings = await getChromeStorageItem("settings");
    if (settings && settings.features && settings.features.pendingTasks) {
        // URL pattern for tasks page (user ID format only)
        const tasksUrlPattern = /https:\/\/www\.u-cursos\.cl\/usuario\/[a-f0-9]+\/tareas_usuario/;
        
        // Check if we're on the tasks page
        const isOnTasksPage = tasksUrlPattern.test(window.location.href);
        
        // If we're on the tasks page, count and store locally (no background fetch)
        if (isOnTasksPage) {
            console.log('On tasks page, counting local tasks');
            const pendingCount = countPendingTasks();
            await setChromeStorageItem("pendingTasksCount", pendingCount);
            // Background worker removed - no background fetch
        }
        
        // Always display current stored count
        const pendingTasksCount = await getChromeStorageItem("pendingTasksCount");
        await notifyPendingTasks(pendingTasksCount || 0);
        
        // Background worker removed - no fresh data requests
    }
})();
