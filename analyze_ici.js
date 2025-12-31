import * as XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('mm_summary_data_2025.xls');
const workbook = XLSX.read(buf, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sheet Name:', sheetName);
console.log('First 10 rows:');
data.slice(0, 10).forEach((row, i) => console.log(`Row ${i}:`, row));
