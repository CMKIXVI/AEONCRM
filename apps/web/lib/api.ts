import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  console.error("AEONCRM API error", error);
  return json({ error: "Internal server error" }, 500);
}
