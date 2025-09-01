(async function() {
    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set({ [key]: value }, () => {
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
                chrome.storage.local.get([key], (result) => {
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

    // This script will iterate over menu elements (modulos) and retrieve the pending notifications and will display them in the menu header
    function countPendingNotifications() {
        // Counts the number of pending notifications by iterating over document.querySelectorAll("a.nuevo")
        // and summing the textContent (converted to number) of each element
        const count = Array.from(document.querySelectorAll("a.nuevo")).reduce((acc, el) => acc + Number(el.textContent), 0);
        console.log('Content: Found', count, 'pending notifications on page');
        return count;
    }

    async function notifyPending(count) {
        const modulos = document.querySelector("#modulos");
        modulos.querySelectorAll("div > h1").forEach(async (section) => {
            let notificationElement = section.querySelector("#pending-notifications");
            if (count > 0) {
                if (!notificationElement) {
                    notificationElement = document.createElement("div");
                    notificationElement.id = "pending-notifications";
                    notificationElement.style.cssText = `
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 20px;
                        height: 20px;
                        background-color: red;
                        border-radius: 50%;
                        color: white;
                        text-align: center;
                        text-justify: center;
                        font-size: 12px;
                        line-height: 20px;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    `;
                    if (count > 99) {notificationElement.style.cssText = `
                        position: absolute;
                        top: 20px;
                        right: 20px;
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
                    section.appendChild(notificationElement);
                }
                notificationElement.textContent = count;
            } else if (notificationElement) {
                notificationElement.remove();
            }
        });
        // Add mouseover event for alert
        let firstHover = await getChromeStorageItem("pendingNotificationsFirstHover") !== true;
        modulos.addEventListener('mouseover', async function() {
            if (firstHover) {
                alert("¡Ahora contamos notificaciones pendientes! Revisa los módulos para más información.");
                await setChromeStorageItem("pendingNotificationsFirstHover", true); // Mark that the alert has been shown
                firstHover = false; // Update the local variable to prevent further alerts
            }
        });
    }

    // Function to refresh notifications display
    async function refreshNotifications() {
        const pendingNotificationsCount = await getChromeStorageItem("pendingNotificationsCount");
        if (pendingNotificationsCount !== null) {
            await notifyPending(pendingNotificationsCount);
        }
    }

    // Listen for updates from background worker (removed - no background worker)
    // chrome.runtime.onMessage.addListener removed

    // Main function to count and notify about pending notifications
    const settings = await getChromeStorageItem("settings");
    if (settings && settings.features && settings.features.pendingNotifications) {
        const currentUrl = /https:\/\/www\.u-cursos\.cl\/+/;
        
        // If we're on the main u-cursos page, count and store locally (no background fetch)
        if (currentUrl.test(window.location.href)) {
            const pendingCount = countPendingNotifications();
            await setChromeStorageItem("pendingNotificationsCount", pendingCount);
            // Background worker removed - no background fetch
        }
        
        // Always display current stored count
        const pendingNotificationsCount = await getChromeStorageItem("pendingNotificationsCount");
        await notifyPending(pendingNotificationsCount || 0);
        
        // Background worker removed - no fresh data requests
    }
})();
