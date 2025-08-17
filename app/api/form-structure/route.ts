import { NextRequest, NextResponse } from 'next/server';
import { getFormStructure } from '@/lib/google-forms-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId') || process.env.GOOGLE_FORM_ID;

    if (!formId) {
      return NextResponse.json(
        { error: 'フォームIDが指定されていません' },
        { status: 400 }
      );
    }

    const formStructure = await getFormStructure(formId);

    return NextResponse.json({
      success: true,
      formStructure,
    });
  } catch (error) {
    console.error('Error fetching form structure:', error);
    return NextResponse.json(
      { error: 'フォーム構造の取得に失敗しました' },
      { status: 500 }
    );
  }
}
