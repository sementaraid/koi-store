import { createClient, type InferClient } from '@mercurjs/client';
import type { Routes } from '@acme/api/_generated';

/* Server-side only, so the backend URL is unprefixed: nothing here is baked
   into a browser bundle. Every call this app makes runs in a server action or a
   server component, which is also what keeps the admin token out of the page —
   see `lib/cookies.ts`. */
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

/* No `x-publishable-api-key`: that header scopes *store* requests to a sales
   channel. The admin API authenticates the `user` actor with a bearer token
   instead, which each call passes through `fetchOptions.headers`. */
export const sdk: InferClient<Routes> = createClient({
  baseUrl: MEDUSA_BACKEND_URL
});
