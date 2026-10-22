import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SystemService } from './system.service';

@Controller()
export class SystemGrpcController {
  constructor(private readonly systemService: SystemService) {}

  @GrpcMethod('SystemService', 'GetHealthStatus')
  getHealthStatus() {
    return this.systemService.getHealthStatus();
  }

  @GrpcMethod('SystemService', 'StartSimulation')
  startSimulation(data: { equipmentId: string; intervalMs?: number }): { success: boolean; message: string } {
    const success = this.systemService.startSimulation(data.equipmentId, data.intervalMs);
    return {
      success,
      message: `Simulation started for ${data.equipmentId}`,
    };
  }

  @GrpcMethod('SystemService', 'StopSimulation')
  stopSimulation(): { success: boolean; message: string } {
    const success = this.systemService.stopSimulation();
    return {
      success,
      message: 'Simulation stopped',
    };
  }
}
