import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

interface RedactionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  replacement: string;
}

// Personal info to find and replace
const REDACTION_RULES = [
  { find: /frankster@fsandoval\.net('s Organization)?/gi, replace: 'franks@bognerpools.com' },
  { find: /frank@greatoakis\.com/gi, replace: 'franks@bognerpools.com' },
  { find: /41040\s*LOS\s*RANCHOS\s*(CIRCLE|CIR)/gi, replace: '5045 Van Buren Blvd' },
  { find: /TEMECULA,?\s*(CA|California)\s*92592/gi, replace: 'Riverside, CA 92503' },
  { find: /TEMECULA/gi, replace: 'Riverside' },
  { find: /\b92592\b/g, replace: '92503' },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: 'File and API key are required' },
        { status: 400 }
      );
    }

    // Only process images
    if (!file.type.startsWith('image/')) {
      // Return original file for non-images
      const bytes = await file.arrayBuffer();
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          'Content-Type': file.type,
        },
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Get image dimensions
    const metadata = await sharp(buffer).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    // Ask Claude to find the exact pixel locations of personal info
    let imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (file.type === 'image/png') {
      imageMediaType = 'image/png';
    } else if (file.type === 'image/gif') {
      imageMediaType = 'image/gif';
    } else if (file.type === 'image/webp') {
      imageMediaType = 'image/webp';
    }

    const promptText = `Analyze this image (${imgWidth}x${imgHeight} pixels) and find ANY occurrences of the following personal information. Return the EXACT pixel coordinates for each match.

SEARCH FOR THESE (case-insensitive):
1. Email: "frankster@fsandoval.net" (might include "'s Organization" after it)
2. Email: "frank@greatoakis.com"
3. Address: "41040 LOS RANCHOS CIRCLE" or "41040 LOS RANCHOS CIR"
4. City/Zip: "TEMECULA, CA 92592" or "TEMECULA CA 92592" or "TEMECULA, California 92592"
5. City alone: "TEMECULA" or "Temecula"
6. Zip alone: "92592"

Return ONLY a JSON array. For EACH occurrence found, include:
{
  "found": "exact text found",
  "x": pixel X coordinate of left edge,
  "y": pixel Y coordinate of top edge,
  "width": width in pixels,
  "height": height in pixels
}

If nothing is found, return an empty array: []

IMPORTANT:
- Be very precise with coordinates
- The image is ${imgWidth}x${imgHeight} pixels
- Include ALL occurrences, even if the same text appears multiple times
- Return ONLY the JSON array, no explanation`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: promptText,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';

    // Parse the locations
    let locations: Array<{ found: string; x: number; y: number; width: number; height: number }> = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        locations = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse redaction locations:', e);
    }

    if (locations.length === 0) {
      // No redactions needed, return original
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file.type,
        },
      });
    }

    // Create SVG overlays for redactions
    const svgRects = locations.map((loc) => {
      // Find the replacement text for this found text
      let replacement = '';
      for (const rule of REDACTION_RULES) {
        if (rule.find.test(loc.found)) {
          replacement = loc.found.replace(rule.find, rule.replace);
          // Reset regex lastIndex
          rule.find.lastIndex = 0;
          break;
        }
      }

      // Estimate font size based on height (roughly 70% of box height)
      const fontSize = Math.max(10, Math.floor(loc.height * 0.7));

      return `
        <rect x="${loc.x}" y="${loc.y}" width="${loc.width}" height="${loc.height}" fill="white"/>
        <text x="${loc.x + 2}" y="${loc.y + loc.height - 4}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="black">${replacement}</text>
      `;
    }).join('');

    const svgOverlay = `
      <svg width="${imgWidth}" height="${imgHeight}">
        ${svgRects}
      </svg>
    `;

    // Composite the redactions onto the image
    const redactedBuffer = await sharp(buffer)
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();

    return new NextResponse(new Uint8Array(redactedBuffer), {
      headers: {
        'Content-Type': file.type,
      },
    });
  } catch (error) {
    console.error('Error redacting image:', error);
    return NextResponse.json(
      { error: 'Failed to redact image' },
      { status: 500 }
    );
  }
}
