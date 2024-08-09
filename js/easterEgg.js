// Assuming you have a reference to the UL element where you want to append the LI

const ulElement = document.querySelector("#menu_curso"); // Replace with your selector

const newLi = document.createElement('li');
newLi.innerHTML = '<a href="#" class="opcion"><span class="glyphicon glyphicon-trash"></span><span> Borrar U-Cursos</span></a>';
ulElement.appendChild(newLi);

newLi.addEventListener('click', () => {
  document.documentElement.innerHTML = ''; // Removes all content
});
