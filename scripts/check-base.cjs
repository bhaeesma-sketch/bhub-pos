
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory_base.xlsx');
console.log('SheetNames:', workbook.SheetNames);
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\nSheet: ${name}`);
    console.log('Headers:', data[0]);
    if (data.length > 2) console.log('Row 1:', data[1]);
});
