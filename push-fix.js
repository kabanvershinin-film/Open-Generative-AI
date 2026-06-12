
const { execSync } = require('child_process');
const path = require('path');

// Work in the correct directory
const repoDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI');
console.log('Working in:', repoDir);

try {
  // 1. Check git status
  console.log('=== 1. Checking git status ===');
  const status = execSync('git status', { 
    cwd: repoDir, 
    encoding: 'utf8',
    stdio: 'inherit'
  });

  // 2. Add all changes
  console.log('\n=== 2. Adding all changes ===');
  execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });

  // 3. Commit
  console.log('\n=== 3. Committing ===');
  try {
    execSync('git commit -m "Добавляем цифровые аватары в проект"', { cwd: repoDir, stdio: 'inherit' });
  } catch (e) {
    console.log('Commit skipped (maybe nothing to commit)');
  }

  // 4. Set remote with token
  console.log('\n=== 4. Setting remote ===');
  const remoteUrl = 'https://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@github.com/kabanvershinin-film/Open-Generative-AI.git';
  execSync(`git remote set-url origin "${remoteUrl}"`, { cwd: repoDir, stdio: 'inherit' });

  // 5. Push to main
  console.log('\n=== 5. Pushing to GitHub ===');
  execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });

  console.log('\n✅ ✅ ✅ Success! Changes pushed to GitHub! ✅ ✅ ✅');

} catch (error) {
  console.error('\n❌ ❌ ❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
