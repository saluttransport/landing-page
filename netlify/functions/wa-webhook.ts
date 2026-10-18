import type { Config, Context } from "@netlify/functions";

// WhatsApp Cloud API webhook (Meta app → Webhooks → WhatsApp Business Account, field "messages").
// GET: Meta's one-time check of the callback URL (hub.verify_token must equal WA_VERIFY_TOKEN).
// POST: only bodies signed with the Meta app secret (X-Hub-Signature-256, env META_APP_SECRET) are accepted. Parent
// messages are passed on to the registration Apps Script ({type: "whatsapp_inbound"}, same URL and shared secret as
// /api/registration), which sends a new number the "Semak slot" Flow once and answers a filled-in Flow with a summary.
// Only filled-in forms carry their content (the Flow answers, or the salut.my form message); other text stays here.
// Meta wants a quick 200, so the hand-over runs after the reply. Message text is never logged.
// Env: WA_VERIFY_TOKEN, META_APP_SECRET, SALUT_REGISTRATION_APPS_SCRIPT_URL, SALUT_REGISTRATION_SHARED_SECRET.

export type InboundMessage = { from: string; id: string; kind: "message" | "flow_reply" | "website_form"; response?: string };

// The message the salut.my "Semak slot" form prepares (site.js): the parent has already given the details, so the
// Apps Script records them and does not send the Flow on top.
export function isWebsiteSlotForm(text: string): boolean {
  return text.includes("*Maklumat anak*") && /\nSekolah: /.test(text) && /\nKawasan rumah: /.test(text);
}

const encoder = new TextEncoder();

export async function validSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !header.startsWith("sha256=") || !appSecret) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody)));
  const expected = Array.from(signature, (b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7).toLowerCase();
  let diff = expected.length ^ given.length;
  for (let i = 0; i < Math.max(expected.length, given.length); i++) diff |= (expected.charCodeAt(i) || 0) ^ (given.charCodeAt(i) || 0);
  return diff === 0;
}

// Parent messages only: delivery statuses, the owner's own replies from the WhatsApp Business app (other fields)
// and anything without a sender are left out.
export function inboundMessages(body: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = (body as { object?: string; entry?: unknown[] })?.object === "whatsapp_business_account" ? (body as { entry: unknown[] }).entry : [];
  for (const entry of entries || []) {
    for (const change of ((entry as { changes?: unknown[] })?.changes || [])) {
      const c = change as { field?: string; value?: { messages?: unknown[] } };
      if (c.field !== "messages") continue;
      for (const raw of c.value?.messages || []) {
        const m = raw as { from?: string; id?: string; type?: string; text?: { body?: string };
          interactive?: { type?: string; nfm_reply?: { response_json?: string } } };
        if (!m.from || !/^\d{8,15}$/.test(m.from)) continue;
        const id = String(m.id || "");
        const reply = m.type === "interactive" && m.interactive?.type === "nfm_reply" ? m.interactive.nfm_reply?.response_json : undefined;
        const text = m.type === "text" ? String(m.text?.body || "") : "";
        if (reply !== undefined) out.push({ from: m.from, id, kind: "flow_reply", response: String(reply).slice(0, 4000) });
        else if (isWebsiteSlotForm(text)) out.push({ from: m.from, id, kind: "website_form", response: text.slice(0, 4000) });
        else out.push({ from: m.from, id, kind: "message" });
      }
    }
  }
  return out.slice(0, 20);
}

async function handOver(url: string, sharedSecret: string, messages: InboundMessage[]) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "whatsapp_inbound", sharedSecret, messages }),
      redirect: "follow",
    });
  } catch {
    // Apps Script unreachable: the parent can still write again; nothing is retried here.
  }
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const token = Netlify.env.get("WA_VERIFY_TOKEN") || "";
    const ok = url.searchParams.get("hub.mode") === "subscribe" && token.length >= 16 && url.searchParams.get("hub.verify_token") === token;
    return ok ? new Response(url.searchParams.get("hub.challenge") || "", { status: 200 }) : new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  if (rawBody.length > 262_144) return new Response("Too large", { status: 413 });
  if (!(await validSignature(rawBody, req.headers.get("x-hub-signature-256"), Netlify.env.get("META_APP_SECRET") || ""))) {
    return new Response("Bad signature", { status: 401 });
  }

  let body: unknown = null;
  try { body = JSON.parse(rawBody); } catch { return new Response("ok"); }
  const messages = inboundMessages(body);
  const appsScriptUrl = Netlify.env.get("SALUT_REGISTRATION_APPS_SCRIPT_URL");
  const sharedSecret = Netlify.env.get("SALUT_REGISTRATION_SHARED_SECRET");
  if (messages.length && appsScriptUrl && sharedSecret) {
    const work = handOver(appsScriptUrl, sharedSecret, messages);
    if (typeof context.waitUntil === "function") context.waitUntil(work);
    else await work;
  }
  return new Response("ok");
};

export const config: Config = {
  path: "/api/wa-webhook",
  method: ["GET", "POST"],
};
