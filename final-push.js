
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const sourceDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI', 'Open-Generative-AI-main');
const destDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI');

console.log('Source:', sourceDir);
console.log('Dest:', destDir);

// First, copy all files from source to dest (excluding .git)
console.log('Copying files...');
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const files = fs.readdirSync(from);
  for (const file of files) {
    if (file === '.git') continue;
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = fs.statSync(fromPath);
    if (stat.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
      console.log(`Copied: ${file}`);
    }
  }
}

copyFolderSync(sourceDir, destDir);

// Now, copy the .git folder
console.log('Copying .git folder...');
copyFolderSync(path.join(sourceDir, '.git'), path.join(destDir, '.git'));

// Now, run git commands in the dest dir
function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const result = execSync(cmd, { cwd: destDir, encoding: 'utf8', stdio: 'inherit' });
    return result;
  } catch (e) {
    console.error('Error:', e.message);
    return null;
  }
}

console.log('\n--- Git status ---');
run('git --no-pager status');

console.log('\n--- Adding files ---');
run('git add -A');

console.log('\n--- Committing ---');
try {
  run('git commit -m "Добавляем цифровые аватары в проект"');
} catch (e) {
  console.log('Commit failed (maybe nothing to commit)');
}

console.log('\n--- Setting remote ---');
const remoteUrl = 'https://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@github.com/kabanvershinin-film/Open-Generative-AI.git';
run(`git remote set-url origin "${remoteUrl}"`);

console.log('\n--- Pushing ---');
run('git push origin main');

console.log('\n✅ DONE!');
