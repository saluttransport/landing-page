import type { Config, Context } from "@netlify/functions";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LEN = 600;
const MAX_TOTAL_LEN = 4000;
const MAX_REPLY_TOKENS = 300;
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Kamu ialah pembantu maklumat automatik untuk Salut Transport, servis van sekolah di Bandar Baru Bangi, Selangor. Kamu BUKAN manusia dan tiada nama peribadi — perkenalkan diri sebagai "Salut Transport" sahaja, bukan sebagai "Kak" atau nama lain.

Maklumat rasmi Salut Transport:
- Servis: van sekolah harian (pergi/balik/pergi dan balik) untuk kawasan Bandar Baru Bangi.
- Sekolah diliputi: SK Jalan 2, SMK Bandar Baru Bangi, SK Jalan 3, SMK Jalan 3, SK Jalan 4, SMK Jalan 4, ABIM Sg Ramal, KAFA Jubli Perak Seksyen 4, Sri Ummah Al Ikhlas, Sri Ummah Bangi Perdana, Sri Ummah As Sobah.
- Waktu operasi: Isnin-Jumaat, 6:00 pagi - 7:30 malam.
- Pendaftaran rasmi: borang di https://salut.my/pendaftaran (sesi 2027).
- WhatsApp: 012-353 9977. E-mel: saluttransport@gmail.com.
- Dasar: T&C https://salut.my/terms, Refund https://salut.my/refund, Cancellation https://salut.my/cancellation, Service Delivery https://salut.my/service-delivery, Privacy https://salut.my/privacy.

Peraturan wajib:
1. Jawab HANYA dalam Bahasa Melayu, nada mesra dan ringkas (maksimum 3-4 ayat), boleh guna emoji sederhana.
2. Tambang/harga TIDAK tetap — ia bergantung kawasan, sekolah, sesi dan 1 hala/2 hala. JANGAN sesekali reka atau anggarkan angka harga. Untuk soalan harga, arahkan ke WhatsApp 012-353 9977.
3. JANGAN sesekali minta atau kumpul maklumat peribadi (nama anak, no. IC, alamat, no. telefon peribadi) dalam chat ini. Kalau parent nak daftar, arahkan terus ke borang rasmi https://salut.my/pendaftaran.
4. Kalau soalan di luar topik servis van sekolah Salut Transport, tolak dengan sopan dan bawa balik perbualan ke topik servis.
5. Sentiasa tawarkan WhatsApp 012-353 9977 untuk apa-apa yang di luar kemampuan jawapan ringkas ini.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function text(value: unknown, max: number) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

function validate(input: unknown): ChatMessage[] {
  if (!input || typeof input !== "object") throw new Error("INVALID:body");
  const rawMessages = (input as Record<string, unknown>).messages;
  if (!Array.isArray(rawMessages) || !rawMessages.length) throw new Error("INVALID:messages");
  if (rawMessages.length > MAX_MESSAGES) throw new Error("INVALID:too_many_messages");

  let totalLen = 0;
  const messages: ChatMessage[] = rawMessages.map((item) => {
    if (!item || typeof item !== "object") throw new Error("INVALID:message");
    const role = (item as Record<string, unknown>).role;
    if (role !== "user" && role !== "assistant") throw new Error("INVALID:role");
    const content = text((item as Record<string, unknown>).content, MAX_MESSAGE_LEN);
    if (!content) throw new Error("INVALID:content");
    totalLen += content.length;
    return { role, content };
  });
  if (totalLen > MAX_TOTAL_LEN) throw new Error("INVALID:too_long");
  if (messages[messages.length - 1].role !== "user") throw new Error("INVALID:last_role");

  return messages;
}

async function askClaude(apiKey: string, messages: ChatMessage[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_REPLY_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      }),
      signal: controller.signal,
    });
    const data = await upstream.json().catch(() => null) as { content?: Array<{ text?: string }> } | null;
    const reply = data?.content?.[0]?.text?.trim();
    if (!upstream.ok || !reply) throw new Error("UPSTREAM_FAILED");
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return json({ success: false, error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 16_384) return json({ success: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);

  const configuredOrigins = (Netlify.env.get("SALUT_ALLOWED_ORIGINS") || "https://salut.my,https://www.salut.my")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const deployContext = Netlify.env.get("CONTEXT") || context.deploy?.context || "";
  const localAllowed = deployContext !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin && !configuredOrigins.includes(origin) && !localAllowed) return json({ success: false, error: { code: "ORIGIN_REJECTED" } }, 403);

  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ success: false, error: { code: "SERVICE_NOT_CONFIGURED" } }, 503);

  try {
    const bodyText = await req.text();
    if (bodyText.length > 16_384) return json({ success: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);
    const messages = validate(JSON.parse(bodyText));
    const reply = await askClaude(apiKey, messages);
    return json({ success: true, reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/^INVALID:/.test(message)) return json({ success: false, error: { code: "INVALID_REQUEST" } }, 400);
    return json({ success: false, error: { code: "TEMPORARY_FAILURE" } }, 502);
  }
};

export const config: Config = {
  path: "/api/chat",
  method: ["POST"],
};
