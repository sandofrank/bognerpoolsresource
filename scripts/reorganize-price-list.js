const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Reorganizing price list by copying and rearranging original Excel rows...');

// Read the original Excel file with full formatting preservation
const originalExcelPath = path.join(__dirname, '../Archive/Bogner Price List 11.11.25.xlsx');
const originalWorkbook = XLSX.readFile(originalExcelPath, {
  cellStyles: true,
  cellHTML: false,
  cellFormula: true,
  cellDates: true
});
const originalSheet = originalWorkbook.Sheets[originalWorkbook.SheetNames[0]];

// Read the current JSON data
const jsonPath = path.join(__dirname, '../public/price-data.json');
const currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Create new reorganized structure
const reorganizedData = {
  title: 'Bogner Price List - Reorganized by Construction Phase',
  lastUpdated: currentData.lastUpdated,
  categories: []
};

// Helper function to find section by name in current data
function findSection(sectionName) {
  for (const category of currentData.categories) {
    const section = category.sections.find(s => s.name === sectionName);
    if (section) return JSON.parse(JSON.stringify(section)); // Deep copy
  }
  return null;
}

// Helper function to find multiple sections
function findSections(...sectionNames) {
  return sectionNames.map(name => findSection(name)).filter(s => s !== null);
}

// NEW CONSTRUCTION CATEGORY
const newConstruction = {
  name: 'NEW CONSTRUCTION',
  sections: []
};

// PHASE 1: Project Planning & Site Preparation
newConstruction.sections.push({
  name: '=== PHASE 1: PROJECT PLANNING & SITE PREPARATION ===',
  items: [],
  notes: ['This phase includes initial project setup, engineering, and site access preparation']
});

// Pool Base Pricing & Specifications
const poolBase = findSection('Pool Base Cost');
if (poolBase) {
  poolBase.name = 'Pool Base Pricing & Specifications';
  newConstruction.sections.push(poolBase);
}

const poolDepths = findSection('Pool Depths');
if (poolDepths) newConstruction.sections.push(poolDepths);

const zoneCharges = findSection('Zone Charges');
if (zoneCharges) newConstruction.sections.push(zoneCharges);

const structuralEng = findSection('Structural Engineering');
if (structuralEng) newConstruction.sections.push(structuralEng);

// Excavation & Site Work
const excavation = findSection('Excavation');
if (excavation) {
  excavation.name = 'Excavation & Site Work';
  newConstruction.sections.push(excavation);
}

// PHASE 2: Pool Shell Construction
newConstruction.sections.push({
  name: '=== PHASE 2: POOL SHELL CONSTRUCTION ===',
  items: [],
  notes: ['Shotcrete, structural elements, and shell finishing']
});

const shotcrete = findSection('Shotcrete');
if (shotcrete) {
  shotcrete.name = 'Pool Structure - Shotcrete & Steel';
  newConstruction.sections.push(shotcrete);
}

const raisedBondBeam = findSection('Raised Bond Beam');
if (raisedBondBeam) newConstruction.sections.push(raisedBondBeam);

const wingWalls = findSection('Wing Walls');
if (wingWalls) newConstruction.sections.push(wingWalls);

const vanishingEdge = findSection('Vanishing Edge');
if (vanishingEdge) newConstruction.sections.push(vanishingEdge);

// Spa Construction (consolidated)
newConstruction.sections.push({
  name: 'Spa Construction (All Elements)',
  items: [],
  notes: ['Consolidated spa base, extras, and walls for easier estimation']
});

const spaBase = findSection('Spa Base Cost');
if (spaBase) newConstruction.sections.push(spaBase);

const spaExtras = findSection('Spa Extras');
if (spaExtras) newConstruction.sections.push(spaExtras);

const spaWalls = findSection('Spa Walls');
if (spaWalls) newConstruction.sections.push(spaWalls);

