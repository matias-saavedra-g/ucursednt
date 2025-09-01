// extensionUtils.js - Shared utility functions for handling extension context

// Check if extension context is still valid
function isExtensionContextValid() {
    try {
        return chrome.runtime && chrome.runtime.id;
    } catch (error) {
        return false;
    }
}

// Safe Chrome storage functions that handle context invalidation
function safeChromeStorageSet(key, value) {
    return new Promise((resolve, reject) => {
        try {
            if (!isExtensionContextValid()) {
                console.log('Extension context invalidated, skipping storage set operation');
                resolve();
                return;
            }
            
            chrome.storage.sync.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        } catch (error) {
            console.log('Extension context error in safeChromeStorageSet:', error);
            resolve(); // Don't reject to avoid breaking the script
        }
    });
}

function safeChromeStorageGet(key) {
    return new Promise((resolve, reject) => {
        try {
            if (!isExtensionContextValid()) {
                console.log('Extension context invalidated, returning null from storage get');
                resolve(null);
                return;
            }
            
            chrome.storage.sync.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result[key] !== undefined ? result[key] : null);
                }
            });
        } catch (error) {
            console.log('Extension context error in safeChromeStorageGet:', error);
            resolve(null); // Return null instead of rejecting
        }
    });
}

// Safe runtime message sending
function safeSendRuntimeMessage(message) {
    return new Promise((resolve) => {
        try {
            if (!isExtensionContextValid()) {
                console.log('Extension context invalidated, skipping runtime message');
                resolve({ success: false, error: 'context_invalidated' });
                return;
            }
            
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Runtime message error:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError });
                } else {
                    resolve(response || { success: true });
                }
            });
        } catch (error) {
            console.log('Extension context error in safeSendRuntimeMessage:', error);
            resolve({ success: false, error: error });
        }
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isExtensionContextValid,
        safeChromeStorageSet,
        safeChromeStorageGet,
        safeSendRuntimeMessage
    };
}
