/**
 * MC Server Communication & Session Manager
 * Orchestrates multi-device TCP sessions, buffer management, watchdog timers and live simulation.
 */

import {
  DeviceModel,
  CommunicationTransaction,
  AlarmItem,
  LogEntry,
  ServerConfig,
} from '@/core/types';
import { IndustrialFrameParser } from '@/features/protocol/engine/frameParser';
import { encodeFrame } from '@/features/protocol/engine/frameEncoder';
import { IndustrialBusinessEngine } from '@/features/mes/api/businessEngine';
import { MesAdapter } from '@/features/mes/api/mesAdapter';

export type TransactionListener = (tx: CommunicationTransaction) => void;
export type DeviceUpdateListener = (device: DeviceModel) => void;
export type AlarmListener = (alarm: AlarmItem) => void;
export type LogListener = (log: LogEntry) => void;

export class SessionManager {
  private devices: Map<string, DeviceModel> = new Map();
  private parsers: Map<string, IndustrialFrameParser> = new Map();
  private businessEngine: IndustrialBusinessEngine;
  private mesAdapter: MesAdapter;
  private config: ServerConfig;

  // Listeners
  private txListeners: Set<TransactionListener> = new Set();
  private deviceListeners: Set<DeviceUpdateListener> = new Set();
  private alarmListeners: Set<AlarmListener> = new Set();
  private logListeners: Set<LogListener> = new Set();

  private simulationTimer: any = null;
  private isSimulating: boolean = false;

  constructor(
    initialDevices: DeviceModel[],
    config: ServerConfig,
    mesAdapter: MesAdapter
  ) {
    this.config = config;
    this.mesAdapter = mesAdapter;
    this.businessEngine = new IndustrialBusinessEngine();

    for (const dev of initialDevices) {
      this.devices.set(dev.id, { ...dev });
      this.parsers.set(dev.id, new IndustrialFrameParser(config.server.bufferSizeLimitBytes));
    }

    // Default: Chế độ kết nối vật lý thực tế. Không tự động phát sinh gói tin ảo.
  }

  public getDevices(): DeviceModel[] {
    return Array.from(this.devices.values());
  }

  public setDevices(newDevices: DeviceModel[]): void {
    this.devices.clear();
    this.parsers.clear();
    for (const dev of newDevices) {
      this.devices.set(dev.id, { ...dev });
      this.parsers.set(dev.id, new IndustrialFrameParser(this.config.server.bufferSizeLimitBytes));
    }
  }

  public getDevice(id: string): DeviceModel | undefined {
    return this.devices.get(id);
  }

  public addDevice(device: DeviceModel): void {
    this.devices.set(device.id, { ...device });
    this.parsers.set(device.id, new IndustrialFrameParser(this.config.server.bufferSizeLimitBytes));
    this.emitLog({
      id: `LOG_DEV_ADD_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      equipmentId: device.id,
      message: `New equipment registered: ${device.id} (${device.name}) at ${device.ipAddress}:${device.port}.`,
    });
  }

  public updateDevice(id: string, updates: Partial<DeviceModel>): DeviceModel | undefined {
    const dev = this.devices.get(id);
    if (!dev) return undefined;
    const updated = { ...dev, ...updates };
    this.devices.set(id, updated);
    this.emitDeviceUpdate(updated);
    return updated;
  }

  public deleteDevice(id: string): boolean {
    const dev = this.devices.get(id);
    if (!dev) return false;
    this.devices.delete(id);
    this.parsers.delete(id);
    this.emitLog({
      id: `LOG_DEV_DEL_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUDIT',
      equipmentId: id,
      message: `Equipment ${id} (${dev.name}) was removed from active configuration.`,
    });
    return true;
  }

  /**
   * Simulates socket reconnection
   */
  public async reconnectDevice(id: string): Promise<boolean> {
    const dev = this.devices.get(id);
    if (!dev) return false;

    this.updateDevice(id, { status: 'Reconnecting' });
    this.emitLog({
      id: `LOG_REC_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'COMMUNICATION',
      equipmentId: id,
      message: `Đang kết nối lại tới thiết bị ${id} (${dev.ipAddress}:${dev.port})...`,
    });

    try {
      const res = await fetch(`http://localhost:3005/api/communication/reconnect/${encodeURIComponent(id)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.connected === true) {
        this.updateDevice(id, {
          status: 'Ready',
          reconnectCount: dev.reconnectCount + 1,
          lastConnectedAt: new Date().toISOString(),
          consecutiveTimeouts: 0,
        });
        this.emitLog({
          id: `LOG_REC_OK_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          category: 'COMMUNICATION',
          equipmentId: id,
          message: `Kết nối thành công tới ${id} (${dev.ipAddress}:${dev.port}). Socket ONLINE.`,
        });
        return true;
      } else {
        this.updateDevice(id, { status: 'Disconnected' });
        this.emitLog({
          id: `LOG_REC_ERR_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'WARN',
          category: 'COMMUNICATION',
          equipmentId: id,
          message: `Không thể kết nối tới ${id} (${dev.ipAddress}:${dev.port}): Thiết bị chưa bật nguồn hoặc chưa mở port.`,
        });
        return false;
      }
    } catch {
      this.updateDevice(id, { status: 'Disconnected' });
      return false;
    }
  }

