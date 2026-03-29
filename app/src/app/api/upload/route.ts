import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('document') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest();
  const hashArray = Array.from(new Uint8Array(hash));

  return NextResponse.json({
    hash: hashArray,
    hashHex: hash.toString('hex'),
    fileName: file.name,
    fileSize: file.size,
  });
}
