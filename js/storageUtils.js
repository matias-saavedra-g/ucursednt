// Chrome Storage API utilities
// This file provides Chrome Storage API functions as replacements for localStorage

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

// Function to get multiple items from Chrome Storage
function getChromeStorageItems(keys) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Function to remove an item from Chrome Storage
function removeChromeStorageItem(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.remove([key], () => {
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

// Function to clear all Chrome Storage
function clearChromeStorage() {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.clear(() => {
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

// Backward compatibility functions that maintain the same interface as localStorage
// These functions work synchronously by using cached data or async/await patterns

// Synchronous-style functions for easier migration (using async/await internally)
async function setLocalStorageItem(key, value) {
    try {
        await setChromeStorageItem(key, value);
    } catch (error) {
        console.error('Error setting storage item:', error);
    }
}

async function getLocalStorageItem(key) {
    try {
        return await getChromeStorageItem(key);
    } catch (error) {
        console.error('Error getting storage item:', error);
        return null;
    }
}
