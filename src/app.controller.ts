import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccess, ApiErrors } from './docs/api-responses.decorator.js';
import { Public } from './auth/decorators/public.decorator.js';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiOperation({ summary: 'Comprobar respuesta de la API' })
  @ApiSuccess(200)
  @ApiErrors(500)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
