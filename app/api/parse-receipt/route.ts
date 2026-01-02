import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const promptText = `Analyze this receipt and extract the following information. Return ONLY a valid JSON object with these fields:
{
  "vendor": "Store/company name",
  "date": "Date of purchase (MM/DD/YYYY format)",
  "amount": "Total amount with $ symbol",
  "description": "Brief description of what was purchased",
  "redactions": [
    {
      "original": "text to redact",
      "replacement": "replacement text",
      "xPercent": 0.5,
      "yPercent": 0.5,
      "widthPercent": 0.2,
      "heightPercent": 0.05
    }
  ]
}

IMPORTANT: Look for any of these personal items that need to be redacted and replaced:
- Email "frankster@fsandoval.net" → replace with "franks@bognerpools.com"
- Email "frank@greatoakis.com" → replace with "franks@bognerpools.com"
- Address "41040 LOS RANCHOS CIRCLE" → replace with "5045 Van Buren Blvd"
- City/State/Zip "TEMECULA, CA 92592" or "TEMECULA CA 92592" → replace with "Riverside CA 92503"
- Just "TEMECULA" alone → replace with "Riverside"
- Just "92592" alone → replace with "92503"

For each found item, add an entry to the "redactions" array with:
- "original": the exact text found
- "replacement": what to replace it with
- "xPercent": horizontal position as percentage (0.0 = left edge, 1.0 = right edge)
- "yPercent": vertical position as percentage (0.0 = top, 1.0 = bottom)
- "widthPercent": width of text area as percentage of image width
- "heightPercent": height of text area as percentage of image height

If no personal info is found, return an empty redactions array.
If any field cannot be determined, use an empty string. Do not include any explanation, just the JSON object.`;

    // Build the content array based on file type
    type ContentBlock = Anthropic.Messages.DocumentBlockParam | Anthropic.Messages.ImageBlockParam | Anthropic.Messages.TextBlockParam;
    const contentBlocks: ContentBlock[] = [];

    if (file.type === 'application/pdf') {
      // Use document block for PDFs
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      });
    } else {
      // Use image block for images
      let imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
      if (file.type === 'image/png') {
        imageMediaType = 'image/png';
      } else if (file.type === 'image/gif') {
        imageMediaType = 'image/gif';
      } else if (file.type === 'image/webp') {
        imageMediaType = 'image/webp';
      }

      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType,
          data: base64,
        },
      });
    }

    contentBlocks.push({
      type: 'text',
      text: promptText,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to extract JSON from the response
    let parsedData;
    try {
      // Try to parse directly first
      parsedData = JSON.parse(responseText);
    } catch {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse response as JSON');
      }
    }

    // Replace personal information with business info
    const replacePersonalInfo = (text: string): string => {
      if (!text) return text;

      // Email replacements
      text = text.replace(/frankster@fsandoval\.net/gi, 'franks@bognerpools.com');
      text = text.replace(/frank@greatoakis\.com/gi, 'franks@bognerpools.com');

      // Address replacements (handle various formats)
      text = text.replace(/41040\s*LOS\s*RANCHOS\s*CIRCLE/gi, '5045 Van Buren Blvd');
      text = text.replace(/TEMECULA,?\s*CA\s*92592/gi, 'Riverside CA 92503');
      text = text.replace(/TEMECULA/gi, 'Riverside');
      text = text.replace(/92592/g, '92503');

      return text;
    };

    return NextResponse.json({
      vendor: replacePersonalInfo(parsedData.vendor || ''),
      date: replacePersonalInfo(parsedData.date || ''),
      amount: replacePersonalInfo(parsedData.amount || ''),
      description: replacePersonalInfo(parsedData.description || ''),
      redactions: parsedData.redactions || [],
    });
  } catch (error) {
    console.error('Error parsing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to parse receipt' },
      { status: 500 }
    );
  }
}
