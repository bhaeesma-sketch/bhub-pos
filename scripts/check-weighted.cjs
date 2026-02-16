
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets['Weighted products'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Weighted Products Raw (Top 10):');
rows.slice(0, 10).forEach(r => console.log(r));
