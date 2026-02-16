
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets['Non weighted products'];
console.log('Range:', sheet['!ref']);
const headersWithCells = [];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Row 0 (Full):', rows[0]);
