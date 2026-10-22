/**
 * Transaction REST API Client
 * Fetches real-time communication frames from mc-server-backend
 */
import { CommunicationTransaction } from '../types';

const BACKEND_BASE_URL = 'http://localhost:3005';

export interface BackendTransactionRecord {
  transactionId: string;
  timestamp: string;
  equipmentId: string;
  commandCode: string;
  direction: 'TX' | 'RX';
  rawHex: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  durationMs: number;
  payloadJson?: string;
  errorMessage?: string;
}

export function backendTxToFrontend(tx: BackendTransactionRecord): CommunicationTransaction {
  let parsedPayload: Record<string, any> = {};
  if (tx.payloadJson) {
    try {
      parsedPayload = typeof tx.payloadJson === 'string' ? JSON.parse(tx.payloadJson) : tx.payloadJson;
    } catch {
      parsedPayload = { raw: tx.payloadJson };
    }
  }

  // Parse Hex thành chuỗi ASCII để hiển thị đẹp trên UI
  let rawAscii = '';
  try {
    if (tx.rawHex) {
      const cleanHex = tx.rawHex.replace(/[^0-9A-Fa-f]/g, '');
      const bytes = cleanHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [];
      rawAscii = String.fromCharCode(...bytes).replace(/[^\x20-\x7E]/g, '.');
    }
  } catch {
    rawAscii = '';
  }

  return {
    id: tx.transactionId,
    correlationId: tx.transactionId,
    equipmentId: tx.equipmentId || 'UNKNOWN',
    messageCode: tx.commandCode || 'DATA',
    direction: tx.direction === 'TX' ? 'OUTBOUND' : 'INBOUND',
    rawHex: tx.rawHex || '',
    rawAscii: rawAscii || tx.commandCode || '',
    payloadLength: tx.rawHex ? Math.floor(tx.rawHex.length / 2) : 0,
    payloadJson: parsedPayload,
    checksum: 'OK',
    checksumStatus: 'VALID',
    responseTimeMs: tx.durationMs || 0,
    status: tx.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
    timestamp: tx.timestamp || new Date().toISOString(),
    errorDetail: tx.errorMessage,
  };
}

export async function fetchRecentTransactions(limit = 100): Promise<CommunicationTransaction[]> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/communication/transactions?limit=${limit}`);
    if (!res.ok) return [];
    const data: BackendTransactionRecord[] = await res.json();
    return data.map(backendTxToFrontend);
  } catch {
    return [];
  }
}

/**
 * Mở kết nối Server-Sent Events (SSE) để nhận các giao dịch tức thì (<50ms) từ Backend
 */
export function subscribeTransactionStream(
  onTransaction: (tx: CommunicationTransaction) => void,
  onError?: (err: any) => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`${BACKEND_BASE_URL}/api/communication/stream`);

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          const frontendTx = backendTxToFrontend(parsed);
          onTransaction(frontendTx);
        } catch (parseErr) {
          console.debug('[SSE] Lỗi parse transaction frame:', parseErr);
        }
      };

      eventSource.onerror = (err) => {
        if (onError) onError(err);
        eventSource?.close();
        // Tự động kết nối lại sau 3 giây nếu đứt kết nối
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onError) onError(err);
      if (!isClosed) {
        setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
