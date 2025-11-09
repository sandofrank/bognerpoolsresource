const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const excelPath = path.join(__dirname, '../Archive/Bogner Price List 11.11.25.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0]; // 'Price List Working Copy'
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log('Converting Excel to JSON...');

// List of known category names (top-level groupings)
const categoryNames = [
  'NEW CONSTRUCTION',
  'REMODEL'
];

const result = {
  title: 'Bogner Price List',
  lastUpdated: '',
  categories: []
};

let currentCategory = null;
let currentSection = null;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const cost = row[0];
  const unit = row[1];
  const description = row[2];

  // Skip empty rows
  if (!description) continue;

  // Check for Last Updated
  if (description.includes('Last Updated')) {
    result.lastUpdated = description;
    continue;
  }

  // Check if this is a note (starts with "Note")
  if (description.match(/^Note\s*[–\-—]/i)) {
    if (currentSection) {
      if (!currentSection.notes) {
        currentSection.notes = [];
      }
      currentSection.notes.push(description);
    }
    continue;
  }

  // Check if this is a category (top-level grouping)
  if (!cost && !unit && categoryNames.includes(description.toUpperCase())) {
    currentCategory = {
      name: description,
      sections: []
    };
    result.categories.push(currentCategory);
    currentSection = null;
    continue;
  }

  // Check if this is a section name (no cost, no unit)
  if (!cost && !unit) {
    // If no currentCategory, create one
    if (!currentCategory) {
      currentCategory = {
        name: description,
        sections: []
      };
      result.categories.push(currentCategory);
    } else {
      // This is a section within the current category
      currentSection = {
        name: description,
        items: []
      };
      currentCategory.sections.push(currentSection);
    }
    continue;
  }

  // This is an item (has cost or unit)
  if (cost !== null || unit) {
    // If no section exists, create a default one
    if (!currentSection) {
      if (!currentCategory) {
        currentCategory = {
          name: 'Miscellaneous',
          sections: []
        };
        result.categories.push(currentCategory);
      }
      currentSection = {
        name: 'Items',
        items: []
      };
      currentCategory.sections.push(currentSection);
    }

    currentSection.items.push({
      cost: cost || 0,
      unit: unit || null,
      description: description || ''
    });
  }
}

// Write to JSON file
const outputPath = path.join(__dirname, '../public/price-data.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log('✓ Conversion complete!');
console.log(`✓ JSON file saved to: ${outputPath}`);
console.log(`✓ Categories: ${result.categories.length}`);
console.log(`✓ Last Updated: ${result.lastUpdated}`);
