import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Bundle the same repository snapshots used by the static frontend.
export default {turbopack:{root},outputFileTracingRoot:root};
