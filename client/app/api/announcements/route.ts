import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// GET /api/announcements
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  return proxyToBackend(
    `/api/announcements?limit=${limit}&offset=${offset}`,
    "GET"
  );
}

// POST /api/announcements
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend("/api/announcements", "POST", body);
}
