// Auto-injected extension alert wrapper (Tour Guide feature)
if (typeof window.showExtensionAlert === 'undefined') {
    window.showExtensionAlert = function(message) {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.get(['settings']).then(res => {
                // Suppress the alert if tourGuide is explicitly disabled
                if (res && res.settings && res.settings.features && res.settings.features.tourGuide === false) {
                    return; 
                }
                alert(message);
            }).catch(() => alert(message));
        } else {
            alert(message);
        }
    };
}

(async function() {
    // Function to set an item in Chrome Storage
    function setStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                browser.storage.sync.set({ [key]: value }, () => {
                    if (browser.runtime.lastError) {
                        reject(browser.runtime.lastError);
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
    function getStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                browser.storage.sync.get([key], (result) => {
                    if (browser.runtime.lastError) {
                        reject(browser.runtime.lastError);
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
        const navigationItem = document.querySelector("#navigation-wrapper > ul > li.servicio_tareas_usuario");
        if (!navigationItem) return;

        // Ensure parent has position: relative for absolute positioning context
        if (!navigationItem.style.position || navigationItem.style.position === 'static') {
            navigationItem.style.position = 'relative';
        }

        let notificationElement = navigationItem.querySelector("#pending-tasks-notification");
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
                navigationItem.appendChild(notificationElement);
            }
            notificationElement.textContent = count;
        } else if (notificationElement) {
            notificationElement.remove();
        }

        // Add mouseover event for alert
        let firstHover = await getStorageItem("pendingTasksFirstHover") !== true;
        navigationItem.addEventListener('mouseover', async function() {
            if (firstHover) {
                window.showExtensionAlert('¡Ahora te notificamos de tus tareas pendientes! Sugerimos definir "Tareas" como la página de inicio de U-Cursos.');
                await setStorageItem("pendingTasksFirstHover", true); // Mark that the alert has been shown
                firstHover = false; // Update the local variable to prevent further alerts
            }
        });
    }

    // Function to refresh notifications display
    async function refreshNotifications() {
        const pendingTasksCount = await getStorageItem("pendingTasksCount");
        if (pendingTasksCount !== null) {
            await notifyPendingTasks(pendingTasksCount);
        }
    }

    // Listen for updates from background worker (removed - no background worker)
    // browser.runtime.onMessage.addListener removed

    const settings = await getStorageItem("settings");
    if (settings && settings.features && settings.features.pendingTasks) {
        // URL pattern for tasks page (user ID format only)
        const tasksUrlPattern = /https:\/\/www\.u-cursos\.cl\/usuario\/[a-f0-9]+\/tareas_usuario/;
        
        // Check if we're on the tasks page
        const isOnTasksPage = tasksUrlPattern.test(window.location.href);
        
        // If we're on the tasks page, count and store locally (no background fetch)
        if (isOnTasksPage) {
            console.log('On tasks page, counting local tasks');
            const pendingCount = countPendingTasks();
            await setStorageItem("pendingTasksCount", pendingCount);
            // Background worker removed - no background fetch
        }
        
        // Always display current stored count
        const pendingTasksCount = await getStorageItem("pendingTasksCount");
        await notifyPendingTasks(pendingTasksCount || 0);
        
        // Background worker removed - no fresh data requests
    }
})();
