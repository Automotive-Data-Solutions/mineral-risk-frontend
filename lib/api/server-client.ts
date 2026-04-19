import { auth } from "@clerk/nextjs/server";
import { createApiClient, type ApiClient } from "./client";

/**
 * Server-only factory that wires the Clerk ``auth()`` helper into
 * the Axios token interceptor. Use from server components or route handlers.
 */
export async function createServerApiClient(): Promise<ApiClient> {
  return createApiClient(async () => {
    try {
      const { getToken } = await auth();
      return await getToken();
    } catch {
      return null;
    }
  });
}
