/**
 * Password hash generator for Oracle FAI Photos login.
 * Run: node scripts/hash-password.js
 * Paste the output values into js/app.js under _auth.saltHex and _auth.hashHex.
 */
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('New password: ', (password) => {
    rl.close();
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256', (err, key) => {
        if (err) throw err;
        console.log('\nPaste these into js/app.js → _auth:');
        console.log(`  saltHex:    '${salt}',`);
        console.log(`  hashHex:    '${key.toString('hex')}',`);
        console.log(`  iterations: 100000`);
    });
});
