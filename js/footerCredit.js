// footerCredit.js - Adds credit footer to U-Cursos pages
// Adds "Made with ❤️ by Matías Ignacio" with link to https://mt.mattia.cl

(async function() {

    // Function to get an item from Chrome Storage
    function getChromeStorageItem(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.get([key], (result) => {
                resolve(result[key] || null);
            });
        });
    }

    // Check if the feature is enabled in settings
    const settings = await getChromeStorageItem("settings");
    if (settings && settings.features && !settings.features.footerCredit) {
        return; // Feature is disabled
    }

    // Function to add the footer credit
    function addFooterCredit() {
        // Find the footer element
        const footer = document.getElementById('footer');
        
        if (footer) {
            // Check if credit already exists to avoid duplicates
            if (footer.querySelector('.matias-credit')) {
                return;
            }
            
            // Create the credit element
            const creditLi = document.createElement('li');
            creditLi.className = 'matias-credit';
            
            const creditLink = document.createElement('a');
            creditLink.href = 'https://mt.mattia.cl';
            creditLink.target = '_blank';
            creditLink.rel = 'noopener noreferrer';
            creditLink.innerHTML = 'Made with ❤️ by Matías Ignacio';
            
            creditLi.appendChild(creditLink);
            
            // Create a new ul element for the credit
            const creditUl = document.createElement('ul');
            
            // Add the credit li to the new ul
            creditUl.appendChild(creditLi);
            
            // Append the new ul to the footer
            footer.appendChild(creditUl);
        }
    }

    // Try to add the footer credit immediately
    addFooterCredit();

    // Also try after DOM content is loaded, in case the footer loads later
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addFooterCredit);
    }

    // Use a MutationObserver to watch for the footer being added dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.id === 'footer' || node.querySelector('#footer')) {
                        addFooterCredit();
                    }
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Stop observing after 10 seconds to avoid indefinite observation
    setTimeout(() => {
        observer.disconnect();
    }, 10000);

})();
