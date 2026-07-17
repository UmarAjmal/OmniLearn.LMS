import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// GET /api/trainers/dashboard-stats?userId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  return proxyToBackend(
    `/api/trainers/dashboard-stats${userId ? `?userId=${userId}` : ""}`,
    "GET"
  );
}
