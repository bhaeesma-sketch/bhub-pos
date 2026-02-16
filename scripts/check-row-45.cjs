
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets['Non weighted products'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Row 44:', rows[44]);
console.log('Row 45:', rows[45]);
console.log('Row 46:', rows[46]);
