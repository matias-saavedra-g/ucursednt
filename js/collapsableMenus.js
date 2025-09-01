(async function() {
    // Check if extension context is still valid
    function isExtensionContextValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    }

    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                if (!isExtensionContextValid()) {
                    console.log('Extension context invalidated, skipping storage operation');
                    resolve();
                    return;
                }
                
                chrome.storage.sync.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                console.log('Extension context error in setChromeStorageItem:', error);
                resolve(); // Don't reject to avoid breaking the script
            }
        });
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
                resolve(null); // Return null instead of rejecting
            }
        });
    }
    
    // Make every section collapsable and adds a button next to each section to collapse it using fa-compress
    // and fa-expand icons with sleek animations
    // Each section is identified by document.querySelector("#modulos")
    // Where each div inside "#modulos" has an h1 which is the title of the section. We want to collapse everything except the title
    function makeCollapsable() {
        // Add CSS for smooth animations
        const style = document.createElement('style');
        style.textContent = `
            .collapsable-content {
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: top;
            }
            
            .collapsable-content.collapsed {
                max-height: 0 !important;
                opacity: 0;
                transform: scaleY(0);
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }
            
            .collapsable-content.expanded {
                opacity: 1;
                transform: scaleY(1);
            }
            
            .collapsable-button {
                transition: all 0.2s ease-in-out;
                transform: scale(1);
            }
            
            .collapsable-button:hover {
                transform: scale(1.1);
                background-color: rgba(34, 34, 34, 0.1) !important;
                border-radius: 3px;
            }
            
            .collapsable-button:active {
                transform: scale(0.95);
            }
            
            .collapsable-button i {
                transition: all 0.2s ease-in-out;
            }
        `;
        document.head.appendChild(style);

        const modulos = document.querySelector("#modulos");
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            
            // Set up content for animation
            content.classList.add("collapsable-content", "expanded");
            
            // Store original height for animation
            const originalHeight = content.scrollHeight;
            content.style.maxHeight = originalHeight + "px";
            
            // The click to collapse only should work when clicking the fa-solid fa-minus button
            const button = document.createElement("button");
            button.innerHTML = '<i class="fa-solid fa-minus"></i>';
            button.classList.add("collapsable-button");
            // Makes background of button #222 in rgba with opacity 0.2
            button.style.backgroundColor = "rgba(34, 34, 34, 0)";
            // Padding to 4 px
            button.style.padding = "4px";
            // No border
            button.style.border = "none";
            // Inherits the color of the text
            button.style.color = "inherit";
            // Add cursor pointer
            button.style.cursor = "pointer";
            
            section.appendChild(button);
            button.addEventListener("click", async () => {
                // Add mouseover event for alert
                let firstClick = await getChromeStorageItem("collapsableMenusFirstClick") !== true;
                if (firstClick) {
                    alert("Puedes expandir o colapsar las secciones haciendo click en el botón que aparece al lado de cada título.");
                    await setChromeStorageItem("collapsableMenusFirstClick", true); // Mark that the alert has been shown
                    firstClick = false; // Update the local variable to prevent further alerts
                }
                
                // Smooth animation toggle
                if (content.classList.contains("collapsed")) {
                    // Expand animation
                    content.classList.remove("collapsed");
                    content.classList.add("expanded");
                    
                    // Update max height for smooth expansion
                    content.style.maxHeight = content.scrollHeight + "px";
                    
                    // Change icon with animation
                    const icon = button.querySelector("i");
                    icon.style.transform = "rotate(180deg)";
                    setTimeout(() => {
                        button.innerHTML = '<i class="fa-solid fa-minus"></i>';
                        icon.style.transform = "rotate(0deg)";
                    }, 100);
                    
                } else {
                    // Collapse animation
                    content.classList.remove("expanded");
                    content.classList.add("collapsed");
                    
                    // Change icon with animation
                    const icon = button.querySelector("i");
                    icon.style.transform = "rotate(180deg)";
                    setTimeout(() => {
                        button.innerHTML = '<i class="fa-solid fa-plus"></i>';
                        icon.style.transform = "rotate(0deg)";
                    }, 100);
                }
                
                // Save state after animation
                setTimeout(async () => {
                    await saveCollapsableState();
                }, 300);
            });
        });
    }


    // Save every collapsable state in Chrome Storage
    async function saveCollapsableState() {
        const modulos = document.querySelector("#modulos");
        if (!modulos) return;
        
        const state = {};
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            // Save based on CSS classes instead of display style
            state[section.innerText] = content.classList.contains("collapsed") ? "collapsed" : "expanded";
        });
        await setChromeStorageItem("collapsableState", state);
        console.log('Saved collapsable state:', state);
    }

    // Load every collapsable state from Chrome Storage
    async function loadCollapsableState() {
        const modulos = document.querySelector("#modulos");
        if (!modulos) return;
        
        const state = await getChromeStorageItem("collapsableState");
        if (!state) return;
        
        console.log('Loading collapsable state:', state);
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            const button = section.querySelector("button");
            
            if (state[section.innerText] === "collapsed") {
                // Apply collapsed state
                content.classList.remove("expanded");
                content.classList.add("collapsed");
                if (button) {
                    button.innerHTML = '<i class="fa-solid fa-plus"></i>';
                }
            } else {
                // Apply expanded state (default)
                content.classList.remove("collapsed");
                content.classList.add("expanded");
                content.style.maxHeight = content.scrollHeight + "px";
                if (button) {
                    button.innerHTML = '<i class="fa-solid fa-minus"></i>';
                }
            }
        });
    }

    // Main execution with error handling
    try {
        // Verificar si la configuración de collapsableMenus está activada
        const settings = await getChromeStorageItem("settings");
        if (settings) {
            const collapsableMenusConfig = settings.features.collapsableMenus;
            if (!collapsableMenusConfig) {return}
        }

        // Call the functions
        makeCollapsable();
        await loadCollapsableState();
        window.addEventListener("beforeunload", saveCollapsableState);
    } catch (error) {
        console.log('Error in collapsableMenus script:', error);
        // Don't throw the error to avoid breaking other scripts
    }

})();
