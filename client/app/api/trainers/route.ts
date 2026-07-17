import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// GET /api/trainers  — list all trainers
export async function GET() {
  return proxyToBackend("/api/trainers", "GET");
}

// POST /api/trainers  — create a new trainer
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend("/api/trainers", "POST", body);
}
