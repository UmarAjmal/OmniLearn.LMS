import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

// DELETE /api/trainers/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(`/api/trainers/${id}`, "DELETE");
}

// PUT /api/trainers/:id  (future use)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return proxyToBackend(`/api/trainers/${id}`, "PUT", body);
}
