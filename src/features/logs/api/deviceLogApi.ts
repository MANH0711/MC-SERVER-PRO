/**
 * API: Tra cứu và đọc file log thiết bị từ ổ D:\log
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export interface DeviceLogFileResponse {
  filePath: string;
  exists: boolean;
  sizeBytes: number;
  content: string;
  linesCount: number;
}

export const deviceLogApi = {
  /**
   * Lấy danh sách thiết bị có thư mục log trong D:\log
   */
  async getLoggedEquipments(): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/device-logs/equipments`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách ngày có file log của thiết bị (yyyy-mm-dd)
   */
  async getLogDates(equipmentId: string): Promise<string[]> {
    if (!equipmentId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/device-logs/${encodeURIComponent(equipmentId)}/dates`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Đọc nội dung file log theo ngày
   */
  async getLogContent(equipmentId: string, date: string, tailLines = 1000): Promise<DeviceLogFileResponse> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/device-logs/${encodeURIComponent(equipmentId)}/${encodeURIComponent(date)}?tail=${tailLines}`
    );
    if (!res.ok) {
      throw new Error(`Không thể đọc file log (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Đường dẫn tải file log trực tiếp
   */
  getDownloadUrl(equipmentId: string, date: string): string {
    return `${API_BASE_URL}/api/v1/device-logs/${encodeURIComponent(equipmentId)}/${encodeURIComponent(date)}/download`;
  },
};
