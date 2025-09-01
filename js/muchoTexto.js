// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g el 2024.07.16

(async function() {

    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to get an item from Chrome Storage
    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([key], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : null);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
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

    const settings = await getChromeStorageItem("settings");
    if (settings) {
        const muchoTextoConfig = settings.features.muchoTexto;
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
            const long_text = text[i].innerHTML;
            text[i].innerHTML = '<div class="text-content" style="display: none">' + long_text + '</div><br><button class="show-more-button" data-more="0">Es Mucho Texto</button>';

            // Añadir alerta la primera vez que se hace clic en el botón de "Es Mucho Texto"
            const showMoreButton = text[i].querySelector('.show-more-button');
            showMoreButton.addEventListener('click', async function () {
                if (await getChromeStorageItem("showMoreFirstClick") !== true) {
                    alert("Mucho texto...");
                    await setChromeStorageItem("showMoreFirstClick", true); // Marcar que ya se mostró la alerta
                }
                
                // Toggle de texto corto y largo
                const moreText = this.getAttribute('data-more') === "0";
                this.setAttribute('data-more', moreText ? "1" : "0");
                this.innerHTML = moreText ? 'Menos texto' : 'Es Mucho Texto';

                const textContent = this.previousElementSibling.previousElementSibling;
                textContent.style.display = moreText ? 'block' : 'none';
            });
        }
        text[i].append(options); // Added
    }
})();