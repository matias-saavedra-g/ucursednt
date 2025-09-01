// taskSubmissionSound.js - Adds dopamine releaser sound to task submission button
// Plays a satisfying sound when submitting tasks on U-Cursos

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

    // Check if we're on a task submission page
    const currentUrl = window.location.href;
    const taskDetailRegex = /^https:\/\/www\.u-cursos\.cl\/.*\/.*\/.*\/.*\/.*\/tareas\/detalle.*/;
    
    if (!taskDetailRegex.test(currentUrl)) {
        return; // Not on a task detail page
    }

    // Check if the feature is enabled in settings
    const settings = await getChromeStorageItem("settings");
    if (settings && settings.features && !settings.features.taskSubmissionSound) {
        return; // Feature is disabled
    }

    // Success sound effect (dopamine-releasing sound)
    let successSound = null;

    function initializeSound() {
        createSound();
        console.log('Success sound initialized with Web Audio API');
    }

    // Create sound using Web Audio API
    function createSound() {
        successSound = {
            play: function() {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Create a pleasant multi-tone chime sound
                    const playTone = (frequency, startTime, duration, volume = 0.2) => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
                        oscillator.type = 'triangle'; // Warmer sound than sine
                        
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
                        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.05);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
                        
                        oscillator.start(audioContext.currentTime + startTime);
                        oscillator.stop(audioContext.currentTime + startTime + duration);
                    };
                    
                    // Play the six-note sequence: E G E C D G (5th octave)
                    playTone(659.25, 0, 0.25, 0.15);    // E5
                    playTone(783.99, 0.15, 0.25, 0.15); // G5
                    playTone(1318.5, 0.3, 0.25, 0.15);   // E6
                    playTone(1046.5, 0.45, 0.25, 0.15);  // C6
                    playTone(1174.66, 0.6, 0.25, 0.15);  // D6
                    playTone(1567.98, 0.75, 0.3, 0.15);  // G6
                    
                } catch (error) {
                    console.log('Unable to play audio:', error);
                }
            }
        };
    }

    // Function to add sound to submit button
    function addSoundToSubmitButton() {
        // Find the submit button using the specific selector
        const submitButton = document.querySelector("#body > form > input[type=submit]:nth-child(4)");
        
        if (!submitButton) {
            // Fallback: look for submit button with "Entregar" value
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

    // Function to add sound handler to a button
    function addSoundHandler(button) {
        if (button.dataset.soundAdded) {
            return; // Already added
        }

        button.dataset.soundAdded = "true";
        
        // Add click event listener for the sound
        button.addEventListener('click', async function(event) {
            // Play the dopamine sound
            if (successSound) {
                successSound.play();
            }

            // Add visual feedback
            const originalStyle = button.style.transform;
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = originalStyle;
            }, 150);

            // Add a subtle green glow effect
            button.style.transition = 'box-shadow 0.3s ease';
            button.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.6)';
            setTimeout(() => {
                button.style.boxShadow = '';
            }, 600);

            // Track first click achievement
            const firstTaskSubmissionSound = await getChromeStorageItem("taskSubmissionSoundFirstClick");
            if (!firstTaskSubmissionSound) {
                await setChromeStorageItem("taskSubmissionSoundFirstClick", true);
                console.log('🏆 Achievement unlocked: First Task Submission Sound!');
            }

            console.log('🎉 Task submission sound played!');
        });

        // Add hover effect for better UX
        button.addEventListener('mouseenter', function() {
            button.style.transition = 'all 0.2s ease';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        button.addEventListener('mouseleave', function() {
            button.style.transform = '';
            button.style.boxShadow = '';
        });

        console.log('🔊 Dopamine sound added to task submission button');
    }

    // Initialize the feature
    function init() {
        initializeSound();
        
        // Add sound to existing button
        addSoundToSubmitButton();
        
        // Watch for dynamically added buttons
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const submitButtons = node.querySelectorAll('input[type="submit"]');
                            submitButtons.forEach(function(button) {
                                if (button.value === "Entregar" && !button.dataset.soundAdded) {
                                    addSoundHandler(button);
                                }
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
