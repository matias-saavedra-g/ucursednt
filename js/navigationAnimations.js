(async function() {
    // Check if extension context is still valid
    function isExtensionContextValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    }

    // Function to get an item from Chrome Storage
    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                if (!isExtensionContextValid()) {
                    console.log('Extension context invalidated, returning null');
                    resolve(null);
                    return;
                }
                
                chrome.storage.sync.get([key], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : null);
                    }
                });
            } catch (error) {
                console.log('Extension context error in getChromeStorageItem:', error);
                resolve(null);
            }
        });
    }

    // Function to add macOS dock-like animations to the navigation menu
    function addNavigationAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            #navigation-wrapper > ul.modulos > li.servicio {
                transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform-origin: bottom center;
            }

            #navigation-wrapper > ul.modulos > li.servicio > a:focus {
                outline: 2px solid rgba(74, 144, 226, 0.6);
                outline-offset: 2px;
            }

            #navigation-wrapper > ul.modulos > li.servicio.pulse {
                animation: pulseGlow 2s ease-in-out infinite;
            }

            @keyframes pulseGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.4); }
                50%       { box-shadow: 0 0 0 8px rgba(74, 144, 226, 0); }
            }
        `;
        document.head.appendChild(style);

        const nav = document.querySelector("#navigation-wrapper > ul.modulos");
        if (!nav) return;

        const items = Array.from(nav.querySelectorAll(":scope > li.servicio"));

        // Scale values: [hovered, distance-1, distance-2]
        const SCALES = [1.1, 1.05, 1.01];

        function applyDock(hoveredIndex) {
            items.forEach((item, i) => {
                const dist = Math.abs(i - hoveredIndex);
                const scale = dist < SCALES.length ? SCALES[dist] : 1;
                item.style.transform = scale !== 1 ? `scale(${scale})` : '';
            });
        }

        function resetDock() {
            items.forEach(item => { item.style.transform = ''; });
        }

        items.forEach((item, index) => {
            item.addEventListener('mouseenter', () => applyDock(index));
        });

        nav.addEventListener('mouseleave', resetDock);

        console.log('Navigation animations applied successfully');
    }

    // Function to observe for dynamic content changes
    function observeNavigationChanges() {
        const targetNode = document.querySelector("#navigation-wrapper");
        if (!targetNode) return;
        
        const config = { childList: true, subtree: true };
        
        const callback = function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Re-apply animations if navigation content changes
                    const navigationUl = document.querySelector("#navigation-wrapper > ul.modulos");
                    if (navigationUl && !navigationUl.dataset.animationsApplied) {
                        navigationUl.dataset.animationsApplied = 'true';
                        addNavigationAnimations();
                    }
                }
            }
        };
        
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    // Main execution with error handling
    try {
        // Check if navigationAnimations feature is enabled
        const settings = await getChromeStorageItem("settings");
        if (settings && settings.features && settings.features.navigationAnimations === false) {
            console.log('Navigation animations feature is disabled');
            return;
        }

        // Wait for the navigation to be available
        const checkNavigation = () => {
            const navigationUl = document.querySelector("#navigation-wrapper > ul.modulos");
            if (navigationUl) {
                if (!navigationUl.dataset.animationsApplied) {
                    navigationUl.dataset.animationsApplied = 'true';
                    addNavigationAnimations();
                    observeNavigationChanges();
                }
            } else {
                // Retry after a short delay if navigation not found
                setTimeout(checkNavigation, 100);
            }
        };

        // Start checking for navigation
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkNavigation);
        } else {
            checkNavigation();
        }

    } catch (error) {
        console.log('Error in navigationAnimations script:', error);
        // Don't throw the error to avoid breaking other scripts
    }

})();
