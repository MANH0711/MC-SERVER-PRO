/**
 * MC Server Industrial Business Logic Engine
 * Processes production handshakes, recipe verification, carrier tracking and alarms.
 */

import { ParsedFrame, CommunicationTransaction, AlarmItem, LogEntry, DeviceModel } from '@/core/types';
import { encodeFrame } from '@/features/protocol/engine/frameEncoder';

export interface BusinessProcessingResult {
  responseTransaction?: CommunicationTransaction;
  updatedDevice?: Partial<DeviceModel>;
  generatedAlarm?: AlarmItem;
  generatedLog?: LogEntry;
  mesSynced: boolean;
}

export class IndustrialBusinessEngine {
  /**
   * Main entry point to process an inbound frame from an equipment
   */
  public processInboundMessage(
    frame: ParsedFrame,
    currentDevice?: DeviceModel
  ): BusinessProcessingResult {
    const timestamp = new Date().toISOString();
    const correlationId = frame.txId || `TX_${Math.floor(Math.random() * 900000 + 100000)}`;

    if (!frame.isValid) {
      // Checksum or frame corruption
      const alarm: AlarmItem = {
        id: `ALM_CORRUPT_${Date.now()}`,
        equipmentId: frame.equipmentId,
        equipmentName: currentDevice?.name || frame.equipmentId,
        alarmCode: 'ERR_FRAME_CORRUPTED',
        severity: 'WARNING',
        description: `Corrupted frame received from ${frame.equipmentId}: ${frame.error || 'Checksum mismatch'}.`,
        acknowledged: false,
        createdAt: timestamp,
      };

      const log: LogEntry = {
        id: `LOG_ERR_${Date.now()}`,
        timestamp,
        level: 'WARN',
        category: 'COMMUNICATION',
        equipmentId: frame.equipmentId,
        correlationId,
        message: `Frame decoding failure from ${frame.equipmentId}: ${frame.error}`,
      };

      return {
        updatedDevice: {
          errorCount: (currentDevice?.errorCount || 0) + 1,
        },
        generatedAlarm: alarm,
        generatedLog: log,
        mesSynced: false,
      };
    }

    const { messageCode, equipmentId, payloadJson } = frame;

    switch (messageCode) {
      case 'M001': {
        // Device Ready / Heartbeat
        const deviceState = payloadJson.status === 'RUN' ? 'Busy' : 'Ready';
        const responsePayload = {
          ack: 'PASS',
          serverTime: timestamp,
          interlockEngaged: currentDevice?.status === 'Error',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'M002',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'M002',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 8 + 6),
          status: 'SUCCESS',
          timestamp,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            status: currentDevice?.status === 'Error' ? 'Error' : deviceState,
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          mesSynced: true,
        };
      }

      case 'S000': {
        // Material / Carrier Inquiry
        const responsePayload = {
          lotId: currentDevice?.currentRecipe ? 'LOT_20261020_084' : 'LOT_WAITING',
          carrierId: currentDevice?.currentCarrierId || 'MAG_SMT_4021',
          quantity: 50,
          dispatchAction: 'LOAD',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'S001',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'S001',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 12 + 10),
          status: 'SUCCESS',
          timestamp,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            status: 'Ready',
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          mesSynced: true,
        };
      }

      case 'S002': {
        // Recipe Validation
        const recipeId = payloadJson.recipeId || 'UNKNOWN_RECIPE';
        const isApproved = recipeId.includes('MAIN') || recipeId.includes('RCP');
        const responsePayload = {
          result: isApproved ? 'PASS' : 'NG',
          recipeVersion: 'REV_2.4.1',
          allowedTolerances: isApproved
            ? {
                tempDeltaMax: 5.0,
                speedTolerancePercent: 2.0,
              }
            : undefined,
          errorCode: isApproved ? undefined : 'ERR_RECIPE_UNAUTHORIZED',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'S003',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'S003',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 15 + 12),
          status: isApproved ? 'SUCCESS' : 'INTERLOCK_DENIED',
          timestamp,
        };

