(function() {
    // Función para establecer un dato en LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Función para obtener un dato de LocalStorage
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    
    // Make every section collapsable and adds a button next to each section to collapse it using fa-compress
    // and fa-expand icons
    // Each section is identified by document.querySelector("#modulos")
    // Where each div inside "#modulos" has an h1 which is the title of the section. We want to collapse everything except the title
    function makeCollapsable() {
        const modulos = document.querySelector("#modulos");
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            // The click to collapse only should work when clicking the fas fa-compress button
            const button = document.createElement("button");
            button.innerHTML = '<i class="fas fa-compress"></i>';
            button.classList.add("collapsable-button");
            // Makes background of button #222
            button.style.backgroundColor = "#222";
            // Opacity to 0.8
            button.style.opacity = "0.8";
            // Padding to 2 px
            button.style.padding = "0";
            // No border
            button.style.border = "none";
            section.appendChild(button);
            button.addEventListener("click", () => {
                if (content.style.display === "none") {
                    content.style.display = "block";
                    button.innerHTML = '<i class="fas fa-compress"></i>';
                    // Save state
                    saveCollapsableState();
                } else {
                    content.style.display = "none";
                    button.innerHTML = '<i class="fas fa-expand"></i>';
                    // Save state
                    saveCollapsableState();
                }
            });
        });
        // Add mouseover event for alert
        let firstHover = getLocalStorageItem("collapsableMenusFirstHover") !== true;
        modulos.querySelector("button").addEventListener('mouseover', function() {
            if (firstHover) {
                alert("Puedes expandir o colapsar las secciones haciendo click en el botón que aparece al lado de cada título.");
                setLocalStorageItem("collapsableMenusFirstHover", true); // Mark that the alert has been shown
                firstHover = false; // Update the local variable to prevent further alerts
            }
        });
    }


    // Save every collapsable state in LocalStorage
    function saveCollapsableState() {
        const modulos = document.querySelector("#modulos");
        const state = {};
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            state[section.innerText] = content.style.display;
        });
        setLocalStorageItem("collapsableState", state);
    }

    // Load every collapsable state from LocalStorage
    function loadCollapsableState() {
        const modulos = document.querySelector("#modulos");
        const state = getLocalStorageItem("collapsableState");
        if (!state) {return}
        modulos.querySelectorAll("div > h1").forEach(section => {
            const content = section.nextElementSibling;
            content.style.display = state[section.innerText];
            if (content.style.display === "none") {
                section.querySelector("button").innerHTML = '<i class="fas fa-expand"></i>';
            }
        });
    }

    // Verificar si la configuración de collapsableMenus está activada
    const collapsableMenusConfig = JSON.parse(localStorage.getItem("settings")).features.collapsableMenus
    if (getLocalStorageItem("settings")) {
        if (!collapsableMenusConfig) {return}
    }

    // Call the functions
    makeCollapsable();
    loadCollapsableState();
    window.addEventListener("beforeunload", saveCollapsableState);

})();
