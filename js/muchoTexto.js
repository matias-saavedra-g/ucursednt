// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g el 2024.07.16

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

    const paragraph_limit = 5;
    const text = document.getElementsByClassName('texto');

    /**
     * Function that counts the amount of paragraphs in a HTML element
     */
    /**
     * Counts the number of lines in an HTML element.
     *
     * @param {HTMLElement} elem - The HTML element to count the lines from.
     * @returns {number} The number of lines in the element.
     */
    function countLines(elem) {
        var paragraphs = elem.innerHTML.split("<br>").filter(String);
        var len = paragraphs.length;
        if (len === 0) {
            return 1;
        } else {
            return len;
        }
    }

    const muchoTextoConfig = JSON.parse(localStorage.getItem("settings")).features.muchoTexto
    if (getLocalStorageItem("settings")) {
        if (!muchoTextoConfig) {return}
    }

    /**
     * Iterate over the divs with class "texto", first we remove the last children for formatting purposes
     * then we count the amount of paragraphs, check if it's greater than the admitted threshold. If it's
     * over the threshold we generate a cut version of the text and the original text, then we change the
     * innerHTML, displaying the short version and adding a button to toggle between the short text and the
     * complete text. Finally we re-add the children we had removed.
     */
    for (let i = 0; i < text.length; i++) {
        const options = text[i].lastElementChild;
        text[i].removeChild(options); // Removed
        const text_length = countLines(text[i]);
        if (text_length > paragraph_limit) {
            const paragraphs = text[i].innerHTML.split("<br>");
            let short_text = paragraphs[0];
            for (let j = 1; j <= paragraph_limit; j++) {
                if (paragraphs[j] === "") {
                    short_text = short_text + "<br>";
                } else {
                    short_text = short_text + "<br>" + paragraphs[j];
                }
            }
            const long_text = text[i].innerHTML;
            text[i].innerHTML = '<div><span class="short-text">' + short_text + '</span><span class="long-text" style="display: none">' + long_text + '</span><br><button class="show-more-button" data-more="0">Mucho texto</button></div>';

            // Añadir alerta la primera vez que se hace clic en el botón de "Leer más"
            const showMoreButton = text[i].querySelector('.show-more-button');
            showMoreButton.addEventListener('click', function () {
                if (getLocalStorageItem("showMoreFirstClick") !== true) {
                    alert("Mucho texto...");
                    setLocalStorageItem("showMoreFirstClick", true); // Marcar que ya se mostró la alerta
                }
                
                // Toggle de texto corto y largo
                const moreText = this.getAttribute('data-more') === "0";
                this.setAttribute('data-more', moreText ? "1" : "0");
                this.innerHTML = moreText ? 'Menos texto' : 'Mucho texto';

                this.previousElementSibling.previousElementSibling.previousElementSibling.style.display = moreText ? 'none' : 'inline';
                this.previousElementSibling.previousElementSibling.style.display = moreText ? 'inline' : 'none';
            });
        }
        text[i].append(options); // Added
    }
})();