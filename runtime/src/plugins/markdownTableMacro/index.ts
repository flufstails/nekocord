import { createUtilityPlugin } from '../_shared/chatUtility.js';

const TABLE = '| Column A | Column B |\n| :--- | :--- |\n| Item 1 | Value 1 |';

export default createUtilityPlugin((c) =>
  c.indexOf('\\table2') !== -1 ? c.split('\\table2').join(TABLE) : c,
);
