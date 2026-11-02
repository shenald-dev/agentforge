const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
async function t() {
    const res = await execAsync("echo hello");
    console.log(res);
}
t();
