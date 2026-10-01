# AIへの作業指示（briefs）

| 番号 | 内容 | 出力 | 向いているAI | 依存 |
|---|---|---|---|---|
| 01 | 仲間会話＋モブ大量追加 | talk.js / mobs.js | Gemini | なし |
| 02 | 酒場・訳あり家・隠しアイテム | town.js | Gemini | 01と同時なら docs/lore/rumors.md を共有 |
| 03 | 仲間モンスターの専用化 | monplus.js | Gemini | なし |
| 04 | バランス設計書（コードなし） | docs/design/balance.md | Gemini → Claudeが実装 | なし |
| 05 | 物語の改稿案（コードなし） | docs/design/story.md | Gemini | 02の訳あり家と整合 |
| 06 | 全コード監査（コードなし） | docs/reports/qa-audit.md | Gemini（長文向き） | なし |

## Google AI Studio で使うときの共通ルール
- AI Studio はリポジトリを読めない。下の「添付するファイル」を毎回アップロードする。
- 最初に「基準コミット」として main の最新ハッシュを伝える。
- 返答は「新規ファイルの全文」か「既存ファイルの unified diff」だけ。Gitには保存できないので、必ず「未保存」と書かせる。
- 受け取ったファイルは、Gitを操作できるAI（Claude/Codex）が作業ブランチへ入れて、check・実プレイ・pushを行う。
- 1回の会話では指示を1本だけにする。長くなったら「続きのファイルだけ出して」と区切る。
