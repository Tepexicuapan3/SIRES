document.addEventListener('DOMContentLoaded', function () {
    var tabla = document.getElementById('datos');
    
    if (tabla) {
        // Añadir un evento de clic a las filas de la tabla
        tabla.addEventListener('click', function (event) {
            // Verificar si se hizo clic en una celda de la fila
            if (event.target.tagName === 'TD') {

                if (document.getElementById('card')){
                    mostrarTarjeta('individual');
                }

                // Obtener la fila de la celda clicada
                var fila = event.target.parentNode;
                var celdas = fila.querySelectorAll(".input-form");

                if (tabla.querySelector('.selected')) {
                    tabla.querySelector('.selected').classList.remove('selected');
                }
                fila.classList.add("selected");

                document.querySelector('.registro').style.display = "none";
                document.querySelector('.modificacion').style.display = "block";
                document.querySelector('.mod_estatus').style.display = "none";
                
                if (document.querySelector('.new-registro')) {
                    document.querySelector('.new-registro').style.display = "block";
                    document.querySelector('.new-registro').style.visibility = "visible";
                }

                if (document.getElementById('txtIdEspec')) {
                    var desc_espec = fila.querySelector('[name="txtDescEspec"]').innerText;
                    actualizarEspecialidades(desc_espec);
                }

                if (document.getElementById('txtIdTpArea')) {
                    var tparea = fila.querySelector('[name="txtIdTpArea"]').innerText;
                    actualizarTpAreas(tparea);
                }

                if (document.getElementById('txtIdTrno')) {
                    var turno = fila.querySelector('[name="txtIdTrno"]').innerText;
                    actualizarTurnos(turno);
                }

                if (document.getElementById('txtIdClin')) {
                    var clinica = fila.querySelector('[name="txtIdClin"]').innerText;
                    actualizarClinicas(clinica);
                }

                if (document.getElementById('txtIdMenu')) {/*Me indica que estoy en la plantilla correcta por ejemplo cat_submenus.html */
                    var menu = fila.querySelector('[name="txtIdMenu"]').innerText; /*A que elemento lo voy aplicar  */
                    actualizarMenus(menu);
                }

                if (document.getElementById('txtIdSubmenu')) { 
                    var submenu = fila.querySelector('[name="txtIdSubmenu"]').innerText;
                    actualizarSubMenus(submenu);
                }

                if (document.getElementById('txtIdTpRol')) {
                    var tprol = fila.querySelector('[name="txtIdTpRol"]').innerText;
                    actualizarTipoRoles(tprol);
                }

            


                estatus = fila.querySelector('[name="txtEstatus"]').innerText;
                if (estatus === "INACTIVO") {
                    document.querySelector('.modificacion').style.display = "none";
                    document.querySelector('.mod_estatus').style.display = "block";
                    for (var i = 0; i < celdas.length; i++) {
                        var name = celdas[i].getAttribute("name");
                        input = document.getElementById(name);
                        input.value = celdas[i].innerText == "None" ? "" : celdas[i].innerText;
                        input.classList.add("input_readonly");
                    }
                }
                else {
                    for (var i = 0; i < celdas.length; i++) {
                        var name = celdas[i].getAttribute("name");
                        input = document.getElementById(name);
                        console.log(input);
                        input.value = celdas[i].innerText == "None" ? "" : celdas[i].innerText;
                        input.classList.remove("input_readonly");
                    }
                }

                id = document.getElementById('txtId');
                if (id) { id.classList.add("input_readonly"); }
                cve = document.getElementById('txtCve');
                if (cve) { cve.classList.add("input_readonly"); }
                versCie = document.getElementById('txtVersCie');
                if (versCie) { versCie.classList.add("input_readonly"); }

                if(document.getElementById("cat").value == "hospitales" || document.getElementById("cat").value == "laboratorios") {
                    entidad_fed = fila.querySelector('[name="txtEntidadFed"]').innerText;
                    municipio = fila.querySelector('[name="txtMunicipio"]').innerText;
                    asenta = fila.querySelector('[name="txtAsenta"]').innerText;
                    cp = fila.querySelector('[name="txtCp"]').innerText;
                    iniciarComboxCP(entidad_fed, municipio, asenta, cp);
                }                                                   
            }
        });
    }
});


document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('txtId')) { var id = document.getElementById('txtId').value; } 
    else if (document.getElementById('txtCve')) { id = document.getElementById('txtCve').value; }

    if (document.getElementById(id)) {
        var element = document.getElementById(id);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.firstElementChild.click();
    }
});

function limpiarFormulario() {
    if (document.querySelector('.selected')) { document.querySelector('.selected').classList.remove('selected'); }

    document.querySelector('.registro').style.display = "block";
    document.querySelector('.modificacion').style.display = "none";
    document.querySelector('.mod_estatus').style.display = "none";
    if (document.querySelector('.new-registro')) {
        document.querySelector('.new-registro').style.display = "none";
        document.querySelector('.new-registro').style.visibility = "hidden";
    }
    
    var inputs = document.getElementById('miFormulario').querySelectorAll('.input-form');
    Array.prototype.forEach.call(inputs, function (item) {
        item.value = "";
        item.classList.remove("input_readonly");
    });

    id = document.getElementById('txtId')
    if (id) {id.classList.add("input_readonly"); }
    
    if (document.getElementById("cat").value == "hospitales" || document.getElementById("cat").value == "laboratorios") { 
        document.getElementById('txtEntidadFed').value = 'CIUDAD DE MÉXICO'; 
        iniciarCombox();
    }
    
    //Implementación de ocultar los divs al limpiar el formulario
    const extraFieldsRow = document.getElementById('extraFieldsRow');
    // Ocultar la fila extra
    extraFieldsRow.style.display = 'none';
}

