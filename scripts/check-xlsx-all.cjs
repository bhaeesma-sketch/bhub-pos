
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
console.log('SheetNames:', workbook.SheetNames);
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Sheet: ${name}, Columns:`, Object.keys(data[0] || {}));
});
