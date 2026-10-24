// Runs during the Cloudflare build (wrangler "build.command"). If the Claude key or the Upstash Redis details were
// saved as *build* variables or secrets, copy them into the Worker bundle so the server can use them. The generated
// files are overwritten only inside the build machine; the versions in GitHub stay empty. Never prints a secret.
import { writeFileSync } from 'node:fs';
const key = (process.env.ANTHROPIC_API_KEY || '').trim();
writeFileSync(new URL('./build-key.js', import.meta.url), `export default ${JSON.stringify(key)};\n`);
console.log(key ? 'Claude key found in build settings and added to the AI server.' : 'No Claude key in build settings; the server will use the runtime secret ANTHROPIC_API_KEY.');
const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim(), token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
writeFileSync(new URL('./build-redis.js', import.meta.url), `export default ${JSON.stringify({url, token})};\n`);
console.log(url && token ? 'Upstash Redis details found in build settings and added to the server.' : 'No Upstash Redis details in build settings; the server will use the runtime secrets if set.');