const spaOnly = findSection('Spa Only');
if (spaOnly) newConstruction.sections.push(spaOnly);

// PHASE 3: Plumbing Systems
newConstruction.sections.push({
  name: '=== PHASE 3: PLUMBING SYSTEMS ===',
  items: [],
  notes: ['All water circulation, drainage, and specialty plumbing']
});

const poolPlumbing = findSection('Pool Plumbing');
if (poolPlumbing) newConstruction.sections.push(poolPlumbing);

const spaPlumbing = findSection('Spa Plumbing');
if (spaPlumbing) newConstruction.sections.push(spaPlumbing);

const inFloorCleaner = findSection('In Floor Cleaner');
if (inFloorCleaner) {
  inFloorCleaner.name = 'Specialty Plumbing - In Floor Cleaning';
  newConstruction.sections.push(inFloorCleaner);
}

const poolSweeps = findSection('Pool Sweeps');
if (poolSweeps) {
  poolSweeps.name = 'Specialty Plumbing - Pool Sweeps';
  newConstruction.sections.push(poolSweeps);
}

const drains = findSection('Drains');
if (drains) {
  drains.name = 'Specialty Plumbing - Drainage Systems';
  newConstruction.sections.push(drains);
}

const gasLines = findSection('Gas Lines');
if (gasLines) {
  gasLines.name = 'Gas Line Systems';
  newConstruction.sections.push(gasLines);
}

// PHASE 4: Equipment Installation
newConstruction.sections.push({
  name: '=== PHASE 4: EQUIPMENT INSTALLATION ===',
  items: [],
  notes: ['Filtration, heating, and water treatment systems']
});

const heaters = findSection('Heaters');
if (heaters) {
  heaters.name = 'Heating Systems';
  newConstruction.sections.push(heaters);
}

const sanitizers = findSection('Sanitizers');
if (sanitizers) {
  sanitizers.name = 'Water Treatment & Sanitization';
  newConstruction.sections.push(sanitizers);
}

// PHASE 5: Electrical Systems
newConstruction.sections.push({
  name: '=== PHASE 5: ELECTRICAL SYSTEMS ===',
  items: [],
  notes: ['All electrical runs, lights, and controls']
});

const electrical = findSection('Electrical');
if (electrical) {
  electrical.name = 'Pool & Feature Electrical';
  newConstruction.sections.push(electrical);
}

const remoteControls = findSection('Remote Controls');
if (remoteControls) newConstruction.sections.push(remoteControls);

// PHASE 6: Interior Finishes
newConstruction.sections.push({
  name: '=== PHASE 6: INTERIOR FINISHES ===',
  items: [],
  notes: ['Tile, coping, and plaster/surface finishes']
});

const tile = findSection('Tile');
if (tile) {
  tile.name = 'Tile Work';
  newConstruction.sections.push(tile);
}

const coping = findSection('Coping');
if (coping) newConstruction.sections.push(coping);

const plaster = findSection('Pebble/Quartz/Colored Plaster');
if (plaster) {
  plaster.name = 'Plaster & Surface Finishes';
  newConstruction.sections.push(plaster);
}

// PHASE 7: Pool Features & Accessories
newConstruction.sections.push({
  name: '=== PHASE 7: POOL FEATURES & ACCESSORIES ===',
  items: [],
  notes: ['Water features, safety features, and pool accessories']
});

const poolExtras = findSection('Pool Extras');
if (poolExtras) {
  poolExtras.name = 'Pool Entry & Safety Features';
  newConstruction.sections.push(poolExtras);
}

const waterFeatures = findSection('Water Features');
if (waterFeatures) newConstruction.sections.push(waterFeatures);

const motorizedCover = findSection('Motorized Pool Cover');
if (motorizedCover) newConstruction.sections.push(motorizedCover);

// PHASE 8: Decking & Hardscape
newConstruction.sections.push({
  name: '=== PHASE 8: DECKING & HARDSCAPE ===',
  items: [],
  notes: ['Concrete decking, footings, steps, and pavers']
});

