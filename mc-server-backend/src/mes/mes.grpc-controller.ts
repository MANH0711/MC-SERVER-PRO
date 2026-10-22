import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MesService, CircuitBreakerState } from './mes.service';

@Controller()
export class MesGrpcController {
  private readonly logger = new Logger(MesGrpcController.name);

  constructor(private readonly mesService: MesService) {}

  @GrpcMethod('MesService', 'ValidateLot')
  async validateLot(data: {
    equipmentId: string;
    lotId: string;
  }): Promise<{ valid: boolean; reason: string }> {
    return await this.mesService.validateLot(data.equipmentId, data.lotId);
  }

  @GrpcMethod('MesService', 'ValidateRecipe')
  async validateRecipe(data: {
    equipmentId: string;
    recipeName: string;
  }): Promise<{ valid: boolean; approvedRecipe: string }> {
    return await this.mesService.validateRecipe(data.equipmentId, data.recipeName);
  }

  @GrpcMethod('MesService', 'GetCircuitBreakerStatus')
  getCircuitBreakerStatus(): {
    isOpen: boolean;
    failureCount: number;
    threshold: number;
    resetTimeoutMs: number;
  } {
    const status = this.mesService.getCircuitBreakerStatus();
    return {
      isOpen: status.isOpen,
      failureCount: status.failureCount,
      threshold: status.threshold,
      resetTimeoutMs: status.resetTimeoutMs,
    };
  }

  @GrpcMethod('MesService', 'ResetCircuitBreaker')
  resetCircuitBreaker(): { success: boolean; message: string } {
    this.mesService.resetCircuitBreaker();
    return {
      success: true,
      message: 'Circuit breaker reset successfully',
    };
  }
}
