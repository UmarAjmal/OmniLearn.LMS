import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// GET /api/trainers/profile?userId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  return proxyToBackend(`/api/trainers/profile?userId=${userId}`, "GET");
}

// PUT /api/trainers/profile
export async function PUT(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend("/api/trainers/profile", "PUT", body);
}
