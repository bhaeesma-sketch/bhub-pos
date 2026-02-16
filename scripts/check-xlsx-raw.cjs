
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Sample Data (Raw):');
rows.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});
