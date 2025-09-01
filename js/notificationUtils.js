// notificationUtils.js - Shared utilities for notification management

// Storage utility functions
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

// Function to request background fetch of notifications
async function requestBackgroundFetch() {
    try {
        await chrome.runtime.sendMessage({ action: 'fetchNotifications' });
    } catch (error) {
        console.log('Could not request background fetch:', error);
    }
}

// Function to listen for notification updates from background
function setupNotificationListener(callback) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'refreshNotifications') {
            callback();
            sendResponse({ received: true });
        }
    });
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
