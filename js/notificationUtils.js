// notificationUtils.js - Shared utilities for notification management

// Storage utility functions
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

// Function to listen for notification updates from background (removed - no background worker)
function setupNotificationListener(callback) {
    // Background worker removed - no listener needed
    console.log('Notification listener disabled - no background worker');
}

// Export functions for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setChromeStorageItem,
        getChromeStorageItem,
        requestBackgroundFetch,
        setupNotificationListener
    };
}
