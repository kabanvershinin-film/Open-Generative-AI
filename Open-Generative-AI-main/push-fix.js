
const { execSync } = require('child_process');
const path = require('path');

const repoDir = path.join(__dirname);
console.log('Working in:', repoDir);

try {
  console.log('Checking git status...');
  const status = execSync('git status', { cwd: repoDir, encoding: 'utf8' });
  console.log(status);

  console.log('\nAdding files...');
  execSync('git add app/api/digital-avatar/', { cwd: repoDir, stdio: 'inherit' });
  execSync('git add packages/studio/src/components/VideoStudio.jsx', { cwd: repoDir, stdio: 'inherit' });
  execSync('git add packages/studio/src/components/FaceAssetDialog.jsx', { cwd: repoDir, stdio: 'inherit' });
  execSync('git add packages/studio/src/components/AvatarCreationDialog.jsx', { cwd: repoDir, stdio: 'inherit' });
  execSync('git add packages/workflow-builder-local/src/components/CharacterNode.jsx', { cwd: repoDir, stdio: 'inherit' });
  execSync('git add packages/workflow-builder-local/src/components/AvatarCreationDialog.jsx', { cwd: repoDir, stdio: 'inherit' });

  console.log('\nCommitting...');
  execSync('git commit -m "Добавляем цифровые аватары в проект"', { cwd: repoDir, stdio: 'inherit' });

  console.log('\nPushing to GitHub...');
  const remoteUrl = 'https://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@github.com/kabanvershinin-film/Open-Generative-AI.git';
  execSync(`git push "${remoteUrl}" main`, { cwd: repoDir, stdio: 'inherit' });

  console.log('\n✅ Success! Changes pushed to GitHub!');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
