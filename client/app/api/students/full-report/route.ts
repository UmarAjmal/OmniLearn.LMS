import { proxyToBackend } from "@/lib/proxy";

// GET /api/students/full-report
export async function GET() {
  return proxyToBackend("/api/students/full-report", "GET");
}
