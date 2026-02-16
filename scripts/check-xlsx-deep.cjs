
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
console.log('SheetNames:', workbook.SheetNames);
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\nSheet: ${name}`);
    console.log('Headers (Row 0):', data[0]);
    console.log('Sample Row 1:', data[1]);
});
