import { proxyToBackend } from "@/lib/proxy";

// GET /api/attendance/summary
export async function GET() {
  return proxyToBackend("/api/attendance/summary", "GET");
}