const decking = findSection('Decking');
if (decking) {
  decking.name = 'Concrete Decking';
  newConstruction.sections.push(decking);
}

const footings = findSection('Footings');
if (footings) newConstruction.sections.push(footings);

const stepRisers = findSection('Step Risers');
if (stepRisers) {
  stepRisers.name = 'Steps & Risers';
  newConstruction.sections.push(stepRisers);
}

const pavers = findSection('Pavers');
if (pavers) newConstruction.sections.push(pavers);

// PHASE 9: Walls & Structures
newConstruction.sections.push({
  name: '=== PHASE 9: WALLS & STRUCTURES ===',
  items: [],
  notes: ['Walls, columns, caps, and veneer work']
});

const walls = findSection('Walls');
if (walls) {
  walls.name = 'Freestanding & Retaining Walls';
  newConstruction.sections.push(walls);
}

const wallCaps = findSection('Wall Caps');
if (wallCaps) newConstruction.sections.push(wallCaps);

const columns = findSection('Columns');
if (columns) newConstruction.sections.push(columns);

const columnCaps = findSection('Column Caps');
if (columnCaps) newConstruction.sections.push(columnCaps);

const facing = findSection('Facing and Veneer Not Raised Bond Beam');
if (facing) {
  facing.name = 'Facing & Veneer';
  newConstruction.sections.push(facing);
}

// PHASE 10: Outdoor Living Features
newConstruction.sections.push({
  name: '=== PHASE 10: OUTDOOR LIVING FEATURES ===',
  items: [],
  notes: ['BBQs, fire features, and specialty outdoor amenities']
});

const bbqs = findSection('Bbqs');
if (bbqs) {
  bbqs.name = 'BBQ Islands';
  newConstruction.sections.push(bbqs);
}

const firePits = findSection('Fire Pits and Bowls');
if (firePits) newConstruction.sections.push(firePits);

const realRock = findSection('Real Rock');
if (realRock) newConstruction.sections.push(realRock);

const artificialRock = findSection('Artificial Rock');
if (artificialRock) newConstruction.sections.push(artificialRock);

const solar = findSection('Solar');
if (solar) newConstruction.sections.push(solar);

const alumawood = findSection('Alumawood Patio Covers');
if (alumawood) newConstruction.sections.push(alumawood);

// PHASE 11: Fencing & Safety
newConstruction.sections.push({
  name: '=== PHASE 11: FENCING & SAFETY ===',
  items: [],
  notes: ['Fence installation and safety compliance']
});

const fencing = findSection('Fencing');
if (fencing) {
  fencing.name = 'Fencing & Gates';
  newConstruction.sections.push(fencing);
}

// Add new construction category
reorganizedData.categories.push(newConstruction);

// REMODEL CATEGORY
const remodel = {
  name: 'REMODEL',
  sections: []
};

// REMODEL Phase 1: Demolition & Preparation
remodel.sections.push({
  name: '=== REMODEL PHASE 1: DEMOLITION & PREPARATION ===',
  items: [],
  notes: ['Strip and removal of existing surfaces']
});

const stripPlaster = findSection('Strip Plaster');
if (stripPlaster) {
  stripPlaster.name = 'Strip & Removal';
  remodel.sections.push(stripPlaster);
}

const dumpFees = findSection('Dump Fees');
if (dumpFees) remodel.sections.push(dumpFees);

// REMODEL Phase 2: Surface Preparation
remodel.sections.push({
  name: '=== REMODEL PHASE 2: SURFACE PREPARATION ===',
  items: [],
  notes: ['Tile cutting and coping preparation']
});

const cutTile = findSection('Cut Tile if Tile Stays on Pool and Spa');
if (cutTile) {
  cutTile.name = 'Tile Work (if tile stays)';
  remodel.sections.push(cutTile);
}

