# 開発と引き継ぎの運用

## 初回起動
Node.jsとGitが必要。外部npm依存はないためnpm installは不要。
リポジトリのフォルダーで npm run check、npm run dev。http://127.0.0.1:4173 をChromeで開く。終了はCtrl+C。
NodeやGitがPATHにない場合は、Codexの同梱ランタイムを使うか公式配布を導入する。
本番とlocalhostのセーブは別。ポートも固定し、既存本番セーブを試験用に上書きしない。

## 役割
| 担当 | 主担当 | 成果 |
| --- | --- | --- |
| ユーザー | 仕様・優先順位・プレイ確認・公開判断 | 採用判断 |
| Codex | Git管理・修正実装・検査・統合 | 検証済みブランチ |
| Claude Code | 物語・ゲーム設計・既存仕様の継続と実装 | 小さな機能変更 |
| Gemini / AI Studio | 独立レビュー・UI案・性能や互換性の検討 | 指摘または限定差分 |
役割は運用上の分担で固定の能力制限ではない。1作業フォルダー1担当。同時作業が必要なら独立したworktreeと別ブランチを使い、統合担当を1人にする。

## 毎回の作業
1. git status、git fetch origin、git log -5。汚れた作業ツリーでは担当の変更を確認して先に保全する。
2. mainを更新するならクリーンな状態で git switch main と git pull --ff-only origin main。分岐していたら自動解決せず比較。
3. npm run backup。git switch -c ai/codex/対象（Claudeはai/claude/対象、Geminiはai/gemini/対象）。名前の対象部分は今回の短い内容に置換。
4. AGENTS.md と AI_HANDOFF.md を読み、今回の変更を限定して実装。
5. npm run check、git diff --check、ブラウザー確認。引き継ぎを更新。
6. git diff で確認し、git add <確認済みファイル>、git commit -m "変更内容"、git push -u origin <作業ブランチ>。
7. GitHubで作業ブランチからmainへPR。別AIで差分レビューし、ユーザーのプレイ確認後に統合。mainへの直接pushを通常運用にしない。
mainがGitHub Pagesの公開元ならマージで公開が動く。公開設定は別途GitHub Settings > Pagesで確認。復旧も履歴を消す操作ではなくgit revertとPRを使う。

## 各AIへの渡し方
Codex：このローカルリポジトリをプロジェクトとして開く。開始指示は「AI_HANDOFF.mdを読み、指定ブランチで○○だけ変更。既存セーブと読込順を維持し検証結果を記録」。
Claude Code：同じGitHubリポジトリの指定ブランチ、またはこのローカルフォルダーで開始。CLAUDE.mdを入口にする。ブラウザーのClaudeチャットとClaude Codeの作業領域が自動で同じとは仮定しない。
AI Studio/Gemini：GitHub連携が利用できる場合も、取り込んだコミットを確認。AGENTS.md・AI_HANDOFF.md・GEMINI.mdと必要なコードを明示して渡す。連携がない場合はnpm run backupのsource.zipを必要に応じて共有する（秘密やセーブを含めない）。戻ったZIPは別フォルダーへ展開し、Gitの作業ブランチへ変更ファイルだけ移す。ZIP全体でGit作業フォルダーを置換しない。
AI Studioの公開・新規雛形作成・秘密キー設定は、この静的ゲームの引き継ぎに不要。AIをゲーム内APIとして実装する作業とは別。

## 手動検証
- 新規ゲームで移動、カメラ、採取、会話、戦闘、メニュー、設定、セーブ後の再読込。
- 既存セーブのコピーでロード、所持品・仲間・章フラグ・拠点・職業を保持。
- 対象章のクエスト、ワープ、はさまり救出。変更箇所と隣接機能を確認。
- スマホ縦横、タッチ、左利き、文字サイズ、iOSホーム画面、音量。
- PWA変更は旧版から新版への更新、オフライン起動を別の試験環境で確認。
checkは構文・参照確認だけ。ゲームを遊んだ検証とは区別する。

## セーブの保全
Gitバックアップにブラウザーのセーブは含まれない。本番のChrome DevTools > Application > Local Storageで上記キーの値を控え、私的なファイルとして保管。実際のセーブをGitやAIチャットへ自動送信しない。サイトデータ全削除は行わない。PWAキャッシュとlocalStorageを区別する。

## バックアップと復元
npm run backupはクリーンなGitツリーのみ受け付ける。../backups/日時 に history.bundle（全refsのGit履歴）、source.zip（HEADの追跡ファイル）、manifest.json（コミットとSHA256）を作る。未追跡・無視ファイルや実セーブは含まれない。
作業開始前、AIを替える前、公開前に実行。外付けディスクなど別媒体へコピーすれば端末故障にも備えられる。同じPC上のコピーだけでは端末故障の対策にはならない。
復元は別の空フォルダーで git clone -b main <history.bundleのパス> kazetomo-recovered。作業版なら -b ai/codex/handoff-setup など目的ブランチを指定。git remote set-url origin https://github.com/mga572que-eng/kazetomo.git を設定し、コミットとファイルを確認してから作業再開。現在の作業フォルダーを復元物で上書きしない。

## 公式資料
- Codex AGENTS.md：https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Claudeの記憶ファイル：https://code.claude.com/docs/en/memory
- AI Studioコードの取得・GitHub連携：https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## PCに依存しない開発
ブラウザー編集、Codespaces、別PCでのclone、GitHubからの手動バックアップはCLOUD_DEVELOPMENT.mdを参照。保存完了はcommit/pushまで確認する。
