import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const git = args => execFileSync(process.env.KAZETOMO_GIT || 'git', args, {cwd: root, encoding: 'utf8'}).trim();
const args = process.argv.slice(2);
function option(name) {
  const i = args.indexOf(name);
  if (i < 0 || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${name} is required`);
  return args[i + 1];
}
try {
  if (args.includes('--status')) {
    console.log('Branch: ' + git(['branch', '--show-current']));
    console.log('HEAD: ' + git(['rev-parse', 'HEAD']));
    console.log(git(['status', '--short', '--branch']));
    console.log(fs.existsSync(path.join(root, 'WORK_STATE.md')) ? fs.readFileSync(path.join(root, 'WORK_STATE.md'), 'utf8') : 'Read AI_HANDOFF.md; no work checkpoint yet.');
  } else {
    const goal = option('--goal'), done = option('--done'), next = option('--next');
    const fileIndex = args.indexOf('--files');
    if (fileIndex < 0 || !args[fileIndex + 1]) throw new Error('--files must be the last option, followed by reviewed file paths');
    const files = [...new Set(args.slice(fileIndex + 1))];
    const branch = git(['branch', '--show-current']);
    if (!branch || ['main', 'master'].includes(branch)) throw new Error('Use a work branch; checkpoints never commit to main/master or detached HEAD');
    if (git(['diff', '--cached', '--name-only'])) throw new Error('Index already contains staged changes. Review them first; nothing was changed.');
    if (git(['diff', '--name-only', '--diff-filter=U'])) throw new Error('Resolve merge conflicts before checkpointing');
    for (const file of files) {
      const parts = file.replaceAll('\\', '/').split('/');
      if (path.isAbsolute(file) || parts.some(p => !p || p === '..' || p === '.' || p.startsWith('-')) || file === 'WORK_STATE.md') throw new Error('Invalid file path: ' + file);
      if (parts.some(p => p.startsWith('.env') || ['.git', 'saves', 'backups', 'node_modules', 'work'].includes(p)) || /(?:credentials|private[-_]?key|\.pem$|\.key$)/i.test(file)) throw new Error('Private or generated file refused: ' + file);
      const full = path.resolve(root, file);
      if (!full.startsWith(root + path.sep)) throw new Error('File is outside repository');
      for (let i = 1; i <= parts.length; i++) {
        const partPath = path.join(root, ...parts.slice(0, i));
        if (fs.existsSync(partPath) && fs.lstatSync(partPath).isSymbolicLink()) throw new Error('Symlink refused: ' + file);
      }
      if (!fs.existsSync(full)) {
        git(['ls-files', '--error-unmatch', '--', file]);
      } else if (!fs.statSync(full).isFile()) throw new Error('Choose individual files, not folders: ' + file);
    }
    const check = spawnSync(process.execPath, [path.join(root, 'check.mjs')], {cwd: root, encoding: 'utf8'});
    if (check.error) throw check.error;
    const passed = check.status === 0;
    console.log(check.stdout || '');
    if (!passed) console.error(check.stderr || 'Check failed; preserving WIP, not ready to merge.');
    const base = git(['rev-parse', 'HEAD']);
    const state = `# 作業の再開\n\n更新: ${new Date().toISOString()}\nブランチ: ${branch}\n直前コミット: ${base}\n\n## 目的\n${goal}\n\n## 完了・途中の内容\n${done}\n\n## 次の一手\n${next}\n\n## 検証\n構文・参照・PWA検査: ${passed ? 'PASS' : 'FAIL（途中保存。修正してから統合）'}\n実プレイ: 未確認（担当AIが結果を別途記録）\n\n## 保存対象\n${files.map(f => '- ' + f).join('\n')}\n\nこのコミットは作業の保管用。mainへの統合・公開承認ではない。GitHubへpushされたことを別途確認する。未選択ファイルはこの保存に含まれない。\n`;
    fs.writeFileSync(path.join(root, 'WORK_STATE.md'), state);
    git(['add', '--', ...files, 'WORK_STATE.md']);
    git(['commit', '-m', 'WIP checkpoint: ' + goal.replace(/[\r\n]/g, ' ').slice(0, 100)]);
    console.log('Checkpoint: ' + git(['rev-parse', 'HEAD']));
    console.log('Not pushed. Review git show and remaining git status, then push this work branch to GitHub.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
