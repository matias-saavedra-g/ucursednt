// Easter Egg 1: Delete U-Cursos menu item
// Assuming you have a reference to the UL element where you want to append the LI
const ulElement = document.querySelector("#menu_curso"); // Replace with your selector

if (ulElement) {
  const newLi = document.createElement('li');
  newLi.innerHTML = '<a href="#" class="opcion"><i class="fa-solid fa-trash"></i><span> Borrar U-Cursos</span></a>';
  ulElement.appendChild(newLi);

  newLi.addEventListener('click', () => {
    // Disables all user interaction with the page
    document.documentElement.style.pointerEvents = 'none';
    document.oncontextmenu = () => false;
    document.onselectstart = () => false;
    document.onkeydown = () => false;

    // Plays this video when the user clicks on the new LI https://www.youtube.com/watch?v=4DxBkW3r8pA&pp=ygUldGhpcyBpcyBteSBmaW5hbCBtZXNzYWdlIGdvb2RieWUgbWVtZQ%3D%3D
    const video = document.createElement('iframe');
    video.src = 'https://www.youtube.com/embed/4DxBkW3r8pA?autoplay=1';
    video.width = '1';
    video.height = '1';
    video.frameborder = '0';
    video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    video.allowfullscreen = true;
    document.body.appendChild(video);

    // Waits for the video to finish and then removes it
    video.addEventListener('ended', () => {
      video.remove();
    });

    // Fades the opacity of entire document to 0 in 5 s
    document.documentElement.style.transition = 'opacity 5s';
    document.documentElement.style.opacity = 0;
    setTimeout(() => {
      // Removes all content after 15 s
      document.documentElement.innerHTML = '';
    }, 15000);
  });
}

