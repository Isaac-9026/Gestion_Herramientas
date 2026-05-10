/* REGISTROS */
USE prestamo_herramientas;

INSERT INTO categorias (nombre) VALUES
('Taladro'),
('Esmeril'),
('Martillo'),
('Rotomartillo'),
('Soldadora'),
('Llaves'),
('Destornilladores'),
('Medición'),
('Corte'),
('Seguridad');

/*    MARCAS */
INSERT INTO marcas (nombre) VALUES
('Bosch'),
('Makita'),
('DeWalt'),
('Stanley'),
('Truper'),
('Milwaukee'),
('Black+Decker'),
('Hilti'),
('Ingco'),
('Total');

/*    UBICACIONES
 */
INSERT INTO ubicaciones (nombre) VALUES
('Estante A'),
('Estante B'),
('Gabinete A1'),
('Gabinete A2'),
('Gabinete B1'),
('Zona Eléctrica'),
('Zona Mecánica'),
('Almacén Central'),
('Rack Superior'),
('Área de Despacho');

/* AREAS*/
INSERT INTO areas (nombre) VALUES
('Mantenimiento'),
('Electricidad'),
('Logística'),
('Producción'),
('Seguridad Industrial'),
('Almacén'),
('Operaciones');

/*ROLES */
INSERT INTO roles (nombre) VALUES
('Administrador'),
('Almacenero'),
('Supervisor'),
('Técnico'),
('Invitado');

/*PERSONAS */
INSERT INTO personas (dni, nombres, telefono, direccion) VALUES
('12345678', 'Admin Sistema', '999111222', 'Av. Principal 100'),
('74859612', 'Juan Carlos Pérez Gómez', '987654321', 'San Juan de Lurigancho'),
('71542368', 'Luis Alberto Torres', '955444111', 'Ate Vitarte'),
('74125896', 'Miguel Ángel Ramos', '966777888', 'Comas'),
('70369852', 'Carlos Eduardo Medina', '933222111', 'Los Olivos'),
('78965412', 'José Manuel Salazar', '988111444', 'San Martín de Porres'),
('74589632', 'Ricardo Flores Mendoza', '944555666', 'Villa El Salvador'),
('73698521', 'Pedro Antonio Silva', '955888999', 'Chorrillos'),
('72147896', 'Andrés Quispe Huamán', '966333777', 'Callao'),
('75412369', 'Fernando Rojas Díaz', '977444555', 'Surco');

/* MPLEADOS*/
INSERT INTO empleados (id_persona, id_area) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3),
(5, 4),
(6, 5),
(7, 6),
(8, 2),
(9, 1),
(10, 7);

/*USUARIOS */

/*
PASSWORDS: 1234546

*/

INSERT INTO usuarios (
    id_persona,
    username,
    password_hash,
    id_rol,
    activo
) VALUES
(
    1,
    'admin',
    '$2b$10$nIay/YBR2JI3uwuz5h3Yr.hokSmli/5CKcAKdo/GhTCM/mFOzKWry',
    1,
    TRUE
),
(
    2,
    'Juan Carlos',
    '$2b$10$nIay/YBR2JI3uwuz5h3Yr.hokSmli/5CKcAKdo/GhTCM/mFOzKWry',
    2,
    TRUE
),
(
    3,
    'LuisAlberto',
    '$2b$10$nIay/YBR2JI3uwuz5h3Yr.hokSmli/5CKcAKdo/GhTCM/mFOzKWry',
    3,
    TRUE
);

/*PRODUCTOS*/
INSERT INTO productos (
    nombre,
    modelo,
    id_marca,
    id_categoria
) VALUES
('Taladro Percutor', 'GSB 13 RE', 1, 1),
('Esmeril Angular', '9557HPG', 2, 2),
('Martillo Demoledor', 'D25911K', 3, 3),
('Rotomartillo Industrial', 'HR2470', 2, 4),
('Soldadora Inverter', 'MMA-250', 9, 5),
('Juego de Llaves Mixtas', 'STMT73795', 4, 6),
('Set Destornilladores', 'TR-860', 5, 7),
('Multímetro Digital', 'DM100', 8, 8),
('Cortadora Circular', 'CS1004', 10, 9),
('Casco de Seguridad', 'SAFE-H1', 5, 10);

/* PROVEEDORES*/
INSERT INTO proveedores (
    ruc,
    razon_social,
    contacto,
    telefono,
    direccion
) VALUES
(
    '20123456789',
    'Proveedor Industrial SAC',
    'Juan Perez',
    '999888777',
    'Lima'
),
(
    '20547896321',
    'Herramientas del Perú SAC',
    'María Torres',
    '988777666',
    'Arequipa'
),
(
    '20698521478',
    'Importaciones Técnicas EIRL',
    'Carlos Ruiz',
    '977666555',
    'Trujillo'
),
(
    '20478523691',
    'Maquinarias Industriales SAC',
    'Lucía Gómez',
    '966555444',
    'Lima'
);

