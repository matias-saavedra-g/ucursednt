// easyCopyMembers.js

(async function() {

    // Función para establecer un dato en Chrome Storage
    async function setChromeStorageItem(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
        } catch (error) {
            console.error('Error setting Chrome storage item:', error);
        }
    }

    // Función para obtener un dato de Chrome Storage
    async function getChromeStorageItem(key) {
        try {
            const result = await chrome.storage.sync.get([key]);
            return result[key] || null;
        } catch (error) {
            console.error('Error getting Chrome storage item:', error);
            return null;
        }
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

    // Función para obtener los nombres de los integrantes de una categoría
    function getIntegrantes(categoria) {
        const integrantes = [];

        // Selector para obtener todos los nombres de integrantes en la categoría especificada
        const integranteElements = document.querySelectorAll(`tbody:nth-child(${categoria}) td.objetoflex.string.responsive-main > div:nth-child(2) > h1 > a`);

        // Iterar sobre cada elemento y extraer el contenido de texto
        for (const integranteElement of integranteElements) {
            integrantes.push(integranteElement.textContent.trim());
        }

        return integrantes;
    }

    // Función para copiar los integrantes en formato horizontal o vertical
    function copiarIntegrantes(formato, categoria) {
        const integrantes = getIntegrantes(categoria);
        let text = '';

        // Generar el texto según el formato especificado
        if (formato === 'horizontal') {
            text = integrantes.join('\t'); // Separador tabulación para formato horizontal
        } else if (formato === 'vertical') {
            text = integrantes.join('\n'); // Separador nueva línea para formato vertical
        }

        // Copiar al portapapeles y mostrar alerta con el nombre de la categoría
        copyToClipboard(text);
        const nombreCategoria = document.querySelector(`tbody:nth-child(${categoria-1}) > tr > td`).textContent.trim();
        console.log(`Integrantes de la categoría ${nombreCategoria} copiados al portapapeles en formato ${formato}`);

        // Cambia el ícono del botón de acuerdo con su formato y categoría, a un checkmark por 2 segundos
        const botonHorizontal = document.querySelector(`tbody:nth-child(${categoria-1}) > tr > td > div > button:nth-child(1)`);
        const botonVertical = document.querySelector(`tbody:nth-child(${categoria-1}) > tr > td > div > button:nth-child(2)`);
        if (formato === 'horizontal') {
            botonHorizontal.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => botonHorizontal.innerHTML = '<i class="fas fa-arrows-alt-h"></i>', 2000);
        } else if (formato === 'vertical') {
            botonVertical.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => botonVertical.innerHTML = '<i class="fas fa-arrows-alt-v"></i>', 2000);
        }
    }

    // Función para agregar botones para copiar integrantes en cada categoría
    /**
     * Adds buttons to copy members horizontally and vertically for each category.
     */
    function añadirBotones() {
        // Calcular el número total de categorías de integrantes
        const totalCategorias = document.querySelectorAll("tbody").length / 2;

        // Iterar sobre las categorías, empezando desde la posición 5 y aumentando de 2 en 2
        for (let categoria = 5; categoria <= 5 + 2 * totalCategorias; categoria += 2) {
            const botonesContainer = document.createElement('div');
            botonesContainer.style.position = "";
            botonesContainer.style.top = '0px';
            botonesContainer.style.marginLeft = '0px';
            botonesContainer.style.zIndex = '1000';
            botonesContainer.style.backgroundColor = "rgba(34, 34, 34, 0)";
            botonesContainer.style.color = "inherit";

            // Botón para copiar horizontalmente
            const botonHorizontal = document.createElement('button');
            botonHorizontal.innerHTML = '<i class="fas fa-arrows-alt-h"></i>'; // Icono FontAwesome para horizontal
            botonHorizontal.title = `Copiar Horizontal - Categoría ${categoria}`;
            botonHorizontal.style.background = 'transparent';
            botonHorizontal.style.border = 'transparent';
            botonHorizontal.style.cursor = 'pointer';
            botonHorizontal.style.marginRight = '0px';
            botonHorizontal.style.color = "inherit";
            botonHorizontal.onclick = () => copiarIntegrantes('horizontal', categoria);
            botonesContainer.appendChild(botonHorizontal);

            // Botón para copiar verticalmente
            const botonVertical = document.createElement('button');
            botonVertical.innerHTML = '<i class="fas fa-arrows-alt-v"></i>'; // Icono FontAwesome para vertical
            botonVertical.title = `Copiar Vertical - Categoría ${categoria}`;
            botonVertical.style.background = 'transparent';
            botonVertical.style.border = 'transparent';
            botonVertical.style.cursor = 'pointer';
            botonVertical.style.color = "inherit";
            botonVertical.onclick = () => copiarIntegrantes('vertical', categoria);
            botonesContainer.appendChild(botonVertical);

            // Insertar los botones en el contenedor de la categoría correspondiente
            const categoriaContainer = document.querySelector(`tbody:nth-child(${categoria-1}) > tr > td`);
            if (categoriaContainer) {
                categoriaContainer.appendChild(botonesContainer);
            }
        }
    }

    const settings = await getChromeStorageItem("settings");
    const easyCopyMembersConfig = settings?.features?.easyCopyMembers;
    if (!settings || !easyCopyMembersConfig) {
        return;
    }

    // Verificar si estamos en la página de integrantes del curso o grupo
    const integrantesUrlPattern = /https:\/\/www\.u-cursos\.cl\/\w+\/\d+\/\w+\/\w+\/\w+\/integrantes*/;
    const integrantesGrupoUrlPattern = /https:\/\/www\.u-cursos\.cl\/\w+\/\d+\/\w+\/\w+\/\w+\/\w+\/\w+\/\w+\/integrantes*/;
    if (integrantesUrlPattern.test(window.location.href) || integrantesGrupoUrlPattern.test(window.location.href)) {
        añadirBotones();
    }
})();