// Easter Egg 2: Growing Image on User Data Page
// Check if we're on the user data page
if (window.location.href.includes('/usuario/') && window.location.href.includes('/datos_usuario')) {
  let clickCount = 0;
  const targetImage = document.querySelector('#body > div > h1 > img');
  
  if (targetImage) {
    // Store original dimensions
    const originalWidth = targetImage.offsetWidth;
    const originalHeight = targetImage.offsetHeight;
    
    // Create counter element
    const counter = document.createElement('div');
    counter.id = 'easter-egg-counter';
    counter.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 20px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000000;
      border: 2px solid #ff6b6b;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      transition: all 0.3s ease;
      display: none;
    `;
    counter.textContent = '0 de 21';
    document.body.appendChild(counter);
    
    // Add CSS for smooth transitions and positioning
    targetImage.style.transition = 'transform 0.3s ease-in-out';
    targetImage.style.cursor = 'pointer';
    targetImage.style.transformOrigin = 'center';
    targetImage.style.position = 'relative';
    targetImage.style.zIndex = '999999';
    
    // Add hover effect
    targetImage.addEventListener('mouseenter', () => {
      if (clickCount < 21) {
        targetImage.style.animation = 'hover-shake 0.6s ease-in-out infinite';
      }
    });
    
    targetImage.addEventListener('mouseleave', () => {
      if (clickCount < 21) {
        targetImage.style.animation = '';
      }
    });
    
    targetImage.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      clickCount++;
      
      // Show and update counter
      counter.style.display = 'block';
      counter.textContent = `${clickCount} de 21`;
      
      // Add pulsing effect to counter
      counter.style.transform = 'scale(1.2)';
      setTimeout(() => {
        counter.style.transform = 'scale(1)';
      }, 200);
      
      // Change counter color as we get closer to 21
      if (clickCount > 15) {
        counter.style.background = 'rgba(255, 0, 0, 0.9)';
        counter.style.borderColor = '#ff0000';
        counter.style.boxShadow = '0 4px 20px rgba(255, 0, 0, 0.5)';
      } else if (clickCount > 10) {
        counter.style.background = 'rgba(255, 165, 0, 0.9)';
        counter.style.borderColor = '#ffa500';
        counter.style.boxShadow = '0 4px 20px rgba(255, 165, 0, 0.4)';
      }
      
      if (clickCount < 21) {
        // Progressive scaling: each click increases size by 15%
        const scale = 1 + (clickCount * 0.15);
        targetImage.style.transform = `scale(${scale})`;
        targetImage.style.position = 'fixed';
        targetImage.style.zIndex = '999999';
        
        // Calculate center position to keep image centered as it grows
        const rect = targetImage.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Position the image at the center of the viewport
        if (clickCount > 5) { // Start repositioning after a few clicks
          targetImage.style.left = `${centerX - (originalWidth * scale / 2)}px`;
          targetImage.style.top = `${centerY - (originalHeight * scale / 2)}px`;
        }
        
        // Add some visual feedback
        targetImage.style.filter = `hue-rotate(${clickCount * 17}deg) brightness(${1 + clickCount * 0.05})`;
        
        // Add shake effect on higher clicks
        if (clickCount > 10) {
          targetImage.style.animation = `shake 0.5s ease-in-out`;
          setTimeout(() => {
            targetImage.style.animation = '';
          }, 500);
        }
      } else {
        // After 21 clicks, explode the page!
        explodePage();
      }
    });
    
    // Add shake animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hover-shake {
        0%, 100% { transform: translateX(0) translateY(0) rotate(0deg) scale(${1 + (clickCount * 0.15)}); }
        25% { transform: translateX(-2px) translateY(-1px) rotate(-1deg) scale(${1 + (clickCount * 0.15)}); }
        50% { transform: translateX(2px) translateY(1px) rotate(1deg) scale(${1 + (clickCount * 0.15)}); }
        75% { transform: translateX(-1px) translateY(2px) rotate(-0.5deg) scale(${1 + (clickCount * 0.15)}); }
      }
      
      @keyframes shake {
        0%, 100% { transform: scale(${1 + (clickCount * 0.15)}) rotate(0deg); }
        10% { transform: scale(${1 + (clickCount * 0.15)}) rotate(-2deg); }
        20% { transform: scale(${1 + (clickCount * 0.15)}) rotate(2deg); }
        30% { transform: scale(${1 + (clickCount * 0.15)}) rotate(-2deg); }
        40% { transform: scale(${1 + (clickCount * 0.15)}) rotate(2deg); }
        50% { transform: scale(${1 + (clickCount * 0.15)}) rotate(-2deg); }
        60% { transform: scale(${1 + (clickCount * 0.15)}) rotate(2deg); }
        70% { transform: scale(${1 + (clickCount * 0.15)}) rotate(-2deg); }
        80% { transform: scale(${1 + (clickCount * 0.15)}) rotate(2deg); }
        90% { transform: scale(${1 + (clickCount * 0.15)}) rotate(-2deg); }
      }
      
      @keyframes explosion {
        0% { 
          transform: scale(4.15) rotate(0deg);
          opacity: 1;
          position: fixed !important;
          z-index: 999999 !important;
        }
        50% { 
          transform: scale(20) rotate(180deg);
          opacity: 0.8;
          position: fixed !important;
          z-index: 999999 !important;
        }
        100% { 
          transform: scale(50) rotate(360deg);
          opacity: 0;
          position: fixed !important;
          z-index: 999999 !important;
        }
      }
      
      .exploding {
        animation: explosion 2s ease-out forwards !important;
        filter: brightness(10) saturate(5) !important;
        position: fixed !important;
        z-index: 999999 !important;
        left: 50% !important;
        top: 50% !important;
        transform-origin: center center !important;
      }
    `;
    document.head.appendChild(style);
    
    function explodePage() {
      // Hide the counter
      counter.style.display = 'none';
      
      // Disable all interactions
      document.documentElement.style.pointerEvents = 'none';
      document.oncontextmenu = () => false;
      document.onselectstart = () => false;
      document.onkeydown = () => false;
      document.onmousedown = () => false;
      document.onmouseup = () => false;
      document.onclick = () => false;
      
      // Add explosion animation to the image
      targetImage.classList.add('exploding');
      
      // Create explosion effect
      setTimeout(() => {
        // Clear the entire body
        document.body.innerHTML = '';
        
        // Create the YouTube video iframe
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/WEEM2Qc9sUg?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0';
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.zIndex = '999999';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = false;
        
        // Set body styles to ensure full coverage
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.background = 'black';
        
        document.body.appendChild(iframe);
        
        // Additional security to prevent interaction
        setInterval(() => {
          document.documentElement.style.pointerEvents = 'none';
          document.body.style.pointerEvents = 'none';
        }, 100);
        
      }, 2000); // Wait for explosion animation to complete
    }
  }
}

