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
