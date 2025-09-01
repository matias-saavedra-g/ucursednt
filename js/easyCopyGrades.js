// easyCopyGrades.js

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

    // Función para copiar texto al portapapeles
    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        navigator.clipboard.writeText(textArea.value)
            .then(() => {
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Error in copying text: ', err);
            });
        document.body.removeChild(textArea);
    }

    // Función para obtener las notas del alumno
    function getNotas() {
        const notas = [];

        // Obtener todos los elementos que coinciden
        const notaElements = document.querySelectorAll('td.number.gris > h1 > span');

        // Iterar sobre cada elemento y obtener el contenido de texto
        for (const notaElement of notaElements) {
            notas.push(notaElement.textContent.trim());
        }

        return notas;
    }

    // Función para copiar las notas en formato horizontal, vertical o suma
    function copiarNotas(formato) {
        const notas = getNotas();
        let text = '';

        // Generar el texto según el formato especificado
        if (formato === 'horizontal') {
            text = notas.join('	'); // Separador tabulación para formato horizontal
        } else if (formato === 'vertical') {
            text = notas.join('\n'); // Separador nueva línea para formato vertical
        } else if (formato === 'suma') {
            text = notas.join(' + '); // Suma de notas en formato de suma
        }

        // Copiar al portapapeles y mostrar alerta
        copyToClipboard(text);
        console.log('Notas copiadas al portapapeles en formato ' + formato);

        // Cambia el ícono del botón de acuerdo con su formato a un checkmark por 2 segundos
        if (formato === 'horizontal') {
            const botonHorizontal = document.querySelector('thead > div > button:nth-child(2)');
            botonHorizontal.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => botonHorizontal.innerHTML = '<i class="fa-solid fa-arrows-alt-h"></i>', 2000);
        } else if (formato === 'vertical') {
            const botonVertical = document.querySelector('thead > div > button:nth-child(3)');
            botonVertical.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => botonVertical.innerHTML = '<i class="fa-solid fa-arrows-alt-v"></i>', 2000);
        } else if (formato === 'suma') {
            const botonSuma = document.querySelector('thead > div > button:nth-child(1)');
            botonSuma.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => botonSuma.innerHTML = '<i class="fa-solid fa-plus"></i>', 2000);
        }
    }

    // Añadir botones para copiar en diferentes formatos
    /**
     * Adds buttons to the page for copying grades.
     */
    function añadirBotones() {
        const botonesContainer = document.createElement('div');
        botonesContainer.style.position = 'absolute';
        botonesContainer.style.top = '-35px';
        botonesContainer.style.right = '0';
        botonesContainer.style.marginRight = '20px';
        botonesContainer.style.zIndex = '1000';
        botonesContainer.style.textAlign = 'right';
        // Inherits the color of the text
        botonesContainer.style.color = "inherit";

        // Botón para copiar suma
        const botonSuma = document.createElement('button');
        botonSuma.innerHTML = '<i class="fa-solid fa-plus"></i>'; // Icono FontAwesome para suma
        botonSuma.title = 'Copiar Suma';
        botonSuma.style.background = 'transparent';
        botonSuma.style.border = 'transparent';
        botonSuma.style.cursor = 'pointer';
        botonSuma.style.marginRight = '0px';
        botonSuma.style.color = "inherit";
        botonSuma.onclick = () => copiarNotas('suma');
        botonesContainer.appendChild(botonSuma);

        // Botón para copiar horizontalmente
        const botonHorizontal = document.createElement('button');
        botonHorizontal.innerHTML = '<i class="fa-solid fa-arrows-alt-h"></i>'; // Icono FontAwesome para horizontal
        botonHorizontal.title = 'Copiar Horizontal';
        botonHorizontal.style.background = 'transparent';
        botonHorizontal.style.border = 'transparent';
        botonHorizontal.style.cursor = 'pointer';
        botonHorizontal.style.color = "inherit";
        botonHorizontal.onclick = () => copiarNotas('horizontal');
        botonesContainer.appendChild(botonHorizontal);

        // Botón para copiar verticalmente
        const botonVertical = document.createElement('button');
        botonVertical.innerHTML = '<i class="fa-solid fa-arrows-alt-v"></i>'; // Icono FontAwesome para vertical
        botonVertical.title = 'Copiar Vertical';
        botonVertical.style.background = 'transparent';
        botonVertical.style.border = 'transparent';
        botonVertical.style.cursor = 'pointer';
        botonVertical.style.color = "inherit";
        botonVertical.onclick = () => copiarNotas('vertical');
        botonesContainer.appendChild(botonVertical);

        // Insertar los botones en el contenedor de notas
        const notesStickyHead = document.querySelector("thead");
        if (notesStickyHead) {
            notesStickyHead.appendChild(botonesContainer);
        }
    }

    const settings = await getChromeStorageItem("settings");
    const easyCopyGradesConfig = settings?.features?.easyCopyGrades;
    if (!settings || !easyCopyGradesConfig) {
        return;
    }

    // Verificar si estamos en la página de notas del alumno
    // Cualquier después de notas/ seguido de cualquier cosa
    const notasUrlPattern = /https:\/\/www\.u-cursos\.cl\/\w+\/\d+\/\w+\/\w+\/\w+\/notas*/;
    if (notasUrlPattern.test(window.location.href)) {
        añadirBotones();
    }

})();