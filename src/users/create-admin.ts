import { parseArgs } from 'node:util';
import * as argon2 from 'argon2';
import dataSource from '../database/data-source.js';
import { User } from './user.entity.js';
import { Role } from './role.enum.js';
import { isEmail } from 'class-validator';

const { values } = parseArgs({
  options: { name: { type: 'string' }, email: { type: 'string' } },
});
const name = values.name?.trim();
const email = values.email?.trim().toLowerCase();
if (
  !name ||
  name.length < 2 ||
  name.length > 100 ||
  !email ||
  !isEmail(email) ||
  email.length > 254
) {
  throw new Error(
    'Uso: npm run admin:create -- --name "Administrador" --email admin@example.com',
  );
}
// La contraseña llega por entorno para evitar guardarla en el historial de comandos.
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 8 || password.length > 128) {
  throw new Error('Define ADMIN_PASSWORD con entre 8 y 128 caracteres');
}
await dataSource.initialize();
try {
  const users = dataSource.getRepository(User);
  if (await users.existsBy({ email }))
    throw new Error('El correo ya existe; no se cambiará su rol');
  await users.save(
    users.create({
      name,
      email,
      role: Role.ADMIN,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    }),
  );
  console.log('Administrador creado');
} finally {
  await dataSource.destroy();
}
