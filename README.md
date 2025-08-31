### portfolio3 (folio3)

このリポジトリは `Next.js` を用いたポートフォリオサイトのソースコードです。

**主な技術スタック**

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Three.js / Framer Motion

## 動作要件

- Node.js (推奨: LTS)
- pnpm (パッケージ管理は **pnpm** を使用してください)

## セットアップ

依存関係のインストール:

```bash
pnpm install
```

開発サーバーの起動:

```bash
pnpm dev
```

本番ビルド / 起動:

```bash
pnpm build
pnpm start
```

その他利用可能なスクリプトは `package.json` を参照してください（`lint`, `type-check`, `format`, `test` 等）。

## プロジェクト構成（抜粋）

- `app/(main)/` - メインのページ群（`page.tsx`, `profile`, `projects`, `contact` など）
- `app/api/` - API ルート（例: `contact/route.ts`, `form-structure/route.ts`）
- `components/` - 再利用可能な UI コンポーネント
- `lib/` - 小さなユーティリティ（例: `google-forms-api.ts`, `form-utils.ts`）
- `public/` - 静的アセット（画像、音楽、アイコン等）
- `data/` - サイトで使う静的データ（例: `projects.tsx`）

## MicroCMS 連携

- このリポジトリは `projects` コンテンツを MicroCMS から取得するように変更されています。
- 使用するパッケージ: `microcms-js-sdk` （pnpm を使用してインストールしてください）

### 環境変数

- `MICROCMS_SERVICE_DOMAIN` - microCMS のサービスドメイン（例: `your-service`）
- `MICROCMS_API_KEY` - サーバー側で使用する読み取り用 API キー（公開しないでください）
- `NEXT_PUBLIC_SITE_URL` - サイトの公開 URL（sitemap 等で使用）

環境変数はローカルでは `.env.local` に設定し、Vercel 等にデプロイする際はプロジェクトの環境変数設定に追加してください。

### ローカル開発時の注意

- `next/image` で microCMS の画像を使うため、`next.config.ts` に `images.domains` として `images.microcms-assets.io` が追加されています。
- サイトを起動する前に `MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を設定してください。HTTP エラーが出る場合はキー/ドメインを確認してください。

### マイグレーション（既存データ移行）

- 既存の `data/projects.tsx` に定義されているプロジェクトデータは MicroCMS の `projects` コンテンツに手動で移行するか、microCMS の API を使って一括登録してください。
- サイト側はエントリの `slug` を `id` として参照しています。slug の命名規則は一貫して英数字とハイフンのみを使用することを推奨します。

### サンプル `.env.local`

開発環境向けのサンプル `.env.local` テンプレートをプロジェクトルートに作成してください（実際の値は MicroCMS 管理画面から取得して置き換えてください）。

```env
# MicroCMS
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-server-side-read-key

# サイトの公開 URL（sitemap 等で使用）
NEXT_PUBLIC_SITE_URL=https://your-site.example

# 既存の環境変数（必要に応じて）
GOOGLE_FORM_ID=your-google-form-id
```

## Google Forms API

Google Forms を利用したコンタクトフォームの実装に関する説明は `README-google-forms-api.md` にまとめています。API キーやセットアップ手順が必要な場合はそちらを参照してください。

## デプロイ

Vercel を使ったデプロイが簡単です。`next.config.js` / プロジェクト設定はそのまま Vercel に配置して動作します。

## 開発上の注意点

- コード整形は `prettier` を使用しています。`pnpm format` を実行してください。
- テストは `jest` を使用しています。`pnpm test` で実行可能です。

---

## 自動デプロイ

- このリポジトリは `main` ブランチへマージされると **Vercel** によって自動的にデプロイされます。

## 環境変数

- コンタクトフォームの動作に必要な環境変数:
  - `GOOGLE_FORM_ID` — Google Forms のフォーム ID（フォームの共有 URL に含まれる ID）

### MicroCMS 関連

- `MICROCMS_SERVICE_DOMAIN` — microCMS サービスドメイン
- `MICROCMS_API_KEY` — server-side の読み取り API キー
- `NEXT_PUBLIC_SITE_URL` — サイト URL（例: `https://folio.paon.dev`）
