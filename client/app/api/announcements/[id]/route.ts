import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// PUT /api/announcements/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return proxyToBackend(`/api/announcements/${id}`, "PUT", body);
}

// DELETE /api/announcements/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(`/api/announcements/${id}`, "DELETE");
}
