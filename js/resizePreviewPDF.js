(function() {
    // Function to set an item in LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Function to get an item from LocalStorage
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
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
            let firstHover = getLocalStorageItem("resizableFirstHover") !== true;

            pdfContainer.addEventListener("mouseover", function() {
                if (firstHover) {
                    alert("¡Puedes cambiar el tamaño del visor PDF desde la esquina inferior derecha!");
                    setLocalStorageItem("resizableFirstHover", true);
                    firstHover = false;
                }
            });
        }
    }
})();
