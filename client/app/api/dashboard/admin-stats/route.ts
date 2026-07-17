import { proxyToBackend } from "@/lib/proxy";

// GET /api/dashboard/admin-stats
export async function GET() {
  return proxyToBackend("/api/dashboard/admin-stats", "GET");
}
