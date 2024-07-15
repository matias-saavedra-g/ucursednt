// Créditos a https://github.com/Nyveon/tU-Cursos por la inspiración inicial

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

    const resizePreviewPDFConfig = JSON.parse(localStorage.getItem("settings")).features.resizePreviewPDF
    if (getLocalStorageItem("settings")) {
        if (!resizePreviewPDFConfig) {return}
    }

    // Resize PDF viewer
    const pdfViewerURL = /https:\/\/www\.u-cursos\.cl\/\w+\/\d+\/\d+\/\w+\/\d+\/material_docente\/detalle\?id=\d+/;

    if (pdfViewerURL.test(window.location.href)) {
        let obj = document.querySelector("object");
        if (obj) {
            obj.style.width = "100%";
            obj.style.height = "100%";
            obj.style.borderBottom = "0.8em solid #F2F3F4";

            let parent = obj.parentElement;
            if (parent) {
                parent.style.resize = "vertical";
                parent.style.overflow = "auto"; // Asegura que la propiedad de redimensionamiento funcione

                // Verificar si ya se ha mostrado el mensaje de alerta
                let firstHover = getLocalStorageItem("resizableFirstHover") !== true;
                parent.addEventListener("mouseover", function() {
                    if (firstHover) {
                        alert("¡Cambia mi tamaño en la esquina inferior derecha!");
                        setLocalStorageItem("resizableFirstHover", true); // Marcar que ya se mostró la alerta
                        firstHover = false; // Asegurar que la alerta se muestre solo una vez
                    }
                });
            }
        }
    }

})();