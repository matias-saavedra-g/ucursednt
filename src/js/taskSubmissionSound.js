// taskSubmissionSound.js - Adds dopamine releaser sound to task submission button
// Plays a satisfying sound when submitting tasks on U-Cursos

(async function() {

    // Function to set an item in Chrome Storage
    

    // Function to get an item from Chrome Storage
    

    const currentUrl = window.location.href;
    const taskDetailRegex = /^https:\/\/www\.u-cursos\.cl\/.*\/.*\/.*\/.*\/.*\/tareas\/detalle.*/;
    const taskAreaRegex  = /^https:\/\/www\.u-cursos\.cl\/.*\/.*\/.*\/.*\/.*\/tareas.*/;

    if (!taskAreaRegex.test(currentUrl)) {
        return;
    }

    // Check if the feature is enabled in settings
    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && !settings.features.taskSubmissionSound) {
        return; // Feature is disabled
    }

    // Play audio from a YouTube video using a hidden iframe
    function playYouTubeAudio(videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        iframe.width = '1';
        iframe.height = '1';
        iframe.style.cssText = 'position:fixed;bottom:0;right:0;opacity:0;pointer-events:none;';
        iframe.allow = 'autoplay; encrypted-media';
        iframe.frameBorder = '0';
        document.body.appendChild(iframe);
        // Remove after 15 seconds
        setTimeout(() => iframe.remove(), 15000);
    }

    // ── Redirect page: play the sound if a submission just happened ───────────
    if (!taskDetailRegex.test(currentUrl)) {
        const pending = await UcursedntUtils.Storage.get("pendingSubmissionSound");
        if (pending) {
            await UcursedntUtils.Storage.set("pendingSubmissionSound", false);
            const soundSettings = await UcursedntUtils.Storage.get("taskSubmissionSoundSettings");
            const videoId = (soundSettings && soundSettings.videoId) ? soundSettings.videoId : '_Z3ra0CxCE0';
            playYouTubeAudio(videoId);
            console.log('🎉 Task submission sound played!');
        }
        return;
    }

    // ── Detail page: wire up the submit button ────────────────────────────────

    // Function to add sound to submit button
    function addSoundToSubmitButton() {
        const submitButton = document.querySelector("#body > form > input[type=submit]:nth-child(4)");

        if (!submitButton) {
            const allSubmitButtons = document.querySelectorAll('input[type="submit"]');
            for (const button of allSubmitButtons) {
                if (button.value === "Entregar") {
                    addSoundHandler(button);
                    break;
                }
            }
            return;
        }

        addSoundHandler(submitButton);
    }

    function addSoundHandler(button) {
        if (button.dataset.soundAdded) {
            return;
        }

        button.dataset.soundAdded = "true";

        button.addEventListener('click', async function() {
            // Store flag so the redirect page plays the sound
            await UcursedntUtils.Storage.set("pendingSubmissionSound", true);

            // Visual feedback
            const originalTransform = button.style.transform;
            button.style.transform = 'scale(0.95)';
            setTimeout(() => { button.style.transform = originalTransform; }, 150);

            button.style.transition = 'box-shadow 0.3s ease';
            button.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.6)';
            setTimeout(() => { button.style.boxShadow = ''; }, 600);

            // Track first click achievement
            const firstClick = await UcursedntUtils.Storage.get("taskSubmissionSoundFirstClick");
            if (!firstClick) {
                await UcursedntUtils.Storage.set("taskSubmissionSoundFirstClick", true);
                console.log('🏆 Achievement unlocked: First Task Submission Sound!');
            }
        });

        button.addEventListener('mouseenter', function() {
            button.style.transition = 'all 0.2s ease';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        button.addEventListener('mouseleave', function() {
            button.style.transform = '';
            button.style.boxShadow = '';
        });

        console.log('🔊 Sound queued for task submission button');
    }

    function init() {
        addSoundToSubmitButton();

        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            node.querySelectorAll('input[type="submit"]').forEach(function(button) {
                                if (button.value === "Entregar" && !button.dataset.soundAdded) {
                                    addSoundHandler(button);
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
