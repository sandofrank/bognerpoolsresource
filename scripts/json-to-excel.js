const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '../public/price-data.json');
const priceData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('Converting JSON to Excel...');

// Read the existing Excel file to preserve formatting
const excelPath = path.join(__dirname, '../Archive/Bogner Price List 11.11.25.xlsx');
const workbook = XLSX.readFile(excelPath, { cellStyles: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Create worksheet data as array of arrays
const worksheetData = [];

// Add header row
worksheetData.push(['Cost', 'Factor', 'Item']);

// Add last updated
worksheetData.push([null, null, priceData.lastUpdated]);

// Process each category
priceData.categories.forEach(category => {
  // Add category name
  worksheetData.push([null, null, category.name]);

  // Process each section
  category.sections.forEach(section => {
    // Add section name
    worksheetData.push([null, null, section.name]);

    // Add notes first if they exist
    if (section.notes && section.notes.length > 0) {
      section.notes.forEach(note => {
        worksheetData.push([null, null, note]);
      });
    }

    // Add items
    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        worksheetData.push([
          item.cost,
          item.unit,
          item.description
        ]);
      });
    }
  });
});

// Update cell values while preserving formatting
worksheetData.forEach((row, rowIndex) => {
  row.forEach((value, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

    // If cell exists, update its value but keep formatting
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].v = value;
      worksheet[cellAddress].w = value != null ? String(value) : '';
    } else {
      // Create new cell if it doesn't exist
      worksheet[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
    }
  });
});

// Update worksheet range
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
if (worksheetData.length - 1 > range.e.r) {
  range.e.r = worksheetData.length - 1;
  worksheet['!ref'] = XLSX.utils.encode_range(range);
}

// Write to Excel file
XLSX.writeFile(workbook, excelPath, { cellStyles: true });

console.log('✓ Conversion complete!');
console.log(`✓ Excel file updated at: ${excelPath}`);
console.log(`✓ Categories: ${priceData.categories.length}`);
console.log(`✓ Total rows: ${worksheetData.length}`);
