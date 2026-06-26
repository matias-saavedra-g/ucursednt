// utilities.js - Global shared helper functions for U-Cursedn't

(function() {
    'use strict';

    if (window.UcursedntUtils) return;

    window.UcursedntUtils = {
        
        // ── 1. Storage Utilities ─────────────────────────────────────────────
        Storage: {
            get: async function(key) {
                // Built-in safety check
                if (!UcursedntUtils.Browser.isExtensionContextValid()) {
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
                if (!UcursedntUtils.Browser.isExtensionContextValid()) {
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
                const titleEl = document.querySelector('.curso h1, .curso h2');
                return titleEl ? titleEl.textContent.trim() : 'Curso Desconocido';
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
})();