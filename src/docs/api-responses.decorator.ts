import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiSuccess(status: number, model?: Type<unknown>) {
  return applyDecorators(
    ...(model ? [ApiExtraModels(model)] : []),
    ApiResponse({
      status,
      description: 'Operación exitosa',
      schema: {
        type: 'object',
        required: ['statusCode', 'data', 'path', 'timestamp'],
        properties: {
          statusCode: { type: 'integer', example: status },
          data: model
            ? { $ref: getSchemaPath(model) }
            : { type: 'string', example: 'Hello World!' },
          path: { type: 'string', example: '/auth/me' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
}

export function ApiErrors(...statuses: number[]) {
  const descriptions: Record<number, string> = {
    400: 'Datos de entrada inválidos',
    401: 'Credenciales ausentes, incorrectas o expiradas',
    403: 'El rol no tiene permisos',
    409: 'Conflicto de unicidad o de negocio',
    500: 'Error interno del servidor',
  };
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: descriptions[status],
        schema: {
          type: 'object',
          required: ['statusCode', 'message', 'path', 'timestamp'],
          properties: {
            statusCode: { type: 'integer', example: status },
            message: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            path: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      }),
    ),
  );
}
