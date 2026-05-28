import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

/** gemini-1.5-flash is retired; use a current vision-capable model */
const GEMINI_MODEL = 'gemini-2.5-flash';

// 🌟 परफेक्ट स्कीमा: 'address' आणि 'mobileNumber' दोन्ही समाविष्ट आहेत
const BIODATA_JSON_SCHEMA = `{
  "fullName": "",
  "mobileNumber": "",
  "address": "",
  "dateOfBirth": "",
  "birthTime": "",
  "rashi": "",
  "gotra": "",
  "complexion": "",
  "height": "",
  "religionCaste": "",
  "education": "",
  "profession": "",
  "fatherName": "",
  "fatherOccupation": "",
  "motherName": "",
  "siblings": "",
  "unclesPaternal": "",
  "unclesMaternal": "",
  "relatives": ""
}`;

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return (ext && map[ext]) || 'application/octet-stream';
}

// 🌟 फिक्स केलेलं फंक्शन: RegEx आता एकाच ओळीत सुरक्षित लिहिली आहे
function extractJsonObject(text: string): string {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI ने JSON स्वरूपात उत्तर दिले नाही.');
  }
  return cleaned.slice(start, end + 1);
}

function getResponseText(result: Awaited<
  ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>
>): string {
  const response = result.response;
  const blocked = response.promptFeedback?.blockReason;
  if (blocked) {
    throw new Error(`सामग्री ब्लॉक झाली: ${blocked}`);
  }
  const text = response.text();
  if (!text?.trim()) {
    throw new Error('AI कडून रिकामे उत्तर आले.');
  }
  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      console.error('ERROR: GEMINI_API_KEY सापडली नाही!');
      return NextResponse.json(
        { success: false, error: 'API Key कॉन्फिगर केलेली नाही.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'फाईल सापडली नाही किंवा रिकामी आहे.' },
        { status: 400 }
      );
    }

    const mimeType = resolveMimeType(file);
    const allowed =
      mimeType.startsWith('image/') || mimeType === 'application/pdf';
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'फक्त PDF किंवा इमेज (JPG, PNG) अपलोड करा.',
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const prompt = `You are an expert Marathi marriage biodata parser.
Analyze the attached biodata document (image or PDF) and extract all fields.
Return ONLY valid JSON matching this exact structure (use empty string "" if unknown):
${BIODATA_JSON_SCHEMA}

Rules:
- Use Marathi for values where natural (keep degree abbreviations like BE, MBA in English if present).
- dateOfBirth must be YYYY-MM-DD or "".
- mobileNumber: Extract the 10-digit mobile number if found in the document. Clean any spaces or dashes.
- address: Extract the full residential address, native place (गावाचे नाव), taluka, or district if available in the text.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      { text: prompt },
    ]);

    const responseText = getResponseText(result);
    const parsedData = JSON.parse(extractJsonObject(responseText));

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'बायोडाटा स्कॅन करताना एरर आला.';
    console.error('AI Parsing Error:', error);

    const userMessage = message.includes('404') || message.includes('not found')
      ? 'AI मॉडेल उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.'
      : message.includes('429') || message.includes('quota')
        ? 'Gemini API मर्यादा ओलांडली. काही मिनिटांनी पुन्हा प्रयत्न करा.'
        : message.includes('API key') || message.includes('API_KEY')
          ? 'Gemini API Key चुकीची आहे. .env.local तपासा.'
          : message;

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}