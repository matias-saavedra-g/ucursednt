// aiPermission.js - Pide el permiso opcional sobre los sitios de los asistentes IA y luego
// devuelve la solicitud al background, que abre el asistente en esta misma pestaña.

(async function() {
    'use strict';

    const request = document.getElementById('request');
    const status = document.getElementById('status');

    function showStatus(text) {
        request.hidden = true;
        status.hidden = false;
        status.textContent = text;
    }

    const token = location.hash.slice(1);
    const pending = token ? await browser.runtime.sendMessage({ type: 'ucd-ai-pending', token }) : null;
    if (!pending) {
        showStatus('Esta solicitud ya no está disponible. Vuelve a U-Cursos e inténtalo de nuevo.');
        return;
    }

    document.getElementById('file-name').textContent = `«${pending.payload.file.name}»`;
    document.getElementById('provider').textContent = pending.providerLabel;
    const list = document.getElementById('origins');
    pending.origins.forEach(origin => {
        const item = document.createElement('li');
        item.textContent = new URL(origin.replace('/*', '/')).hostname;
        list.appendChild(item);
    });
    request.hidden = false;

    document.getElementById('grant').addEventListener('click', async () => {
        // permissions.request debe ser lo primero dentro del gesto del usuario (Firefox)
        let granted = false;
        try {
            granted = await browser.permissions.request({ origins: pending.origins });
        } catch (error) {
            console.error('Permission request failed:', error);
        }
        if (!granted) {
            showStatus('Sin el permiso no se puede adjuntar el archivo. Puedes descargarlo desde U-Cursos y arrastrarlo al asistente.');
            return;
        }
        showStatus(`Abriendo ${pending.providerLabel}…`);
        await browser.runtime.sendMessage({ type: 'ucd-ai-granted', payload: pending.payload });
    });

    document.getElementById('cancel').addEventListener('click', () => window.close());
})();
