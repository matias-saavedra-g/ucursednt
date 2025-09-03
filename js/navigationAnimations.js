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

    // Function to add sleek animations to the navigation menu
    function addNavigationAnimations() {
        // Add CSS for sleek navigation animations
        const style = document.createElement('style');
        style.textContent = `
            /* Smooth transitions for the entire navigation */
            #navigation-wrapper > ul.modulos {
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                height: auto !important;
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: flex-start !important;
            }
            
            /* Individual menu items animations */
            #navigation-wrapper > ul.modulos > li.servicio {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                height: auto !important;
                margin: 2px !important;
                flex-shrink: 0 !important;
            }
            
            /* Hover effects for menu items */
            #navigation-wrapper > ul.modulos > li.servicio:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            }
            
            /* Active/Selected state enhancement */
            #navigation-wrapper > ul.modulos > li.servicio.sel {
                transform: scale(1.02);
                background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(80, 200, 120, 0.1));
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
            }
            
            #navigation-wrapper > ul.modulos > li.servicio.sel:hover {
                transform: scale(1.02) translateY(-2px);
                box-shadow: 0 6px 16px rgba(74, 144, 226, 0.3);
            }
            
            /* Link animations */
            #navigation-wrapper > ul.modulos > li.servicio > a {
                transition: all 0.2s ease-in-out;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                position: relative;
                text-align: center;
            }
            
            /* Ensure text spans are visible */
            #navigation-wrapper > ul.modulos > li.servicio > a > span {
                overflow: hidden !important;
                overflow-x: hidden !important;
                overflow-y: hidden !important;
                text-overflow: ellipsis !important;
                text-wrap-mode: nowrap !important;
                list-style-type: none !important;
                white-space: nowrap !important;
            }
            
            /* Image/Icon animations */
            #navigation-wrapper > ul.modulos > li.servicio img {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform: scale(1);
            }
            
            #navigation-wrapper > ul.modulos > li.servicio:hover img {
                transform: scale(1.1) rotate(5deg);
                filter: brightness(1.2) contrast(1.1);
            }
                        
            /* Ripple effect for clicks */
            #navigation-wrapper > ul.modulos > li.servicio > a::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out;
                opacity: 0;
                pointer-events: none;
                z-index: 1;
            }
            
            #navigation-wrapper > ul.modulos > li.servicio > a:active::before {
                width: 300px;
                height: 300px;
                opacity: 0.3;
                transition: width 0.1s ease-out, height 0.1s ease-out, opacity 0.1s ease-out;
            }
            
            /* Enhanced focus states for accessibility */
            #navigation-wrapper > ul.modulos > li.servicio > a:focus {
                outline: 2px solid rgba(74, 144, 226, 0.6);
                outline-offset: 2px;
                border-radius: 6px;
            }
                        
            /* Pulse animation for new items or notifications */
            #navigation-wrapper > ul.modulos > li.servicio.pulse {
                animation: pulseGlow 2s ease-in-out infinite;
            }
            
            @keyframes pulseGlow {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.4);
                }
                50% {
                    box-shadow: 0 0 0 8px rgba(74, 144, 226, 0);
                }
            }
            
            /* Smooth transitions for responsive design */
            @media (max-width: 768px) {
                #navigation-wrapper > ul.modulos > li.servicio:hover {
                    transform: scale(1.02);
                }
                
                #navigation-wrapper > ul.modulos > li.servicio:hover img {
                    transform: scale(1.05);
                }
            }
        `;
        document.head.appendChild(style);

        // Add click ripple effect to menu items
        const menuItems = document.querySelectorAll("#navigation-wrapper > ul.modulos > li.servicio");
        menuItems.forEach((item, index) => {
            // Add click ripple effect
            const link = item.querySelector('a');
            if (link) {
                link.addEventListener('click', function(e) {
                    // Create ripple effect
                    const rect = this.getBoundingClientRect();
                    const ripple = document.createElement('div');
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.cssText = `
                        position: absolute;
                        top: ${y}px;
                        left: ${x}px;
                        width: ${size}px;
                        height: ${size}px;
                        background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
                        border-radius: 50%;
                        transform: scale(0);
                        animation: rippleEffect 0.6s ease-out forwards;
                        pointer-events: none;
                        z-index: 2;
                    `;
                    
                    // Add ripple animation
                    const rippleKeyframes = `
                        @keyframes rippleEffect {
                            to {
                                transform: scale(2);
                                opacity: 0;
                            }
                        }
                    `;
                    
                    if (!document.getElementById('ripple-keyframes')) {
                        const rippleStyle = document.createElement('style');
                        rippleStyle.id = 'ripple-keyframes';
                        rippleStyle.textContent = rippleKeyframes;
                        document.head.appendChild(rippleStyle);
                    }
                    
                    this.style.position = 'relative';
                    this.appendChild(ripple);
                    
                    // Remove ripple after animation
                    setTimeout(() => {
                        if (ripple.parentNode) {
                            ripple.parentNode.removeChild(ripple);
                        }
                    }, 600);
                });
            }
        });
        
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
