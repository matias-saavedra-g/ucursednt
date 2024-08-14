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

    /// This script will iterate over menu elements (modulos) and retrieve the pending notifications and will display them in the menu header
    function countPendingNotifications() {
        // Counts the number of pending notifications by iterating over document.querySelectorAll("a.nuevo")
        // and summing the textContent (converted to number) of each element
        const count = Array.from(document.querySelectorAll("a.nuevo")).reduce((acc, el) => acc + Number(el.textContent), 0);
        return count;
    }

    function notifyPending(count) {
        const modulos = document.querySelector("#modulos");
        modulos.querySelectorAll("div > h1").forEach(section => {
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
                    section.appendChild(notificationElement);
                }
                notificationElement.textContent = count;
            } else if (notificationElement) {
                notificationElement.remove();
            }
        });
        // Add mouseover event for alert
        let firstHover = getLocalStorageItem("pendingNotificationsFirstHover") !== true;
        modulos.querySelector("h1").addEventListener('mouseover', function() {
            if (firstHover) {
                alert("Puedes expandir o colapsar las secciones haciendo click en el botón que aparece al lado de cada título.");
                setLocalStorageItem("pendingNotificationsFirstHover", true); // Mark that the alert has been shown
                firstHover = false; // Update the local variable to prevent further alerts
            }
        });
    }

    // Main function to count and notify about pending notifications
    const settings = getLocalStorageItem("settings");
    if (settings && settings.features && settings.features.pendingNotifications) {
        const currentUrl = /https:\/\/www\.u-cursos\.cl\/+/;
        if (currentUrl.test(window.location.href)) {
            const pendingCount = countPendingNotifications();
            setLocalStorageItem("pendingNotificationsCount", pendingCount);
        }
        notifyPending(getLocalStorageItem("pendingNotificationsCount")); // Notify about pending tasks;
    }
})();
