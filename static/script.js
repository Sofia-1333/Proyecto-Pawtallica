let productos = [];

// ==================================================
// 2. VARIABLES GENERALES
// ==================================================

const categorias = [
    ...new Set(productos.map(producto => producto.cat))
];

const $ = id => document.getElementById(id);

const fmt = numero =>
    "$" + numero.toLocaleString("es-CO");

let carrito = [];

try {
    carrito = JSON.parse(
        localStorage.getItem("pawCarrito")
    ) || [];
} catch (error) {
    carrito = [];
}


// ==================================================
// 3. MOSTRAR LAS TARJETAS DE LOS PRODUCTOS
// ==================================================

function tarjeta(producto) {
    return `
        <div class="card">

            <div class="foto">
                <img
                    src="${producto.imagen}"
                    alt="${producto.nombre}"
                    loading="lazy"
                    onerror="this.outerHTML='🎸';"
                >
            </div>

            <div class="info">

                <small>${producto.cat}</small>

                <strong>${producto.nombre}</strong>

                ${
                    producto.viejo
                    ? '<span class="etiqueta">¡OFERTA!</span>'
                    : ''
                }

                <div class="precio">
                    ${fmt(producto.precio)}

                    ${
                        producto.viejo
                        ? `<s>${fmt(producto.viejo)}</s>`
                        : ''
                    }
                </div>

                <p class="stock-producto" style="
                    margin:8px 0;
                    font-size:14px;
                    font-weight:600;
                    color:${Number(producto.cantidad) > 0 ? '#238636' : '#c62828'};
                ">
                    ${
                        Number(producto.cantidad) > 0
                        ? `Disponibles: ${producto.cantidad} unidades`
                        : 'Producto agotado'
                    }
                </p>

                <button
                    class="btn"
                    onclick="agregar(${producto.id})"
                    ${Number(producto.cantidad) <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}
                >
                    ${Number(producto.cantidad) > 0 ? 'Agregar al carrito' : 'Agotado'}
                </button>

            </div>
        </div>
    `;
}


// ==================================================
// 4. PINTAR LOS PRODUCTOS EN LA PÁGINA
// ==================================================

function pintar(id, lista) {
    const contenedor = $(id);

    if (!contenedor) {
        console.error("No se encontró el elemento:", id);
        return;
    }

    if (lista.length === 0) {
        contenedor.innerHTML =
            "<p>No se encontraron productos.</p>";
        return;
    }

    contenedor.innerHTML = lista
        .map(producto => tarjeta(producto))
        .join("");
}


// ==================================================
// 5. FILTRAR LOS PRODUCTOS POR CATEGORÍA
// ==================================================

function filtrarTienda(categoria, boton) {
    document.querySelectorAll("#filtros button")
        .forEach(botonActual => {
            botonActual.classList.remove("activo");
        });

    if (boton) {
        boton.classList.add("activo");
    }

    const lista = categoria === "Todos"
        ? productos
        : productos.filter(
            producto => producto.cat === categoria
        );

    pintar("g-tienda", lista);
}


// ==================================================
// 6. INICIAR LA PÁGINA
// ==================================================

function iniciar() {

    // Productos destacados
    pintar("g-destacados", productos.slice(0, 4));

    // Todos los productos
    pintar("g-tienda", productos);

    // Productos en oferta
    pintar(
        "g-ofertas",
        productos.filter(producto => producto.viejo)
    );

    // Botones de categorías
    $("filtros").innerHTML = [
        "Todos",
        ...categorias
    ].map((categoria, indice) => `
        <button
            class="${indice === 0 ? "activo" : ""}"
            onclick="filtrarTienda('${categoria}', this)"
        >
            ${categoria}
        </button>
    `).join("");

    // Tarjetas de categorías
    $("g-categorias").innerHTML = categorias.map(categoria => {

        const cantidad = productos.filter(
            producto => producto.cat === categoria
        ).length;

        return `
            <div
                class="card"
                style="cursor:pointer"
                onclick="irACategoria('${categoria}')"
            >
                <div class="foto">🎸</div>

                <div class="info">
                    <strong>${categoria}</strong>

                    <small>
                        ${cantidad}
                        producto${cantidad > 1 ? "s" : ""}
                    </small>
                </div>
            </div>
        `;
    }).join("");

    dibujarCarrito();
    // Generar categorías automáticamente
const categorias = [...new Set(
    productos
        .map(producto => producto.cat)
        .filter(categoria => categoria && categoria.trim() !== "")
)];

// Mostrar las categorías
const contenedor = document.getElementById("g-categorias");

if (contenedor) {
    contenedor.innerHTML = categorias.map(categoria => `
        <button onclick="irACategoria('${categoria.replace(/'/g, "\\'")}')">
            ${categoria}
        </button>
    `).join("");
}
}


