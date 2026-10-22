import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime?: number;
  threshold: number;
  resetTimeoutMs: number;
}

@Injectable()
export class MesService {
  private readonly logger = new Logger(MesService.name);
  private circuitBreaker: CircuitBreakerState;

  constructor(private readonly configService: ConfigService) {
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      threshold: this.configService.get<number>('mes.circuitBreakerThreshold') || 5,
      resetTimeoutMs: this.configService.get<number>('mes.circuitBreakerResetMs') || 30000,
    };
  }

  async validateLot(equipmentId: string, lotId: string): Promise<{ valid: boolean; reason: string }> {
    this.checkCircuitBreaker();
    if (this.circuitBreaker.isOpen) {
      this.logger.warn(`⚠️ MES Circuit Breaker đang MỞ. Tạm thời chấp thuận Offline cho Lot: ${lotId}`);
      return { valid: true, reason: 'OFFLINE_MES_APPROVED' };
    }

    try {
      this.logger.log(`[MES Validation] Xác thực Lot [${lotId}] cho máy [${equipmentId}]`);
      this.circuitBreaker.failureCount = 0;
      return { valid: true, reason: 'VALID' };
    } catch (err: any) {
      this.recordFailure();
      throw err;
    }
  }

  async validateRecipe(equipmentId: string, recipeName: string): Promise<{ valid: boolean; approvedRecipe: string }> {
    this.checkCircuitBreaker();
    return {
      valid: true,
      approvedRecipe: recipeName,
    };
  }

  getCircuitBreakerStatus(): CircuitBreakerState {
    this.checkCircuitBreaker();
    return { ...this.circuitBreaker };
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
    this.logger.log('Đã thủ công Reset MES Circuit Breaker về trạng thái CLOSED');
  }

  private recordFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.logger.error(`🚨 MES Circuit Breaker đã KÍCH HOẠT (OPEN)! Đã vượt quá ${this.circuitBreaker.threshold} lần thất bại liên tiếp.`);
    }
  }

  private checkCircuitBreaker() {
    if (this.circuitBreaker.isOpen && this.circuitBreaker.lastFailureTime) {
      const elapsed = Date.now() - this.circuitBreaker.lastFailureTime;
      if (elapsed > this.circuitBreaker.resetTimeoutMs) {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failureCount = 0;
        this.logger.log('🔄 MES Circuit Breaker chuyển về HALF-OPEN/CLOSED sau thời gian chờ.');
      }
    }
  }
}
