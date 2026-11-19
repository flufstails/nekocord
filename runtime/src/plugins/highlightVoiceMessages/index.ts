import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  const isVoiceFlag = typeof msg.flags === 'number' && (msg.flags & 8192) !== 0;
  const hasWaveform =
    Array.isArray(msg.attachments) && msg.attachments.some((a: any) => a && typeof a.waveform === 'string');
  if (isVoiceFlag || hasWaveform) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.amberBg,
      gutterColor: ROW_COLOURS.amberGutter,
    };
    return true;
  }
  return false;
});
