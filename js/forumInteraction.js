// forumInteraction.js - Forum interaction features for U-Cursos
// Adds copy and AI chat integration functionality to forum threads and posts

(async function() {
    'use strict';

    // Check if already loaded to prevent duplicate initialization
    if (window.forumInteractionLoaded) {
        return;
    }
    window.forumInteractionLoaded = true;

    // Import utility functions
    const { safeChromeStorageGet, safeChromeStorageSet, isExtensionContextValid } = window.extensionUtils || {
        safeChromeStorageGet: (key) => new Promise(resolve => {
            chrome.storage.sync.get([key], result => resolve(result[key] || null));
        }),
        safeChromeStorageSet: (key, value) => new Promise(resolve => {
            chrome.storage.sync.set({ [key]: value }, resolve);
        }),
        isExtensionContextValid: () => true
    };

    // CSS Selectors for forum elements
    const SELECTORS = {
        thread: 'div[id^="raiz_"]',
        post: '.msg',
        rootPost: '.msg.raiz',
        replyPost: '.msg.hijo',
        author: '.autor .usuario',
        time: '.autor .tiempo_rel',
        content: '.texto .ta',
        postOptions: 'ul.opciones'  // Native options list for each post
    };

    // Check if we're on a forum page
    function isForumPage() {
        return window.location.pathname.includes('/foro/');
    }

    // Check extension settings
    async function checkSettings() {
        try {
            const settings = await safeChromeStorageGet("settings");
            if (settings && settings.features && settings.features.forumInteraction === false) {
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking settings:', error);
            return true; // Default to enabled if error
        }
    }

    // Extract post data from a post element
    function extractPostData(postElement) {
        const authorElement = postElement.querySelector(SELECTORS.author);
        const timeElement = postElement.querySelector(SELECTORS.time);
        const contentElement = postElement.querySelector(SELECTORS.content);

        const author = authorElement ? authorElement.textContent.trim() : 'Autor desconocido';
        const time = timeElement ? timeElement.textContent.trim() : 'Fecha desconocida';
        const content = contentElement ? contentElement.textContent.trim() : 'Contenido no disponible';

        const isRoot = postElement.classList.contains('raiz');
        const isReply = postElement.classList.contains('hijo');

        return {
            author,
            time,
            content,
            isRoot,
            isReply
        };
    }

    // Format post data as plain text
    function formatPostAsText(postData, includePrefix = true) {
        const prefix = postData.isRoot ? '[HILO ORIGINAL]' : '[RESPUESTA]';
        const prefixText = includePrefix ? `${prefix}\n` : '';
        
        return `${prefixText}Autor: ${postData.author}
Fecha: ${postData.time}

${postData.content}`;
    }

    // Format thread data as plain text
    function formatThreadAsText(threadData) {
        let formattedText = `=== HILO COMPLETO ===\n\n`;
        
        threadData.forEach((post, index) => {
            if (index > 0) {
                formattedText += '\n\n--- --- ---\n\n';
            }
            formattedText += formatPostAsText(post, true);
        });
        
        return formattedText;
    }

    // Copy text to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback method
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (fallbackError) {
                console.error('Fallback copy method failed:', fallbackError);
                return false;
            }
        }
    }

    // Send text to AI chat popup
    function sendToAIChat(text) {
        // First try to find existing chat input
        let chatInput = document.querySelector('#chat-input');
        
        if (chatInput) {
            // If chat is visible, insert text directly
            insertTextIntoChat(chatInput, text);
            return true;
        }
        
        // Try to open the AI chat popup if it's not visible
        const mascotButton = document.querySelector('.ucursitos-mascot');
        if (mascotButton) {
            // Click to open the popup
            mascotButton.click();
            
            // Wait and try again
            setTimeout(() => {
                const chatInputAfterOpen = document.querySelector('#chat-input');
                if (chatInputAfterOpen) {
                    insertTextIntoChat(chatInputAfterOpen, text);
                }
            }, 500);
            
            return true;
        }
        
        // If AI chat is not available, try to initialize it
        if (window.aiChatPopup && typeof window.aiChatPopup.init === 'function') {
            try {
                window.aiChatPopup.init();
                
                // Wait for initialization and try again
                setTimeout(() => {
                    const chatInputAfterInit = document.querySelector('#chat-input');
                    if (chatInputAfterInit) {
                        insertTextIntoChat(chatInputAfterInit, text);
                    }
                }, 1000);
                
                return true;
            } catch (error) {
                console.error('Error initializing AI chat:', error);
            }
        }
        
        return false;
    }
    
    // Helper function to insert text into chat input
    function insertTextIntoChat(chatInput, text) {
        // Insert the text
        chatInput.value = text;
        
        // Focus the input
        chatInput.focus();
        
        // Set cursor at the end
        chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
        
        // Trigger events to ensure proper handling
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        
        chatInput.dispatchEvent(inputEvent);
        chatInput.dispatchEvent(changeEvent);
        
        // If the chat popup is minimized, show it
        const chatFrame = document.querySelector('.ai-chat-frame');
        if (chatFrame && chatFrame.style.display === 'none') {
            chatFrame.style.display = 'block';
        }
        
        // Auto-resize textarea if it's a textarea
        if (chatInput.tagName.toLowerCase() === 'textarea') {
            chatInput.style.height = 'auto';
            chatInput.style.height = chatInput.scrollHeight + 'px';
        }
    }

    // Show temporary feedback on link (for native integration)
    function showLinkFeedback(link, text, duration = 2000) {
        const originalHTML = link.innerHTML;
        const originalStyle = link.style.cssText;
        
        link.innerHTML = text;
        link.style.cssText = originalStyle + '; color: #4caf50 !important; font-weight: bold !important;';
        link.style.pointerEvents = 'none';
        
        setTimeout(() => {
            link.innerHTML = originalHTML;
            link.style.cssText = originalStyle;
            link.style.pointerEvents = '';
        }, duration);
    }

    // Show temporary feedback on button (for thread-level actions)
    function showButtonFeedback(button, text, duration = 2000) {
        const originalHTML = button.innerHTML;
        const originalStyle = button.style.cssText;
        
        button.innerHTML = text;
        button.style.cssText = originalStyle + '; background-color: #4caf50 !important; color: white !important;';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.cssText = originalStyle;
            button.disabled = false;
        }, duration);
    }

    // Create action link for native integration (U-Cursos style)
    function createActionLink(text, iconClass, clickHandler) {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'forum-action-link';
        link.innerHTML = `<span class="${iconClass}"></span> ${text}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clickHandler();
        });
        return link;
    }

    // Create list item for native options list
    function createActionListItem(link) {
        const listItem = document.createElement('li');
        listItem.id = 'acciones'; // Native ID used by U-Cursos
        listItem.appendChild(link);
        return listItem;
    }

    // Handle copy post action
    async function handleCopyPost(postElement, linkElement) {
        const postData = extractPostData(postElement);
        const formattedText = formatPostAsText(postData, false);
        
        const success = await copyToClipboard(formattedText);
        
        if (success) {
            showLinkFeedback(linkElement, '<span class="fa fa-check"></span> ¡Copiado!');
        } else {
            showLinkFeedback(linkElement, '<span class="fa fa-times"></span> Error', 2000);
        }
    }

    // Handle send post to chat action
    function handleSendPostToChat(postElement, linkElement) {
        const postData = extractPostData(postElement);
        const formattedText = formatPostAsText(postData, false);
        
        const success = sendToAIChat(formattedText);
        
        if (success) {
            showLinkFeedback(linkElement, '<span class="fa fa-check"></span> ¡Enviado!');
        } else {
            showLinkFeedback(linkElement, '<span class="fa fa-times"></span> Error', 2000);
        }
    }

    // Handle copy thread action
    async function handleCopyThread(threadElement, button) {
        const posts = threadElement.querySelectorAll(SELECTORS.post);
        const threadData = Array.from(posts).map(post => extractPostData(post));
        const formattedText = formatThreadAsText(threadData);
        
        const success = await copyToClipboard(formattedText);
        
        if (success) {
            showButtonFeedback(button, '<i class="fas fa-check"></i> ¡Copiado!');
        } else {
            showButtonFeedback(button, '<i class="fas fa-times"></i> Error', 2000);
        }
    }

    // Handle send thread to chat action
    function handleSendThreadToChat(threadElement, button) {
        const posts = threadElement.querySelectorAll(SELECTORS.post);
        const threadData = Array.from(posts).map(post => extractPostData(post));
        const formattedText = formatThreadAsText(threadData);
        
        const success = sendToAIChat(formattedText);
        
        if (success) {
            showButtonFeedback(button, '<i class="fas fa-check"></i> ¡Enviado!');
        } else {
            showButtonFeedback(button, '<i class="fas fa-times"></i> Error', 2000);
        }
    }

    // Add thread-level buttons (these remain as separate buttons since threads don't have native options structure)
    function addThreadButtons(threadElement) {
        // Find the first post (root post) to add thread controls
        const rootPost = threadElement.querySelector(SELECTORS.rootPost);
        if (!rootPost) {
            console.warn('No root post found in thread:', threadElement);
            return;
        }

        // Check if buttons already exist
        if (rootPost.querySelector('.forum-thread-actions')) {
            return; // Already added
        }

        // Find the best place to insert thread buttons (typically in the header area)
        const headerArea = rootPost.querySelector('.autor') || rootPost.querySelector('.msg-header') || rootPost.firstElementChild;
        if (!headerArea) {
            console.warn('No header area found in root post:', rootPost);
            return;
        }

        // Create container for thread buttons
        const threadButtonContainer = document.createElement('div');
        threadButtonContainer.className = 'forum-thread-actions';
        
        // Create buttons (keep these as buttons for thread-level actions)
        const copyThreadBtn = document.createElement('button');
        copyThreadBtn.className = 'forum-action-btn thread-btn';
        copyThreadBtn.innerHTML = `<i class="fas fa-copy"></i> Copiar Hilo`;
        copyThreadBtn.addEventListener('click', () => handleCopyThread(threadElement, copyThreadBtn));
        
        const sendThreadBtn = document.createElement('button');
        sendThreadBtn.className = 'forum-action-btn thread-btn';
        sendThreadBtn.innerHTML = `<i class="fas fa-robot"></i> Enviar Hilo al Chat`;
        sendThreadBtn.addEventListener('click', () => handleSendThreadToChat(threadElement, sendThreadBtn));
        
        threadButtonContainer.appendChild(copyThreadBtn);
        threadButtonContainer.appendChild(sendThreadBtn);
        
        // Insert after the header area
        try {
            headerArea.parentNode.insertBefore(threadButtonContainer, headerArea.nextSibling);
        } catch (error) {
            console.error('Error inserting thread buttons:', error);
        }
    }

    // Add post-level buttons using native U-Cursos options structure
    function addPostButtons(postElement) {
        // Find the native options list (ul.opciones)
        const optionsList = postElement.querySelector(SELECTORS.postOptions);
        if (!optionsList) {
            console.warn('No options list (ul.opciones) found in post:', postElement);
            return;
        }

        // Check if our buttons already exist
        if (optionsList.querySelector('.boton-copiar-post') || optionsList.querySelector('.boton-enviar-chat')) {
            return; // Already added
        }

        try {
            // Create "Copiar Post" action
            const copyPostLink = createActionLink('Copiar Post', 'fa fa-copy', () => {
                handleCopyPost(postElement, copyPostLink);
            });
            copyPostLink.classList.add('boton-copiar-post');
            const copyPostItem = createActionListItem(copyPostLink);

            // Create "Enviar Post al Chat" action
            const sendPostLink = createActionLink('Enviar Post al Chat', 'fa fa-robot', () => {
                handleSendPostToChat(postElement, sendPostLink);
            });
            sendPostLink.classList.add('boton-enviar-chat');
            const sendPostItem = createActionListItem(sendPostLink);

            // Insert the new actions at the beginning of the options list
            // This ensures they appear before existing actions like "Compartir" and "Responder"
            if (optionsList.firstChild) {
                optionsList.insertBefore(copyPostItem, optionsList.firstChild);
                optionsList.insertBefore(sendPostItem, optionsList.firstChild);
            } else {
                optionsList.appendChild(sendPostItem);
                optionsList.appendChild(copyPostItem);
            }

        } catch (error) {
            console.error('Error inserting post buttons into options list:', error);
        }
    }

    // Add CSS styles for forum interaction
    function addForumInteractionStyles() {
        if (document.querySelector('#forum-interaction-styles')) return;

        const style = document.createElement('style');
        style.id = 'forum-interaction-styles';
        style.textContent = `
            /* Thread-level buttons (separate styling) */
            .forum-thread-actions {
                margin: 8px 0;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .forum-action-btn.thread-btn {
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .forum-action-btn.thread-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .forum-action-btn.thread-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .forum-action-btn.thread-btn:disabled {
                cursor: not-allowed;
                transform: none;
                opacity: 0.8;
            }
            
            .forum-action-btn.thread-btn i {
                font-size: 11px;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Initialize forum interaction features
    async function initializeForumInteraction() {
        // Check if we're on a forum page
        if (!isForumPage()) {
            return;
        }

        // Check if feature is enabled
        const enabled = await checkSettings();
        if (!enabled) {
            return;
        }

        // Wait for potential AI chat to be available
        await waitForAIChat();

        // Add CSS styles
        addForumInteractionStyles();

        // Find all thread containers
        const threads = document.querySelectorAll(SELECTORS.thread);
        
        if (threads.length === 0) {
            // If no threads found immediately, wait a bit and try again
            setTimeout(() => {
                const threadsRetry = document.querySelectorAll(SELECTORS.thread);
                processThreads(threadsRetry);
            }, 2000);
            return;
        }

        processThreads(threads);
    }
    
    // Helper function to process threads
    function processThreads(threads) {
        threads.forEach(thread => {
            // Add thread-level buttons
            addThreadButtons(thread);
            
            // Find all posts within this thread and add post-level buttons
            const posts = thread.querySelectorAll(SELECTORS.post);
            posts.forEach(post => {
                addPostButtons(post);
            });
        });

        console.log(`Forum interaction initialized: ${threads.length} threads processed`);
    }
    
    // Wait for AI chat to be potentially available
    function waitForAIChat() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkAIChat = () => {
                attempts++;
                
                // Check if AI chat is loaded
                if (window.aiChatPopupLoaded || document.querySelector('.ucursitos-mascot')) {
                    resolve();
                    return;
                }
                
                // If we've reached max attempts, continue anyway
                if (attempts >= maxAttempts) {
                    resolve();
                    return;
                }
                
                // Try again after a short delay
                setTimeout(checkAIChat, 300);
            };
            
            checkAIChat();
        });
    }

    // Wait for DOM to be ready and extension utils to be available
    function waitForDependencies() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    // Initialize when ready
    waitForDependencies().then(() => {
        // Wait a bit more for other scripts to load
        setTimeout(initializeForumInteraction, 1000);
    });

    // Also initialize when page changes (for SPA-like behavior)
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            setTimeout(initializeForumInteraction, 1000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
