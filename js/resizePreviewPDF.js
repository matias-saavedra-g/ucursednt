(async function() {
    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set({ [key]: value }, () => {
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
                chrome.storage.local.get([key], (result) => {
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

    // Check if the page URL matches the PDF viewer pattern
    const pdfViewerURL = /https:\/\/www\.u-cursos\.cl\/\w+\/\d+\/\d+\/\w+\/\d+\/material_docente\/detalle\?id=\d+/;

    if (pdfViewerURL.test(window.location.href)) {
        // Target the <object> element that contains the PDF
        let pdfContainer = document.querySelector("#body > div.streaming.no-movil > div");

        if (pdfContainer) {
            // Apply resizable and overflow properties
            pdfContainer.style.resize =  "vertical";
            pdfContainer.style.overflow = "hidden";
            pdfContainer.style.maxHeight = "1000%";

            // Let childs to be resized
            pdfContainer.children[0].style.width = "100%";
            pdfContainer.children[0].style.height = "100%";
            pdfContainer.children[0].style.maxWidth = "100%";
            pdfContainer.children[0].style.maxHeight = "100%";
            pdfContainer.children[0].style.overflow = "auto";

            // Show an alert message only once on hover
            let firstHover = await getChromeStorageItem("resizableFirstHover") !== true;

            pdfContainer.addEventListener("mouseover", async function() {
                if (firstHover) {
                    alert("¡Puedes cambiar el tamaño del visor PDF desde la esquina inferior derecha!");
                    await setChromeStorageItem("resizableFirstHover", true);
                    firstHover = false;
                }
            });
        }
    }
})();
