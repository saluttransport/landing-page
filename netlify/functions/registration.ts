import type { Config, Context } from "@netlify/functions";

// One form per family (schema v3): family fields at the top, up to 5 children in "children".
const FAMILY_FIELDS = new Set([
  "clientRequestId", "alamatRumah", "namaIbu", "telefonIbu", "icIbu", "namaAyah", "telefonAyah", "icAyah", "email",
  "termsAccepted", "privacyAccepted", "website", "children",
]);
const CHILD_FIELDS = new Set([
  "namaAnak", "tarikhLahir", "darjahTingkatan2027", "jantina", "sekolah", "sesiSekolah", "pilihanPerjalanan",
  "pickupPoint", "dropOff", "pickupPoint1", "dropOff1", "pickupPoint2", "dropOff2",
]);
// The older one-child form (a page still open in a browser from before the change) counts as a family of one.
const LEGACY_FIELDS = new Set([...FAMILY_FIELDS, ...CHILD_FIELDS, "umur"]);
const MAX_CHILDREN = 5;

const SCHOOLS = new Set([
  "SK Jalan 2", "SMK Jalan 2", "SK Jalan 3", "SMK Jalan 3", "SK Jalan 4", "SMK Jalan 4",
  "SERI / SEMI ABIM Sg Ramal", "KAFA Jubli Perak", "Sri Ummah Al Ikhlas", "Sri Ummah Bangi Perdana",
  "Sri Ummah As Sobah",
]);
const SCHOOL_LEVELS_2027 = new Set([
  "Darjah 1", "Darjah 2", "Darjah 3", "Darjah 4", "Darjah 5", "Darjah 6",
  "Tingkatan 1", "Tingkatan 2", "Tingkatan 3", "Tingkatan 4", "Tingkatan 5", "Perlu semakan",
]);
const ROUTE_POINTS = new Set(["Rumah", "Sekolah", "Transit"]);

type Input = Record<string, unknown>;
type RegistrationResult = { success?: boolean; submissionId?: string; duplicate?: boolean; paymentUrl?: string; feeRm?: string };

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
        body: JSON.stringify({ type: "website_registration", schemaVersion: "2027-website-v3", sharedSecret, data }),
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

