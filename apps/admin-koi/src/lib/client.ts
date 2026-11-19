import { createClient, type InferClient } from '@mercurjs/client';
import type { Routes } from '@acme/api/_generated';

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const sdk: InferClient<Routes> = createClient({
  baseUrl: MEDUSA_BACKEND_URL
});
