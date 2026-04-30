CREATE DATABASE IF NOT EXISTS prestamo_herramientas;
USE prestamo_herramientas;

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ubicaciones (
    id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS areas (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS personas (
    id_persona INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    id_area INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_area) REFERENCES areas(id_area)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT,
    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,

    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    modelo VARCHAR(100),
    id_marca INT,
    id_categoria INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(20) UNIQUE,
    razon_social VARCHAR(150),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    num_factura VARCHAR(50),
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_compra DECIMAL(10,2),
    id_proveedor INT,
    id_usuario INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,

    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalle_compra (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS herramientas (
    id_herramienta INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_detalle_compra INT,
    codigo_inventario VARCHAR(50) UNIQUE,
    numero_serie VARCHAR(100),

    estado ENUM('BUENO','REGULAR','MALO') DEFAULT 'BUENO',
    disponible BOOLEAN DEFAULT TRUE,
    id_ubicacion INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,

    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_detalle_compra) REFERENCES detalle_compra(id_detalle_compra),
    FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id_ubicacion),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prestamos (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    id_usuario_despachador INT NOT NULL,

    fecha_salida DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    estado_prestamo ENUM('EN_CURSO','CERRADO') DEFAULT 'EN_CURSO',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,

    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_usuario_despachador) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalle_prestamo (
    id_detalle_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_prestamo INT NOT NULL,
    id_herramienta INT NOT NULL,

    estado_entrega ENUM('BUENO','REGULAR','MALO'),
    estado_devolucion ENUM('BUENO','REGULAR','MALO'),
    fecha_devolucion DATETIME,
    observaciones TEXT,

    id_usuario_receptor INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_prestamo) REFERENCES prestamos(id_prestamo),
    FOREIGN KEY (id_herramienta) REFERENCES herramientas(id_herramienta),
    FOREIGN KEY (id_usuario_receptor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

INSERT INTO marcas (nombre) VALUES
('Bosch'),
('Makita'),
('DeWalt');

INSERT INTO categorias (nombre) VALUES
('Taladro'),
('Esmeril'),
('Martillo');

INSERT INTO productos (nombre, id_marca, id_categoria) VALUES
('Bosch X100', 1, 1),
('Makita M9000', 2, 2),
('DeWalt D200', 3, 3);

INSERT INTO ubicaciones (nombre) VALUES
('Estante A'),
('Gabinete B');

INSERT INTO herramientas 
(id_producto, codigo_inventario, numero_serie, estado, id_ubicacion)
VALUES
(1, 'H-001', 'SER-001', 'BUENO', 1),
(1, 'H-002', 'SER-002', 'BUENO', 1),
(2, 'H-003', 'SER-003', 'REGULAR', 2);


INSERT INTO proveedores (ruc, razon_social, contacto, telefono, direccion)
VALUES 
('20123456789', 'Proveedor Industrial SAC', 'Juan Perez', '999888777', 'Lima');

INSERT INTO personas (dni, nombres) VALUES ('12345678', 'Admin Sistema');

INSERT INTO usuarios (id_persona, username, password_hash)
VALUES (1, 'admin', '123456');

SHOW TABLES;

SELECT * FROM herramientas;
SELECT * FROM proveedores;
SELECT * FROM ubicaciones
