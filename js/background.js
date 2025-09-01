// background.js - Service Worker for fetching notifications

// Storage utility functions
async function setChromeStorageItem(key, value) {
    try {
        await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
        console.error('Background: Error setting Chrome storage item:', error);
    }
}

async function getChromeStorageItem(key) {
    try {
        const result = await chrome.storage.sync.get([key]);
        return result[key] || null;
    } catch (error) {
        console.error('Background: Error getting Chrome storage item:', error);
        return null;
    }
}

// Function to fetch and parse pending tasks
async function fetchPendingTasks() {
    try {
        console.log('Background: Fetching pending tasks...');
        
        // Get stored user ID
        const userId = await getChromeStorageItem('userId');
        
        if (!userId) {
            console.log('Background: No user ID available, cannot fetch tasks');
            await setChromeStorageItem("pendingTasksCount", 0);
            return 0;
        }
        
        // Build the correct tasks URL using stored user ID
        const taskUrl = `https://www.u-cursos.cl/usuario/${userId}/tareas_usuario/`;
        console.log(`Background: Using user ID ${userId} for tasks URL: ${taskUrl}`);
        
        let count = 0;
        
        try {
            console.log(`Background: Fetching from ${taskUrl}`);
            const response = await fetch(taskUrl, {
                credentials: 'include' // Include cookies for authentication
            });
            
            if (response.ok) {
                const html = await response.text();
                
                // Parse HTML using regex since DOMParser is not available in service workers
                // Look for <h1> tags inside <td class="rel"> that contain "En Plazo" or "On time"
                const taskStatusPattern = /<td[^>]*class="[^"]*rel[^"]*"[^>]*>[\s\S]*?<h1[^>]*>(.*?)<\/h1>/gi;
                const matches = html.matchAll(taskStatusPattern);
                
                count = 0;
                for (const match of matches) {
                    const statusText = match[1].trim();
                    if (statusText === "En Plazo" || statusText === "On time") {
                        count++;
                    }
                }
                
                console.log(`Background: Found ${count} pending tasks from ${taskUrl}`);
            } else {
                console.log(`Background: Failed to fetch from ${taskUrl}, status: ${response.status}`);
            }
        } catch (urlError) {
            console.log(`Background: Error fetching from ${taskUrl}:`, urlError);
        }
        
        // Store the count
        await setChromeStorageItem("pendingTasksCount", count);
        
        return count;
    } catch (error) {
        console.error('Background: Error fetching pending tasks:', error);
        return 0;
    }
}

// Function to fetch and parse pending notifications
async function fetchPendingNotifications() {
    try {
        console.log('Background: Fetching pending notifications...');
        
        // Fetch the main u-cursos page
        const response = await fetch('https://www.u-cursos.cl/', {
            credentials: 'include' // Include cookies for authentication
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Parse HTML using regex since DOMParser is not available in service workers
        // Look for <a> tags with class "nuevo" and extract their text content
        const notificationPattern = /<a[^>]*class="[^"]*nuevo[^"]*"[^>]*>(.*?)<\/a>/gi;
        const matches = html.matchAll(notificationPattern);
        
        let count = 0;
        for (const match of matches) {
            const notificationText = match[1].replace(/<[^>]*>/g, '').trim(); // Remove any nested HTML tags
            const notificationCount = Number(notificationText) || 0;
            count += notificationCount;
        }
        
        console.log(`Background: Found ${count} pending notifications`);
        
        // Store the count
        await setChromeStorageItem("pendingNotificationsCount", count);
        
        return count;
    } catch (error) {
        console.error('Background: Error fetching pending notifications:', error);
        return 0;
    }
}

// Function to update all notification counts
async function updateNotificationCounts() {
    try {
        const settings = await getChromeStorageItem("settings");
        
        if (!settings?.features) {
            console.log('Background: Settings not found or features disabled');
            return;
        }
        
        const promises = [];
        
        // Fetch pending tasks if enabled
        if (settings.features.pendingTasks) {
            promises.push(fetchPendingTasks());
        }
        
        // Fetch pending notifications if enabled
        if (settings.features.pendingNotifications) {
            promises.push(fetchPendingNotifications());
        }
        
        // Wait for all fetches to complete
        await Promise.all(promises);
        
        console.log('Background: Notification counts updated');
        
        // Notify all open tabs to refresh their notifications
        const tabs = await chrome.tabs.query({ url: "*://*.u-cursos.cl/*" });
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { 
                    action: 'refreshNotifications' 
                });
            } catch (error) {
                // Ignore errors for tabs that don't have content scripts
                console.log(`Background: Could not send message to tab ${tab.id}`);
            }
        }
        
    } catch (error) {
        console.error('Background: Error updating notification counts:', error);
    }
}

// Set up periodic fetching
async function setupPeriodicFetch() {
    // Clear any existing alarms
    await chrome.alarms.clear('fetchNotifications');
    
    // Create alarm to fetch every 5 minutes
    await chrome.alarms.create('fetchNotifications', {
        delayInMinutes: 1, // First fetch after 1 minute
        periodInMinutes: 5 // Then every 5 minutes
    });
    
    console.log('Background: Periodic fetch alarm set up');
}

// Event listeners
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Background: Extension installed/updated');
    await setupPeriodicFetch();
    // Do initial fetch
    await updateNotificationCounts();
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('Background: Browser started');
    await setupPeriodicFetch();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'fetchNotifications') {
        console.log('Background: Alarm triggered - fetching notifications');
        await updateNotificationCounts();
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'fetchNotifications') {
        console.log('Background: Manual fetch requested');
        await updateNotificationCounts();
        sendResponse({ success: true });
    } else if (message.action === 'enablePeriodicFetch') {
        console.log('Background: Enabling periodic fetch');
        await setupPeriodicFetch();
        sendResponse({ success: true });
    } else if (message.action === 'disablePeriodicFetch') {
        console.log('Background: Disabling periodic fetch');
        await chrome.alarms.clear('fetchNotifications');
        sendResponse({ success: true });
    } else if (message.action === 'userIdUpdated') {
        console.log(`Background: User ID updated to ${message.userId}`);
        // Trigger immediate fetch with new user ID
        await updateNotificationCounts();
        sendResponse({ success: true });
    } else if (message.action === 'campusUpdated') {
        console.log(`Background: Campus updated to ${message.campus}`);
        // Trigger immediate fetch with new campus
        await updateNotificationCounts();
        sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async response
});

console.log('Background: Service worker loaded');
