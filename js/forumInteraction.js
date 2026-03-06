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
        const path = window.location.pathname;
        return path.includes('/foro/') || path.includes('/foro_');
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
    async function handleCopyThread(threadElement, trigger) {
        const posts = threadElement.querySelectorAll(SELECTORS.post);
        const threadData = Array.from(posts).map(post => extractPostData(post));
        const formattedText = formatThreadAsText(threadData);
        
        const success = await copyToClipboard(formattedText);
        
        if (success) {
            showLinkFeedback(trigger, '<i class="fa-regular fa-check"></i> ¡Copiado!');
        } else {
            showLinkFeedback(trigger, '<i class="fa-regular fa-times"></i> Error', 2000);
        }
    }

    // Handle send thread to chat action
    function handleSendThreadToChat(threadElement, trigger) {
        const posts = threadElement.querySelectorAll(SELECTORS.post);
        const threadData = Array.from(posts).map(post => extractPostData(post));
        const formattedText = formatThreadAsText(threadData);
        
        const success = sendToAIChat(formattedText);
        
        if (success) {
            showLinkFeedback(trigger, '<i class="fa-regular fa-check"></i> ¡Enviado!');
        } else {
            showLinkFeedback(trigger, '<i class="fa-regular fa-times"></i> Error', 2000);
        }
    }

    // Create a minimalist "Funciones IA" dropdown
    function createIADropdown(items) {
        const container = document.createElement('div');
        container.className = 'forum-ia-dropdown';

        const trigger = document.createElement('a');
        trigger.href = '#';
        trigger.className = 'forum-ia-trigger';
        trigger.innerHTML = 'Funciones IA <i class="fa fa-caret-down"></i>';

        const menu = document.createElement('div');
        menu.className = 'forum-ia-menu';

        items.forEach(({ label, icon, handler }) => {
            const link = document.createElement('a');
            link.href = '#';
            link.innerHTML = `<i class="${icon}"></i> ${label}`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeIADropdownMenu(menu);
                handler(trigger);
            });
            menu.appendChild(link);
        });

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.forum-ia-menu.open').forEach(m => {
                if (m !== menu) closeIADropdownMenu(m);
            });
            if (menu.classList.contains('open')) {
                closeIADropdownMenu(menu);
            } else {
                openIADropdownMenu(menu);
            }
        });

        container.appendChild(trigger);
        container.appendChild(menu);

        return container;
    }

    function openIADropdownMenu(menu) {
        menu.classList.add('open');
        menu.style.maxHeight = menu.scrollHeight + 'px';
    }

    function closeIADropdownMenu(menu) {
        menu.style.maxHeight = '0px';
        menu.classList.remove('open');
    }

    // Add a single unified dropdown using native U-Cursos options structure.
    // Root posts include both post and thread actions in the same menu.
    function addPostButtons(postElement, threadElement) {
        const optionsList = postElement.querySelector(SELECTORS.postOptions);
        if (!optionsList) {
            console.warn('No options list (ul.opciones) found in post:', postElement);
            return;
        }

        if (optionsList.querySelector('.forum-ia-dropdown')) {
            return;
        }

        try {
            const actions = [
                { label: 'Copiar Post', icon: 'fa fa-copy', handler: (t) => handleCopyPost(postElement, t) },
                { label: 'Enviar Post al Chat', icon: 'fa fa-robot', handler: (t) => handleSendPostToChat(postElement, t) }
            ];

            if (postElement.classList.contains('raiz') && threadElement) {
                actions.push(
                    { label: 'Copiar Hilo', icon: 'fa-regular fa-copy', handler: (t) => handleCopyThread(threadElement, t) },
                    { label: 'Enviar Hilo al Chat', icon: 'fa-regular fa-robot', handler: (t) => handleSendThreadToChat(threadElement, t) }
                );
            }

            const container = createIADropdown(actions);

            const listItem = document.createElement('li');
            listItem.id = 'acciones';
            listItem.className = 'forum-ia-item';
            listItem.appendChild(container);

            if (optionsList.firstChild) {
                optionsList.insertBefore(listItem, optionsList.firstChild);
            } else {
                optionsList.appendChild(listItem);
            }
        } catch (error) {
            console.error('Error inserting post dropdown into options list:', error);
        }
    }

    // Add CSS styles for forum interaction
    function addForumInteractionStyles() {
        if (document.querySelector('#forum-interaction-styles')) return;

        const style = document.createElement('style');
        style.id = 'forum-interaction-styles';
        style.textContent = `
            li.forum-ia-item {
                padding-left: 0 !important;
                margin-left: 0 !important;
            }

            .forum-ia-dropdown {
                position: relative;
                display: inline-flex;
                flex-direction: column;
                align-items: flex-start;
                max-width: 100%;
            }

            .forum-ia-trigger {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-size: 12px;
                color: inherit;
                opacity: 0.65;
                text-decoration: underline;
                text-underline-offset: 3px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                transition: opacity 0.2s ease;
                font-family: inherit;
            }

            .forum-ia-trigger:hover {
                opacity: 1;
            }

            .forum-ia-menu {
                position: relative;
                max-height: 0;
                opacity: 0;
                margin-top: 0;
                background: #fff;
                border: 1px solid rgba(0,0,0,0.12);
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-width: 170px;
                overflow: hidden;
                pointer-events: none;
                transform-origin: top;
                transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-top 0.25s ease;
            }

            .forum-ia-menu.open {
                opacity: 1;
                margin-top: 6px;
                pointer-events: auto;
            }

            .forum-ia-menu a {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                color: inherit;
                text-decoration: none;
                font-size: 12px;
                white-space: normal;
                word-break: break-word;
                transition: background 0.15s ease;
            }

            .forum-ia-menu a:hover {
                background: rgba(0,0,0,0.05);
                text-decoration: none;
            }
        `;

        if (!window.forumIADropdownListenerAdded) {
            window.forumIADropdownListenerAdded = true;
            document.addEventListener('click', () => {
                document.querySelectorAll('.forum-ia-menu.open').forEach(m => closeIADropdownMenu(m));
            });
        }
        
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
            // Find all posts within this thread and add one unified dropdown per post
            const posts = thread.querySelectorAll(SELECTORS.post);
            posts.forEach(post => {
                addPostButtons(post, thread);
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
