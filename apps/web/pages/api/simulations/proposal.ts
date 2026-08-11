import { createBackendProxy } from '../../../lib/server/backendProxy';

export default createBackendProxy('/api/v1/simulations/proposal', {
  timeoutMs: 125_000,
});
