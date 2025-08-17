import { NextRequest, NextResponse } from 'next/server';
import { submitFormResponse } from '@/lib/google-forms-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, organization, contact, inquiry } = body;

    // バリデーション
    if (!name || !contact || !inquiry) {
      return NextResponse.json(
        { error: '必須フィールドを入力してください' },
        { status: 400 }
      );
    }

    // 連絡先の形式チェック（メールアドレス）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 一時的にformIdをハードコード（テスト用）; 本番ではprocess.env.GOOGLE_FORM_IDを使用
    const formId = process.env.GOOGLE_FORM_ID;
    if (!formId) {
      return NextResponse.json(
        { error: 'フォームIDが設定されていません' },
        { status: 500 }
      );
    }

    // Google Forms APIに送信するデータを準備
    const answers = {
      'entry.265143097': name,
      'entry.1201516531': organization || '',
      'entry.1681873407': contact,
      'entry.781029084': inquiry,
    };

    // Google Forms APIに送信
    const response = await submitFormResponse(formId, answers);

    if (!response.success) {
      throw new Error('フォーム送信に失敗しました');
    }

    return NextResponse.json({
      success: true,
      message: 'お問い合わせを送信しました',
    });
  } catch (error) {
    return NextResponse.json(
      { error: '送信に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
