import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const FULL_DATETIME_RE =
  /(^|\s)@(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?=$|[\s.,!?)])/g;
const TIME_ONLY_RE = /(^|\s)@(\d{1,2}):(\d{2})(?::(\d{2}))?(?=$|[\s.,!?)])/g;

let cleanupOutgoing: (() => void) | null = null;
let convertedCount = 0;

function isValidTime(hour: number, minute: number, second: number): boolean {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59;
}

function replaceTimestampTokens(segment: string): string {
  let out = segment.replace(
    FULL_DATETIME_RE,
    (full, lead: string, yStr: string, moStr: string, dStr: string, hStr: string, miStr: string, sStr?: string) => {
      const year = Number(yStr);
      const month = Number(moStr);
      const day = Number(dStr);
      const hour = Number(hStr);
      const minute = Number(miStr);
      const second = sStr ? Number(sStr) : 0;
      if (month < 1 || month > 12 || day < 1 || day > 31 || !isValidTime(hour, minute, second)) {
        return full;
      }
      const date = new Date(year, month - 1, day, hour, minute, second);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return full;
      }
      const unix = Math.floor(date.getTime() / 1000);
      convertedCount += 1;
      return `${lead}<t:${unix}:f>`;
    },
  );

  out = out.replace(
    TIME_ONLY_RE,
    (full, lead: string, hStr: string, miStr: string, sStr?: string) => {
      const hour = Number(hStr);
      const minute = Number(miStr);
      const second = sStr ? Number(sStr) : 0;
      if (!isValidTime(hour, minute, second)) {
        return full;
      }
      const now = new Date();
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        second,
      );
      const unix = Math.floor(date.getTime() / 1000);
      const style = sStr ? 'T' : 't';
      convertedCount += 1;
      return `${lead}<t:${unix}:${style}>`;
    },
  );

  return out;
}

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      if (!content.includes('@')) {
        return content;
      }
      return transformOutsideCode(content, replaceTimestampTokens);
    });
  },

  stop() {
    if (cleanupOutgoing) {
      cleanupOutgoing();
      cleanupOutgoing = null;
    }
  },
});
