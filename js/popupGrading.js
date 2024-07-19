// Créditos a https://github.com/Nyveon/tU-Cursos por la inspiración inicial

(function() {

    // Función para establecer un dato en LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Función para obtener un dato de LocalStorage
    /**
     * Retrieves the value associated with the specified key from the local storage.
     * @param {string} key - The key to retrieve the value for.
     * @returns {any} The value associated with the key, or null if the key does not exist.
     */
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    const popupGradingConfig = JSON.parse(localStorage.getItem("settings")).features.popupGrading
    if (getLocalStorageItem("settings")) {
        if (!popupGradingConfig) {return}
    }

    // Obtener todos los elementos <a> que contienen enlace a historial de evaluación
    var elem = document.querySelectorAll('a[href*="historial?id_evaluacion="]');

    // Iterar sobre cada elemento encontrado
    for (let i = 0; i < elem.length; i++){
        var link = elem[i].attributes[0].nodeValue; // Obtener el valor del atributo href
        elem[i].setAttribute("target", "popup"); // Establecer el atributo target como "popup"
        elem[i].setAttribute("onclick", "window.open('" + link + "','popup','width=600,height=600'); return false;"); // Agregar onclick para abrir en ventana emergente
    }

})();