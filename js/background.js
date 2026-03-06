// background.js - Service Worker for handling Gemini AI API calls

console.log('U-Cursedn\'t background service worker loaded');

// Handle API requests from content scripts and the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateContent') {
        handleGeminiAPICall(request)
            .then(response => sendResponse({ success: true, content: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }

    if (request.action === 'openSidePanel') {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
                chrome.sidePanel.open({ tabId: tabs[0].id });
            }
        });
        sendResponse({ success: true });
        return false;
    }
});

async function handleGeminiAPICall(request) {
    const { apiKey, messages, prompt, systemInstruction = '' } = request;
    
    if (!apiKey) {
        throw new Error('API key is required');
    }
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        // Support multi-turn conversation (messages array) or single prompt.
        // Gemini roles are "user" and "model" (not "assistant").
        let contents;
        if (Array.isArray(messages) && messages.length > 0) {
            contents = messages.map(m => ({
                role : m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));
        } else {
            contents = [{ parts: [{ text: prompt ?? '' }] }];
        }
        
        const requestBody = { contents };
        
        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }
        
        const response = await fetch(url, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.candidates?.[0]?.content) {
            return data.candidates[0].content.parts
                .map(part => part.text)
                .join('');
        }
        throw new Error('Unexpected response format from Gemini API');
        
    } catch (error) {
        console.error('Gemini API call failed:', error);
        throw error;
    }
}

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
    console.log('U-Cursedn\'t extension installed/updated:', details.reason);
    // Configure the toolbar icon to open the side panel on click.
    // This runs once and persists — no need for chrome.action.onClicked.
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
        .catch(err => console.warn('setPanelBehavior not available:', err));
});

chrome.runtime.onStartup.addListener(() => {
    console.log('U-Cursedn\'t extension started');
});
