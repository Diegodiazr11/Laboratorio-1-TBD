# Plataforma de Arriendo de Alojamientos Turísticos

Taller de Base de Datos (2-2026) · Laboratorio 1 · Universidad de Santiago de Chile · **Grupo 4**

Marketplace donde los **anfitriones** publican alojamientos (departamentos, cabañas y casas) y los **huéspedes** los reservan. Gestiona disponibilidad, tarifas por temporada, reservas, pagos, reseñas y políticas de cancelación. Un **administrador** modera publicaciones y reseñas y consulta un dashboard de ocupación e ingresos.

La lógica de negocio crítica (cálculo de totales, confirmación y cancelación de reservas, validaciones y auditoría) vive en **PostgreSQL**, mediante funciones, procedimientos almacenados, triggers y una vista materializada. El backend accede a la base de datos con **JDBC puro, sin ORM**.

## Tabla de contenidos

1. [Arquitectura y tecnologías](#1-arquitectura-y-tecnologías)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Manual de instalación y despliegue](#3-manual-de-instalación-y-despliegue)
4. [Base de datos](#4-base-de-datos)
5. [Seguridad y roles (JWT + RBAC)](#5-seguridad-y-roles-jwt--rbac)
6. [Documentación de la API](#6-documentación-de-la-api)
7. [Datos de prueba](#7-datos-de-prueba)
8. [Pruebas de la base de datos](#8-pruebas-de-la-base-de-datos)
9. [Equipo](#9-equipo)

---

## 1. Arquitectura y tecnologías

Arquitectura desacoplada de tres capas, cada una en su propio contenedor Docker:

```
┌────────────────────┐   HTTP + JSON    ┌─────────────────────────┐   JDBC    ┌──────────────────────┐
│     Frontend       │ ───────────────► │         Backend         │ ────────► │      PostgreSQL      │
│ React + Vite       │  Authorization:  │ Spring Boot (API REST)  │           │ Tablas, índices,     │
│ (servido por Nginx)│  Bearer <JWT>    │ Spring Security + JWT   │           │ funciones, SP,       │
│ :5173              │ ◄─────────────── │ controller/service/repo │ ◄──────── │ triggers y vista     │
└────────────────────┘                  │ :8080                   │           │ materializada :5433  │
                                        └─────────────────────────┘           └──────────────────────┘
```

- **Frontend:** interfaz web que consume la API. Guarda el JWT en `localStorage` y lo envía en cada petición.
- **Backend:** API REST en capas (`controller` → `service` → `repository`). Un filtro de autenticación valida el JWT y las rutas se protegen por rol (RBAC). Los repositorios ejecutan SQL con `JdbcTemplate` (sin ORM) e invocan los procedimientos almacenados.
- **Base de datos:** concentra las reglas de negocio con transacciones atómicas, triggers de validación y auditoría, e índices y vista materializada para rendimiento.

| Capa          | Tecnología                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------ |
| Base de datos | PostgreSQL 17 (extensiones `btree_gist` y `pgcrypto`)                                      |
| Backend       | Java 21, Spring Boot 3.3.4, Spring Security, Spring JDBC, JWT (jjwt 0.11.5), Lombok, Maven |
| Frontend      | React 19, Vite, React Router 7, Axios, Tailwind CSS 4                                      |
| Despliegue    | Docker y Docker Compose (el frontend se sirve con Nginx)                                   |

## 2. Estructura del repositorio

```
.
├── backend/                 API REST (Spring Boot)
│   └── src/main/java/cl/alojamientos/backend/
│       ├── controller/      Endpoints REST
│       ├── service/         Lógica de aplicación
│       ├── repository/      Acceso a datos (SQL con JDBC)
│       ├── models/          Entidades
│       ├── dto/             Objetos de petición y respuesta
│       └── security/        JWT, filtro de autenticación y reglas de acceso
├── frontend/                Aplicación web (React + Vite)
├── database/                Scripts SQL
│   ├── alojamientos_db.sql        Tablas, relaciones, funciones, índices y datos de prueba (seeders)
│   ├── procedimientos.sql         Procedimientos almacenados
│   ├── triggers_auditoria.sql     Triggers de validación y auditoría
│   ├── vista_materializada.sql    Vista materializada y su procedimiento de refresco
│   └── pruebas.sql                Pruebas automáticas de la base de datos
├── Presentacion/            Diapositivas de la defensa (PDF o PPTX)
├── docker-compose.yml       Orquesta base de datos, backend y frontend
└── README.md
```

## 3. Manual de instalación y despliegue

El proyecto se ejecuta **únicamente con Docker**. No hace falta instalar Java, Node.js ni PostgreSQL.

### 3.1 Requisitos

- [Docker](https://docs.docker.com/get-docker/) con Docker Compose v2 (viene incluido en Docker Desktop). Verificar con:

  ```bash
  docker --version
  docker compose version
  ```

- Conexión a internet en la primera ejecución (se descargan imágenes y dependencias).
- Puertos libres en la máquina: **5173** (frontend), **8080** (backend) y **5433** (PostgreSQL).

### 3.2 Paso a paso

**Paso 1. Clonar el repositorio**

```bash
git clone https://github.com/Diegodiazr11/Laboratorio-1-TBD.git
cd Laboratorio-1-TBD
```

**Paso 2. Crear el archivo `.env`** en la raíz del proyecto (al mismo nivel que `docker-compose.yml`) con este contenido:

```env
NOMBRE_DB=alojamientos_db
USER_DB=${COLOCAR_TU_USUARIO}
PASSWORD_DB=${COLOCAR_TU_CONTRASEÑA}
JWT_SECRET=clave-secreta-de-ejemplo-para-el-laboratorio-1-tbd-2026
JWT_EXPIRATION=86400000
```

> Los valores de arriba sirven tal cual para probar el proyecto en un entorno local. Si se cambian, respetar las reglas de la tabla de [variables de entorno](#33-variables-de-entorno).

**Paso 3. Construir y levantar los servicios**

```bash
docker compose up --build
```

La primera vez demora varios minutos (compila el backend y el frontend). Esto hace automáticamente:

1. Levanta PostgreSQL y ejecuta los scripts de `database/` en orden: esquema y datos de prueba, procedimientos, triggers y vista materializada.
2. Cuando la base de datos está lista, compila y levanta el backend.
3. Compila el frontend y lo sirve con Nginx.

El sistema está listo cuando el backend muestra en la consola un mensaje similar a `Started BackendApplication`. Para dejarlo corriendo en segundo plano, usar `docker compose up --build -d`.

**Paso 4. Abrir la aplicación**

| Servicio                  | URL                                                                   |
| ------------------------- | --------------------------------------------------------------------- |
| Frontend (aplicación web) | http://localhost:5173                                                 |
| PostgreSQL                | `localhost:5433` (usuario y clave del `.env`, base `alojamientos_db`) |

**Paso 5. Iniciar sesión** con alguna de las [cuentas de prueba](#7-datos-de-prueba).

### 3.3 Variables de entorno

Se definen en el archivo `.env` de la raíz.

| Variable         | Descripción                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `NOMBRE_DB`      | Nombre de la base de datos. **Debe ser `alojamientos_db`**, que es la que crean y usan los scripts SQL. |
| `USER_DB`        | Usuario de PostgreSQL.                                                                                  |
| `PASSWORD_DB`    | Contraseña de PostgreSQL.                                                                               |
| `JWT_SECRET`     | Clave para firmar los tokens JWT. Mínimo 32 caracteres (256 bits).                                      |
| `JWT_EXPIRATION` | Duración del token en milisegundos (`86400000` = 24 horas).                                             |

### 3.4 Comandos útiles

```bash
docker compose ps                      # estado de los contenedores
docker compose logs -f backend         # logs del backend (también: db, frontend)
docker compose down                    # detener los servicios (conserva los datos)
docker compose down -v                 # detener y borrar los datos de la base
docker compose up --build              # reconstruir tras cambiar código o .env
```

### 3.5 Reiniciar desde cero

Los scripts de `database/` solo se ejecutan cuando el volumen de datos está vacío. Para volver al estado inicial (por ejemplo, tras modificar un script SQL):

```bash
docker compose down -v
docker compose up --build
```

### 3.6 Solución de problemas

| Problema                                                | Solución                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port is already allocated`                             | Hay otro programa usando 5173, 8080 o 5433. Cerrarlo o liberar el puerto.                                                                                                                                                                                                                                  |
| El backend se reinicia varias veces al comenzar         | Es normal en el primer arranque mientras la base termina de inicializarse; se reinicia solo hasta conectarse. Esperar uno o dos minutos y revisar `docker compose logs -f backend`.                                                                                                                        |
| El frontend carga pero el login falla                   | Confirmar que el backend esté en ejecución (`docker compose ps`) y que se acceda al frontend desde `http://localhost:5173`. La dirección de la API (`http://localhost:8080/api`) está definida en `docker-compose.yml` (`VITE_API_BASE_URL`); si se modifica, reconstruir con `docker compose up --build`. |
| `variable is not set` o el backend no conecta a la base | Falta el archivo `.env` o alguna variable. Debe estar en la raíz del proyecto.                                                                                                                                                                                                                             |
| Los datos o scripts SQL no se actualizan                | Aplicar [reiniciar desde cero](#35-reiniciar-desde-cero).                                                                                                                                                                                                                                                  |

## 4. Base de datos

### 4.1 Modelo de datos

Tablas: `usuario`, `ciudad`, `tipo_alojamiento`, `politica_cancelacion`, `alojamiento`, `temporada`, `bloqueo_calendario`, `reserva`, `pago`, `resena` y `auditoria_cambios`.

Restricciones relevantes: `CHECK` en capacidad, estadía mínima, precios, fechas (checkout posterior al checkin), calificación (1 a 5) y estados.

### 4.2 Objetos programables y de rendimiento

| Requisito                              | Implementación                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Procedimiento 1:** confirmar reserva | `sp_confirmar_reserva`: valida fechas, huésped activo, alojamiento publicado, capacidad, estadía mínima, solapamientos y bloqueos; bloquea el alojamiento para evitar confirmaciones simultáneas; calcula el total según la tarifa de cada noche (`fn_calcular_total`); crea la reserva, registra el pago y bloquea las fechas del calendario, todo en una transacción. |
| **Procedimiento 2:** cancelar reserva  | `sp_cancelar_reserva`: solo el huésped dueño puede cancelar; calcula el reembolso según la política (flexible, moderada o estricta) con `fn_porcentaje_reembolso`; registra la devolución y libera las fechas.                                                                                                                                                          |
| **Trigger 1:** validación de reglas    | `trg_validar_confirmacion`: impide confirmar una reserva que se traslape con otra del mismo alojamiento, que supere la capacidad o que no cumpla la estadía mínima.                                                                                                                                                                                                     |
| **Trigger 2:** auditoría               | `trg_auditar_alojamiento` (cambios de precio por noche y de política de cancelación) y `trg_auditar_politica` (cambios en las reglas de cancelación). Guardan valor anterior, nuevo, usuario y fecha en `auditoria_cambios`.                                                                                                                                            |
| **Vista materializada**                | `mv_ocupacion_ingresos_mensuales`: ocupación e ingresos netos por mes, ciudad y tipo de alojamiento (ventana de 25 meses). Alimenta el dashboard del administrador.                                                                                                                                                                                                     |
| **Estado de reservas**                 | Todos los días a la 01:00 el backend marca como `COMPLETADA` las reservas `CONFIRMADA` cuyo checkout ya pasó. Una reserva completada es la que permite al huésped dejar una reseña.                                                                                                                                                                                     |
| **Refresco de la vista**               | Procedimiento `sp_refrescar_dashboard`. El backend lo ejecuta automáticamente todos los días a las 00:00 (`@Scheduled`), al consultar el reporte y mediante `POST /api/admin/reportes/ocupacion-ingresos/refrescar`.                                                                                                                                                    |
| **Índices**                            | `idx_reserva_rango_fechas` (GiST sobre el rango de fechas de la reserva), `idx_reserva_alojamiento` (ID del alojamiento en reservas) e `idx_alojamiento_ciudad` (ciudad).                                                                                                                                                                                               |
| **Funciones auxiliares**               | `fn_precio_noche`, `fn_calcular_total`, `fn_alojamiento_disponible`, `fn_porcentaje_reembolso`.                                                                                                                                                                                                                                                                         |

## 5. Seguridad y roles (JWT + RBAC)

1. El usuario se autentica con `POST /api/auth/login` y recibe un token JWT (firmado con HS256) que incluye su `id`, correo y rol.
2. El cliente envía el token en cada petición: `Authorization: Bearer <token>`.
3. Un filtro valida el token y asigna el rol; `SecurityConfig` protege cada ruta según el rol.

| Rol                                 | Puede                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Huésped** (`HUESPED`)             | Buscar alojamientos, crear y cancelar **sus** reservas y reseñar **sus** estadías completadas.                          |
| **Anfitrión** (`ANFITRION`)         | Gestionar **sus** alojamientos, tarifas por temporada y bloqueos de calendario; ver las reservas de sus propiedades.    |
| **Administrador** (`ADMINISTRADOR`) | Moderar publicaciones y reseñas, gestionar usuarios y catálogos (ciudades, tipos y políticas) y consultar el dashboard. |

Las rutas sin token son solo de lectura pública: login, registro, búsqueda y detalle de alojamientos, calendario, reseñas y catálogos.

## 6. Documentación de la API

- URL base: `http://localhost:8080/api`
- Formato: JSON (`Content-Type: application/json`).
- Autenticación: `Authorization: Bearer <token>` en las rutas que no son públicas.
- Fechas: formato `AAAA-MM-DD`.
- Si falla una regla de negocio de la base de datos (fechas ocupadas, capacidad excedida, estadía mínima, etc.), la API responde `400` con el motivo.

### 6.1 Resumen de endpoints

| Método              | Ruta                                                        | Acceso        | Descripción                                       |
| ------------------- | ----------------------------------------------------------- | ------------- | ------------------------------------------------- |
| POST                | `/auth/register`                                            | Público       | Registrar usuario                                 |
| POST                | `/auth/login`                                               | Público       | Iniciar sesión y obtener JWT                      |
| GET                 | `/alojamientos`                                             | Público       | Listar alojamientos publicados                    |
| GET                 | `/alojamientos/buscar`                                      | Público       | Buscar disponibles por ciudad, fechas y huéspedes |
| GET                 | `/alojamientos/{id}/resenas`                                | Público       | Calificación promedio e historial de reseñas      |
| GET                 | `/alojamientos/{id}/calendario`                             | Público       | Fechas bloqueadas del alojamiento                 |
| POST                | `/alojamientos`                                             | Anfitrión     | Crear alojamiento (queda pendiente de aprobación) |
| PUT                 | `/alojamientos/{id}`                                        | Anfitrión     | Actualizar un alojamiento propio                  |
| DELETE              | `/alojamientos/{id}`                                        | Anfitrión     | Eliminar un alojamiento propio                    |
| GET                 | `/alojamientos/mis-publicaciones`                           | Anfitrión     | Listar alojamientos propios                       |
| GET                 | `/alojamientos/{id}/tarifas`                                | Anfitrión     | Listar tarifas por temporada                      |
| POST                | `/alojamientos/{id}/tarifas`                                | Anfitrión     | Crear tarifa por temporada                        |
| POST                | `/reservas`                                                 | Huésped       | Crear y confirmar una reserva                     |
| POST                | `/reservas/{id}/cancelar`                                   | Huésped       | Cancelar una reserva propia                       |
| GET                 | `/reservas/mias`                                            | Huésped       | Listar reservas propias                           |
| GET                 | `/reservas/mis-alojamientos`                                | Anfitrión     | Reservas de las propiedades del anfitrión         |
| GET                 | `/reservas/admin`                                           | Administrador | Listar todas las reservas                         |
| GET                 | `/reservas/{id}`                                            | Autenticado   | Detalle de una reserva                            |
| POST                | `/pago`                                                     | Huésped       | Registrar un pago o reembolso sobre una reserva   |
| POST                | `/resenas`                                                  | Huésped       | Reseñar una estadía completada                    |
| GET                 | `/resenas/misresenas`                                       | Huésped       | Listar reseñas propias                            |
| DELETE              | `/resenas/{id}`                                             | Huésped       | Eliminar una reseña propia                        |
| PATCH               | `/resenas/admin/{id}/ocultar`                               | Administrador | Ocultar una reseña                                |
| PATCH               | `/resenas/admin/{id}/mostrar`                               | Administrador | Volver a mostrar una reseña                       |
| GET                 | `/ciudades`, `/tipos-alojamiento`, `/politicas-cancelacion` | Público       | Listar catálogos                                  |
| POST / PUT / DELETE | `/ciudades`, `/tipos-alojamiento`, `/politicas-cancelacion` | Administrador | Crear, actualizar y eliminar catálogos            |
| GET                 | `/admin/estadisticas`                                       | Administrador | Totales de usuarios, propiedades y reservas       |
| GET                 | `/admin/usuarios`                                           | Administrador | Listar usuarios                                   |
| PUT                 | `/admin/usuarios/{id}/estado`                               | Administrador | Activar o desactivar un usuario                   |
| GET                 | `/admin/propiedades`                                        | Administrador | Listar todas las propiedades                      |
| PATCH               | `/admin/alojamientos/{id}/estado?estado=PUBLICADO`          | Administrador | Moderar una publicación                           |
| GET                 | `/admin/reportes/ocupacion-ingresos`                        | Administrador | Reporte de la vista materializada                 |
| POST                | `/admin/reportes/ocupacion-ingresos/refrescar`              | Administrador | Refrescar la vista materializada                  |

Al crear una reserva, `sp_confirmar_reserva` registra automáticamente su pago, y `sp_cancelar_reserva` registra el reembolso al cancelar. El endpoint `POST /pago` permite registrar un movimiento adicional de forma manual.

### 6.2 Ejemplos

#### Registro

`POST /auth/register` (el rol solo puede ser `HUESPED` o `ANFITRION`; cualquier otro valor responde `400`. La contraseña debe tener al menos 8 caracteres)

```json
{
  "nombre": "Ana Torres",
  "email": "ana@huesped.cl",
  "password": "MiClave.1234",
  "rol": "HUESPED"
}
```

Respuesta `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "mensaje": "Registro exitoso"
}
```

#### Login

`POST /auth/login`

```json
{
  "email": "matias@huesped.cl",
  "password": "su-contraseña"
}
```

Respuesta `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "mensaje": "Sesion iniciada con exito"
}
```

Si las credenciales son inválidas responde `401` con el motivo.

#### Buscar alojamientos disponibles

`GET /alojamientos/buscar?ciudadId=1&checkin=2027-01-10&checkout=2027-01-13&huespedes=2`

Respuesta `200`:

```json
[
  {
    "id": 1,
    "anfitrionId": 2,
    "tipoId": 1,
    "ciudadId": 1,
    "politicaId": 1,
    "titulo": "Depto moderno en Providencia",
    "capacidadMax": 4,
    "precioBaseNoche": 45000.0,
    "estadiaMinima": 1,
    "estadoPublicacion": "PUBLICADO"
  }
]
```

#### Crear alojamiento (anfitrión)

`POST /alojamientos`

```json
{
  "tipoId": 2,
  "ciudadId": 4,
  "politicaId": 2,
  "titulo": "Cabaña frente al lago",
  "capacidadMax": 6,
  "precioBaseNoche": 80000,
  "estadiaMinima": 2
}
```

Respuesta `201`: el alojamiento creado, con `estadoPublicacion: "PENDIENTE"` hasta que un administrador lo publique.

#### Crear tarifa por temporada (anfitrión)

`POST /alojamientos/3/tarifas`

```json
{
  "fechaInicio": "2026-12-15",
  "fechaFin": "2027-03-15",
  "precioNoche": 130000
}
```

Respuesta `200`: `"Tarifa de temporada creada exitosamente."`

#### Crear reserva (huésped)

`POST /reservas`: ejecuta `sp_confirmar_reserva`.

```json
{
  "alojamientoId": 1,
  "fechaCheckin": "2027-01-10",
  "fechaCheckout": "2027-01-13",
  "numHuespedes": 2
}
```

Respuesta `201`:

```json
{
  "id": 14,
  "alojamientoId": 1,
  "huespedId": 5,
  "fechaCheckin": "2027-01-10",
  "fechaCheckout": "2027-01-13",
  "numHuespedes": 2,
  "total": 135000.0,
  "estado": "CONFIRMADA"
}
```

Si las fechas se traslapan, se supera la capacidad o no se cumple la estadía mínima, responde `400` con el motivo.

#### Cancelar reserva (huésped)

`POST /reservas/14/cancelar`: ejecuta `sp_cancelar_reserva` y aplica la política de cancelación. No lleva cuerpo.

Respuesta `200`:

```json
{
  "message": "Reserva cancelada correctamente. Reembolso: $135000.00",
  "reembolso": 135000.0
}
```

#### Registrar un pago (huésped)

`POST /pago` (`tipo` puede ser `PAGO` o `REEMBOLSO`; el monto debe ser mayor que 0)

```json
{
  "reservaId": 14,
  "monto": 135000,
  "tipo": "PAGO"
}
```

Respuesta `200`: `"Pago registrado exitosamente."`

#### Crear reseña (huésped)

`POST /resenas`: solo para reservas propias en estado `COMPLETADA`.

```json
{
  "reservaId": 6,
  "calificacion": 5,
  "comentario": "Muy buena ubicación y atención."
}
```

Respuesta `201`:

```json
{
  "id": 6,
  "reservaId": 6,
  "calificacion": 5,
  "comentario": "Muy buena ubicación y atención.",
  "estado": "VISIBLE",
  "fecha": "2026-10-31T12:00:00-03:00"
}
```

#### Calificación promedio e historial de un alojamiento

`GET /alojamientos/1/resenas`

Respuesta `200` (promedio calculado en la base de datos; solo reseñas visibles):

```json
{
  "calificacionPromedio": 5.0,
  "historialResenas": [
    {
      "id": 1,
      "reservaId": 1,
      "calificacion": 5,
      "comentario": "Excelente ubicación y muy limpio. Volveríamos sin dudar.",
      "estado": "VISIBLE",
      "fecha": "2026-10-21T00:03:57.998802-03:00"
    }
  ]
}
```

#### Moderar una publicación (administrador)

`PATCH /admin/alojamientos/8/estado?estado=PUBLICADO` → `204 No Content`. Estados válidos: `PENDIENTE`, `PUBLICADO` y `SUSPENDIDO`.

#### Reporte de ocupación e ingresos (administrador)

`GET /admin/reportes/ocupacion-ingresos`: lee la vista materializada `mv_ocupacion_ingresos_mensuales`.

Respuesta `200`:

```json
[
  {
    "mes": "2026-10-01",
    "ciudad_id": 1,
    "ciudad": "Santiago",
    "tipo_id": 1,
    "tipo_alojamiento": "Departamento",
    "total_alojamientos": 2,
    "noches_ocupadas": 9,
    "noches_disponibles": 62,
    "porcentaje_ocupacion": 14.52,
    "ingresos_netos": 405000.0
  }
]
```

#### Ejemplo con `curl`

```bash
# 1. Obtener el token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"matias@huesped.cl","password":"su-contraseña"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')

# 2. Usarlo en una ruta protegida
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/reservas/mias
```

## 7. Datos de prueba

El script `database/alojamientos_db.sql` carga datos de ejemplo: 9 usuarios, 8 alojamientos en 7 ciudades, 13 reservas, 14 pagos, 5 reseñas y 6 temporadas.

| Rol           | Correo                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Administrador | `admin@alojamientos.cl`                                                                                      |
| Anfitrión     | `carolina@anfitrion.cl`, `rodrigo@anfitrion.cl`, `valentina@anfitrion.cl`                                    |
| Huésped       | `matias@huesped.cl`, `camila@huesped.cl`, `diego@huesped.cl`, `francisca@huesped.cl`, `sebastian@huesped.cl` |

**Contraseña de todas las cuentas:** `COMPLETAR`

También se puede crear una cuenta nueva desde la pantalla de registro.

## 8. Pruebas de la base de datos

`database/pruebas.sql` verifica la lógica de la base de datos y **revierte todos los cambios** al terminar, por lo que no altera los datos. Con los contenedores en ejecución:

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/pruebas.sql
```

Casos cubiertos:

1. Confirmar una reserva, calcular su total y registrar el pago.
2. Impedir fechas superpuestas.
3. Impedir superar la capacidad máxima.
4. Respetar la estadía mínima.
5. Impedir que otro huésped cancele una reserva ajena.
6. Cancelar con política flexible y calcular el reembolso.
7. Auditoría de cambios en alojamientos.
8. Auditoría de cambios en las reglas de cancelación.
9. Actualizar y consultar la vista materializada.

## 9. Equipo

Grupo 4 · Taller de Base de Datos 2-2026 · Profesor: Matías Calderón · Ayudante: Fernando Solís

| Integrante        | Rol                                                   |
| ----------------- | ----------------------------------------------------- |
| Nicolás Irribarra | Creador de la Base de Datos                           |
| Kristian Camacho  | Creador de vistas, triggers y procedimientos de la BD |
| Nicolás Meza      | Desarrollo Backend                                    |
| Diego Díaz        | Desarrollo Frontend                                   |
| Sebastián Arévalo | Desarrollo Backend                                    |