// Easter Egg 3: Immediate Hover Effects with 5-Minute Discovery Helper
// Add immediate hover effects to specific elements, with automatic shake after 5 minutes if not discovered
(function() {
  const profileWidget = document.querySelector('#widget_perfil');
  const menuButton = document.querySelector('#navigation-wrapper > div.curso > div > div > h1 > a');
  
  let profileDiscovered = false;
  let menuDiscovered = false;
  
  // Add CSS for the hover effects
  const hoverStyle = document.createElement('style');
  hoverStyle.textContent = `
    @keyframes mysterious-glow {
      0%, 100% { 
        box-shadow: 0 0 5px rgba(138, 43, 226, 0.3);
        filter: brightness(1);
      }
      50% { 
        box-shadow: 0 0 20px rgba(138, 43, 226, 0.8), 0 0 30px rgba(138, 43, 226, 0.4);
        filter: brightness(1.2);
      }
    }
    
    @keyframes mysterious-pulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
      }
      50% { 
        transform: scale(1.05);
        opacity: 0.9;
      }
    }
    
    @keyframes mysterious-shake {
      0%, 100% { transform: translateX(0) translateY(0) rotate(0deg) scale(1); }
      10% { transform: translateX(-1px) translateY(-1px) rotate(-0.5deg) scale(1.02); }
      20% { transform: translateX(1px) translateY(1px) rotate(0.5deg) scale(1.04); }
      30% { transform: translateX(-1px) translateY(1px) rotate(-0.3deg) scale(1.06); }
      40% { transform: translateX(1px) translateY(-1px) rotate(0.3deg) scale(1.04); }
      50% { transform: translateX(-1px) translateY(-1px) rotate(-0.5deg) scale(1.02); }
      60% { transform: translateX(1px) translateY(1px) rotate(0.5deg) scale(1.04); }
      70% { transform: translateX(-1px) translateY(1px) rotate(-0.3deg) scale(1.06); }
      80% { transform: translateX(1px) translateY(-1px) rotate(0.3deg) scale(1.04); }
      90% { transform: translateX(-1px) translateY(-1px) rotate(-0.5deg) scale(1.02); }
    }
    
    @keyframes attention-shake {
      0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
      10% { transform: translateX(-2px) translateY(-1px) rotate(-1deg); }
      20% { transform: translateX(2px) translateY(1px) rotate(1deg); }
      30% { transform: translateX(-2px) translateY(1px) rotate(-0.5deg); }
      40% { transform: translateX(2px) translateY(-1px) rotate(0.5deg); }
      50% { transform: translateX(-2px) translateY(-1px) rotate(-1deg); }
      60% { transform: translateX(2px) translateY(1px) rotate(1deg); }
      70% { transform: translateX(-2px) translateY(1px) rotate(-0.5deg); }
      80% { transform: translateX(2px) translateY(-1px) rotate(0.5deg); }
      90% { transform: translateX(-2px) translateY(-1px) rotate(-1deg); }
    }
    
    .easter-egg-mysterious:hover {
      animation: mysterious-glow 1.5s ease-in-out infinite, mysterious-pulse 2s ease-in-out infinite, mysterious-shake 0.8s ease-in-out infinite !important;
      border-radius: 8px !important;
      transition: all 0.3s ease !important;
      cursor: help !important;
    }
    
    .easter-egg-mysterious {
      transition: all 0.3s ease !important;
    }
    
    .attention-needed {
      animation: attention-shake 1s ease-in-out 3 !important;
    }
  `;
  document.head.appendChild(hoverStyle);
  
  // Apply immediate hover effects to profile widget
  if (profileWidget) {
    profileWidget.classList.add('easter-egg-mysterious');
    
    // Track when user discovers the hover effect
    profileWidget.addEventListener('mouseenter', () => {
      profileDiscovered = true;
    });
    
    // Add click event for additional surprise
    profileWidget.addEventListener('click', (e) => {
      // Small visual feedback when clicked
      profileWidget.style.transform = 'scale(0.95)';
      setTimeout(() => {
        profileWidget.style.transform = 'scale(1)';
      }, 150);
      
      // Add a subtle message in console
      console.log('🎭 You found a hidden feature! Keep exploring...');
    });
  }
  
  // Apply immediate hover effects to menu button
  if (menuButton) {
    menuButton.classList.add('easter-egg-mysterious');
    
    // Track when user discovers the hover effect
    menuButton.addEventListener('mouseenter', () => {
      menuDiscovered = true;
    });
    
    // Add click event for additional surprise
    menuButton.addEventListener('click', (e) => {
      // Small visual feedback when clicked
      menuButton.style.transform = 'scale(0.95)';
      setTimeout(() => {
        menuButton.style.transform = 'scale(1)';
      }, 150);
      
      // Add a subtle message in console
      console.log('⋮ The dots hold secrets... 🔍');
    });
  }
  
  // After 5 minutes, shake undiscovered elements to draw attention
  setTimeout(() => {
    if (!profileDiscovered && profileWidget) {
      profileWidget.classList.add('attention-needed');
      setTimeout(() => {
        profileWidget.classList.remove('attention-needed');
      }, 3000); // Remove after 3 seconds (3 shake cycles)
    }
    
    if (!menuDiscovered && menuButton) {
      menuButton.classList.add('attention-needed');
      setTimeout(() => {
        menuButton.classList.remove('attention-needed');
      }, 3000); // Remove after 3 seconds (3 shake cycles)
    }
  }, 300000); // 5 minutes = 300,000 milliseconds
})();