// Child n's errors name the form field "<field>-n" so the page can open the right child card.
function validateChild(input: Input, n: number) {
  for (const key of Object.keys(input)) if (!CHILD_FIELDS.has(key)) throw new Error(`UNEXPECTED:${key}`);
  const field = (name: string) => `${name}-${n}`;
  const studentName = requireValue(text(input.namaAnak, 180), field("namaAnak"));
  const dateOfBirth = requireValue(text(input.tarikhLahir, 10), field("tarikhLahir"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) throw new Error(`INVALID:${field("tarikhLahir")}`);
  // Read the date from its parts in UTC: the server clock is UTC, so a Malaysian-midnight Date
  // would fall on the previous day and make 1 January births a year older.
  const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
  const dob = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
  if (dob.getUTCMonth() !== birthMonth - 1 || dob.getUTCDate() !== birthDay || dob > new Date() || birthYear < 2008) throw new Error(`INVALID:${field("tarikhLahir")}`);
  const gender = requireValue(text(input.jantina, 20), field("jantina"));
  if (!["Lelaki", "Perempuan"].includes(gender)) throw new Error(`INVALID:${field("jantina")}`);
  const school = requireValue(text(input.sekolah, 120), field("sekolah"));
  if (!SCHOOLS.has(school)) throw new Error(`INVALID:${field("sekolah")}`);
  const schoolLevel2027 = requireValue(text(input.darjahTingkatan2027, 40), field("darjahTingkatan2027"));
  if (!SCHOOL_LEVELS_2027.has(schoolLevel2027)) throw new Error(`INVALID:${field("darjahTingkatan2027")}`);
  const schoolSession = requireValue(text(input.sesiSekolah, 20), field("sesiSekolah"));
  if (!["Pagi", "Petang"].includes(schoolSession)) throw new Error(`INVALID:${field("sesiSekolah")}`);
  const tripType = requireValue(text(input.pilihanPerjalanan, 30).toUpperCase(), field("pilihanPerjalanan"));
  if (!["PERGI", "BALIK", "PERGI DAN BALIK"].includes(tripType)) throw new Error(`INVALID:${field("pilihanPerjalanan")}`);

  const pickupPoint = text(input.pickupPoint, 30);
  const dropoffPoint = text(input.dropOff, 30);
  const pergiPickupPoint = text(input.pickupPoint1, 30);
  const pergiDropoffPoint = text(input.dropOff1, 30);
  const balikPickupPoint = text(input.pickupPoint2, 30);
  const balikDropoffPoint = text(input.dropOff2, 30);
  const routeValues = tripType === "PERGI DAN BALIK"
    ? [pergiPickupPoint, pergiDropoffPoint, balikPickupPoint, balikDropoffPoint]
    : [pickupPoint, dropoffPoint];
  if (routeValues.some((value) => !ROUTE_POINTS.has(value))) throw new Error(`INVALID:${field("pilihanPerjalanan")}`);

  return {
    studentName, dateOfBirth, clientAge: 2027 - birthYear, schoolLevel2027, gender, school, schoolSession, tripType,
    pickupPoint, dropoffPoint, pergiPickupPoint, pergiDropoffPoint, balikPickupPoint, balikDropoffPoint,
  };
}

function validate(input: Input) {
  let childInputs: Input[];
  if (Array.isArray(input.children)) {
    for (const key of Object.keys(input)) if (!FAMILY_FIELDS.has(key)) throw new Error(`UNEXPECTED:${key}`);
    if (input.children.length < 1 || input.children.length > MAX_CHILDREN) throw new Error("INVALID:children");
    childInputs = input.children.map((child) => {
      if (!child || typeof child !== "object" || Array.isArray(child)) throw new Error("INVALID:children");
      return child as Input;
    });
  } else {
    for (const key of Object.keys(input)) if (!LEGACY_FIELDS.has(key)) throw new Error(`UNEXPECTED:${key}`);
    childInputs = [Object.fromEntries(Object.entries(input).filter(([key]) => CHILD_FIELDS.has(key)))];
  }
  if (text(input.website)) throw new Error("SPAM:honeypot");

  const clientRequestId = requireValue(text(input.clientRequestId, 100), "clientRequestId");
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(clientRequestId)) throw new Error("INVALID:clientRequestId");
  const homeAddress = requireValue(text(input.alamatRumah, 500), "alamatRumah");

  // At least one guardian (ayah or ibu) so single-parent families can register. A guardian who
  // is given needs a name and a valid phone; at least one given guardian needs a 12-digit IC.
  const fatherName = text(input.namaAyah, 180);
  const fatherPhone = phone(input.telefonAyah);
  const fatherIc = String(input.icAyah ?? "").replace(/\D/g, "").slice(0, 12);
  const motherName = text(input.namaIbu, 180);
  const motherPhone = phone(input.telefonIbu);
  const motherIc = String(input.icIbu ?? "").replace(/\D/g, "").slice(0, 12);
  const fatherGiven = Boolean(fatherName || fatherPhone || fatherIc);
  const motherGiven = Boolean(motherName || motherPhone || motherIc);
  if (!fatherGiven && !motherGiven) throw new Error("MISSING:namaAyah");
  if (fatherGiven) {
    requireValue(fatherName, "namaAyah");
    if (!/^60\d{9,10}$/.test(fatherPhone)) throw new Error("INVALID:telefonAyah");
  }
  if (motherGiven) {
    requireValue(motherName, "namaIbu");
    if (!/^60\d{9,10}$/.test(motherPhone)) throw new Error("INVALID:telefonIbu");
  }
  if (fatherIc && !/^\d{12}$/.test(fatherIc)) throw new Error("INVALID:icAyah");
  if (motherIc && !/^\d{12}$/.test(motherIc)) throw new Error("INVALID:icIbu");
  if (!fatherIc && !motherIc) throw new Error(fatherGiven ? "MISSING:icAyah" : "MISSING:icIbu");
  const email = requireValue(text(input.email, 254).toLowerCase(), "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID:email");

  const children = childInputs.map((child, index) => validateChild(child, index + 1));
  if (input.termsAccepted !== true) throw new Error("INVALID:termsAccepted");
  if (input.privacyAccepted !== true) throw new Error("INVALID:privacyAccepted");

  return {
    clientRequestId, homeAddress, motherName, motherPhone, motherIc, fatherName, fatherPhone, fatherIc, email,
    termsAccepted: true, privacyAccepted: true, children,
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
    // With the registration fee on, Apps Script returns the family's Billplz bill; only a Billplz bill link is passed on.
    const paymentUrl = typeof result.paymentUrl === "string" && /^https:\/\/www\.billplz\.com\/bills\/[A-Za-z0-9_-]+$/.test(result.paymentUrl) ? result.paymentUrl : undefined;
    const feeRm = paymentUrl && typeof result.feeRm === "string" && /^\d{1,4}\.\d{2}$/.test(result.feeRm) ? result.feeRm : undefined;
    return json({ success: true, submissionId: result.submissionId, duplicate: result.duplicate === true, paymentUrl, feeRm });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Name only the form field to fix (never its value) so the page can point the parent to it.
    const invalidField = /^(MISSING|INVALID):([\w-]+)$/.exec(message)?.[2];
    const field = invalidField && !["clientRequestId", "children"].includes(invalidField) ? invalidField : undefined;
    if (/^(MISSING|INVALID|UNEXPECTED|SPAM):/.test(message)) return json({ success: false, error: { code: "INVALID_REQUEST", field } }, 400);
    return json({ success: false, error: { code: "TEMPORARY_FAILURE" } }, 502);
  }
};

export const config: Config = {
  path: "/api/registration",
  method: ["POST"],
  // Stops scripts from flooding the sheet. A family registering several children stays far below
  // this; the page also retries a failed send twice, which still fits. Over the limit Netlify answers 429.
  rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
