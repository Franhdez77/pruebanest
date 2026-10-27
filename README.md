# pruebanest


API REST de FleetCore para gestionar el mantenimiento de vehículos.

## Requisitos

- Node.js 24 (versión indicada en `.nvmrc`).
- npm.
- PostgreSQL 17 o superior, con una base y un usuario para el proyecto.

## Instalación y ejecución

```bash
source "$HOME/.nvm/nvm.sh"
nvm use
npm install
cp .env.example .env
# Ajusta las credenciales de PostgreSQL en .env.
npm run migration:run
npm run start:dev
```

La aplicación inicia en http://localhost:3000 y `GET /` devuelve `Hello World!`.
Se puede cambiar el puerto mediante la variable `PORT`.

## Comandos

```bash
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
```

## PostgreSQL y variables de entorno

Crea un usuario y una base desde una sesión administradora de PostgreSQL:

```sql
CREATE USER fleetcore WITH PASSWORD 'fleetcore_local_example';
CREATE DATABASE fleetcore OWNER fleetcore;
```

La contraseña anterior es un ejemplo local. Ajusta `.env` a tu instalación.
El archivo `.env` está excluido de Git; `.env.example` contiene valores ficticios.

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | `development`, `test` o `production` |
| `PORT` | Puerto HTTP; por defecto 3000 |
| `DB_HOST` | Dirección de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL; por defecto 5432 |
| `DB_USERNAME` | Usuario de la base |
| `DB_PASSWORD` | Contraseña del usuario |
| `DB_DATABASE` | Nombre de la base |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres para firmar JWT |
| `API_KEY` | Clave de integración de al menos 32 caracteres |

La aplicación valida estas variables al iniciar y necesita una conexión a PostgreSQL.
Las pruebas HTTP (`npm run test:e2e`) también requieren la base configurada.
Las pruebas unitarias (`npm test`) no necesitan conexión.

## Migraciones

`synchronize` está desactivado: las tablas se gestionan con migraciones.
La primera migración crea la tabla de usuarios y los roles `ADMIN` y `TECHNICIAN`.

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

Para generar una migración después de modificar entidades:

```bash
npm run build
npx typeorm migration:generate src/database/migrations/NombreDelCambio -d dist/database/data-source.js
```

## Autenticación

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/auth/register` | Público; crea un `TECHNICIAN` |
| POST | `/auth/login` | Público; devuelve JWT válido por una hora |
| GET | `/auth/me` | JWT; devuelve el usuario actual |
| GET | `/auth/admin-check` | JWT y rol `ADMIN`; comprueba los permisos |

Registro:

```json
{
  "name": "Técnico de prueba",
  "email": "tecnico@example.com",
  "password": "UnaClaveSegura123!"
}
```

Para el login envía `email` y `password`. Usa el `data.accessToken` recibido como
`Authorization: Bearer <data.accessToken>` en las rutas privadas.
El registro no acepta un campo `role`. Los correos se normalizan a minúsculas
para evitar duplicados. Las contraseñas se guardan con Argon2id y no se devuelven.

### Crear el primer administrador

Después de ejecutar las migraciones, introduce una contraseña sin guardarla en el
historial y ejecuta el comando local:

```bash
read -rs -p "Contraseña del administrador: " ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run admin:create -- --name "Administrador" --email admin@example.com
unset ADMIN_PASSWORD
```

El comando rechaza correos existentes; no cambia el rol de un usuario registrado.
No hay credenciales predeterminadas de administrador.

### Pruebas

Ejecuta `npm run migration:run` antes de `npm run test:e2e`. Las pruebas de
autenticación crean usuarios con correos únicos y eliminan sus registros al terminar.
Comprueban validación, registro, hashing, duplicados, login, tokens inválidos y
expirados, y permisos de administrador. Usa una base de pruebas separada.

## Integraciones con API Key

`GET /integrations/status` comprueba el acceso externo al servicio. Requiere el
encabezado `x-api-key` con el valor de `API_KEY` de tu `.env`; no requiere JWT.
Un JWT no sustituye la API Key, y una API Key no permite acceder al perfil `/auth/me`.
Una clave ausente o incorrecta devuelve `401`.

```bash
curl -H 'x-api-key: TU_API_KEY' http://localhost:3000/integrations/status
```

## Formato de respuestas

Todas las respuestas exitosas tienen esta estructura (los códigos HTTP son números):

```json
{
  "statusCode": 200,
  "data": { "service": "FleetCore", "status": "ok" },
  "path": "/integrations/status",
  "timestamp": "2026-10-27T12:00:00.000Z"
}
```

El login devuelve el token en `data.accessToken` y el usuario en `data.user`.
Los errores conservan su código HTTP y siguen este formato:

```json
{
  "statusCode": 401,
  "message": "Se requiere x-api-key",
  "path": "/integrations/status",
  "timestamp": "2026-10-27T12:00:00.000Z"
}
```

En errores de validación, `message` es una lista de mensajes. Los conflictos de
unicidad y relaciones se traducen a `409`; los datos inválidos, a `400`.
Los errores inesperados devuelven `500` con un mensaje genérico.

Swagger se implementará en la siguiente etapa.
