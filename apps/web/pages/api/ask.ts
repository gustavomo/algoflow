import { createBackendProxy } from '../../lib/server/backendProxy';

export default createBackendProxy('/api/v1/ask', { timeoutMs: 125_000 });
