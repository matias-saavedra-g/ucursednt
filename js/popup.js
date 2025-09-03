// document.addEventListener('DOMContentLoaded', function () {
//     // Agregar evento al hacer clic en el elemento con id 'popup'
//     document.getElementById('popup').addEventListener('click', function () {
//         // Llamar a la función para copiar al portapapeles con los datos especificados
//         copyToClipboard('Matias Saavedra\n20.905.508-2\nBanco de Chile\nCuenta Corriente\n00-801-69864-02\nmsaavedrag@gmail.com');
//     });
// });

// Función para copiar texto al portapapeles utilizando el API del navegador
/**
 * Copies the given text to the clipboard.
 * @param {string} text - The text to be copied.
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
        // Alerta cuando se ha copiado correctamente el texto
        alert('Texto copiado al portapapeles');
    }, function (err) {
        // Manejo de errores en caso de fallo al copiar
        console.error('Error al copiar el texto: ', err);
    });
}