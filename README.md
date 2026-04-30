# Sistema de Gestión de Herramientas (Inventario + Préstamos)

Aplicación web para la gestión de herramientas, control de inventario y préstamos, desarrollada con **Node.js, Express, MySQL** y un frontend tipo SPA en JavaScript.

---

## Funcionalidades principales

* Gestión de **productos y marcas**
* Registro de **herramientas físicas**
* Control de **ubicaciones**
* Gestión de **personas y usuarios**
* Gestión de **proveedores**
* Registro de **compras**
* Sistema de **préstamos y devoluciones**
* Visualización de datos en tablas dinámicas

---

## Tecnologías utilizadas

### Backend

* Node.js
* Express
* MySQL
* dotenv
* CORS

### Frontend

* HTML + CSS + JavaScript
* Bootstrap 5
* Arquitectura SPA (Single Page Application)
* 
## Instalación

### 2. Instalar dependencias

```bash
npm install
```

---

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz:

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nombre_base_datos
```

---

### 4. Configurar la base de datos

Debes crear la base de datos en MySQL y ejecutar los scripts de tablas:

* productos
* herramientas
* prestamos
* detalle_prestamo
* personas
* usuarios
* proveedores
* ubicaciones
* compras

---

### 5. Ejecutar el servidor

```bash
npm run dev
```

o

```bash
node server.js
```
