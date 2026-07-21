/**
 * lib/apiClient.ts
 * Centralized API client wrapper that automatically attaches the JWT token
 * to every request for secure authentication.
 */

export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("lms_token");
  }

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default Content-Type to JSON if not specified and body is not FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, fetchOptions);
}
