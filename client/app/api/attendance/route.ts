import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// POST /api/attendance
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend("/api/attendance", "POST", body);
}