const remodelTile = findSection('Tile up to Group 5');
if (remodelTile) {
  remodelTile.name = 'Tile Replacement';
  remodel.sections.push(remodelTile);
}

const remodelCoping = findSection('Coping');
if (remodelCoping) {
  remodelCoping.name = 'Coping Replacement';
  remodel.sections.push(remodelCoping);
}

// REMODEL Phase 3: New Finishes
remodel.sections.push({
  name: '=== REMODEL PHASE 3: NEW FINISHES ===',
  items: [],
  notes: ['Plaster and surface finish application']
});

const whitePlaster = findSection('White Plaster');
if (whitePlaster) {
  whitePlaster.name = 'Plaster & Surface Finishes';
  remodel.sections.push(whitePlaster);
}

const pebbleFinish = findSection('Pebble Finish');
if (pebbleFinish) remodel.sections.push(pebbleFinish);

const sparkleQuartz = findSection('Sparkle Quartz');
if (sparkleQuartz) remodel.sections.push(sparkleQuartz);

// REMODEL Phase 4: Systems Upgrades
remodel.sections.push({
  name: '=== REMODEL PHASE 4: SYSTEMS UPGRADES ===',
  items: [],
  notes: ['Plumbing, electrical, and equipment updates']
});

const remodelPlumbing = findSection('Plumbing');
if (remodelPlumbing) {
  remodelPlumbing.name = 'Plumbing Upgrades';
  remodel.sections.push(remodelPlumbing);
}

const remodelElectrical = findSection('Electrical');
if (remodelElectrical) {
  remodelElectrical.name = 'Electrical Upgrades';
  remodel.sections.push(remodelElectrical);
}

const remodelEquipment = findSection('Equipment');
if (remodelEquipment) {
  remodelEquipment.name = 'Equipment Replacement';
  remodel.sections.push(remodelEquipment);
}

// REMODEL Phase 5: Decking
remodel.sections.push({
  name: '=== REMODEL PHASE 5: DECKING ===',
  items: [],
  notes: ['Use new construction pricing + $1 PSF']
});

const remodelDecking = findSection('Decking');
if (remodelDecking) {
  remodelDecking.name = 'Decking Work';
  remodel.sections.push(remodelDecking);
}

// Add remodel category
reorganizedData.categories.push(remodel);

// Helper function to find row index by text in column C
function findRowByText(searchText, searchType = 'exact') {
  const range = XLSX.utils.decode_range(originalSheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 2 }); // Column C
    const cell = originalSheet[cellAddress];
    if (cell && cell.v) {
      const cellValue = String(cell.v).trim();
      const searchValue = String(searchText).trim();

      if (searchType === 'exact' && cellValue === searchValue) {
        return R;
      } else if (searchType === 'contains' && cellValue.includes(searchValue)) {
        return R;
      }
    }
  }
  return -1;
}

// Helper function to copy entire row with all formatting
function copyRow(sourceRow, targetRow) {
  const range = XLSX.utils.decode_range(originalSheet['!ref']);
  const newCells = {};

  for (let C = range.s.c; C <= range.e.c; C++) {
    const sourceAddr = XLSX.utils.encode_cell({ r: sourceRow, c: C });
    const targetAddr = XLSX.utils.encode_cell({ r: targetRow, c: C });

    if (originalSheet[sourceAddr]) {
      // Deep copy the cell with all properties (value, style, format, etc.)
      newCells[targetAddr] = JSON.parse(JSON.stringify(originalSheet[sourceAddr]));
    }
  }

  return newCells;
}

