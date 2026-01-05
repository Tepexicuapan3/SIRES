
document.addEventListener('DOMContentLoaded', function () {
    // Obtener la tabla y el formulario
    var tabla = document.getElementById('datos');
    var formulario = document.getElementById('miFormulario');

    // Añadir un evento de clic a las filas de la tabla
    tabla.addEventListener('click', function (event) {
        // Verificar si se hizo clic en una celda de la fila
        if (event.target.tagName === 'TD') {
            // Obtener la fila de la celda clicada
            var fila = event.target.parentNode;

            if (tabla.querySelector('.selected')) {
                tabla.querySelector('.selected').classList.remove('selected');
            }
            fila.classList.add("selected");

            document.querySelector('.registro').style.display = "none";
            document.querySelector('.modificacion').style.display = "block";

            // Obtener los datos de la fila
            var id = fila.querySelector('.text-center').innerText;
            var clinica = fila.querySelector('.texto-largo:nth-child(2)').innerText;
            var nombre = fila.querySelector('.texto-largo:nth-child(3)').innerText;
            var especialidad = fila.querySelector('.texto-largo:nth-child(4)').innerText;

            // Asignar los datos al formulario
            formulario.querySelector('#txtId').value = id;
            formulario.querySelector('#txtClinica').value = clinica;
            formulario.querySelector('#txtNombre').value = nombre;
            formulario.querySelector('#txtEspecialidad').value = especialidad;

            // Activar los inputs del formulario
            formulario.querySelector('#txtId').focus();
            formulario.querySelector('#txtNombre').focus();
            formulario.querySelector('#txtClinica').focus();
            formulario.querySelector('#txtEspecialidad').focus();
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var elementoError = document.querySelector('.error');
    if (elementoError) {
        // Desplazar la ventana de visualización hasta el elemento con clase 'error'
        elementoError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

function limpiarFormulario() {
    // Lógica para limpiar los campos del formulario
    // Puedes utilizar document.getElementById o jQuery para acceder y limpiar los campos según sea necesario
    $('#miFormulario')[0].reset();

    if (document.querySelector('.selected')) {
        document.querySelector('.selected').classList.remove('selected');
    }
    document.querySelector('.registro').style.display = "block";
    document.querySelector('.modificacion').style.display = "none";

    document.getElementById("txtId").value = "";
    document.getElementById("txtClinica").value = "";
    document.getElementById("txtNombre").value = "";
    document.getElementById("txtEspecialidad").value = "";
}


// Script para filtrar la tabla al escribir en el campo de búsqueda
$(document).ready(function () {
    $("#busqueda").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#datos tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});

function setAccion(opcion) {
    document.getElementById('accion').value = opcion;
    document.getElementById('miFormulario').submit();
}

//Cerrar ventanas de alertas en 3.4 segundos
setTimeout(function () {
    bootstrap.Alert.getOrCreateInstance(document.querySelector("#myAlert")).close();
}, 3500);


// Capturar el formulario
var form = document.getElementById("miFormulario");

// Agregar un evento de clic al botón
form.addEventListener("submit", function(event) {
    // Cambiar el valor del campo oculto al número de catálogo deseado
    form.elements["catalog_number"].value = "501";
});