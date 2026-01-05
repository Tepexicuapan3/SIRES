
$(document).ready(function () {
    if (document.getElementById('txtRol')) {
        $('#txtRol').click(function() {
            var rol = $('#txtRol').val();
            actualizarRoles(rol);
        });    
    }

});

document.addEventListener("DOMContentLoaded", function() {
    const selectRol = document.getElementById("txtRol");
    if (!selectRol) return;

    function cargarDatosRol(idRol) {
        const inputTpRol = document.getElementById("txtTpRol");
        const inputDescRol = document.getElementById("txtDescRol");

        if (!idRol || !inputTpRol || !inputDescRol) {
            if (inputTpRol) inputTpRol.value = "";
            if (inputDescRol) inputDescRol.value = "";
            return;
        }

        fetch(`/herramientas/get_rol_data/${idRol}`)
            .then(response => response.json())
            .then(data => {
                inputTpRol.value = data.tp_rol || "";
                inputDescRol.value = data.desc_rol || "";
            })
            .catch(error => {
                console.error("Error al obtener datos del rol:", error);
            });
    }

    selectRol.addEventListener("change", function() {
        cargarDatosRol(this.value);
    });

    cargarDatosRol(selectRol.value); // inicial
});


    