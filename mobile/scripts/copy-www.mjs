// Copies ../dist to www (Capacitor's webDir) for the Android app. dist stays untouched.
import {cpSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('../../dist/',import.meta.url)),www=fileURLToPath(new URL('../www/',import.meta.url));
rmSync(www,{recursive:true,force:true});
cpSync(dist,www,{recursive:true});
console.log('Copied dist to www.');
