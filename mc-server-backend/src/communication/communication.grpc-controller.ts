import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { CommunicationService } from './communication.service';
import { TransactionRecord } from '../database/transaction.repository';

@Controller()
export class CommunicationGrpcController {
  private readonly logger = new Logger(CommunicationGrpcController.name);

  constructor(private readonly commService: CommunicationService) {}

  @GrpcMethod('CommunicationService', 'GetRecentTransactions')
  async getRecentTransactions(data: {
    equipmentId?: string;
    commandCode?: string;
    limit?: number;
  }): Promise<{ transactions: TransactionRecord[]; totalCount: number }> {
    const list = await this.commService.getRecentTransactions(
      data.equipmentId,
      data.commandCode,
      data.limit || 50
    );
    return {
      transactions: list,
      totalCount: list.length,
    };
  }

  @GrpcMethod('CommunicationService', 'SendManualCommand')
  async sendManualCommand(data: {
    equipmentId: string;
    commandCode: string;
    subCode?: number;
    payloadHex?: string;
  }): Promise<{
    success: boolean;
    txRecord?: TransactionRecord;
    rxRecord?: TransactionRecord;
    errorMessage?: string;
  }> {
    this.logger.log(`gRPC SendManualCommand: [${data.commandCode}] -> ${data.equipmentId}`);
    const result = await this.commService.executeManualCommand(data);
    return {
      success: result.success,
      txRecord: result.txRecord,
      rxRecord: result.rxRecord,
      errorMessage: result.errorMessage,
    };
  }

  @GrpcStreamMethod('CommunicationService', 'StreamCommunication')
  streamCommunication(): Observable<TransactionRecord> {
    this.logger.log('Client kết nối tới gRPC StreamCommunication');
    return this.commService.getTransactionStream();
  }
}
