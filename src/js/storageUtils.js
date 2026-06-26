// Chrome Storage API utilities
// This file provides Chrome Storage API functions as replacements for localStorage

// Function to set an item in Chrome Storage


// Function to get an item from Chrome Storage


// Function to get multiple items from Chrome Storage
function getStorageItems(keys) {
    return new Promise((resolve, reject) => {
        try {
            browser.storage.sync.get(keys, (result) => {
                if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError);
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


// Function to clear all Chrome Storage


// Backward compatibility functions that maintain the same interface as localStorage
// These functions work synchronously by using cached data or async/await patterns

// Synchronous-style functions for easier migration (using async/await internally)
async function setLocalStorageItem(key, value) {
    try {
        await UcursedntUtils.Storage.set(key, value);
    } catch (error) {
        console.error('Error setting storage item:', error);
    }
}

async function getLocalStorageItem(key) {
    try {
        return await UcursedntUtils.Storage.get(key);
    } catch (error) {
        console.error('Error getting storage item:', error);
        return null;
    }
}
