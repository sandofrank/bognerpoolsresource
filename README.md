# Bogner Pools Resource Site

Next.js resource site for Bogner Pools with price list management.

## Project Structure

```
bognerpoolsresource/
├── Bogner Price List 11.11.25.xlsx  # Source of truth - edit this file
└── bogner-resource-site/             # Next.js application
    ├── app/                          # Pages
    ├── components/                   # React components
    ├── public/
    │   └── price-data.json          # Auto-generated from Excel
    └── scripts/
        └── excel-to-json.js         # Conversion script
```

## Editing Price Data

The price list data comes from the Excel file `Bogner Price List 11.11.25.xlsx`.

### Workflow:

1. **Edit the Excel file** - Make your changes to prices, descriptions, etc.
2. **Convert to JSON** - Run the sync command:
   ```bash
   cd bogner-resource-site
   npm run sync-data
   ```
3. **View changes** - The website will automatically use the updated data

### Excel File Structure:

The Excel file should have 3 columns:
- **Column A (Cost)**: Price or "BID ONLY"
- **Column B (Factor/Unit)**: Unit of measurement (EA, PLF, PSF, etc.)
- **Column C (Item)**: Description

**Categories and Sections:**
- Major categories: "NEW CONSTRUCTION", "REMODEL"
- Sections: Any row without cost/unit becomes a section name
- Notes: Lines starting with `***`, `*NOTE`, or `*NPT`
- Items: Any row with a cost and/or unit

## Development

```bash
cd bogner-resource-site

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Sync Excel data to JSON
npm run sync-data
```

## Deployment

The site is configured for static export. Build and deploy the `/out` directory:

```bash
npm run build
# Deploy the 'out' folder to your hosting provider
```
