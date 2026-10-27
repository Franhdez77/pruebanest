import { Controller, Get } from '@nestjs/common';
import { ApiKeyAuth } from '../auth/decorators/api-key-auth.decorator.js';

@ApiKeyAuth()
@Controller('integrations')
export class IntegrationsController {
  @Get('status')
  status() {
    return { service: 'FleetCore', status: 'ok' };
  }
}
