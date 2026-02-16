
import * as XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Headers:', rows[0]);
console.log('Row 1:', rows[1]);
