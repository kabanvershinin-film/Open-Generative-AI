
const { execSync } = require('child_process');
const path = require('path');

// Work in the main subdirectory
const repoDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI', 'Open-Generative-AI-main');
console.log('Working in:', repoDir);

try {
  // 1. Check git status
  console.log('=== 1. Checking git status ===');
  const status = execSync('git status', { 
    cwd: repoDir, 
    encoding: 'utf8',
    stdio: 'inherit'
  });

  // 2. Set remote with token
  console.log('\n=== 2. Setting remote ===');
  const remoteUrl = 'https://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@github.com/kabanvershinin-film/Open-Generative-AI.git';
  execSync(`git remote set-url origin "${remoteUrl}"`, { cwd: repoDir, stdio: 'inherit' });

  // 3. Push to main
  console.log('\n=== 3. Pushing to GitHub ===');
  execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });

  console.log('\n✅ ✅ ✅ Success! Changes pushed to GitHub! ✅ ✅ ✅');

} catch (error) {
  console.error('\n❌ ❌ ❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
