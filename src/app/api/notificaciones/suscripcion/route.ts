import { NextResponse } from "next/server";
import {
  isPushSubscriptionPayload,
  type PushSubscriptionPayload,
} from "@/domain/notifications";
import { deletePushSubscription, savePushSubscription } from "@/lib/notifications.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!isPushSubscriptionPayload(payload)) {
    return NextResponse.json({ error: "Suscripción Push inválida." }, { status: 400 });
  }

  try {
    await savePushSubscription(payload);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  let payload: Partial<PushSubscriptionPayload>;
  try {
    payload = (await request.json()) as Partial<PushSubscriptionPayload>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (typeof payload.endpoint !== "string" || !/^https:\/\//i.test(payload.endpoint)) {
    return NextResponse.json({ error: "Endpoint inválido." }, { status: 400 });
  }

  try {
    await deletePushSubscription(payload.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar la suscripción." }, { status: 503 });
  }
}
