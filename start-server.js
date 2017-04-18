// run npm start in proper directory
const args = [ 'start' ];
const opts = { stdio: 'inherit', cwd: 'server', shell: true };
require('child_process').spawn('npm', args, opts);