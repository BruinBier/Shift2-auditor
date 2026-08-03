import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Prepare the update data
    const updateData: any = {
      ...(body.title && { title: body.title }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sampleType && { sampleType: body.sampleType }),
      ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
      ...(body.makeScreenshot !== undefined && { makeScreenshot: body.makeScreenshot }),
      ...(body.screenshotAlt !== undefined && { screenshotAlt: body.screenshotAlt }),
      ...(body.screenshotPath !== undefined && { screenshotPath: body.screenshotPath }),
      ...(body.auditHtmlPath !== undefined && { auditHtmlPath: body.auditHtmlPath }),
      ...(body.auditCapturedAt !== undefined && {
        auditCapturedAt: body.auditCapturedAt ? new Date(body.auditCapturedAt) : null,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
    };

    // If makeScreenshot is true and URL is provided, create/update screenshot
    if (body.makeScreenshot && body.url) {
      try {
        // Call the scan-url API to generate screenshot
        const scanResponse = await fetch(`${request.nextUrl.origin}/api/scan-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: body.url }),
        });

        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          updateData.screenshotPath = scanData.screenshot;
          // Set screenshotAlt to just the title (without "Screenshot van")
          if (body.title && !updateData.screenshotAlt) {
            updateData.screenshotAlt = body.title;
          }
        }
      } catch (error) {
        console.error('Failed to create screenshot:', error);
        // Continue updating the sample item even if screenshot fails
      }
    }

    const sampleItem = await prisma.sampleItem.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json(sampleItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sample item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sampleItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sample item' }, { status: 500 });
  }
}
