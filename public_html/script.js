
// CONFIGURACIÓN DEL ESTACIONAMIENTO

const CAPACIDAD = 20;
const TARIFA_INICIAL = 10;
const TARIFA_ADICIONAL = 5;
const TARIFA_MAXIMA = 60;

// DATOS DEL ADMINISTRADOR

const ADMIN_USUARIO = "admin";
const ADMIN_CONTRASENA = "2026";

let clienteActual = null;


// OBTENER DATOS GUARDADOS

function obtenerClientes() {
    return JSON.parse(localStorage.getItem("clientes")) || [];
}

function obtenerMovimientos() {
    return JSON.parse(localStorage.getItem("movimientos")) || [];
}

function guardarClientes(clientes) {
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

function guardarMovimientos(movimientos) {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}


// MOSTRAR Y CERRAR VENTANAS

function mostrarRegistro() {
    document.getElementById("registro").style.display = "block";
}

function mostrarLogin() {
    document.getElementById("login").style.display = "block";
}

function cerrarVentanas() {
    document.getElementById("registro").style.display = "none";
    document.getElementById("login").style.display = "none";
    document.getElementById("factura").style.display = "none";
}


// REGISTRO DE CLIENTES

document.getElementById("formRegistro").addEventListener("submit", function(e) {

    e.preventDefault();

    let clientes = obtenerClientes();

    let cliente = {
        nombre: document.getElementById("nombre").value.trim(),
        dpi: document.getElementById("dpi").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        correo: document.getElementById("correo").value.toLowerCase().trim(),
        placa: document.getElementById("placa").value.toUpperCase().trim(),
        vehiculo: document.getElementById("vehiculo").value,
        contrasena: document.getElementById("contrasena").value
    };

    let existe = clientes.find(c =>
        c.correo === cliente.correo ||
        c.placa === cliente.placa
    );

    if (existe) {
        alert("El correo o la placa ya están registrados.");
        return;
    }

    clientes.push(cliente);

    guardarClientes(clientes);

    clienteActual = cliente;

    document.getElementById("formRegistro").reset();

    cerrarVentanas();

    alert("Cliente registrado correctamente.");

    mostrarPanel();

});


// INICIO DE SESIÓN DE CLIENTES Y ADMINISTRADOR

document.getElementById("formLogin").addEventListener("submit", function(e) {

    e.preventDefault();

    let usuario = document.getElementById("correoLogin").value.toLowerCase().trim();

    let contrasena = document.getElementById("contrasenaLogin").value;

    // ACCESO DEL ADMINISTRADOR

    if (usuario === ADMIN_USUARIO &&
        contrasena === ADMIN_CONTRASENA) {

        clienteActual = null;

        document.getElementById("formLogin").reset();

        cerrarVentanas();

        document.getElementById("panel").style.display = "none";

        mostrarAdmin();

        alert("Bienvenido Administrador.");

        return;
    }

    // ACCESO DE CLIENTES

    let clientes = obtenerClientes();

    let cliente = clientes.find(c =>
        c.correo === usuario &&
        c.contrasena === contrasena
    );

    if (cliente) {

        clienteActual = cliente;

        document.getElementById("formLogin").reset();

        cerrarVentanas();

        alert("Bienvenido al sistema.");

        mostrarPanel();

    } else {

        alert("Usuario o contraseña incorrectos.");

    }

});


// MOSTRAR INFORMACIÓN DEL CLIENTE

function mostrarPanel() {

    document.getElementById("panel").style.display = "block";

    document.getElementById("adminPanel").style.display = "none";

    document.getElementById("bienvenida").textContent =
        clienteActual.nombre;

    document.getElementById("datosCliente").innerHTML =
        "<strong>Nombre:</strong> " + escapar(clienteActual.nombre) + "<br>" +
        "<strong>DPI:</strong> " + escapar(clienteActual.dpi) + "<br>" +
        "<strong>Teléfono:</strong> " + escapar(clienteActual.telefono) + "<br>" +
        "<strong>Correo:</strong> " + escapar(clienteActual.correo) + "<br>" +
        "<strong>Vehículo:</strong> " + escapar(clienteActual.vehiculo) + "<br>" +
        "<strong>Placa:</strong> " + escapar(clienteActual.placa);

    actualizarSistema();

    document.getElementById("panel").scrollIntoView({
        behavior: "smooth"
    });

}


// REGISTRAR INGRESO

function registrarIngreso() {

    let movimientos = obtenerMovimientos();

    let activo = movimientos.find(m =>
        m.correo === clienteActual.correo &&
        m.salida === null
    );

    if (activo) {

        alert("Ya tienes un vehículo dentro del estacionamiento.");

        return;
    }

    let ocupados = movimientos.filter(m =>
        m.salida === null
    ).length;

    if (ocupados >= CAPACIDAD) {

        alert("No hay espacios disponibles.");

        return;
    }

    let movimiento = {

        correo: clienteActual.correo,

        placa: clienteActual.placa,

        ingreso: new Date().toISOString(),

        salida: null,

        tiempo: "",

        pago: 0

    };

    movimientos.push(movimiento);

    guardarMovimientos(movimientos);

    alert("Ingreso registrado correctamente.");

    actualizarSistema();

}


// REGISTRAR SALIDA Y CALCULAR PAGO

function registrarSalida() {

    let movimientos = obtenerMovimientos();

    let indice = movimientos.findIndex(m =>
        m.correo === clienteActual.correo &&
        m.salida === null
    );

    if (indice === -1) {

        alert("No tienes ningún vehículo estacionado.");

        return;
    }

    let movimiento = movimientos[indice];

    let salida = new Date();

    let ingreso = new Date(movimiento.ingreso);

    let diferencia = Math.max(1, Math.ceil(
        (salida - ingreso) / 60000
    ));

    let horas = Math.ceil(diferencia / 60);

    let pago;

    if (horas <= 1) {

        pago = TARIFA_INICIAL;

    } else {

        pago = TARIFA_INICIAL +
            (horas - 1) * TARIFA_ADICIONAL;

    }

    pago = Math.min(pago, TARIFA_MAXIMA);

    movimiento.salida = salida.toISOString();

    movimiento.tiempo = horas + " hora(s)";

    movimiento.pago = pago;

    guardarMovimientos(movimientos);

    generarFactura(movimiento);

    actualizarSistema();

    alert("Salida registrada y pago calculado.");

}


// GENERAR FACTURA

function generarFactura(movimiento) {

    let ingreso = new Date(movimiento.ingreso);

    let salida = new Date(movimiento.salida);

    let contenido = `
        <h2>PARKCONTROL</h2>

        <h3>FACTURA / COMPROBANTE DE PAGO</h3>

        <hr>

        <p><strong>Cliente:</strong> ${escapar(clienteActual.nombre)}</p>

        <p><strong>DPI:</strong> ${escapar(clienteActual.dpi)}</p>

        <p><strong>Teléfono:</strong> ${escapar(clienteActual.telefono)}</p>

        <p><strong>Vehículo:</strong> ${escapar(clienteActual.vehiculo)}</p>

        <p><strong>Placa:</strong> ${escapar(movimiento.placa)}</p>

        <hr>

        <p><strong>Fecha de ingreso:</strong>
        ${ingreso.toLocaleString("es-GT")}</p>

        <p><strong>Fecha de salida:</strong>
        ${salida.toLocaleString("es-GT")}</p>

        <p><strong>Tiempo estacionado:</strong>
        ${movimiento.tiempo}</p>

        <p><strong>Primera hora:</strong>
        Q${TARIFA_INICIAL.toFixed(2)}</p>

        <p><strong>Horas adicionales:</strong>
        Q${TARIFA_ADICIONAL.toFixed(2)}</p>

        <hr>

        <h2>TOTAL A PAGAR: Q${movimiento.pago.toFixed(2)}</h2>

        <p>Estado del pago: PAGADO</p>

        <hr>

        <p>Gracias por utilizar ParkControl.</p>
    `;

    document.getElementById("contenidoFactura").innerHTML = contenido;

    document.getElementById("factura").style.display = "block";

}


// IMPRIMIR FACTURA

function imprimirFactura() {

    window.print();

}


// ACTUALIZAR ESPACIOS Y MOVIMIENTOS

function actualizarSistema() {

    let movimientos = obtenerMovimientos();

    let ocupados = movimientos.filter(m =>
        m.salida === null
    ).length;

    let disponibles = CAPACIDAD - ocupados;

    document.getElementById("total").textContent =
        CAPACIDAD;

    document.getElementById("ocupados").textContent =
        ocupados;

    document.getElementById("disponibles").textContent =
        disponibles;

    document.getElementById("espacios").textContent =
        disponibles;

    let activo = movimientos.find(m =>
        m.correo === clienteActual.correo &&
        m.salida === null
    );

    if (activo) {

        document.getElementById("estado").textContent =
            "Tu vehículo " + activo.placa +
            " se encuentra dentro del estacionamiento.";

    } else {

        document.getElementById("estado").textContent =
            "No tienes ningún vehículo estacionado.";

    }

    mostrarMovimientos();

}


// MOSTRAR ÚLTIMOS MOVIMIENTOS DEL CLIENTE

function mostrarMovimientos() {

    let movimientos = obtenerMovimientos();

    let propios = movimientos.filter(m =>
        m.correo === clienteActual.correo
    );

    let tabla = document.getElementById("movimientos");

    tabla.innerHTML = "";

    if (propios.length === 0) {

        tabla.innerHTML =
            "<tr><td colspan='6'>No hay movimientos registrados.</td></tr>";

        return;
    }

    propios.slice().reverse().forEach(m => {

        let ingreso = new Date(m.ingreso).toLocaleString("es-GT");

        let salida = m.salida
            ? new Date(m.salida).toLocaleString("es-GT")
            : "Pendiente";

        let tiempo = m.tiempo || "En curso";

        let pago = m.salida
            ? "Q" + m.pago.toFixed(2)
            : "Pendiente";

        let estado = m.salida
            ? "Finalizado"
            : "Estacionado";

        let fila = document.createElement("tr");

        [
            m.placa,
            ingreso,
            salida,
            tiempo,
            pago,
            estado
        ].forEach(valor => {

            let celda = document.createElement("td");

            celda.textContent = valor;

            fila.appendChild(celda);

        });

        tabla.appendChild(fila);

    });

}


// =====================================
// FUNCIONES DEL ADMINISTRADOR
// =====================================


// MOSTRAR PANEL ADMINISTRATIVO

function mostrarAdmin() {

    document.getElementById("adminPanel").style.display = "block";

    document.getElementById("panel").style.display = "none";

    actualizarAdmin();

    document.getElementById("adminPanel").scrollIntoView({
        behavior: "smooth"
    });

}


// ACTUALIZAR INFORMACIÓN DEL ADMINISTRADOR

function actualizarAdmin() {

    let clientes = obtenerClientes();

    let movimientos = obtenerMovimientos();

    let ocupados = movimientos.filter(m =>
        m.salida === null
    ).length;

    let disponibles = CAPACIDAD - ocupados;

    let ingresos = movimientos.reduce((total, m) => {

        return total + (m.pago || 0);

    }, 0);

    // ACTUALIZAR ESTADÍSTICAS

    document.getElementById("adminClientes").textContent =
        clientes.length;

    document.getElementById("adminOcupados").textContent =
        ocupados;

    document.getElementById("adminDisponibles").textContent =
        disponibles;

    document.getElementById("totalIngresos").textContent =
        "Ingresos totales: Q" + ingresos.toFixed(2);


    // MOSTRAR TODOS LOS CLIENTES

    let tablaClientes =
        document.getElementById("tablaClientes");

    tablaClientes.innerHTML = "";

    if (clientes.length === 0) {

        tablaClientes.innerHTML =
            "<tr><td colspan='5'>No hay clientes registrados.</td></tr>";

    }

    clientes.forEach(c => {

        let fila = document.createElement("tr");

        [
            c.nombre,
            c.dpi,
            c.telefono,
            c.correo,
            c.placa
        ].forEach(dato => {

            let celda = document.createElement("td");

            celda.textContent = dato;

            fila.appendChild(celda);

        });

        tablaClientes.appendChild(fila);

    });


    // MOSTRAR TODOS LOS MOVIMIENTOS

    let tablaMovimientos =
        document.getElementById("tablaAdminMovimientos");

    tablaMovimientos.innerHTML = "";

    if (movimientos.length === 0) {

        tablaMovimientos.innerHTML =
            "<tr><td colspan='6'>No hay movimientos registrados.</td></tr>";

    }

    movimientos.slice().reverse().forEach(m => {

        let cliente = clientes.find(c =>
            c.correo === m.correo
        );

        let fila = document.createElement("tr");

        let datos = [

            cliente ? cliente.nombre : "Desconocido",

            m.placa,

            new Date(m.ingreso).toLocaleString("es-GT"),

            m.salida
                ? new Date(m.salida).toLocaleString("es-GT")
                : "Pendiente",

            m.salida
                ? "Q" + m.pago.toFixed(2)
                : "Pendiente",

            m.salida ? "Finalizado" : "Estacionado"

        ];

        datos.forEach(dato => {

            let celda = document.createElement("td");

            celda.textContent = dato;

            fila.appendChild(celda);

        });

        tablaMovimientos.appendChild(fila);

    });

}


// EVITAR INTERPRETAR DATOS COMO HTML

function escapar(texto) {

    return String(texto).replace(/[&<>"']/g, caracter => {

        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[caracter];

    });

}


// CERRAR SESIÓN

function cerrarSesion() {

    clienteActual = null;

    document.getElementById("panel").style.display = "none";

    document.getElementById("adminPanel").style.display = "none";

    cerrarVentanas();

    alert("Sesión cerrada correctamente.");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}
