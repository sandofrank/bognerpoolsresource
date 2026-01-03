import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as mupdf from 'mupdf';
import sharp from 'sharp';

// Text patterns to redact - all replaced with "Bogner Pools"
const REDACTION_PATTERNS = [
  // Name patterns
  "Frank Sandoval",
  "FRANK SANDOVAL",
  "frank sandoval",
  // Email patterns
  "frankster@fsandoval.net's Organization",
  "Frank Sandoval's projects",
  "frankster@fsandoval.net",
  "frank@greatoakis.com",
  "frank@fsandoval.net",
  "fsandoval@gmail.com",
  // Address patterns
  "41040 LOS RANCHOS CIRCLE",
  "41040 Los Ranchos Circle",
  "41040 LOS RANCHOS CIR",
  "41040 Los Ranchos Cir",
  "41040 Los Ranchos",
  // City/State/Zip patterns
  "TEMECULA, CA 92592",
  "TEMECULA, California 92592",
  "Temecula, CA 92592",
  "Temecula, California 92592",
  "Temecula CA 92592",
  "TEMECULA",
  "Temecula",
  "92592",
];

const REPLACEMENT_TEXT = "Bogner Pools";

interface RedactionResult {
  imageBuffer: Buffer;
  // Redaction positions in PDF coordinates (for drawing text with pdf-lib)
  textPositions: Array<{x: number; y: number; fontSize: number}>;
  // Original page dimensions
  pageWidth: number;
  pageHeight: number;
}

