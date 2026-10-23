// Runs during the Cloudflare build (wrangler "build.command"). If the Claude key was saved as a *build*
// variable or secret, copy it into the Worker bundle so the server can use it. The generated file is
// overwritten only inside the build machine; the version in GitHub stays empty. Never prints the key.
import { writeFileSync } from 'node:fs';
const key = (process.env.ANTHROPIC_API_KEY || '').trim();
writeFileSync(new URL('./build-key.js', import.meta.url), `export default ${JSON.stringify(key)};\n`);
console.log(key ? 'Claude key found in build settings and added to the AI server.' : 'No Claude key in build settings; the server will use the runtime secret ANTHROPIC_API_KEY.');