// Script para filtrar la tabla al escribir en el campo de búsqueda
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

$(document).ready(function () {
    $("#busqueda").on("keyup", function () {
        var value = removeAccents($(this).val().toLowerCase());
        if ($("#columnas")) {
            var selectedColumns = $("#columnas").val();
        }
        $("#datos tr").filter(function () {
            var row = $(this);
            var isVisible = false;
            row.find('.visible').each(function() {
                if (selectedColumns && selectedColumns.length > 0) {
                    selectedColumns.forEach(function(colIndex) {
                        var cellText = removeAccents(row.find('td').eq(colIndex).text().toLowerCase());
                        if (cellText.indexOf(value) > -1) {
                            isVisible = true;
                            return false;
                        }
                    });
                } else {
                    var cellText = removeAccents($(this).text().toLowerCase());
                    if (cellText.indexOf(value) > -1) {
                        isVisible = true;
                        return false;
                    }
                }
            });
            row.toggle(isVisible);
        });
    });
});

function enviarFormulario(value) {
    formulario = document.getElementById('miFormulario');
    var inputs = formulario.querySelectorAll('.input-form');
    document.getElementById('opcion').value = "";

    for (var i = 0; i < inputs.length; i++) {
        var valor = inputs[i].value.trim();
        
        if (valor === '') {
            inputs[i].value = valor;
        }
        else {
            valor = valor.replace(/\s+/g, ' ');
            inputs[i].value = valor;
        }
    }

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
    }
    else {
        document.getElementById('opcion').value = value;
        formulario.submit();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var inputs = document.getElementById('miFormulario').querySelectorAll('.input-form');

    Array.prototype.forEach.call(inputs, function (input) {
        input.addEventListener('keydown', function(event) {
            formulario = document.getElementById('miFormulario');
            var inputs = formulario.querySelectorAll('.input-form')
            if (event.key === 'Enter') {
                for (var i = 0; i < inputs.length; i++) {
                    var valor = inputs[i].value.trim();
                    
                    if (valor === '') {
                        inputs[i].value = valor;
                    }
                    else {
                        valor = valor.replace(/\s+/g, ' ');
                        inputs[i].value = valor;
                    }
                }

                if (!formulario.checkValidity() ) {
                    formulario.reportValidity();
                } 
                else {
                    event.preventDefault();
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var inputs = document.querySelectorAll('input.hora');

    Array.prototype.forEach.call(inputs, function (input) {
        input.addEventListener('input', function(event) {
            var valor = this.value.trim();

            valor = valor.replace(/[^0-9:]/g, '');

            if (/^([0-2])?$/.test(valor)) {
            }
            else if (/^([01][0-9]|2[0-3])?$/.test(valor)) {
                if (!isNaN(parseInt(event.data))) {
                    valor += ':';
                }
            }
            else if (/^([01][0-9]|2[0-3]):?$/.test(valor)) {
            } 
            else if (/^([01][0-9]|2[0-3]):([0-5])?$/.test(valor)) {
            } 
            else if (/^([01][0-9]|2[0-3]):([0-5][0-9])?$/.test(valor) || valor === '') {
                this.value = valor;
            } 
            else {
                valor = this.getAttribute('data-prev-value') || '';
            }

            this.value = valor;
            this.setAttribute('data-prev-value', this.value);
        });
    });
});

$(document).ready(function () {
    if (document.getElementById('txtIdEspec')) {
        $('#txtDescEspec').change(function() {
            var desc_espec = $('#txtDescEspec').val();
            actualizarEspecialidades(desc_espec);
        });
    }

    if (document.getElementById('txtIdTpArea')) {
        $('#txtIdTpArea').click(function() {
            var tparea = $('#txtIdTpArea').val();
            actualizarTpAreas(tparea);
        });
    }

    if (document.getElementById('txtIdTrno')) {
        $('#txtIdTrno').click(function() {
            var turno = $('#txtIdTrno').val();
            actualizarTurnos(turno);
        });
    }
    
    if (document.getElementById('txtIdClin')) {
        $('#txtIdClin').click(function() {
            var clinica = $('#txtIdClin').val();
            actualizarClinicas(clinica);
        });    
    }

    if (document.getElementById('txtIdMenu')) {
        $('#txtIdMenu').click(function() {
            var menu = $('#txtIdMenu').val();
            actualizarMenus(menu);
        });    
    }

    if (document.getElementById('txtIdTpRol')) {
        $('#txtIdTpRol').click(function() {
            var tprol = $('#txtIdTpRol').val();
            actualizarRoles(tprol);
        });    
    }

    if (document.getElementById('txtIdSubmenu')) {
        $('#txtIdSubmenu').click(function() {
            var submenu = $('#txtIdSubmenu').val();
            actualizarSubMenus(submenu);
        });    
    }

});

function imprimir() {
    var formulario = document.getElementById('formImpresion');

    if (formulario) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'nom_rep';
        input.value = document.getElementById('nom_rep').innerText;
        formulario.appendChild(input);

        var inputCont = document.createElement('input');
        inputCont.type = 'hidden';
        inputCont.name = 'tabla';
        inputCont.value = document.getElementById('titulo').innerText;
        formulario.appendChild(inputCont);

        formulario.submit();

        formulario.removeChild(input);
        formulario.removeChild(inputCont);
    }
}

document.getElementById('busqueda').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {  
        event.preventDefault();
    }
});