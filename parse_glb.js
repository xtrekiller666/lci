import fs from 'fs';
// We just want to check if the new femalehead is high poly. If it's 24mb it definitely is.
console.log(fs.statSync('dashboard/public/models/femalehead.glb').size);
