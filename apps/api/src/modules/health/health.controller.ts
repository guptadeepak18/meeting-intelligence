import { Controller, Get, Version } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Version('1')
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      branding: 'Made with ❤️ at HyperBuild',
    };
  }
}
