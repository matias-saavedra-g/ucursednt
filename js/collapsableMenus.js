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
    // and fa-expand icons
    // Each section is identified by document.querySelector("#modulos")
    // Where each div inside "#modulos" has an h1 which is the title of the section. We want to collapse everything except the title
    function makeCollapsable() {
        const modulos = document.querySelector("#modulos");
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
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
            section.appendChild(button);
            button.addEventListener("click", async () => {
                // Add mouseover event for alert
                let firstClick = await getChromeStorageItem("collapsableMenusFirstClick") !== true;
                if (firstClick) {
                    alert("Puedes expandir o colapsar las secciones haciendo click en el botón que aparece al lado de cada título.");
                    await setChromeStorageItem("collapsableMenusFirstClick", true); // Mark that the alert has been shown
                    firstClick = false; // Update the local variable to prevent further alerts
                }
                if (content.style.display === "none") {
                    content.style.display = "block";
                    button.innerHTML = '<i class="fa-solid fa-minus"></i>';
                    // Save state
                    await saveCollapsableState();
                } else {
                    content.style.display = "none";
                    button.innerHTML = '<i class="fa-solid fa-plus"></i>';
                    // Save state
                    await saveCollapsableState();
                }
            });
        });
    }


    // Save every collapsable state in Chrome Storage
    async function saveCollapsableState() {
        const modulos = document.querySelector("#modulos");
        const state = {};
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            state[section.innerText] = content.style.display;
        });
        await setChromeStorageItem("collapsableState", state);
    }

    // Load every collapsable state from Chrome Storage
    async function loadCollapsableState() {
        const modulos = document.querySelector("#modulos");
        const state = await getChromeStorageItem("collapsableState");
        if (!state) {return}
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            content.style.display = state[section.innerText];
            if (content.style.display === "none") {
                section.querySelector("button").innerHTML = '<i class="fa-solid fa-plus"></i>';
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
