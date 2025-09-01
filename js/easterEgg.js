// Assuming you have a reference to the UL element where you want to append the LI

const ulElement = document.querySelector("#menu_curso"); // Replace with your selector

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
  const video = document.createElement
  ('iframe');
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
