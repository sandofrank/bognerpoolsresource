import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as mupdf from 'mupdf';
import sharp from 'sharp';

// Text patterns to redact and their replacements
const REDACTION_PATTERNS = [
  // Email patterns
  { search: "frankster@fsandoval.net's Organization", replace: "Bogner Pools" },
  { search: "Frank Sandoval's projects", replace: "Bogner Pools" },
  { search: "frankster@fsandoval.net", replace: "franks@bognerpools.com" },
  { search: "frank@greatoakis.com", replace: "franks@bognerpools.com" },
  // Address patterns - full variations
  { search: "41040 LOS RANCHOS CIRCLE", replace: "5045 Van Buren Blvd" },
  { search: "41040 Los Ranchos Circle", replace: "5045 Van Buren Blvd" },
  { search: "41040 LOS RANCHOS CIR", replace: "5045 Van Buren Blvd" },
  { search: "41040 Los Ranchos Cir", replace: "5045 Van Buren Blvd" },
  // City/State/Zip patterns
  { search: "TEMECULA, CA 92592", replace: "Riverside, CA 92503" },
  { search: "TEMECULA, California 92592", replace: "Riverside, CA 92503" },
  { search: "Temecula, CA 92592", replace: "Riverside, CA 92503" },
  { search: "Temecula, California 92592", replace: "Riverside, CA 92503" },
  // City alone
  { search: "TEMECULA", replace: "Riverside" },
  { search: "Temecula", replace: "Riverside" },
  // Zip code alone (last to avoid partial matches)
  { search: "92592", replace: "92503" },
];

