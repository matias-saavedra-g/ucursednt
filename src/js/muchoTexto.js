// Auto-injected extension alert wrapper (Tour Guide feature)
if (typeof window.showExtensionAlert === 'undefined') {
    window.showExtensionAlert = function(message) {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.get(['settings']).then(res => {
                // Suppress the alert if tourGuide is explicitly disabled
                if (res && res.settings && res.settings.features && res.settings.features.tourGuide === false) {
                    return; 
                }
                alert(message);
            }).catch(() => alert(message));
        } else {
            alert(message);
        }
    };
}

// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g el 2024.07.16

(async function() {
    const paragraph_limit = 5;
    const text = document.getElementsByClassName('texto');

    /**
     * Smartly counts the number of lines/paragraphs in an HTML element 
     * by checking for <p> tags, <br> tags, or plain text newlines.
     */
    function countLines(elem) {
        // 1. Check if the post uses <p> tags
        const pTags = elem.querySelectorAll('p').length;
        if (pTags > 0) return pTags;
        
        // 2. Check if the post uses <br> tags (1 break = 2 lines)
        const brTags = elem.querySelectorAll('br').length;
        if (brTags > 0) return brTags + 1;
        
        // 3. Fallback: Count visual newlines in the raw text
        const textLines = elem.innerText.split('\n').filter(line => line.trim().length > 0);
        return textLines.length > 0 ? textLines.length : 1;
    }

    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings) {
        const muchoTextoConfig = settings.features.muchoTexto;
        if (!muchoTextoConfig) {return}
    }

    // Add modern CSS styles for Mucho Texto buttons
    function addMuchoTextoStyles() {
        if (document.querySelector('#mucho-texto-styles')) return;

        const style = document.createElement('style');
        style.id = 'mucho-texto-styles';
        style.textContent = `
            .show-more-button {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-size: 12px;
                color: inherit;
                opacity: 0.6;
                text-decoration: underline;
                text-underline-offset: 3px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin: 6px 0 2px;
                transition: opacity 0.2s ease;
            }
            
            .show-more-button:hover {
                opacity: 1;
            }
            
            .show-more-button:active {
                opacity: 0.4;
            }
            
            .mucho-texto-content {
                overflow: hidden;
                max-height: 0;
                opacity: 0;
                transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
            }
            
            .mucho-texto-content.expanded {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Initialize styles
    addMuchoTextoStyles();

    for (let i = 0; i < text.length; i++) {
        const options = text[i].lastElementChild;
        // Safety check: Ensure we are only pulling out the options menu, not actual text
        const hasOptions = options && options.classList.contains('opciones');
        
        if (hasOptions) text[i].removeChild(options);

        const text_length = countLines(text[i]);
        
        if (text_length > paragraph_limit) {
            
            // 1. Create the wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'mucho-texto-content';
            
            // 2. Physically move all existing child nodes into the wrapper safely
            while (text[i].firstChild) {
                wrapper.appendChild(text[i].firstChild);
            }

            // 3. Create the toggle button
            const btn = document.createElement('button');
            btn.className = 'show-more-button';
            btn.setAttribute('data-more', '0');
            UcursedntUtils.DOM.safeSetHTML(btn, '<i class="fa-regular fa-expand-alt"></i> Es Mucho Texto');

            // 4. Attach event listener
            btn.addEventListener('click', async function () {
                if (await UcursedntUtils.Storage.get("showMoreFirstClick") !== true) {
                    window.showExtensionAlert("Mucho texto...");
                    await UcursedntUtils.Storage.set("showMoreFirstClick", true);
                }
                
                // Toggle de texto corto y largo
                const moreText = this.getAttribute('data-more') === "0";
                this.setAttribute('data-more', moreText ? "1" : "0");
                UcursedntUtils.DOM.safeSetHTML(this, moreText ? '<i class="fa-regular fa-compress-alt"></i> Menos texto' : '<i class="fa-regular fa-expand-alt"></i> Es Mucho Texto');

                const textContent = this.previousElementSibling;
                if (moreText) {
                    textContent.style.maxHeight = textContent.scrollHeight + "px";
                    textContent.classList.add("expanded");
                } else {
                    textContent.style.maxHeight = "0";
                    textContent.classList.remove("expanded");
                }
            });

            // 5. Inject the wrapper and button back into the post
            text[i].appendChild(wrapper);
            text[i].appendChild(btn);
        }
        
        // 6. Put the options footer back at the bottom if it existed
        if (hasOptions) text[i].appendChild(options);
    }
})();