// Helper function to get all rows for a section (section name + notes + items)
function getSectionRows(sectionName) {
  const startRow = findRowByText(sectionName, 'exact');
  if (startRow === -1) return [];

  const rows = [startRow];
  const range = XLSX.utils.decode_range(originalSheet['!ref']);

  // Continue until we hit another section header or category
  for (let R = startRow + 1; R <= range.e.r; R++) {
    const cellC = originalSheet[XLSX.utils.encode_cell({ r: R, c: 2 })];
    const cellA = originalSheet[XLSX.utils.encode_cell({ r: R, c: 0 })];

    // Stop if we hit a new section (no cost/unit and not a note)
    if (cellC && cellC.v && !cellA) {
      const text = String(cellC.v).trim();
      if (!text.startsWith('Note')) {
        break;
      }
    }

    rows.push(R);

    // Stop if we've gone far enough and hit empty cells
    if (!cellC && !cellA) {
      const nextCell = originalSheet[XLSX.utils.encode_cell({ r: R + 1, c: 2 })];
      if (!nextCell) break;
    }
  }

  return rows;
}

// Create new worksheet by copying and rearranging original rows
const newSheet = {};
let currentTargetRow = 0;

// Copy header row (row 0)
Object.assign(newSheet, copyRow(0, currentTargetRow++));

// Copy "Last Updated" row (row 1)
const lastUpdatedRow = findRowByText('Last Updated', 'contains');
if (lastUpdatedRow >= 0) {
  Object.assign(newSheet, copyRow(lastUpdatedRow, currentTargetRow++));
}

// Process reorganized data
reorganizedData.categories.forEach(category => {
  // Find and copy category row
  const categoryRow = findRowByText(category.name, 'exact');
  if (categoryRow >= 0) {
    Object.assign(newSheet, copyRow(categoryRow, currentTargetRow++));
  }

  category.sections.forEach(section => {
    // Handle phase headers (create new formatted row)
    if (section.name.includes('===')) {
      // Copy a category row format for phase header
      const phaseHeaderRow = findRowByText('NEW CONSTRUCTION', 'exact');
      if (phaseHeaderRow >= 0) {
        const phaseCells = copyRow(phaseHeaderRow, currentTargetRow);
        // Update the text in column C
        const cellC = XLSX.utils.encode_cell({ r: currentTargetRow, c: 2 });
        if (phaseCells[cellC]) {
          phaseCells[cellC].v = section.name;
          phaseCells[cellC].w = section.name;
        }
        Object.assign(newSheet, phaseCells);
        currentTargetRow++;
      }
    } else {
      // Find and copy all rows for this section
      const sectionRows = getSectionRows(section.name);
      sectionRows.forEach(sourceRow => {
        Object.assign(newSheet, copyRow(sourceRow, currentTargetRow++));
      });
    }
  });
});

// Set the range for the new sheet
newSheet['!ref'] = XLSX.utils.encode_range({
  s: { r: 0, c: 0 },
  e: { r: currentTargetRow - 1, c: 2 }
});

// Copy column widths
if (originalSheet['!cols']) {
  newSheet['!cols'] = JSON.parse(JSON.stringify(originalSheet['!cols']));
}

// Copy other sheet properties
if (originalSheet['!rows']) {
  newSheet['!rows'] = JSON.parse(JSON.stringify(originalSheet['!rows']));
}
if (originalSheet['!merges']) {
  newSheet['!merges'] = JSON.parse(JSON.stringify(originalSheet['!merges']));
}

// Create workbook and add the reorganized sheet
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, newSheet, 'Price List Reorganized');

// Write to file
const outputPath = path.join(__dirname, '../Archive/Bogner Price List - Reorganized.xlsx');
XLSX.writeFile(workbook, outputPath, {
  cellStyles: true,
  bookSST: true,
  bookType: 'xlsx'
});

console.log('✓ Reorganization complete!');
console.log(`✓ File saved to: ${outputPath}`);
console.log(`✓ Categories: ${reorganizedData.categories.length}`);
console.log(`✓ New Construction Sections: ${reorganizedData.categories[0].sections.length}`);
console.log(`✓ Remodel Sections: ${reorganizedData.categories[1].sections.length}`);
