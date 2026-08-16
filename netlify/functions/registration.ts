import type { Config, Context } from "@netlify/functions";

const ALLOWED_FIELDS = new Set([
  "clientRequestId", "namaAnak", "tarikhLahir", "umur", "darjahTingkatan2027", "jantina", "alamatRumah", "sekolah",
  "namaIbu", "telefonIbu", "icIbu", "namaAyah", "telefonAyah", "icAyah", "email",
  "sesiSekolah", "pilihanPerjalanan", "pickupPoint", "dropOff", "pickupPoint1", "dropOff1",
  "pickupPoint2", "dropOff2", "termsAccepted", "privacyAccepted", "website",
]);

const SCHOOLS = new Set([
  "SK Jalan 2", "SMK Jalan 2", "SK Jalan 3", "SMK Jalan 3", "SK Jalan 4", "SMK Jalan 4",
  "SERI / SEMI ABIM Sg Ramal", "KAFA Jubli Perak", "Sri Ummah As Sobbah", "Sri Ummah Al Ikhlas",
]);
const SCHOOL_LEVELS_2027 = new Set([
  "Darjah 1", "Darjah 2", "Darjah 3", "Darjah 4", "Darjah 5", "Darjah 6",
  "Tingkatan 1", "Tingkatan 2", "Tingkatan 3", "Tingkatan 4", "Tingkatan 5", "Perlu semakan",
]);
const ROUTE_POINTS = new Set(["Rumah", "Sekolah", "Transit"]);

type Input = Record<string, unknown>;
type RegistrationResult = { success?: boolean; submissionId?: string; duplicate?: boolean };

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

function text(value: unknown, max = 1000) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

function phone(value: unknown) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `6${digits}`;
  if (!digits.startsWith("60") && digits.length >= 9 && digits.length <= 10) digits = `60${digits}`;
  return digits;
}

function requireValue(value: string, field: string) {
  if (!value) throw new Error(`MISSING:${field}`);
  return value;
}

async function postRegistrationWithRetry(appsScriptUrl: string, sharedSecret: string, data: ReturnType<typeof validate>) {
  let lastError: unknown = new Error("BACKEND_REJECTED");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const upstream = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type: "website_registration", schemaVersion: "2027-website-v2", sharedSecret, data }),
        redirect: "follow",
        signal: controller.signal,
      });
      const result = await upstream.json().catch(() => null) as RegistrationResult | null;
      if (upstream.ok && result?.success && result.submissionId) return result;
      lastError = new Error("BACKEND_REJECTED");
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw lastError;
}

