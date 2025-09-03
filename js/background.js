// background.js - Service Worker for handling Gemini AI API calls

console.log('U-Cursedn\'t background service worker loaded');

// Handle API requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateContent') {
        handleGeminiAPICall(request)
            .then(response => sendResponse({ success: true, content: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

async function handleGeminiAPICall(request) {
    const { apiKey, prompt, systemInstruction = '' } = request;
    
    if (!apiKey) {
        throw new Error('API key is required');
    }
    
    try {
        // Use the Gemini REST API directly
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        // Prepare the request body
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };
        
        // Add system instruction if provided
        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        // Extract the generated text
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const content = data.candidates[0].content.parts
                .map(part => part.text)
                .join('');
            return content;
        } else {
            throw new Error('Unexpected response format from Gemini API');
        }
        
    } catch (error) {
        console.error('Gemini API call failed:', error);
        throw error;
    }
}

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
    console.log('U-Cursedn\'t extension installed/updated:', details.reason);
});

chrome.runtime.onStartup.addListener(() => {
    console.log('U-Cursedn\'t extension started');
});
