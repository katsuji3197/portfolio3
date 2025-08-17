# Google Forms API カスタムフォーム

このプロジェクトでは、Google Forms APIを使用して完全にカスタマイズ可能なコンタクトフォームを実装しています。

## セットアップ手順

### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「ライブラリ」で「Google Forms API」を有効化
4. 「APIとサービス」→「認証情報」でサービスアカウントを作成
5. サービスアカウントのJSONキーをダウンロード

### 2. Googleフォームの設定

1. Googleフォームを作成
2. 以下の質問を追加：
   - お名前（短答）
   - メールアドレス（短答）
   - 件名（短答）
   - メッセージ（段落）
3. フォームの共有設定でサービスアカウントのメールアドレスに編集権限を付与

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下を設定：

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_FORM_ID=your_google_form_id_here
```

### 4. 質問IDの取得

1. ブラウザで `/api/form-structure?formId=YOUR_FORM_ID` にアクセス
2. コンソールで質問IDを確認
3. `app/api/contact/route.ts` の `questionId` を実際のIDに更新

## 使用方法

### 基本的な使用

```tsx
import GoogleFormsAPIContactForm from '@/components/google-forms-api-contact-form';

export default function ContactPage() {
  return (
    <div>
      <h1>お問い合わせ</h1>
      <GoogleFormsAPIContactForm />
    </div>
  );
}
```

### カスタマイズ

フォームコンポーネントは完全にカスタマイズ可能です：

- スタイリング：Tailwind CSSクラスを変更
- バリデーション：`validateForm`関数を修正
- フィールド：新しいフィールドを追加
- 送信処理：API Routeをカスタマイズ

## ファイル構成

```
├── lib/
│   ├── google-forms-api.ts      # Google Forms API ユーティリティ
│   └── form-utils.ts            # フォーム関連ユーティリティ
├── app/
│   └── api/
│       ├── contact/route.ts     # フォーム送信API
│       └── form-structure/route.ts # フォーム構造取得API
├── components/
│   └── google-forms-api-contact-form.tsx # カスタムフォームコンポーネント
└── docs/
    └── google-forms-api-setup.md # セットアップ手順
```

## 機能

- ✅ 完全にカスタマイズ可能なデザイン
- ✅ リアルタイムバリデーション
- ✅ エラーハンドリング
- ✅ ローディング状態
- ✅ 成功/エラーメッセージ
- ✅ Googleフォームへの自動送信
- ✅ レスポンシブデザイン

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - サービスアカウントの設定を確認
   - 環境変数の形式を確認（特に `GOOGLE_PRIVATE_KEY`）

2. **フォームIDエラー**
   - GoogleフォームのURLから正しいIDを取得
   - フォームが公開されていることを確認

3. **質問IDエラー**
   - `/api/form-structure` で質問IDを確認
   - API Routeの `questionId` を更新

### デバッグ

ブラウザの開発者ツールで以下を確認：

```javascript
// フォーム構造を確認
fetch('/api/form-structure')
  .then(res => res.json())
  .then(data => console.log(data));
```

## セキュリティ

- サービスアカウントの認証情報は環境変数で管理
- API Routeでバリデーションを実装
- CORS設定で適切なドメイン制限を設定

## 参考リンク

- [Google Forms API Documentation](https://developers.google.com/forms/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
