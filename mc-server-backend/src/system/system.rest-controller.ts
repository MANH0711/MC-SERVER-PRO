import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SystemService, RealSystemHealthDto, DiagnosticResultItem } from './system.service';
import { DieAttachService } from '../interlock/die-attach.service';

@Controller('api/system')
export class SystemRestController {
  private readonly logger = new Logger(SystemRestController.name);

  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getHealth(): Promise<RealSystemHealthDto> {
    return await this.systemService.getFullHealth();
  }

  @Get('plants')
  async getPlants(): Promise<{ plant: string; description: string }[]> {
    return await this.systemService.getPlants();
  }

  @Get('active-plant')
  getActivePlant() {
    return { plant: DieAttachService.getGlobalPlant() };
  }

  @Post('active-plant')
  setActivePlant(@Body() body: { plant: string }) {
    if (body.plant && body.plant.trim()) {
      DieAttachService.setGlobalPlant(body.plant.trim());
      this.logger.log(`🏭 Đã chọn Nhà máy hoạt động: [${body.plant.trim()}]`);
    }
    return { success: true, plant: DieAttachService.getGlobalPlant() };
  }

  @Post('diagnostics/run')
  async runDiagnostics(): Promise<{ results: DiagnosticResultItem[]; totalTests: number; passedCount: number; timestamp: string }> {
    this.logger.log('Thực thi bộ tự chẩn đoán hệ thống (Real Self-Test Diagnostics)...');
    const results = await this.systemService.runLiveDiagnostics();
    const passedCount = results.filter((r) => r.status === 'PASS').length;
    return {
      results,
      totalTests: results.length,
      passedCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('diagnostics')
  async getDiagnostics(): Promise<DiagnosticResultItem[]> {
    return await this.systemService.runLiveDiagnostics();
  }

  @Post('simulation/toggle')
  toggleSimulation(@Body() body: { equipmentId?: string; active?: boolean }) {
    if (body.active) {
      this.systemService.startSimulation(body.equipmentId || 'BAKE01');
      return { active: true, message: 'Simulation started' };
    } else {
      this.systemService.stopSimulation();
      return { active: false, message: 'Simulation stopped' };
    }
  }
}
