# Google Forms API 設定手順

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択

### 1.2 Google Forms APIの有効化

1. 「APIとサービス」→「ライブラリ」に移動
2. 「Google Forms API」を検索して有効化

### 1.3 認証情報の作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：`forms-api-service`）
4. 「キーを作成」→「JSON」を選択してダウンロード

### 1.4 Googleフォームの共有設定

1. Googleフォームを開く
2. 「設定」→「回答」→「回答の受信方法」
3. 「Google スプレッドシートに回答を保存」を有効化
4. サービスアカウントのメールアドレスに編集権限を付与

## 2. 環境変数の設定

`.env.local`ファイルに以下を追加：

```
GOOGLE_FORMS_API_KEY=your_api_key_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_FORM_ID=your_form_id_here
```

## 3. フォームIDの取得

GoogleフォームのURLから取得：

```
https://docs.google.com/forms/d/FORM_ID/edit
```

FORM_IDの部分がフォームIDです。
