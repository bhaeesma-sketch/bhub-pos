
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log('Columns:', Object.keys(data[0] || {}));
console.log('Sample Row:', data[0]);
