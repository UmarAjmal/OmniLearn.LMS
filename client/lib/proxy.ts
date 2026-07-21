/**
 * lib/proxy.ts
 * Universal proxy helper for Next.js App Router API routes.
 * Forwards requests to the Express backend and returns JSON,
 * so the frontend always gets JSON — never an HTML 404 page.
 */

import { headers } from "next/headers";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

const BACKEND_REQUEST_TIMEOUT_MS = 20_000;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function proxyToBackend(
  backendPath: string,
  method: Method,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const url = `${BACKEND}${backendPath}`;

  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(customHeaders || {}),
    },
    // Forward the body for mutating methods
    ...(body !== undefined && method !== "GET"
      ? { body: JSON.stringify(body) }
      : {}),
  };

  try {
    const upstream = await fetch(url, { ...fetchOptions, signal: AbortSignal.timeout(BACKEND_REQUEST_TIMEOUT_MS) });

    // Helpful logging (server-side) for non-JSON errors
    // eslint-disable-next-line no-console
    if (!upstream.ok) console.warn(`[proxyToBackend] Upstream ${method} ${backendPath} -> ${upstream.status} ${upstream.statusText}`);

    // Forward binary responses natively (images, pdfs)
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.startsWith("image/") || contentType.startsWith("application/octet-stream") || contentType.startsWith("application/pdf")) {
      const buffer = await upstream.arrayBuffer();
      return new Response(buffer, {
        status: upstream.status,
        headers: { "Content-Type": contentType },
      });
    }

    // If the upstream returns non-JSON (HTML error page), synthesise a JSON error
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Backend returned non-JSON response (status ${upstream.status}). The backend server may not be running or the route doesn't exist yet.`,
        }),
        {
          status: upstream.status === 200 ? 502 : upstream.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream the JSON response through
    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: `Proxy error: ${message}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
