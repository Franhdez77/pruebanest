import { type ArgumentsHost, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter.js';

function capture(error: unknown) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ path: '/test' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(error, host);
  return { status, body: json.mock.calls[0][0] };
}

describe('HttpExceptionFilter', () => {
  it.each([
    ['23505', 409],
    ['23503', 409],
    ['23P01', 409],
    ['23502', 400],
    ['23514', 400],
    ['22P02', 400],
    ['22003', 400],
  ])('traduce PostgreSQL %s a HTTP %i sin exponer SQL', (code, expected) => {
    const error = new QueryFailedError(
      'SECRET SQL',
      [],
      Object.assign(new Error('SECRET DETAIL'), { code }),
    );
    const { status, body } = capture(error);
    expect(status).toHaveBeenCalledWith(expected);
    expect(body.statusCode).toBe(expected);
    expect(body.path).toBe('/test');
    expect(JSON.stringify(body)).not.toContain('SECRET');
  });

  it('oculta los detalles de errores inesperados', () => {
    const logger = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      const { status, body } = capture(new Error('SECRET'));
      expect(status).toHaveBeenCalledWith(500);
      expect(body.message).toBe('Error interno del servidor');
      expect(logger).toHaveBeenCalled();
    } finally {
      logger.mockRestore();
    }
  });
});