  /**
   * Dừng kết nối thiết bị và gửi tín hiệu xuống backend tắt Auto-Reconnect
   */
  public async stopDevice(id: string): Promise<boolean> {
    const dev = this.devices.get(id);
    this.updateDevice(id, { status: 'Disconnected', enabled: false });
    this.emitLog({
      id: `LOG_STOP_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'COMMUNICATION',
      equipmentId: id,
      message: `Đã dừng thiết bị ${id}${dev ? ` (${dev.ipAddress}:${dev.port})` : ''}. Tắt tự động kết nối lại.`,
    });

    try {
      await fetch(`http://localhost:3005/api/communication/stop/${encodeURIComponent(id)}`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dừng toàn bộ thiết bị và gửi lệnh dừng xuống backend
   */
  public async stopAll(): Promise<boolean> {
    for (const dev of this.devices.values()) {
      this.updateDevice(dev.id, { status: 'Disconnected', enabled: false });
    }
    this.emitLog({
      id: `LOG_STOP_ALL_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'COMMUNICATION',
      equipmentId: 'ALL',
      message: `Đã dừng toàn bộ thiết bị và tắt tính năng tự động kết nối lại.`,
    });

    try {
      await fetch(`http://localhost:3005/api/communication/stop-all`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Khởi động lại toàn bộ thiết bị và kích hoạt lại kết nối
   */
  public async startAll(): Promise<boolean> {
    for (const dev of this.devices.values()) {
      this.updateDevice(dev.id, { status: 'Connecting' });
    }
    this.emitLog({
      id: `LOG_START_ALL_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'COMMUNICATION',
      equipmentId: 'ALL',
      message: `Đang khởi động và kết nối lại toàn bộ thiết bị...`,
    });

    try {
      await fetch(`http://localhost:3005/api/communication/start-all`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Feed raw bytes/string from an equipment into the session engine
   */
  public injectRawFrame(equipmentId: string, rawData: string | Uint8Array): void {
    let parser = this.parsers.get(equipmentId);
    if (!parser) {
      parser = new IndustrialFrameParser(this.config.server.bufferSizeLimitBytes);
      this.parsers.set(equipmentId, parser);
    }

    const dev = this.devices.get(equipmentId);
    const checksumAlg = dev?.checksumAlgorithm || this.config.protocol.checksumAlgorithm;

    const parsedFrames = parser.pushChunk(rawData, checksumAlg);

    for (const frame of parsedFrames) {
      const timestamp = new Date().toISOString();
      // Record inbound transaction
      const inTx: CommunicationTransaction = {
        id: `TX_IN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        correlationId: frame.txId || `TX_${Date.now()}`,
        equipmentId: frame.equipmentId,
        equipmentModel: dev?.model || dev?.equipmentModel,
        messageCode: frame.messageCode,
        direction: 'INBOUND',
        rawHex: frame.rawHex,
        rawAscii: frame.rawAscii,
        payloadLength: frame.payloadLength,
        payloadJson: frame.payloadJson,
        checksum: frame.checksum,
        checksumStatus: frame.checksumStatus,
        responseTimeMs: 0,
        status: frame.isValid ? 'SUCCESS' : 'ERROR',
        timestamp,
        errorDetail: frame.error,
      };

      this.emitTransaction(inTx);

      // Pass to business logic
      const result = this.businessEngine.processInboundMessage(frame, dev);

      if (result.updatedDevice && dev) {
        this.updateDevice(equipmentId, result.updatedDevice);
      }

      if (result.generatedAlarm) {
        this.emitAlarm(result.generatedAlarm);
      }

      if (result.generatedLog) {
        this.emitLog(result.generatedLog);
      }

      if (result.responseTransaction) {
        this.emitTransaction(result.responseTransaction);
      }
    }
  }

  /**
   * Background production floor simulation
   */
  private startLiveSimulation() {
    if (this.simulationTimer) clearInterval(this.simulationTimer);

    // Periodic simulation of realistic shopfloor events
    this.simulationTimer = setInterval(() => {
      if (!this.isSimulating) return;

      const deviceList = Array.from(this.devices.values()).filter((d) => d.enabled);
      if (deviceList.length === 0) return;

      // Randomly pick a device
      const targetDev = deviceList[Math.floor(Math.random() * deviceList.length)];
      if (targetDev.status === 'Disconnected' || targetDev.status === 'Error') {
        return; // Don't simulate traffic from dead or faulted devices
      }

      // Pick a realistic industrial message
      const rand = Math.random();
      let msgCode = 'M001';
      let payload: Record<string, any> = {};

      if (rand < 0.5) {
        // Heartbeat M001
        msgCode = 'M001';
        payload = {
          status: targetDev.status === 'Busy' ? 'RUN' : 'IDLE',
          temp: +(23.5 + Math.random() * 3).toFixed(1),
          pressure: +(6.0 + Math.random() * 0.4).toFixed(2),
        };
      } else if (rand < 0.75) {
        // Move-In Handshake S005
        msgCode = 'S005';
        const pcbSerial = `PCB_BRD_${Math.floor(100000000 + Math.random() * 900000000)}`;
        payload = {
          pcbBarcode: pcbSerial,
          lotId: 'LOT_20261020_084',
          carrierId: targetDev.currentCarrierId || 'MAG_SMT_A01',
          posInCarrier: Math.floor(Math.random() * 50) + 1,
        };
      } else if (rand < 0.95) {
        // Move-Out S030
        msgCode = 'S030';
        payload = {
          pcbBarcode: `PCB_BRD_${Math.floor(100000000 + Math.random() * 900000000)}`,
          overallJudgement: Math.random() > 0.03 ? 'PASS' : 'FAIL',
          cycleTimeSeconds: +(12.0 + Math.random() * 6.0).toFixed(1),
          defectCount: Math.random() > 0.97 ? 1 : 0,
        };
      } else {
        // Carrier Inquiry S000
        msgCode = 'S000';
        payload = {
          stationId: targetDev.station,
          carrierSlot: 1,
          bufferStatus: 'EMPTY',
        };
      }

      const txId = `TX${Math.floor(100000 + Math.random() * 900000)}`;
      const encoded = encodeFrame({
        equipmentId: targetDev.id,
        messageCode: msgCode,
        txId,
        payload,
        checksumAlg: targetDev.checksumAlgorithm,
        boundary: targetDev.frameBoundary,
      });

      this.injectRawFrame(targetDev.id, encoded.bytes);
    }, 2500);
  }

  public toggleSimulation(active?: boolean): boolean {
    this.isSimulating = active !== undefined ? active : !this.isSimulating;
    if (this.isSimulating) {
      this.startLiveSimulation();
    } else {
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
    }
    return this.isSimulating;
  }

  public getSimulationState(): boolean {
    return this.isSimulating;
  }

  // Subscription methods
  public onTransaction(cb: TransactionListener): () => void {
    this.txListeners.add(cb);
    return () => this.txListeners.delete(cb);
  }

  public onDeviceUpdate(cb: DeviceUpdateListener): () => void {
    this.deviceListeners.add(cb);
    return () => this.deviceListeners.delete(cb);
  }

  public onAlarm(cb: AlarmListener): () => void {
    this.alarmListeners.add(cb);
    return () => this.alarmListeners.delete(cb);
  }

  public onLog(cb: LogListener): () => void {
    this.logListeners.add(cb);
    return () => this.logListeners.delete(cb);
  }

  private emitTransaction(tx: CommunicationTransaction) {
    for (const listener of this.txListeners) {
      try {
        listener(tx);
      } catch (err) {
        console.error('Error in txListener', err);
      }
    }
  }

  private emitDeviceUpdate(dev: DeviceModel) {
    for (const listener of this.deviceListeners) {
      try {
        listener(dev);
      } catch (err) {
        console.error('Error in deviceListener', err);
      }
    }
  }

  private emitAlarm(alarm: AlarmItem) {
    for (const listener of this.alarmListeners) {
      try {
        listener(alarm);
      } catch (err) {
        console.error('Error in alarmListener', err);
      }
    }
  }

  private emitLog(log: LogEntry) {
    for (const listener of this.logListeners) {
      try {
        listener(log);
      } catch (err) {
        console.error('Error in logListener', err);
      }
    }
  }

  public destroy() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.txListeners.clear();
    this.deviceListeners.clear();
    this.alarmListeners.clear();
    this.logListeners.clear();
  }
}
