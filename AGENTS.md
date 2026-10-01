# ともしびアイランド — 共通作業ルール

最初に AI_HANDOFF.md と DEVELOPMENT.md を読む。Gitのコミットと実ファイルを正とする。
- 作業前に git status と git log -5 を確認。別AIの未コミット変更を上書きしない。
- main は公開版。作業は ai/<担当>/<内容> ブランチで行う。同じ作業フォルダーで複数AIを同時に動かさない。
- 変更前にクリーンなコミットから npm run backup。未保存の変更は個別確認して保存する。git add . を無条件に実行しない。
- 既存のスクリプト読込順、window.KZ、HOOK を維持。全面書き換えやフレームワーク移行は別提案。
- セーブキー、データID、進行フラグを維持。移行が必要なら旧セーブを残し移行・復元を検証する。
- localStorage.clear()、本番セーブ削除、force push、reset --hard、clean -fd を実行しない。
- 秘密情報、実際のセーブ、.env、個人のチャット全文をコミットしない。
- npm run check と変更に応じた DEVELOPMENT.md の実機チェックを行い、未実施は明記。
- ゲーム変更の公開時は index.html の ?v、pwa.js BUILD、sw.js CACHE、version.json build を同期する。文書変更だけなら更新不要。
- 終了時に AI_HANDOFF.md の担当・変更・検証・次の一手を更新し、差分を確認して明示したファイルだけコミットする。
- main への統合と公開はユーザーが確認した変更だけ。AIチャットの成果はまだ実装済み扱いにしない。
