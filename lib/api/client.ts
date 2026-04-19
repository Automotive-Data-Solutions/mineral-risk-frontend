/**
 * Axios factory + typed error wrapper for the FastAPI backend.
 *
 * Client components obtain a token via ``useAuth().getToken`` from Clerk and
 * pass that function into ``createApiClient(getToken)``; server components
 * use the async ``auth().getToken()`` helper from ``@clerk/nextjs/server``.
 * Every request attaches ``Authorization: Bearer <jwt>`` when a token is
 * available and rethrows 4xx/5xx responses as ``ApiError`` instances.
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import type { ApiErrorPayload } from "@/lib/types";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TokenGetter = () => Promise<string | null | undefined>;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: ApiErrorPayload["detail"] | undefined;

  constructor(message: string, status: number, detail?: ApiErrorPayload["detail"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function normalizeError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<ApiErrorPayload>;
    const payload = axErr.response?.data;
    const status = axErr.response?.status ?? 0;
    const rawDetail = payload?.detail;
    const detailMessage =
      typeof rawDetail === "string"
        ? rawDetail
        : payload?.error ?? axErr.message ?? "Request failed";
    throw new ApiError(detailMessage, status, rawDetail);
  }
  if (error instanceof Error) {
    throw new ApiError(error.message, 0);
  }
  throw new ApiError("Unknown error", 0);
}

export function createApiClient(
  getToken?: TokenGetter,
  config: AxiosRequestConfig = {},
): AxiosInstance {
  const instance = axios.create({
    baseURL: DEFAULT_BASE_URL,
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
    ...config,
  });

  instance.interceptors.request.use(async (req) => {
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          req.headers = req.headers ?? {};
          (req.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
      } catch {
        // When auth isn't configured (dev mode, stub), fall through without a
        // token. The backend's dev-mode stub user will accept the request.
      }
    }
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => normalizeError(err),
  );

  return instance;
}

/**
 * A client-side Axios instance that expects callers to pass a ``getToken``
 * on construction (typically from ``useAuth()``). Server components should
 * use ``createServerApiClient`` from ``./server-client`` instead.
 */
export type ApiClient = AxiosInstance;
