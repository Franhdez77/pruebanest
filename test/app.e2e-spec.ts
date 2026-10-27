import { setupSwagger } from '../dist/docs/setup-swagger.js';
import { configureApp } from '../dist/common/configure-app.js';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../dist/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    setupSwagger(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(200);
        expect(body.data).toBe('Hello World!');
        expect(body.path).toBe('/');
        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
      });
  });

  it('sirve Swagger y documenta correctamente JWT, API Key y respuestas', async () => {
    await request(app.getHttpServer())
      .get('/docs/')
      .expect(200)
      .expect('Content-Type', /html/);
    const { body } = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(body.info.title).toBe('FleetCore API');
    expect(body.components.securitySchemes.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(body.components.securitySchemes['api-key']).toMatchObject({
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    });
    expect(body.paths['/auth/login'].post.security ?? []).toEqual([]);
    expect(body.paths['/auth/register'].post.security ?? []).toEqual([]);
    expect(body.paths['/auth/me'].get.security).toEqual([{ bearer: [] }]);
    expect(body.paths['/integrations/status'].get.security).toEqual([
      { 'api-key': [] },
    ]);
    expect(body.components.schemas.RegisterDto.required).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
    expect(body.components.schemas.RegisterDto.properties.role).toBeUndefined();
    expect(
      body.components.schemas.UserResponseDto.properties.passwordHash,
    ).toBeUndefined();
    const loginSchema =
      body.paths['/auth/login'].post.responses['200'].content[
        'application/json'
      ].schema;
    expect(loginSchema.properties.data.$ref).toBe(
      '#/components/schemas/LoginResponseDto',
    );
    expect(body.paths['/auth/admin-check'].get.responses['403']).toBeDefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
