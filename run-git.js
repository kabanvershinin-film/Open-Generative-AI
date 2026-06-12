
const { execSync } = require('child_process');
const path = require('path');

const repoDir = path.join('d:', 'CODER', 'Trae cod', 'Open-Generative-AI', 'Open-Generative-AI-main');
console.log('Working in:', repoDir);

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const result = execSync(cmd, { cwd: repoDir, encoding: 'utf8' });
    console.log(result);
    return result;
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stdout);
    console.error(e.stderr);
    return null;
  }
}

run('git --no-pager status');
run('git --no-pager log --oneline -3');
run('git --no-pager remote -v');
