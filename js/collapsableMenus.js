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
            section.style.cursor = "pointer";
            section.innerHTML += " <i class='fas fa-compress'></i>";
            section.addEventListener("click", () => {
                content.style.display = content.style.display === "none" ? "block" : "none";
                // Save state to local storage
                saveCollapsableState();
            });
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
        });
    }

    // Verificar si la configuración de easyCopyCourseDetails está activada
    const collapsableMenusConfig = JSON.parse(localStorage.getItem("settings")).features.collapsableMenus
    if (getLocalStorageItem("settings")) {
        if (!collapsableMenusConfig) {return}
    }

    // Call the functions
    makeCollapsable();
    loadCollapsableState();
    window.addEventListener("beforeunload", saveCollapsableState);

})();