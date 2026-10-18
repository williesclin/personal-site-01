import {readFile} from 'node:fs/promises';
import {validateRecoveryExportEvidence} from './recovery-export-evidence.mjs';

const input=process.argv[2];
if(!input){
 console.error('Usage: node scripts/verify-recovery-export-evidence.mjs <private-evidence.json>');
 process.exitCode=2;
}else{
 try{
  const value=JSON.parse(await readFile(input,'utf8'));
  console.log(JSON.stringify(validateRecoveryExportEvidence(value),null,2));
 }catch(error){
  console.error(`Recovery export evidence rejected: ${error.message}`);
  process.exitCode=1;
 }
}