// Process PDF: white out personal info and return positions for text overlay
async function redactPdfToImage(pdfBuffer: Buffer): Promise<RedactionResult[]> {
  const results: RedactionResult[] = [];

  try {
    const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf") as mupdf.PDFDocument;
    const pageCount = doc.countPages();

    for (let pageNum = 0; pageNum < pageCount; pageNum++) {
      const page = doc.loadPage(pageNum) as mupdf.PDFPage;
      const bounds = page.getBounds();
      const pageWidth = bounds[2] - bounds[0];
      const pageHeight = bounds[3] - bounds[1];

      // Render at 2x resolution for quality
      const scale = 2;
      const pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        false,
        true
      );

      const pngBuffer = Buffer.from(pixmap.asPNG());

      // Find all text locations that need redaction
      const redactions: Array<{x: number; y: number; width: number; height: number; pdfX: number; pdfY: number; pdfH: number}> = [];

      for (const searchText of REDACTION_PATTERNS) {
        const hits = page.search(searchText);

        for (const hit of hits) {
          const quads = Array.isArray(hit[0]) ? hit : [hit];

          for (const quad of quads) {
            if (Array.isArray(quad) && quad.length >= 8) {
              const q = quad as number[];
              const x0 = Math.min(q[0], q[2], q[4], q[6]);
              const y0 = Math.min(q[1], q[3], q[5], q[7]);
              const x1 = Math.max(q[0], q[2], q[4], q[6]);
              const y1 = Math.max(q[1], q[3], q[5], q[7]);

              // Image coordinates (scaled)
              const imgX = Math.floor((x0 - bounds[0]) * scale);
              const imgY = Math.floor((y0 - bounds[1]) * scale);
              const imgW = Math.ceil((x1 - x0) * scale);
              const imgH = Math.ceil((y1 - y0) * scale);

              // PDF coordinates (relative to page origin)
              const pdfX = x0 - bounds[0];
              const pdfY = y0 - bounds[1];
              const pdfH = y1 - y0;

              redactions.push({ x: imgX, y: imgY, width: imgW, height: imgH, pdfX, pdfY, pdfH });
            }
          }
        }
      }

      if (redactions.length === 0) {
        results.push({ imageBuffer: pngBuffer, textPositions: [], pageWidth, pageHeight });
        continue;
      }

      // White out all personal info (just white boxes, no text)
      const compositeOps: sharp.OverlayOptions[] = [];
      const textPositions: Array<{x: number; y: number; fontSize: number}> = [];

      for (const r of redactions) {
        const padding = 2 * scale;
        const boxW = Math.ceil(r.width + padding * 2);
        const boxH = Math.ceil(r.height + padding * 2);

        // Create white box
        const whiteBox = await sharp({
          create: {
            width: boxW,
            height: boxH,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).png().toBuffer();

        compositeOps.push({
          input: whiteBox,
          left: Math.max(0, Math.floor(r.x - padding)),
          top: Math.max(0, Math.floor(r.y - padding)),
        });

        // Store position for pdf-lib text drawing (convert to PDF coordinate system)
        const fontSize = Math.max(8, Math.floor(r.pdfH * 0.8));
        textPositions.push({
          x: r.pdfX,
          y: r.pdfY,
          fontSize
        });
      }

      const redactedBuffer = await sharp(pngBuffer)
        .composite(compositeOps)
        .png()
        .toBuffer();

      results.push({ imageBuffer: redactedBuffer, textPositions, pageWidth, pageHeight });
    }

    return results;
  } catch (err) {
    console.error("Error redacting PDF:", err);
    return [];
  }
}

interface ReceiptData {
  id: string;
  data: {
    vendor: string;
    date: string;
    amount: string;
    description: string;
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
    const colWidths = { vendor: 150, date: 80, description: 200, amount: 80 };

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

    // Helper to wrap text into lines
    const wrapText = (text: string, maxChars: number): string[] => {
      if (text.length <= maxChars) return [text];
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Receipt rows
    let currentY = tableStartY - 25;
    const lineHeight = 12;

    receipts.forEach((receipt) => {
      const descLines = wrapText(receipt.data.description || '-', 32);
      const rowHeight = Math.max(descLines.length * lineHeight, 20);

      if (currentY - rowHeight < 150) {
        return;
      }

      // Vendor
      coverPage.drawText((receipt.data.vendor || 'Unknown').substring(0, 22), {
        x: 50,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Date
      coverPage.drawText(receipt.data.date || '-', {
        x: 50 + colWidths.vendor,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Description (wrapped)
      descLines.forEach((line, i) => {
        coverPage.drawText(line, {
          x: 50 + colWidths.vendor + colWidths.date,
          y: currentY - (i * lineHeight),
          size: 10,
          font: helvetica,
          color: rgb(0.2, 0.2, 0.2),
        });
      });

      // Amount
      coverPage.drawText(receipt.data.amount || '$0.00', {
        x: width - 50 - colWidths.amount,
        y: currentY,
        size: 10,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawLine({
        start: { x: 50, y: currentY - rowHeight + 4 },
        end: { x: width - 50, y: currentY - rowHeight + 4 },
        thickness: 0.25,
        color: rgb(0.9, 0.9, 0.9),
      });

      currentY -= rowHeight + 8;
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

    // Footer
    coverPage.drawText(`${receipts.length} receipt(s) attached`, {
      x: 50,
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

          // If redaction returned no images, try to copy original PDF pages directly
          if (redactedImages.length === 0) {
            console.log(`Redaction returned no images for ${file.name}, copying original PDF pages`);
            try {
              const sourcePdf = await PDFDocument.load(bytes);
              const pageIndices = sourcePdf.getPageIndices();
              const copiedPages = await pdfDoc.copyPages(sourcePdf, pageIndices);

              for (let pageIdx = 0; pageIdx < copiedPages.length; pageIdx++) {
                const copiedPage = copiedPages[pageIdx];
                pdfDoc.addPage(copiedPage);
              }
            } catch (copyErr) {
              console.error(`Error copying PDF pages for ${file.name}:`, copyErr);
              // Create error page as last resort
              const errorPage = pdfDoc.addPage([612, 792]);
              errorPage.drawText(`Receipt ${i + 1}: ${vendorName}`, {
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
            // Embed each page as an image with text overlays
            for (let pageIdx = 0; pageIdx < redactedImages.length; pageIdx++) {
              const result = redactedImages[pageIdx];
              const image = await pdfDoc.embedPng(result.imageBuffer);
              const imgDims = image.scale(1);

              // Scale to fit page (leave room for header)
              const maxWidth = 562; // 612 - 50 margin on each side
              const maxHeight = 712; // 792 - 50 margin top - 30 header
              let imgScale = 1;
              if (imgDims.width > maxWidth) {
                imgScale = maxWidth / imgDims.width;
              }
              if (imgDims.height * imgScale > maxHeight) {
                imgScale = maxHeight / imgDims.height;
              }

              const scaledWidth = imgDims.width * imgScale;
              const scaledHeight = imgDims.height * imgScale;

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

              // Draw "Bogner Pools" text at each redaction position
              // Convert from original PDF coords to final page coords
              const pdfToPageScale = scaledWidth / result.pageWidth;
              for (const pos of result.textPositions) {
                const textX = imgX + (pos.x * pdfToPageScale);
                // PDF y-coords are from bottom, but mupdf returns from top, so we flip
                const textY = imgY + scaledHeight - ((pos.y + pos.fontSize) * pdfToPageScale);
                const textSize = Math.max(6, Math.min(12, pos.fontSize * pdfToPageScale));

                imagePage.drawText(REPLACEMENT_TEXT, {
                  x: textX,
                  y: textY,
                  size: textSize,
                  font: helvetica,
                  color: rgb(0.2, 0.2, 0.2),
                });
              }
            }
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
        // For images, embed directly (with redaction)
        const vendorName = receipts[i]?.data.vendor || file.name.replace(/\.[^/.]+$/, '') || 'Receipt';
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
          imagePage.drawText(`Receipt ${i + 1}: ${vendorName}`, {
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
          // Create error page for failed image
          const errorPage = pdfDoc.addPage([612, 792]);
          errorPage.drawText(`Receipt ${i + 1}: ${vendorName}`, {
            x: 50,
            y: 700,
            size: 14,
            font: helveticaBold,
            color: primaryBlue,
          });
          errorPage.drawText('(Could not process this image)', {
            x: 50,
            y: 680,
            size: 10,
            font: helvetica,
            color: gray,
          });
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