/*  COMPRAS */
INSERT INTO compras (
    num_factura,
    total_compra,
    id_proveedor,
    id_usuario
) VALUES
('F001-000125', 3500.00, 1, 1),
('F001-000126', 4200.00, 2, 1),
('F001-000127', 1800.00, 3, 2);

/*DETALLE COMPRA */
INSERT INTO detalle_compra (
    id_compra,
    id_producto,
    cantidad,
    precio_unitario
) VALUES
(1, 1, 2, 450.00),
(1, 2, 3, 350.00),
(1, 6, 5, 120.00),

(2, 3, 1, 1800.00),
(2, 4, 2, 650.00),
(2, 8, 4, 200.00),

(3, 5, 2, 500.00),
(3, 7, 6, 80.00);

/*HERRAMIENTAS */
INSERT INTO herramientas (
    id_producto,
    id_detalle_compra,
    codigo_inventario,
    numero_serie,
    estado,
    disponible,
    id_ubicacion
) VALUES

(1, 1, 'H-001', 'SER-BOSCH-001', 'BUENO', TRUE, 1),
(1, 1, 'H-002', 'SER-BOSCH-002', 'BUENO', TRUE, 1),

(2, 2, 'H-003', 'SER-MAKITA-001', 'REGULAR', TRUE, 2),
(2, 2, 'H-004', 'SER-MAKITA-002', 'BUENO', TRUE, 2),
(2, 2, 'H-005', 'SER-MAKITA-003', 'BUENO', TRUE, 2),

(3, 4, 'H-006', 'SER-DEWALT-001', 'BUENO', TRUE, 3),

(4, 5, 'H-007', 'SER-HR2470-001', 'BUENO', TRUE, 4),
(4, 5, 'H-008', 'SER-HR2470-002', 'REGULAR', TRUE, 4),

(5, 7, 'H-009', 'SER-SOLD-001', 'BUENO', TRUE, 5),
(5, 7, 'H-010', 'SER-SOLD-002', 'MALO', FALSE, 5),

(6, 3, 'H-011', 'SER-STANLEY-001', 'BUENO', TRUE, 6),
(6, 3, 'H-012', 'SER-STANLEY-002', 'BUENO', TRUE, 6),

(7, 8, 'H-013', 'SER-TRUPER-001', 'BUENO', TRUE, 7),
(7, 8, 'H-014', 'SER-TRUPER-002', 'REGULAR', TRUE, 7),

(8, 6, 'H-015', 'SER-HILTI-001', 'BUENO', TRUE, 8);

/* PRESTAMOS */
INSERT INTO prestamos (
    id_persona,
    id_usuario_despachador,
    fecha_limite,
    motivo,
    estado_prestamo
) VALUES
(
    2,
    1,
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    'Mantenimiento preventivo de planta',
    'EN_CURSO'
),
(
    3,
    2,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    'Instalación eléctrica',
    'EN_CURSO'
),
(
    4,
    1,
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    'Reparación de estructuras',
    'CERRADO'
);

/*  DETALLE PRESTAMO*/
INSERT INTO detalle_prestamo (
    id_prestamo,
    id_herramienta,
    estado_entrega
) VALUES
(1, 1, 'BUENO'),
(1, 3, 'REGULAR'),
(2, 7, 'BUENO');

INSERT INTO detalle_prestamo (
    id_prestamo,
    id_herramienta,
    estado_entrega,
    estado_devolucion,
    fecha_devolucion,
    observaciones,
    id_usuario_receptor
) VALUES
(
    3,
    6,
    'BUENO',
    'BUENO',
    NOW(),
    'Herramienta devuelta correctamente',
    1
),
(
    3,
    11,
    'BUENO',
    'REGULAR',
    NOW(),
    'Presenta desgaste en el mango',
    2
);

/* ACTUALIZAR DISPONIBILIDAD DE HERRAMIENTAS PRESTADAS */

UPDATE herramientas
SET disponible = FALSE
WHERE id_herramienta IN (1,3,7);

/* CONSULTAS RAPIDAS */

SHOW TABLES;

SELECT * FROM categorias;
SELECT * FROM marcas;
SELECT * FROM ubicaciones;
SELECT * FROM areas;
SELECT * FROM roles;

SELECT * FROM personas;
SELECT * FROM empleados;
SELECT * FROM usuarios;

SELECT * FROM productos;
SELECT * FROM proveedores;

SELECT * FROM compras;
SELECT * FROM detalle_compra;

SELECT * FROM herramientas;

SELECT * FROM prestamos;
SELECT * FROM detalle_prestamo;