import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((content) =>
  content
    .replace(/\n{2,}```/g, '\n```')
    .replace(/```\n{2,}/g, '```\n'),
);
