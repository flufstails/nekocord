import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

function formatSecs(raw: number): string {
  const total = Math.max(0, Math.round(raw));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatKb(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = Math.round(sizeBytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) {
    return false;
  }
  const att = msg.attachments.find(
    (a: any) =>
      a && typeof a === 'object' && (Boolean(a.waveform) || Number(a.duration_secs) > 0),
  );
  if (!att) {
    return false;
  }
  const secs = Number(att.duration_secs ?? att.durationSecs) || 0;
  const size = Number(att.size ?? att.file_size) || 0;
  const parts: string[] = [];
  if (secs > 0) parts.push(formatSecs(secs));
  const sz = formatKb(size);
  if (sz) parts.push(sz);
  if (parts.length === 0) {
    return false;
  }
  return appendTimestampNote(msg, `[${parts.join(' · ')}]`);
});
