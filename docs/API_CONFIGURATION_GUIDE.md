# 🔧 AI API Configuration Guide

## 🚨 CORS Issue Solution

The CORS errors you're experiencing are now **SOLVED** by implementing a background service worker that handles all API calls. This bypasses browser CORS restrictions entirely.

### What Changed:
- ✅ **Background Script**: Added `js/background.js` service worker
- ✅ **Host Permissions**: Added permissions for AI API domains
- ✅ **API Routing**: All API calls now go through the background script
- ✅ **Multi-API Support**: Supports OpenAI, Gemini, and Anthropic formats

## 📖 Supported AI APIs

### 1. OpenAI (ChatGPT)
```javascript
Base URL: https://api.openai.com/v1/chat/completions
Model: gpt-3.5-turbo, gpt-4, gpt-4-turbo
API Key: sk-...
```

### 2. Google Gemini 
```javascript
Base URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
Model: gemini-pro
API Key: AIza...  (from Google AI Studio)
```

### 3. Anthropic Claude
```javascript
Base URL: https://api.anthropic.com/v1/messages
Model: claude-3-sonnet-20240229, claude-3-opus-20240229
API Key: sk-ant-...
```

### 4. Local/Self-hosted APIs
```javascript
Base URL: http://localhost:1234/v1/chat/completions
Model: llama2-7b, mistral-7b, etc.
API Key: (often not needed for local)
```

## 🔑 Getting API Keys

### Google Gemini (Free Tier Available)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIza...`)

### OpenAI 
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key (starts with `sk-...`)

### Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

## ⚙️ Configuration Examples

### Example 1: Google Gemini (Recommended for Free Use)
```
Proveedor: API Personalizada
Base URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
Modelo: gemini-pro
API Key: AIzaSyC...your-gemini-key
```

### Example 2: OpenAI GPT
```
Proveedor: API Personalizada
Base URL: https://api.openai.com/v1/chat/completions
Modelo: gpt-3.5-turbo
API Key: sk-...your-openai-key
```

### Example 3: Local LLM Server
```
Proveedor: API Personalizada
Base URL: http://localhost:1234/v1/chat/completions
Modelo: llama2-7b
API Key: (leave empty or use 'local')
```

## 🛠️ Technical Implementation

### Background Script Features
- **CORS Bypass**: Service worker isn't subject to CORS restrictions
- **API Format Conversion**: Automatically converts between API formats
- **Error Handling**: Comprehensive error reporting
- **Response Normalization**: Standardizes responses from different APIs

### Message Flow
```
Content Script → Background Script → AI API → Background Script → Content Script
```

### Supported Request Formats
The background script automatically detects and converts between:
- **OpenAI Format**: Standard chat completions
- **Gemini Format**: Google's content generation format
- **Anthropic Format**: Claude's message format

## 🔍 Troubleshooting

### Common Issues

#### 1. "Extension context invalidated"
- **Solution**: Reload the extension in `chrome://extensions/`

#### 2. "API key not configured"
- **Solution**: Check that your API key is correctly entered and saved

#### 3. "CORS policy error"
- **Solution**: This should be fixed with the background script. If you still see it, make sure you've reloaded the extension

#### 4. "HTTP 401: Unauthorized"
- **Solution**: Verify your API key is correct and has sufficient credits/permissions

#### 5. "HTTP 429: Too Many Requests"
- **Solution**: You've hit the API rate limit. Wait a few minutes and try again

### Debug Steps
1. Open browser console (F12)
2. Check for error messages
3. Verify extension is loaded properly
4. Test with a simple message first

## 🎯 Benefits of This Solution

### For Developers
- **No CORS Issues**: Background script handles all external requests
- **Multi-API Support**: Works with multiple AI providers
- **Easy Integration**: Simple message passing interface
- **Error Handling**: Robust error detection and reporting

### For Users
- **Reliable Operation**: No more CORS blocking
- **Multiple AI Options**: Choose from various AI providers
- **Seamless Experience**: All APIs work the same way in the UI
- **Offline Capable**: Works with local AI servers

## 🚀 Next Steps

1. **Reload Extension**: Go to `chrome://extensions/` and reload U-Cursedn't
2. **Configure API**: Choose your preferred AI provider and add your API key
3. **Test Chat**: Try sending a message to verify it works
4. **Enjoy**: Use the AI assistant for your U-Cursos activities!

The CORS issue is now completely resolved! 🎉