function validate(input: Input) {
  for (const key of Object.keys(input)) if (!ALLOWED_FIELDS.has(key)) throw new Error(`UNEXPECTED:${key}`);
  if (text(input.website)) throw new Error("SPAM:honeypot");

  const clientRequestId = requireValue(text(input.clientRequestId, 100), "clientRequestId");
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(clientRequestId)) throw new Error("INVALID:clientRequestId");
  const studentName = requireValue(text(input.namaAnak, 180), "namaAnak");
  const dateOfBirth = requireValue(text(input.tarikhLahir, 10), "tarikhLahir");
  const dob = new Date(`${dateOfBirth}T00:00:00+08:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(dob.valueOf()) || dob > new Date() || dob.getFullYear() < 2008) throw new Error("INVALID:tarikhLahir");
  const gender = requireValue(text(input.jantina, 20), "jantina");
  if (!["Lelaki", "Perempuan"].includes(gender)) throw new Error("INVALID:jantina");
  const homeAddress = requireValue(text(input.alamatRumah, 500), "alamatRumah");
  const school = requireValue(text(input.sekolah, 120), "sekolah");
  if (!SCHOOLS.has(school)) throw new Error("INVALID:sekolah");
  const schoolLevel2027 = requireValue(text(input.darjahTingkatan2027, 40), "darjahTingkatan2027");
  if (!SCHOOL_LEVELS_2027.has(schoolLevel2027)) throw new Error("INVALID:darjahTingkatan2027");

  const motherName = requireValue(text(input.namaIbu, 180), "namaIbu");
  const motherPhone = phone(input.telefonIbu);
  const fatherName = requireValue(text(input.namaAyah, 180), "namaAyah");
  const fatherPhone = phone(input.telefonAyah);
  if (!/^60\d{9,10}$/.test(motherPhone) || !/^60\d{9,10}$/.test(fatherPhone)) throw new Error("INVALID:phone");
  const motherIc = String(input.icIbu ?? "").replace(/\D/g, "").slice(0, 12);
  const fatherIc = String(input.icAyah ?? "").replace(/\D/g, "").slice(0, 12);
  if (motherIc && !/^\d{12}$/.test(motherIc)) throw new Error("INVALID:icIbu");
  if (!/^\d{12}$/.test(fatherIc)) throw new Error("INVALID:icAyah");
  const email = requireValue(text(input.email, 254).toLowerCase(), "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID:email");
  const schoolSession = requireValue(text(input.sesiSekolah, 20), "sesiSekolah");
  if (!["Pagi", "Petang"].includes(schoolSession)) throw new Error("INVALID:sesiSekolah");
  const tripType = requireValue(text(input.pilihanPerjalanan, 30).toUpperCase(), "pilihanPerjalanan");
  if (!["PERGI", "BALIK", "PERGI DAN BALIK"].includes(tripType)) throw new Error("INVALID:pilihanPerjalanan");

  const pickupPoint = text(input.pickupPoint, 30);
  const dropoffPoint = text(input.dropOff, 30);
  const pergiPickupPoint = text(input.pickupPoint1, 30);
  const pergiDropoffPoint = text(input.dropOff1, 30);
  const balikPickupPoint = text(input.pickupPoint2, 30);
  const balikDropoffPoint = text(input.dropOff2, 30);
  const routeValues = tripType === "PERGI DAN BALIK"
    ? [pergiPickupPoint, pergiDropoffPoint, balikPickupPoint, balikDropoffPoint]
    : [pickupPoint, dropoffPoint];
  if (routeValues.some((value) => !ROUTE_POINTS.has(value))) throw new Error("INVALID:route");
  if (input.termsAccepted !== true || input.privacyAccepted !== true) throw new Error("INVALID:consent");

  return {
    clientRequestId, studentName, dateOfBirth, clientAge: 2027 - dob.getFullYear(), schoolLevel2027, gender, homeAddress, school,
    motherName, motherPhone, motherIc, fatherName, fatherPhone, fatherIc, email, schoolSession, tripType,
    pickupPoint, dropoffPoint, pergiPickupPoint, pergiDropoffPoint, balikPickupPoint, balikDropoffPoint,
    termsAccepted: true, privacyAccepted: true,
  };
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return json({ success: false, error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 32_768) return json({ success: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);

  const configuredOrigins = (Netlify.env.get("SALUT_ALLOWED_ORIGINS") || "https://salut.my,https://www.salut.my")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const deployContext = Netlify.env.get("CONTEXT") || context.deploy?.context || "";
  const localAllowed = deployContext !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin && !configuredOrigins.includes(origin) && !localAllowed) return json({ success: false, error: { code: "ORIGIN_REJECTED" } }, 403);

  const appsScriptUrl = Netlify.env.get("SALUT_REGISTRATION_APPS_SCRIPT_URL");
  const sharedSecret = Netlify.env.get("SALUT_REGISTRATION_SHARED_SECRET");
  if (!appsScriptUrl || !sharedSecret || sharedSecret.length < 24) return json({ success: false, error: { code: "SERVICE_NOT_CONFIGURED" } }, 503);

  let bodyText = "";
  try {
    bodyText = await req.text();
    if (bodyText.length > 32_768) return json({ success: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);
    const data = validate(JSON.parse(bodyText) as Input);
    // Apps Script sometimes completes the write but its first response is late.
    // Retrying with the same clientRequestId is safe and returns the existing record.
    const result = await postRegistrationWithRetry(appsScriptUrl, sharedSecret, data);
    return json({ success: true, submissionId: result.submissionId, duplicate: result.duplicate === true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/^(MISSING|INVALID|UNEXPECTED|SPAM):/.test(message)) return json({ success: false, error: { code: "INVALID_REQUEST" } }, 400);
    return json({ success: false, error: { code: "TEMPORARY_FAILURE" } }, 502);
  }
};

export const config: Config = {
  path: "/api/registration",
  method: ["POST"],
};
