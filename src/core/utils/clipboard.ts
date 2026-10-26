/**
 * Tiện ích sao chép văn bản vào Clipboard tương thích 100% mọi trình duyệt,
 * hỗ trợ cả môi trường HTTP qua mạng LAN (non-secure context) nhờ cơ chế Fallback textarea.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Thử Navigator Clipboard API hiện đại nếu ở Secure Context (HTTPS hoặc localhost)
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText failed, using fallback:', err);
    }
  }

  // 2. Fallback cổ điển sử dụng textarea + execCommand('copy')
  // Hoạt động hoàn hảo trên HTTP, IP LAN nội bộ và khi trình duyệt chặn Clipboard API
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (fallbackErr) {
    console.error('[Clipboard] execCommand fallback failed:', fallbackErr);
    return false;
  }
}
