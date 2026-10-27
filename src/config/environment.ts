import Joi from 'joi';

export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  JWT_SECRET: string;
  API_KEY: string;
}

const schema = Joi.object<Environment>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  API_KEY: Joi.string().min(32).required(),
});

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = schema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });
  if (result.error) {
    // Reporta los campos inválidos sin exponer los valores de las credenciales.
    const fields = result.error.details.map((detail) => detail.path.join('.'));
    throw new Error(`Variables de entorno inválidas: ${fields.join(', ')}`);
  }
  return result.value as Environment;
}