// Redact a PDF by rendering to image, overlaying white boxes with text, then returning as image
async function redactPdfToImage(pdfBuffer: Buffer): Promise<Buffer[]> {
  const images: Buffer[] = [];

  try {
    const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf") as mupdf.PDFDocument;
    const pageCount = doc.countPages();

    for (let pageNum = 0; pageNum < pageCount; pageNum++) {
      const page = doc.loadPage(pageNum) as mupdf.PDFPage;

      // Get page dimensions
      const bounds = page.getBounds();
      const _pageWidth = bounds[2] - bounds[0];
      const _pageHeight = bounds[3] - bounds[1];

      // Render at 2x resolution for quality
      const scale = 2;
      const pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        false,
        true
      );

      const pngBuffer = Buffer.from(pixmap.asPNG());
      const imgWidth = pixmap.getWidth();
      const imgHeight = pixmap.getHeight();

      // Find all text locations that need redaction
      const redactions: Array<{x: number; y: number; width: number; height: number; replace: string}> = [];

      for (const pattern of REDACTION_PATTERNS) {
        const hits = page.search(pattern.search);

        for (const hit of hits) {
          const quads = Array.isArray(hit[0]) ? hit : [hit];

          for (const quad of quads) {
            if (Array.isArray(quad) && quad.length >= 8) {
              // Get bounding rect from quad points (in PDF coordinates)
              const q = quad as number[];
              const x0 = Math.min(q[0], q[2], q[4], q[6]);
              const y0 = Math.min(q[1], q[3], q[5], q[7]);
              const x1 = Math.max(q[0], q[2], q[4], q[6]);
              const y1 = Math.max(q[1], q[3], q[5], q[7]);

              // Convert PDF coordinates to image coordinates
              // PDF origin is bottom-left, image origin is top-left
              const imgX = Math.floor((x0 - bounds[0]) * scale);
              const imgY = Math.floor((y0 - bounds[1]) * scale);
              const imgW = Math.ceil((x1 - x0) * scale);
              const imgH = Math.ceil((y1 - y0) * scale);

              redactions.push({
                x: imgX,
                y: imgY,
                width: imgW,
                height: imgH,
                replace: pattern.replace
              });
            }
          }
        }
      }

      if (redactions.length === 0) {
        // No redactions needed, just use the rendered image
        images.push(pngBuffer);
        continue;
      }

      // Create SVG overlay with white boxes only (cover page has correct bill-to info)
      const svgRects = redactions.map((r) => {
        // Add padding to fully cover the text
        const padding = 4 * scale;
        return `<rect x="${r.x - padding}" y="${r.y - padding}" width="${r.width + padding * 2}" height="${r.height + padding * 2}" fill="white"/>`;
      }).join('');

      const svgOverlay = Buffer.from(`
        <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
          ${svgRects}
        </svg>
      `);

      // Composite the redactions onto the image
      const redactedBuffer = await sharp(pngBuffer)
        .composite([{
          input: svgOverlay,
          top: 0,
          left: 0,
        }])
        .png()
        .toBuffer();

      images.push(redactedBuffer);
    }

    return images;
  } catch (err) {
    console.error("Error redacting PDF:", err);
    return [];
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface ReceiptData {
  id: string;
  data: {
    vendor: string;
    date: string;
    amount: string;
    description: string;
    billTo: {
      name: string;
      company: string;
      email: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const submittedBy = formData.get('submittedBy') as string;
    const receiptsDataStr = formData.get('receiptsData') as string;
    const receipts: ReceiptData[] = JSON.parse(receiptsDataStr);

    // Collect all uploaded files
    const files: File[] = [];
    let fileIndex = 0;
    while (formData.has(`file_${fileIndex}`)) {
      files.push(formData.get(`file_${fileIndex}`) as File);
      fileIndex++;
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Create cover page
    const coverPage = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = coverPage.getSize();

    // Colors
    const primaryBlue = rgb(0.02, 0.31, 0.55); // Bogner blue
    const tealAccent = rgb(0.0, 0.59, 0.65);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.6, 0.6, 0.6);

    // Header bar
    coverPage.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: primaryBlue,
    });

    // Company name in header
    coverPage.drawText('BOGNER POOLS', {
      x: 50,
      y: height - 60,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Report title
    coverPage.drawText(title || 'Expense Report', {
      x: 50,
      y: height - 160,
      size: 32,
      font: helveticaBold,
      color: primaryBlue,
    });

    // Date line
    coverPage.drawText(`Generated: ${date}`, {
      x: 50,
      y: height - 195,
      size: 12,
      font: helvetica,
      color: lightGray,
    });

    // Submitted by
    coverPage.drawText(`Submitted by: ${submittedBy}`, {
      x: 50,
      y: height - 215,
      size: 12,
      font: helvetica,
      color: lightGray,
    });

    // Summary section
    coverPage.drawText('EXPENSE SUMMARY', {
      x: 50,
      y: height - 280,
      size: 14,
      font: helveticaBold,
      color: tealAccent,
    });

    // Divider line
    coverPage.drawLine({
      start: { x: 50, y: height - 290 },
      end: { x: width - 50, y: height - 290 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Calculate total
    let total = 0;
    receipts.forEach((receipt) => {
      const amountStr = receipt.data.amount.replace(/[^0-9.-]/g, '');
      const amount = parseFloat(amountStr) || 0;
      total += amount;
    });

    // Receipt list header
    const tableStartY = height - 320;
    const colWidths = { vendor: 180, date: 100, description: 150, amount: 80 };

    // Table header
    coverPage.drawText('Vendor', {
      x: 50,
      y: tableStartY,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    coverPage.drawText('Date', {
      x: 50 + colWidths.vendor,
      y: tableStartY,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    coverPage.drawText('Description', {
      x: 50 + colWidths.vendor + colWidths.date,
      y: tableStartY,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    coverPage.drawText('Amount', {
      x: width - 50 - colWidths.amount,
      y: tableStartY,
      size: 10,
      font: helveticaBold,
      color: gray,
    });

    // Header line
    coverPage.drawLine({
      start: { x: 50, y: tableStartY - 5 },
      end: { x: width - 50, y: tableStartY - 5 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Receipt rows
    let currentY = tableStartY - 25;
    receipts.forEach((receipt) => {
      if (currentY < 150) {
        return;
      }

      const truncate = (text: string, maxLen: number) => {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen - 3) + '...';
      };

      coverPage.drawText(truncate(receipt.data.vendor || 'Unknown', 25), {
        x: 50,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawText(receipt.data.date || '-', {
        x: 50 + colWidths.vendor,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawText(truncate(receipt.data.description || '-', 20), {
        x: 50 + colWidths.vendor + colWidths.date,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawText(receipt.data.amount || '$0.00', {
        x: width - 50 - colWidths.amount,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawLine({
        start: { x: 50, y: currentY - 8 },
        end: { x: width - 50, y: currentY - 8 },
        thickness: 0.25,
        color: rgb(0.9, 0.9, 0.9),
      });

      currentY -= 25;
    });

    // Total row
    currentY -= 10;
    coverPage.drawLine({
      start: { x: 50, y: currentY + 5 },
      end: { x: width - 50, y: currentY + 5 },
      thickness: 1,
      color: primaryBlue,
    });

    coverPage.drawText('TOTAL', {
      x: 50,
      y: currentY - 15,
      size: 12,
      font: helveticaBold,
      color: primaryBlue,
    });

    coverPage.drawText(`$${total.toFixed(2)}`, {
      x: width - 50 - colWidths.amount,
      y: currentY - 15,
      size: 12,
      font: helveticaBold,
      color: primaryBlue,
    });

    // Bill To section
    const billToY = currentY - 70;
    coverPage.drawText('BILL TO', {
      x: 50,
      y: billToY,
      size: 14,
      font: helveticaBold,
      color: tealAccent,
    });

    coverPage.drawLine({
      start: { x: 50, y: billToY - 10 },
      end: { x: 250, y: billToY - 10 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    const billTo = receipts[0]?.data.billTo || {
      name: 'Frank Sandoval',
      company: 'Bogner Pools',
      email: 'franks@bognerpools.com',
    };

    coverPage.drawText(billTo.name, {
      x: 50,
      y: billToY - 30,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    coverPage.drawText(billTo.company, {
      x: 50,
      y: billToY - 45,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    coverPage.drawText(billTo.email, {
      x: 50,
      y: billToY - 60,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Footer
    coverPage.drawText(`${receipts.length} receipt(s) attached`, {
      x: 50,
      y: 50,
      size: 10,
      font: helvetica,
      color: lightGray,
    });

    coverPage.drawText('Generated by BERT - Bogner Expense Report Tool', {
      x: width - 280,
      y: 50,
      size: 10,
      font: helvetica,
      color: lightGray,
    });

    // Append redacted receipts
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();

      if (file.type === 'application/pdf') {
        try {
          // Redact the PDF and get images of each page
          const pdfBuffer = Buffer.from(bytes);
          const redactedImages = await redactPdfToImage(pdfBuffer);

          // Get the vendor name for this receipt
          const vendorName = receipts[i]?.data.vendor || file.name.replace(/\.[^/.]+$/, '') || 'Receipt';

          // Embed each page as an image
          for (let pageIdx = 0; pageIdx < redactedImages.length; pageIdx++) {
            const imgBuffer = redactedImages[pageIdx];
            const image = await pdfDoc.embedPng(imgBuffer);
            const imgDims = image.scale(1);

            // Scale to fit page (leave room for header)
            const maxWidth = 562; // 612 - 50 margin on each side
            const maxHeight = 712; // 792 - 50 margin top - 30 header
            let scale = 1;
            if (imgDims.width > maxWidth) {
              scale = maxWidth / imgDims.width;
            }
            if (imgDims.height * scale > maxHeight) {
              scale = maxHeight / imgDims.height;
            }

            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;

            const imagePage = pdfDoc.addPage([612, 792]);

            // Add receipt header
            const pageLabel = redactedImages.length > 1
              ? `Receipt ${i + 1}: ${vendorName} (Page ${pageIdx + 1}/${redactedImages.length})`
              : `Receipt ${i + 1}: ${vendorName}`;

            imagePage.drawText(pageLabel, {
              x: 50,
              y: 760,
              size: 12,
              font: helveticaBold,
              color: primaryBlue,
            });

            // Center the image below the header
            const imgX = (612 - scaledWidth) / 2;
            const imgY = (742 - scaledHeight) / 2;

            imagePage.drawImage(image, {
              x: imgX,
              y: imgY,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        } catch (err) {
          console.error(`Error processing PDF ${file.name}:`, err);
          // Create error page
          const errorPage = pdfDoc.addPage([612, 792]);
          errorPage.drawText(`Receipt ${i + 1}: ${file.name}`, {
            x: 50,
            y: 700,
            size: 14,
            font: helveticaBold,
            color: primaryBlue,
          });
          errorPage.drawText('(Could not process this PDF)', {
            x: 50,
            y: 680,
            size: 10,
            font: helvetica,
            color: gray,
          });
        }
      } else {
        // For images, embed directly (no redaction for now)
        try {
          let image;
          if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(bytes);
          } else {
            image = await pdfDoc.embedJpg(bytes);
          }

          const maxWidth = 512;
          const maxHeight = 692;
          const imgDims = image.scale(1);

          let scale = 1;
          if (imgDims.width > maxWidth) {
            scale = maxWidth / imgDims.width;
          }
          if (imgDims.height * scale > maxHeight) {
            scale = maxHeight / imgDims.height;
          }

          const scaledWidth = imgDims.width * scale;
          const scaledHeight = imgDims.height * scale;

          const imagePage = pdfDoc.addPage([612, 792]);
          imagePage.drawText(`Receipt ${i + 1}: ${receipts[i]?.data.vendor || file.name}`, {
            x: 50,
            y: 750,
            size: 12,
            font: helveticaBold,
            color: primaryBlue,
          });

          const imgX = (612 - scaledWidth) / 2;
          const imgY = (792 - scaledHeight) / 2 - 20;

          imagePage.drawImage(image, {
            x: imgX,
            y: imgY,
            width: scaledWidth,
            height: scaledHeight,
          });
        } catch (err) {
          console.error(`Error embedding image ${file.name}:`, err);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'expense-report'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
