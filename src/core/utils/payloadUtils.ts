/**
 * MC Server Industrial Enterprise Edition
 * Utilities for cleaning and formatting transaction payloads
 */

/**
 * Làm sạch và chuẩn hóa đối tượng JSON payload:
 * 1. Tự động parse các chuỗi JSON lồng nhau (nested JSON strings).
 * 2. Tự động tách chuỗi phản hồi nghiệp vụ MES dạng `<Header>;<JSON_Body>` thành:
 *    - responseHeader: phần Header (ví dụ: "CLEAN001 S051WORKIN")
 *    - responseMessage (hoặc trường tương ứng): phần JSON Body đã được parse thành object JSON thật.
 * 3. Loại bỏ hoàn toàn các ký tự escape `\"` và `\n` khi hiển thị trên giao diện hoặc xuất JSON.
 */
export function cleanPayloadForDisplay(rawPayload: any): any {
  if (rawPayload === null || rawPayload === undefined) {
    return rawPayload;
  }

  let payload = rawPayload;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        payload = JSON.parse(trimmed);
      } catch {
        return payload;
      }
    } else {
      return payload;
    }
  }

  if (typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => cleanPayloadForDisplay(item));
  }

  const result: Record<string, any> = {};

  for (const [key, val] of Object.entries(payload)) {
    if (typeof val === 'string') {
      const trimmed = val.trim();

      // Trường hợp chuỗi có dạng "<Header> ; { <JSON> }" hoặc "<Header> ; [ <JSON> ]"
      const semiIndex = trimmed.indexOf(';');
      if (semiIndex !== -1 && (trimmed.includes('{') || trimmed.includes('['))) {
        const header = trimmed.substring(0, semiIndex).trim();
        const jsonPart = trimmed.substring(semiIndex + 1).trim();
        try {
          const parsed = JSON.parse(jsonPart);
          if (header) {
            const headerKey = key === 'responseMessage' ? 'responseHeader' : `${key}Header`;
            result[headerKey] = header;
          }
          result[key] = cleanPayloadForDisplay(parsed);
          continue;
        } catch {
          // Bỏ qua nếu jsonPart không phải JSON hợp lệ
        }
      }

      // Trường hợp chuỗi JSON thuần túy bị stringify lồng nhau
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          result[key] = cleanPayloadForDisplay(parsed);
          continue;
        } catch {}
      }

      result[key] = val;
    } else if (typeof val === 'object' && val !== null) {
      result[key] = cleanPayloadForDisplay(val);
    } else {
      result[key] = val;
    }
  }

  return result;
}