        const log: LogEntry = {
          id: `LOG_RCP_${Date.now()}`,
          timestamp,
          level: isApproved ? 'INFO' : 'WARN',
          category: 'BUSINESS',
          equipmentId,
          correlationId,
          message: `Recipe validation for ${recipeId}: Result ${isApproved ? 'PASS' : 'NG'}`,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            currentRecipe: isApproved ? recipeId : currentDevice?.currentRecipe,
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          generatedLog: log,
          mesSynced: true,
        };
      }

      case 'S005': {
        // Station Move-In Handshake
        const pcbBarcode = payloadJson.pcbBarcode || 'PCB_ANONYMOUS';
        const responsePayload = {
          permission: 'PASS',
          pcbBarcode,
          previousStepStatus: 'SPI_3D: PASS',
          action: 'CLAMP_AND_START',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'S006',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'S006',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 14 + 10),
          status: 'SUCCESS',
          timestamp,
        };

        const log: LogEntry = {
          id: `LOG_MI_${Date.now()}`,
          timestamp,
          level: 'INFO',
          category: 'BUSINESS',
          equipmentId,
          correlationId,
          message: `Station Move-In Handshake: PCB ${pcbBarcode} permission GRANTED.`,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            status: 'Busy',
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          generatedLog: log,
          mesSynced: true,
        };
      }

      case 'S030': {
        // Station Move-Out & Inspection Result
        const pcbBarcode = payloadJson.pcbBarcode || 'PCB_COMPLETED';
        const overallJudgement = payloadJson.overallJudgement || 'PASS';
        const responsePayload = {
          ack: 'PASS',
          nextDestinationStation: 'ST04_POST_AOI',
          releaseAction: 'UNCLAMP_AND_CONVEY',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'S031',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'S031',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 16 + 12),
          status: 'SUCCESS',
          timestamp,
        };

        const log: LogEntry = {
          id: `LOG_MO_${Date.now()}`,
          timestamp,
          level: overallJudgement === 'PASS' ? 'INFO' : 'WARN',
          category: 'BUSINESS',
          equipmentId,
          correlationId,
          message: `Station Move-Out: PCB ${pcbBarcode} completed with judgement ${overallJudgement}.`,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            status: 'Ready',
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          generatedLog: log,
          mesSynced: true,
        };
      }

      case 'S040': {
        // Machine Alarm Event
        const alarmCode = payloadJson.alarmCode || 'ALM_MACHINE_UNKNOWN';
        const severity = (payloadJson.severity || 'ERROR') as any;
        const description = payloadJson.description || 'Machine interlock triggered';

        const alarm: AlarmItem = {
          id: `ALM_${Date.now()}`,
          equipmentId,
          equipmentName: currentDevice?.name || equipmentId,
          alarmCode,
          severity,
          description,
          acknowledged: false,
          createdAt: timestamp,
        };

        const responsePayload = {
          recorded: true,
          serverAction: 'NOTIFY_LINE_LEADER',
        };

        const encoded = encodeFrame({
          equipmentId,
          messageCode: 'S041',
          txId: correlationId,
          payload: responsePayload,
          checksumAlg: currentDevice?.checksumAlgorithm || 'LRC_MOD256',
          boundary: currentDevice?.frameBoundary || '20013_STANDARD',
        });

        const respTx: CommunicationTransaction = {
          id: `TX_OUT_${Date.now()}`,
          correlationId,
          equipmentId,
          messageCode: 'S041',
          direction: 'OUTBOUND',
          rawHex: encoded.hexDump,
          rawAscii: encoded.asciiString,
          payloadLength: encoded.lengthHeader,
          payloadJson: responsePayload,
          checksum: encoded.checksum,
          checksumStatus: 'VALID',
          responseTimeMs: Math.floor(Math.random() * 10 + 8),
          status: 'SUCCESS',
          timestamp,
        };

        const log: LogEntry = {
          id: `LOG_ALM_${Date.now()}`,
          timestamp,
          level: 'ERROR',
          category: 'BUSINESS',
          equipmentId,
          correlationId,
          message: `Alarm logged from ${equipmentId}: ${alarmCode} - ${description}`,
        };

        return {
          responseTransaction: respTx,
          updatedDevice: {
            status: 'Error',
            errorCount: (currentDevice?.errorCount || 0) + 1,
            lastDataReceivedAt: timestamp,
            totalRequests: (currentDevice?.totalRequests || 0) + 1,
            totalResponses: (currentDevice?.totalResponses || 0) + 1,
          },
          generatedAlarm: alarm,
          generatedLog: log,
          mesSynced: true,
        };
      }

      default: {
        // Unknown message code
        const log: LogEntry = {
          id: `LOG_UNK_${Date.now()}`,
          timestamp,
          level: 'WARN',
          category: 'COMMUNICATION',
          equipmentId,
          correlationId,
          message: `Unrecognized message code received: ${messageCode}`,
        };

        return {
          generatedLog: log,
          mesSynced: false,
        };
      }
    }
  }
}
