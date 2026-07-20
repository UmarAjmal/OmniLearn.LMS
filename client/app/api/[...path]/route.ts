/**
 * app/api/[...path]/route.ts
 *
 * Catch-all proxy — forwards ANY /api/* request from the Next.js frontend
 * to the Express backend server, preserving method, body, and query string.
 *
 * Why this exists:
 *   The deployed Express server on Render sometimes lags behind the latest
 *   commit. When the frontend calls a route that doesn't exist yet on the
 *   deployed server, Render returns an HTML 404 page → the browser gets
 *   "<!DOCTYPE html>" instead of JSON → SyntaxError: Unexpected token '<'
 *
 *   By routing through Next.js API routes we always get a JSON response
 *   (either the real data, or a structured error object), so the UI can
 *   display a meaningful message instead of crashing.
 */

import { type NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://omnilearn-lms.onrender.com";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Reconstruct the full backend URL including query string
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const backendUrl = `${BACKEND}/api/${path.join("/")}${qs ? `?${qs}` : ""}`;

  // Read request body for mutating methods
  let body: string | undefined;
  const method = request.method;
  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(backendUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Forward the Authorization header if present
        ...(request.headers.get("authorization")
          ? { Authorization: request.headers.get("authorization")! }
          : {}),
      },
      ...(body ? { body } : {}),
    });

    // If the upstream returns non-JSON (HTML error page from Render 404),
    // synthesise a clean JSON error so the frontend never sees "<DOCTYPE"
    const contentType = upstream.headers.get("content-type") || "";
    
    // Forward images and binaries natively
    if (contentType.startsWith("image/") || contentType.startsWith("application/octet-stream")) {
      const buffer = await upstream.arrayBuffer();
      return new NextResponse(buffer, {
        status: upstream.status,
        headers: { "Content-Type": contentType },
      });
    }

    if (!contentType.includes("application/json")) {
      const text = await upstream.text();
      console.error(
        `[proxy] Backend returned non-JSON for ${method} ${backendUrl} ` +
          `(HTTP ${upstream.status}): ${text.slice(0, 200)}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Backend route not found or server error (HTTP ${upstream.status}). ` +
            `Path: /api/${path.join("/")}`,
        },
        { status: upstream.status === 200 ? 502 : upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] Fetch error for ${backendUrl}: ${message}`);
    return NextResponse.json(
      { success: false, error: `Proxy network error: ${message}` },
      { status: 502 }
    );
  }
}

// Export all HTTP methods — Next.js App Router requires explicit exports
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
