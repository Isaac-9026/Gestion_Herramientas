# Gestión de Herramientas

Sistema web para la gestión de inventario, herramientas físicas, préstamos, devoluciones, compras, proveedores, personal y autenticación de usuarios.

Desarrollado con **Node.js**, **Express**, **MySQL** y **JavaScript Vanilla** bajo una arquitectura **SPA**.

---

## Características principales

### Inventario
- Gestión de productos
- Gestión de herramientas físicas
- Control de estado
- Control de disponibilidad
- Ubicación de herramientas

### Operaciones
- Registro de compras
- Préstamos de herramientas
- Devoluciones por herramienta
- Cierre automático de préstamos
- Historial completo

### Administración
- Personal
- Personas
- Empleados
- Usuarios
- Roles
- Proveedores
- Catálogos: categorías, marcas, ubicaciones y áreas

### Seguridad
- Login con JWT
- Protección de rutas
- Sesión de usuario
- Control de acceso

### Reportes
- Comprobante PDF de préstamo
- Detalle de préstamo

---

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- MySQL

### Frontend
- HTML5
- CSS3
- JavaScript Vanilla
- Bootstrap Icons

### Base de datos
- MySQL
- Transacciones SQL
- Arquitectura relacional

---

## Estructura del proyecto

```txt
Gestion_Herramientas/
├── config/
│   └── db.js
│
├── middlewares/
│   └── auth.middleware.js
│
├── routes/
│   ├── auth.js
│   ├── areas.js
│   ├── categorias.js
│   ├── compras.js
│   ├── empleados.js
│   ├── herramientas.js
│   ├── marcas.js
│   ├── prestamos.js
│   ├── productos.js
│   ├── proveedores.js
│   ├── roles.js
│   └── ubicaciones.js
│
├── database/
│   └── schema.sql
│
├── reports/
│   └── prestamoPdf.js
│
├── public/
│   ├── css/
│   ├── js/
│   │   ├── modules/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── login.js
│   │   ├── utils.js
│   │   └── catalogoBase.js
│   │
│   ├── views/
│   ├── index.html
│   └── login.html
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

## Modelo de datos

Tablas principales:

- categorias
- marcas
- ubicaciones
- areas
- roles
- personas
- empleados
- usuarios
- productos
- proveedores
- compras
- detalle_compra
- herramientas
- prestamos
- detalle_prestamo

---

## Flujo principal del sistema

1. Se registran productos.
2. Se registran compras.
3. Las compras generan herramientas.
4. Se registran préstamos.
5. Las herramientas pasan a no disponibles.
6. Se registran devoluciones.
7. El sistema cierra automáticamente el préstamo cuando corresponde.

---

## Reglas de negocio

- Una herramienta solo puede estar en un préstamo activo.
- Una herramienta no puede prestarse si está inactiva o dañada.
- Los préstamos usan fecha límite.
- Las devoluciones registran estado, observaciones y usuario receptor.
- El préstamo se cierra automáticamente cuando todas las herramientas son devueltas.
- Los catálogos usan soft delete.
- El historial no se elimina físicamente.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Isaac-9026/Gestion_Herramientas.git
cd Gestion_Herramientas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=prestamo_herramientas
JWT_SECRET=clave_secreta_segura
```

### 4. Importar la base de datos

Ejecutar el script `database.sql` en MySQL.

### 5. Iniciar la aplicación

```bash
node server.js
```

---

## Usuario inicial

### Login de ejemplo
```txt
Usuario: admin
Contraseña: 123456
```

---

## Endpoints principales

### Autenticación
- `POST /api/auth/login`
- `GET /api/auth/me`

### Préstamos
- `GET /api/prestamos`
- `GET /api/prestamos/:id`
- `POST /api/prestamos`
- `PUT /api/prestamos/devolver/:id_detalle`
- `GET /api/prestamos/:id/pdf`

### Compras
- `GET /api/compras`
- `GET /api/compras/:id`
- `GET /api/compras/opciones`
- `POST /api/compras`

### Herramientas
- `GET /api/herramientas`
- `GET /api/herramientas/:id`
- `POST /api/herramientas`
- `PUT /api/herramientas/:id`
- `DELETE /api/herramientas/:id`

### Productos
- `GET /api/productos`
- `GET /api/productos/opciones`
- `POST /api/productos`
- `PUT /api/productos/:id`
- `PUT /api/productos/:id/estado`

### Proveedores
- `GET /api/proveedores`
- `POST /api/proveedores`
- `PUT /api/proveedores/:id`
- `PUT /api/proveedores/:id/estado`

### Personal
- `GET /api/empleados`
- `POST /api/empleados`
- `PUT /api/empleados/:id`
- `PUT /api/empleados/inactivar/:id`

---

## Reportes

- Comprobante PDF de préstamo
- Detalle de préstamo
- Historial de préstamos
- Información de herramientas prestadas

---

## Funcionalidades destacadas

- SPA con navegación dinámica
- Modales reutilizables
- Tablas con búsqueda
- CRUDs con validaciones
- Transacciones SQL para compras y préstamos
- JWT para autenticación
- PDFKit para reportes
- Soft delete para conservar historial

---

Proyecto académico de gestión de inventario y préstamo de herramientas.

