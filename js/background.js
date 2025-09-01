// background.js - Service Worker for handling AI API calls

console.log('U-Cursedn\'t background service worker loaded');

// Handle API requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makeAIAPICall') {
        handleAIAPICall(request.data)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

async function handleAIAPICall(apiData) {
    const { baseUrl, apiKey, messages, modelName, maxTokens = 1000, temperature = 0.7 } = apiData;
    
    try {
        // Determine API format based on URL
        const isOpenAICompatible = baseUrl.includes('openai.com') || baseUrl.includes('/v1/chat/completions');
        const isGemini = baseUrl.includes('generativelanguage.googleapis.com');
        const isAnthropic = baseUrl.includes('anthropic.com');
        
        let requestBody, headers;
        
        if (isGemini) {
            // Google Gemini API format
            headers = {
                'Content-Type': 'application/json'
            };
            
            // Convert OpenAI format to Gemini format
            const parts = messages
                .filter(msg => msg.role !== 'system')
                .map(msg => ({ text: msg.content }));
            
            const systemInstruction = messages.find(msg => msg.role === 'system')?.content || '';
            
            requestBody = JSON.stringify({
                contents: [{
                    parts: parts
                }],
                systemInstruction: systemInstruction ? {
                    parts: [{ text: systemInstruction }]
                } : undefined,
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens
                }
            });
            
        } else if (isAnthropic) {
            // Anthropic Claude API format
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            };
            
            const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
            const userMessages = messages.filter(msg => msg.role !== 'system');
            
            requestBody = JSON.stringify({
                model: modelName,
                messages: userMessages,
                system: systemMessage,
                max_tokens: maxTokens,
                temperature: temperature
            });
            
        } else {
            // OpenAI compatible format (default)
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            
            requestBody = JSON.stringify({
                model: modelName,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature
            });
        }
        
        console.log('Making API call to:', baseUrl);
        
        // Construct final URL (add API key for Gemini)
        let finalUrl = baseUrl;
        if (isGemini) {
            const urlObj = new URL(baseUrl);
            urlObj.searchParams.set('key', apiKey);
            finalUrl = urlObj.toString();
        }
        
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response received:', data);
        
        // Normalize response format
        let normalizedResponse;
        
        if (isGemini) {
            // Google Gemini response format
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const content = data.candidates[0].content.parts
                    .map(part => part.text)
                    .join('');
                normalizedResponse = {
                    choices: [{ message: { content: content } }]
                };
            } else {
                throw new Error('Unexpected response format from Gemini API');
            }
        } else if (isAnthropic) {
            // Anthropic Claude response format
            if (data.content && data.content[0] && data.content[0].text) {
                normalizedResponse = {
                    choices: [{ message: { content: data.content[0].text } }]
                };
            } else {
                throw new Error('Unexpected response format from Anthropic API');
            }
        } else {
            // OpenAI format (already normalized)
            normalizedResponse = data;
        }
        
        return normalizedResponse;
        
    } catch (error) {
        console.error('API call failed:', error);
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
