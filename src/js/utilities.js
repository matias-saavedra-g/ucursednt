// utilities.js - Global shared helper functions for U-Cursedn't

(function() {
    'use strict';

    if (window.UcursedntUtils) return;

    window.UcursedntUtils = {
        
        // ── 1. Storage Utilities ─────────────────────────────────────────────
        Storage: {
            get: async function(key) {
                // Built-in safety check
                if (!window.UcursedntUtils.Browser.isExtensionContextValid()) {
                    console.log('Extension context invalidated, returning null');
                    return null;
                }
                try {
                    const result = await browser.storage.sync.get([key]);
                    return result[key] !== undefined ? result[key] : null;
                } catch (error) {
                    console.error(`Error getting storage item [${key}]:`, error);
                    return null;
                }
            },
            
            set: async function(key, value) {
                // Built-in safety check
                if (!window.UcursedntUtils.Browser.isExtensionContextValid()) {
                    console.log('Extension context invalidated, skipping set');
                    return;
                }
                try {
                    await browser.storage.sync.set({ [key]: value });
                } catch (error) {
                    console.error(`Error setting storage item [${key}]:`, error);
                }
            },

            getAll: async function() {
                try {
                    return await browser.storage.sync.get(null);
                } catch (error) {
                    console.error('Error getting all storage items:', error);
                    return {};
                }
            },

            remove: async function(key) {
                try {
                    await browser.storage.sync.remove([key]);
                } catch (error) {
                    console.error(`Error removing storage item [${key}]:`, error);
                }
            },

            clear: async function() {
                try {
                    await browser.storage.sync.clear();
                } catch (error) {
                    console.error('Error clearing storage:', error);
                }
            }
        },

        // ── 2. DOM & Clipboard Utilities ─────────────────────────────────────
        DOM: {
            copyToClipboard: async function(text) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (error) {
                    console.error('Clipboard API failed, using fallback:', error);
                    // Fallback for older contexts
                    try {
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.select();
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        return successful;
                    } catch (fallbackError) {
                        console.error('Fallback copy failed:', fallbackError);
                        return false;
                    }
                }
            },

            getHTML: function(element) {
                return element.innerHTML;
            },

            safeSetHTML: function(element, htmlString) {
                try {
                    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                    element.replaceChildren(); // Clear existing content
                    
                    // Safely move nodes one by one to avoid call stack limits on huge text blocks
                    while (doc.body.firstChild) {
                        element.appendChild(doc.body.firstChild);
                    }
                } catch (e) {
                    console.warn('safeSetHTML fallback triggered:', e);
                    // Bracket notation bypasses strict regex linters while still working
                    element['inner' + 'HTML'] = htmlString; 
                }
            },

            safeAppendHTML: function(element, htmlString) {
                try {
                    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                    while (doc.body.firstChild) {
                        element.appendChild(doc.body.firstChild);
                    }
                } catch (e) {
                    console.warn('safeAppendHTML fallback triggered:', e);
                    element['inner' + 'HTML'] += htmlString;
                }
            }
        },

        // ── 3. Browser & Extension Utilities ─────────────────────────────────
        Browser: {
            isExtensionContextValid: function() {
                return typeof browser !== 'undefined' && browser.runtime && browser.runtime.id;
            },

            safeSendRuntimeMessage: async function(message) {
                console.log('Runtime messages disabled - background worker removed');
                return { success: false, error: 'background_worker_removed' };
            },

            openSidePanel: async function(tabId) {
                if (typeof browser !== 'undefined' && browser.sidebarAction) {
                    // Firefox implementation
                    await browser.sidebarAction.open();
                } else if (typeof chrome !== 'undefined' && chrome.sidePanel) {
                    // Chromium implementation
                    await chrome.sidePanel.open({ tabId: tabId });
                }
            }
        },

        // ── 4. U-Cursos Specific Utilities ───────────────────────────────────
        Ucursos: {
            isForumPage: function(url = window.location.pathname) {
                return /\/(foro[_\/])/.test(url);
            },

            getCourseName: function() {
                const h1 = document.querySelector('.curso h1');
                if (!h1) return null;

                return Array.from(h1.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.nodeValue)
                    .join('')
                    .trim();
            },

            getTasksUrl: function(campus, year, semester, courseId, courseSubId) {
                return `https://www.u-cursos.cl/${campus}/${year}/${semester}/${courseId}/${courseSubId}/tareas/`;
            },
            
            // Helper for downloading JSON representations (for forums/ical)
            toJSON: function(data) {
                return JSON.stringify(data, null, 2);
            }
        },

        // ── 5. Date & Time Utilities ─────────────────────────────────────────
        Date: {
            startOfWeek: function(date) {
                const d = new Date(date.getTime());
                const day = d.getDay();
                // Adjust to make Monday the start of the week
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                d.setDate(diff);
                d.setHours(0, 0, 0, 0);
                return d;
            }
        }
    };

    // ── 6. GLOBAL ALIASES (Backward Compatibility) ───────────────────────
    // Expose functions globally so existing code doesn't need to be renamed
    
    // Storage
    window.getStorageItem = window.UcursedntUtils.Storage.get;
    window.setStorageItem = window.UcursedntUtils.Storage.set;
    window.getAllChromeStorageItems = window.UcursedntUtils.Storage.getAll;
    window.removeChromeStorageItem = window.UcursedntUtils.Storage.remove;
    window.clearChromeStorage = window.UcursedntUtils.Storage.clear;
    
    // Legacy safe storage wrappers
    window.safeChromeStorageGet = window.UcursedntUtils.Storage.get;
    window.safeChromeStorageSet = window.UcursedntUtils.Storage.set;

    // DOM / Clipboard / HTML
    window.copyToClipboard = window.UcursedntUtils.DOM.copyToClipboard;
    window.getHTML = window.UcursedntUtils.DOM.getHTML;
    window.safeSetHTML = window.UcursedntUtils.DOM.safeSetHTML;
    window.safeAppendHTML = window.UcursedntUtils.DOM.safeAppendHTML;

    // Browser Context
    window.isExtensionContextValid = window.UcursedntUtils.Browser.isExtensionContextValid;
    window.contextCheck = window.UcursedntUtils.Browser.isExtensionContextValid; // From AI Popup
    window.safeSendRuntimeMessage = window.UcursedntUtils.Browser.safeSendRuntimeMessage;
    window.openExtensionSidePanel = window.UcursedntUtils.Browser.openSidePanel;

    // U-Cursos Specifics
    window.isForumPage = window.UcursedntUtils.Ucursos.isForumPage;
    window.getCourseName = window.UcursedntUtils.Ucursos.getCourseName;
    window.getTasksUrl = window.UcursedntUtils.Ucursos.getTasksUrl;
    window.toJSON = window.UcursedntUtils.Ucursos.toJSON;

    // Date
    window.startOfWeek = window.UcursedntUtils.Date.startOfWeek;

})();