
const XLSX = require('xlsx');
const workbook = XLSX.readFile('./public/data/inventory.xlsx');
let found = 0;
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let r = range.s.r; r <= range.e.r; ++r) {
        for (let c = range.s.c; c <= range.e.c; ++c) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v && typeof cell.v === 'string' && /^\d{8,14}$/.test(cell.v)) {
                console.log(`Potential Barcode Found: ${cell.v} in Sheet ${name}, Cell ${XLSX.utils.encode_cell({ r, c })}`);
                found++;
                if (found > 10) return;
            }
        }
    }
});
if (found === 0) console.log('No barcode-like strings found in Excel.');