// ==================================================
// 7. ABRIR UNA CATEGORÍA
// ==================================================

function irACategoria(categoria) {

    irA("tienda");

    const boton = [
        ...document.querySelectorAll("#filtros button")
    ].find(elemento => elemento.textContent.trim() === categoria);

    if (boton) {
        filtrarTienda(categoria, boton);
    }
}


// ==================================================
// 8. NAVEGAR ENTRE LAS SECCIONES
// ==================================================

function irA(vista) {

    document.querySelectorAll(".vista")
        .forEach(seccion => {
            seccion.classList.remove("activa");
        });

    const destino = $("v-" + vista);

    if (!destino) {
        console.error("No existe la sección:", vista);
        return;
    }

    destino.classList.add("activa");

    document.querySelectorAll("nav button")
        .forEach(boton => {
            boton.classList.toggle(
                "activo",
                boton.dataset.vista === vista
            );
        });

    cerrarTodo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==================================================
// 9. GUARDAR EL CARRITO
// ==================================================

function guardar() {
    try {
        localStorage.setItem(
            "pawCarrito",
            JSON.stringify(carrito)
        );
    } catch (error) {
        console.warn("No se pudo guardar el carrito.");
    }
}


// ==================================================
// 10. AGREGAR PRODUCTOS AL CARRITO
// ==================================================

function agregar(id) {

    const producto = productos.find(
        elemento => elemento.id === id
    );

    if (!producto) {
        alert("No se encontró el producto.");
        return;
    }

    const stockDisponible = Number(producto.cantidad) || 0;
    const existente = carrito.find(
        elemento => elemento.id === id
    );
    const cantidadEnCarrito = existente ? existente.cant : 0;

    if (stockDisponible <= 0) {
        alert("Este producto está agotado.");
        return;
    }

    if (cantidadEnCarrito >= stockDisponible) {
        alert(`Solo hay ${stockDisponible} unidades disponibles de ${producto.nombre}.`);
        return;
    }

    if (existente) {
        existente.cant++;
    } else {
        carrito.push({
            id: id,
            cant: 1
        });
    }

    guardar();
    dibujarCarrito();

    alert(`¡${producto.nombre} se agregó al carrito! 🤘`);

}


// ==================================================
// 11. CAMBIAR LA CANTIDAD DE PRODUCTOS
// ==================================================

function cambiar(id, diferencia) {

    const producto = carrito.find(
        elemento => elemento.id === id
    );

    if (!producto) {
        return;
    }

    const datosProducto = productos.find(p => p.id === id);
    const stockDisponible = datosProducto ? Number(datosProducto.cantidad) : 0;

    if (diferencia > 0 && producto.cant >= stockDisponible) {
        toast(`Solo hay ${stockDisponible} unidades disponibles.`);
        return;
    }

    producto.cant += diferencia;

    if (producto.cant <= 0) {
        carrito = carrito.filter(
            elemento => elemento.id !== id
        );
    }

    guardar();
    dibujarCarrito();
}


// ==================================================
// 12. VACIAR EL CARRITO
// ==================================================

function vaciar() {

    carrito = [];

    guardar();
    dibujarCarrito();

    toast("El carrito está vacío.");
}


// ==================================================
// 13. MOSTRAR EL CARRITO
// ==================================================

function dibujarCarrito() {

    const contenedor = $("items");

    if (!contenedor) {
        return;
    }

    let total = 0;
    let cantidadTotal = 0;

    const elementos = carrito.map(elemento => {

        const producto = productos.find(
            p => p.id === elemento.id
        );

        if (!producto) {
            return "";
        }

        if (elemento.cant > Number(producto.cantidad)) {
            elemento.cant = Number(producto.cantidad);
        }
        if (elemento.cant <= 0) {
            return "";
        }

        total += producto.precio * elemento.cant;
        cantidadTotal += elemento.cant;

        return `
            <div class="item">

                <span>
                    <img
                        src="${producto.imagen}"
                        alt=""
                        style="width:45px;height:45px;object-fit:contain;vertical-align:middle"
                        onerror="this.outerHTML='🎸';"
                    >

                    ${producto.nombre}

                    <br>

                    <small>${fmt(producto.precio)}</small>
                </span>

                <span class="cant">

                    <button
                        onclick="cambiar(${producto.id}, -1)"
                    >
                        −
                    </button>

                    ${elemento.cant}

                    <button
                        onclick="cambiar(${producto.id}, 1)"
                    >
                        +
                    </button>

                </span>

            </div>
        `;
    }).join("");

    contenedor.innerHTML = elementos ||
        "<p style='color:var(--gris)'>Tu carrito está vacío.</p>";

    $("total").textContent = fmt(total);
    $("contador").textContent = cantidadTotal;
}


// ==================================================
// 14. FINALIZAR COMPRA
// ==================================================

let procesandoCompra = false;

async function pagar() {

    if (carrito.length === 0) {
        toast("Primero agrega productos al carrito.");
        return;
    }

    let total = 0;
    let resumen = "🤘 PAWTALLICA - RESUMEN DE COMPRA\n\n";

    carrito.forEach(elemento => {

        const producto = productos.find(
            p => p.id === elemento.id
        );

        if (!producto) return;

        const subtotal = producto.precio * elemento.cant;

        total += subtotal;

        resumen += `${producto.nombre}\n`;
        resumen += `Cantidad: ${elemento.cant}\n`;
        resumen += `Subtotal: ${fmt(subtotal)}\n\n`;
    });

    resumen += "--------------------------\n";
    resumen += `TOTAL A PAGAR: ${fmt(total)}\n`;

    if (!confirm(resumen + "\n¿Deseas finalizar tu compra?")) {
        toast("Tu compra sigue pendiente.");
        return;
    }

    try {

        const respuesta = await fetch("/api/compras", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                articulos: carrito.map(elemento => ({
                    id: elemento.id,
                    cantidad: elemento.cant
                }))
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(
                resultado.error ||
                "No fue posible completar la compra."
            );
            return;
        }

        // Vaciar el carrito solamente después
        // de confirmar la compra en el servidor.

        carrito = [];
        guardar();
        dibujarCarrito();

        // Actualizar los productos y el inventario.

        try {

            const actualizacion = await fetch("/api/productos");

            if (actualizacion.ok) {
                productos = await actualizacion.json();
                iniciar();
            }

        } catch (error) {
            console.error("Error actualizando inventario:", error);
        }

        alert(
            "¡GRACIAS POR COMPRAR EN PAWTALLICA! 🤘\n\n" +
            "Tu compra fue registrada correctamente.\n\n" +
            "Total: " + fmt(total)
        );

        cerrarTodo();

    } catch (error) {

        console.error("Error al registrar la compra:", error);

        alert(
            "No se pudo conectar con el servidor. " +
            "Tu carrito se conservó y no se descontó stock."
        );

    }

}

// ==================================================
// 15. BUSCAR PRODUCTOS
// ==================================================

function buscar() {

    const campo = $("q");

    if (!campo) {
        return;
    }

    const texto = campo.value.trim().toLowerCase();

    if (!texto) {
        toast("Escribe el nombre de un producto.");
        return;
    }

    const resultados = productos.filter(producto =>
        (
            producto.nombre + " " +
            producto.cat
        ).toLowerCase().includes(texto)
    );

    pintar("g-busqueda", resultados);

    $("t-busqueda").textContent =
        `Resultados para «${texto}»`;

    irA("busqueda");
}


// ==================================================
// 16. INICIAR SESIÓN
// ==================================================

function entrar() {

    const nombre = $("u-nombre").value.trim();
    const correo = $("u-correo").value.trim();

    if (!nombre || !correo.includes("@")) {
        toast("Escribe tu nombre y un correo válido.");
        return;
    }

    try {
        localStorage.setItem("pawUser", nombre);
    } catch (error) {}

    estadoUsuario(nombre);

    toast("¡Bienvenido, " + nombre + "! 🤘");
}


// ==================================================
// 17. CERRAR SESIÓN
// ==================================================

function salir() {

    try {
        localStorage.removeItem("pawUser");
    } catch (error) {}

    estadoUsuario(null);

    toast("Has cerrado sesión.");
}


// ==================================================
// 18. MOSTRAR EL ESTADO DEL USUARIO
// ==================================================

function estadoUsuario(nombre) {

    $("u-form").style.display =
        nombre ? "none" : "block";

    $("u-ok").style.display =
        nombre ? "block" : "none";

    $("u-titulo").textContent =
        nombre ? "Mi cuenta" : "Iniciar sesión";

    if (nombre) {
        $("u-saludo").textContent =
            "Hola, " + nombre +
            ". ¡Tu mascota ya es una estrella de rock!";
    }
}


// ==================================================
// 19. INFORMACIÓN DE PAWTALLICA
// ==================================================

const textos = {

    "Sobre nosotros":
        "Pawtallica nació del amor por el rock y por las mascotas. Ofrecemos productos para que perros y gatos tengan su propio estilo rockero.",

    "Términos y condiciones":
        "Los productos están sujetos a disponibilidad. Los precios se expresan en pesos colombianos. Antes de realizar una compra, revisa las características del producto.",

    "Política de privacidad":
        "Los datos ingresados en esta demostración se guardan localmente en el navegador. Esta página no cuenta con un sistema real de procesamiento de pedidos.",

    "Preguntas frecuentes":
        "¿Hay productos para perros y gatos? Sí, la tienda está pensada para ambas mascotas. Consulta las tallas y características antes de comprar.",

    "Métodos de pago":
        "Esta página es una demostración y no procesa pagos reales. Los métodos de pago deberán configurarse cuando la tienda esté preparada para vender.",

    "Envíos y devoluciones":
        "Las condiciones de envío, cambios y devoluciones deberán confirmarse antes de realizar una compra real."
};


// ==================================================
// 20. ABRIR PANELES
// ==================================================

function abrir(id) {

    cerrarTodo();

    const fondo = $("fondo");
    const panel = $(id);

    if (fondo && panel) {
        fondo.classList.add("abierto");
        panel.classList.add("abierto");
    }
}


// ==================================================
// 21. CERRAR PANELES
// ==================================================

function cerrarTodo() {

    const fondo = $("fondo");

    if (fondo) {
        fondo.classList.remove("abierto");
    }

    [
        "carrito",
        "buscador",
        "usuario",
        "infoModal"
    ].forEach(id => {
        const panel = $(id);

        if (panel) {
            panel.classList.remove("abierto");
        }
    });
}


// ==================================================
// 22. MOSTRAR INFORMACIÓN
// ==================================================

function info(titulo) {

    $("i-titulo").textContent = titulo;

    $("i-texto").textContent =
        textos[titulo] || "Información no disponible.";

    abrir("infoModal");
}


// ==================================================
// 23. MOSTRAR MENSAJES TEMPORALES
// ==================================================

let temporizadorToast;

function toast(mensaje) {

    const aviso = $("toast");

    if (!aviso) {
        return;
    }

    aviso.textContent = mensaje;

    aviso.classList.add("ver");

    clearTimeout(temporizadorToast);

    temporizadorToast = setTimeout(() => {
        aviso.classList.remove("ver");
    }, 2500);
}


// ==================================================
// 24. CARGAR LA PÁGINA
// ==================================================

async function cargarPawtallica() {

    try {
        const respuesta = await fetch("/api/productos");
        if (!respuesta.ok) throw new Error("No fue posible consultar el inventario");
        productos = await respuesta.json();
        iniciar();
    } catch (error) {
        console.error(error);
        toast("No se pudieron cargar los productos. Verifica que Flask esté ejecutándose.");
        return;
    }

    let usuarioGuardado = null;

    try {
        usuarioGuardado = localStorage.getItem("pawUser");
    } catch (error) {}

    estadoUsuario(usuarioGuardado);

    console.log("PAWTALLICA está funcionando correctamente.");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        cargarPawtallica
    );
} else {
    cargarPawtallica();
}
// Ampliar imágenes de productos al hacer clic
const visor = document.getElementById("visor-imagen");
const imagenAmpliada = document.getElementById("imagen-ampliada");
const cerrarVisor = document.getElementById("cerrar-visor");

document.addEventListener("click", function (evento) {
const imagen = evento.target.closest(".foto img");

if (imagen) {
    imagenAmpliada.src = imagen.src;
    imagenAmpliada.alt = imagen.alt || "Imagen ampliada del producto";
    visor.classList.add("abierto");
}

});

// Cerrar con el botón
cerrarVisor.addEventListener("click", function () {
visor.classList.remove("abierto");
});

// Cerrar al pulsar fuera de la imagen
visor.addEventListener("click", function (evento) {
if (evento.target === visor) {
visor.classList.remove("abierto");
}
});

// Cerrar con la tecla Escape
document.addEventListener("keydown", function (evento) {
if (evento.key === "Escape") {
visor.classList.remove("abierto");
}
});