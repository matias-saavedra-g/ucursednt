// backgroundSettings.js - Manage background notification fetching

(async function() {
    // Storage utility functions
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

    // Function to enable or disable background fetching based on settings
    async function updateBackgroundFetchingState() {
        try {
            const settings = await getChromeStorageItem("settings");
            
            if (settings && settings.features && 
                (settings.features.pendingTasks || settings.features.pendingNotifications)) {
                // Enable background fetching
                await chrome.runtime.sendMessage({ action: 'enablePeriodicFetch' });
                console.log('Background fetching enabled');
            } else {
                // Disable background fetching
                await chrome.runtime.sendMessage({ action: 'disablePeriodicFetch' });
                console.log('Background fetching disabled');
            }
        } catch (error) {
            console.log('Could not update background fetching state:', error);
        }
    }

    // Listen for storage changes to update background fetching state
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.settings) {
            updateBackgroundFetchingState();
        }
    });

    // Initialize background fetching state
    await updateBackgroundFetchingState();
})();
