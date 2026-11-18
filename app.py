from pathlib import Path
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, jsonify

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "tienda.db"
app = Flask(__name__)


def conectar():
    conexion = sqlite3.connect(DB_PATH)
    conexion.row_factory = sqlite3.Row
    return conexion


def crear_tabla():
    with conectar() as conexion:
        conexion.execute("""CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT NOT NULL DEFAULT '',
            precio REAL NOT NULL CHECK(precio >= 0),
            cantidad INTEGER NOT NULL DEFAULT 0 CHECK(cantidad >= 0),
            categoria TEXT NOT NULL,
            imagen TEXT,
            precio_anterior REAL
        )""")
        columnas = {fila[1] for fila in conexion.execute("PRAGMA table_info(productos)")}
        if "imagen" not in columnas:
            conexion.execute("ALTER TABLE productos ADD COLUMN imagen TEXT")
        if "precio_anterior" not in columnas:
            conexion.execute("ALTER TABLE productos ADD COLUMN precio_anterior REAL")


def producto_json(fila):
    return {
        "id": fila["id"], "nombre": fila["nombre"],
        "cat": fila["categoria"], "categoria": fila["categoria"],
        "descripcion": fila["descripcion"], "precio": fila["precio"],
        "cantidad": fila["cantidad"], "viejo": fila["precio_anterior"],
        "imagen": fila["imagen"] or "/static/imagenes/logo.png"
    }


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/inventario")
def inventario():
    return render_template("inventario.html")


@app.route("/api/productos", methods=["GET"])
def listar_productos():
    with conectar() as conexion:
        filas = conexion.execute("SELECT * FROM productos ORDER BY id").fetchall()
    return jsonify([producto_json(fila) for fila in filas])


@app.route("/api/productos", methods=["POST"])
def agregar_producto():
    datos = request.get_json(silent=True) or request.form
    nombre = str(datos.get("nombre", "")).strip()
    categoria = str(datos.get("categoria", "")).strip()
    descripcion = str(datos.get("descripcion", "")).strip()
    imagen = str(datos.get("imagen", "")).strip() or "/static/imagenes/logo.png"
    try:
        precio = float(datos.get("precio", ""))
        cantidad = int(datos.get("cantidad", 0))
    except (TypeError, ValueError):
        return jsonify(error="El precio y la cantidad deben ser números válidos."), 400
    if not nombre or not categoria or precio < 0 or cantidad < 0:
        return jsonify(error="Completa el nombre y la categoría, y usa valores no negativos."), 400
    with conectar() as conexion:
        cursor = conexion.execute("""INSERT INTO productos
            (nombre, descripcion, precio, cantidad, categoria, imagen)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (nombre, descripcion, precio, cantidad, categoria, imagen))
        nuevo_id = cursor.lastrowid
    return jsonify(mensaje="Producto agregado correctamente.", id=nuevo_id), 201


@app.route("/api/compras", methods=["POST"])
def registrar_compra():
    """Valida todos los artículos y descuenta stock solo si la compra completa es posible."""
    datos = request.get_json(silent=True) or {}
    articulos = datos.get("articulos", [])

    if not isinstance(articulos, list) or not articulos:
        return jsonify(error="El carrito está vacío o no es válido."), 400

    cantidades = {}
    try:
        for articulo in articulos:
            producto_id = int(articulo.get("id"))
            cantidad = int(articulo.get("cantidad"))
            if producto_id <= 0 or cantidad <= 0:
                raise ValueError
            cantidades[producto_id] = cantidades.get(producto_id, 0) + cantidad
    except (AttributeError, TypeError, ValueError):
        return jsonify(error="Hay productos o cantidades no válidas en la compra."), 400

    conexion = conectar()
    try:
        conexion.execute("BEGIN IMMEDIATE")
        for producto_id, cantidad in cantidades.items():
            fila = conexion.execute(
                "SELECT nombre, cantidad FROM productos WHERE id = ?",
                (producto_id,)
            ).fetchone()

            if fila is None:
                conexion.rollback()
                return jsonify(error=f"No se encontró el producto con ID {producto_id}."), 404

            if fila["cantidad"] < cantidad:
                conexion.rollback()
                return jsonify(
                    error=f"Stock insuficiente para {fila['nombre']}. "
                          f"Disponibles: {fila['cantidad']}; solicitados: {cantidad}."
                ), 409

        for producto_id, cantidad in cantidades.items():
            conexion.execute(
                "UPDATE productos SET cantidad = cantidad - ? WHERE id = ?",
                (cantidad, producto_id)
            )

        conexion.commit()
        return jsonify(mensaje="Compra registrada y existencias descontadas correctamente.")
    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()


@app.route("/api/productos/<int:producto_id>/stock", methods=["PATCH"])
def actualizar_stock(producto_id):
    datos = request.get_json(silent=True) or {}
    try:
        cantidad = int(datos.get("cantidad"))
    except (TypeError, ValueError):
        return jsonify(error="La cantidad debe ser un número entero."), 400
    if cantidad < 0:
        return jsonify(error="La cantidad no puede ser negativa."), 400
    with conectar() as conexion:
        cursor = conexion.execute("UPDATE productos SET cantidad=? WHERE id=?", (cantidad, producto_id))
        if cursor.rowcount == 0:
            return jsonify(error="No se encontró ese producto."), 404
    return jsonify(mensaje="Existencias actualizadas correctamente.")


if __name__ == "__main__":
    crear_tabla()
    app.run(debug=True)
