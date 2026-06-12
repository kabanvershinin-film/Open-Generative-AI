
const { spawn } = require('child_process');
const path = require('path');

const repoDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI', 'Open-Generative-AI-main');
console.log('Working in:', repoDir);

const git = spawn('git', ['--no-pager', 'status'], { cwd: repoDir, shell: true });

git.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

git.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

git.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
