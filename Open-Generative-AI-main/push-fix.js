
const { execSync } = require('child_process');
const path = require('path');

const repoDir = path.join(__dirname);
console.log('Working in:', repoDir);

try {
  console.log('Checking git status...');
  const status = execSync('git status', { cwd: repoDir, encoding: 'utf8' });
  console.log(status);

  console.log('\nAdding file...');
  execSync('git add packages/studio/src/components/VideoStudio.jsx', { cwd: repoDir, stdio: 'inherit' });

  console.log('\nCommitting...');
  execSync('git commit -m "fix: restore model validation for cost calculation"', { cwd: repoDir, stdio: 'inherit' });

  console.log('\nPushing to GitHub...');
  const remoteUrl = 'https://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@github.com/kabanvershinin-2440s/open-generative-ai.git';
  execSync(`git push "${remoteUrl}" main`, { cwd: repoDir, stdio: 'inherit' });

  console.log('\n✅ Success! Changes pushed to GitHub!');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
