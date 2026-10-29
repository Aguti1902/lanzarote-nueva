import { createSign } from "crypto";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GaServiceAccount = {
  clientEmail: string;
  privateKey: string;
};

export type GaTotals = {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number;
  averageSessionDuration: number;
};

export type GaDayPoint = {
  date: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
};

export type GaRangeDays = 7 | 28 | 90;

export function normalizeGaDays(raw: unknown): GaRangeDays {
  const days = Number(raw);
  if (days === 7 || days === 90) return days;
  return 28;
}

export type GaReport = {
  days: GaRangeDays;
  from: string;
  to: string;
  current: GaTotals;
  previous: GaTotals;
  byDay: GaDayPoint[];
  previousByDay: GaDayPoint[];
  topPages: { path: string; views: number; users: number }[];
  channels: { name: string; sessions: number; users: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; sessions: number }[];
};

export type GaAnalyticsStatus = {
  connected: boolean;
  propertyId: string;
  clientEmail: string;
  source: "panel" | "env" | "none";
  report: GaReport | null;
  error: string;
};

type ApiReport = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  }[];
};

const EMPTY_TOTALS: GaTotals = {
  activeUsers: 0,
  sessions: 0,
  screenPageViews: 0,
  engagementRate: 0,
  averageSessionDuration: 0,
};

export function normalizePropertyId(raw: string): string | null {
  const id = raw.trim().replace(/^properties\//i, "");
  if (!id) return "";
  return /^\d{5,15}$/.test(id) ? id : null;
}

export function parseServiceAccount(raw: string): GaServiceAccount | null {
  const text = raw.trim();
  if (!text) return null;
  let data: {
    type?: string;
    client_email?: string;
    private_key?: string;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error("El JSON de la cuenta de servicio no se puede leer.");
  }
  if (data.type && data.type !== "service_account") {
    throw new Error("Ese JSON no es una cuenta de servicio de Google.");
  }
  const clientEmail = String(data.client_email || "").trim();
  const privateKey = String(data.private_key || "").replace(/\\n/g, "\n");
  if (!clientEmail.includes("@") || !privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error("El JSON tiene que incluir client_email y private_key.");
  }
  return { clientEmail, privateKey };
}

function b64url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function accessToken(account: GaServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: account.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(account.privateKey);
  const assertion = `${unsigned}.${b64url(signature)}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        "Google no ha aceptado la cuenta de servicio. Revisa el JSON."
    );
  }
  return data.access_token;
}

function rowsOf(report: ApiReport | undefined): Record<string, string>[] {
  const dims = report?.dimensionHeaders?.map((header) => header.name) || [];
  const metrics = report?.metricHeaders?.map((header) => header.name) || [];
  return (report?.rows || []).map((row) => {
    const out: Record<string, string> = {};
    dims.forEach((name, index) => {
      out[name] = row.dimensionValues?.[index]?.value || "";
    });
    metrics.forEach((name, index) => {
      out[name] = row.metricValues?.[index]?.value || "0";
    });
    return out;
  });
}

function num(value: string | undefined): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function totalsFrom(row: Record<string, string> | undefined): GaTotals {
  if (!row) return { ...EMPTY_TOTALS };
  return {
    activeUsers: num(row.activeUsers),
    sessions: num(row.sessions),
    screenPageViews: num(row.screenPageViews),
    engagementRate: num(row.engagementRate),
    averageSessionDuration: num(row.averageSessionDuration),
  };
}

function formatGaDate(raw: string): string {
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw;
}

function daySeries(report: ApiReport | undefined): GaDayPoint[] {
  return rowsOf(report)
    .map((row) => ({
      date: formatGaDate(row.date || ""),
      activeUsers: num(row.activeUsers),
      sessions: num(row.sessions),
      screenPageViews: num(row.screenPageViews),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function parseGaBatch(reports: ApiReport[], days: GaRangeDays = 28): GaReport {
  const totalRows = rowsOf(reports[0]);
  const current =
    totalRows.find((row) => row.dateRange === "current") || totalRows[0];
  const previous =
    totalRows.find((row) => row.dateRange === "previous") || totalRows[1];
  return {
    days,
    from: `${days}daysAgo`,
    to: "yesterday",
    current: totalsFrom(current),
    previous: totalsFrom(previous),
    byDay: daySeries(reports[1]),
    previousByDay: daySeries(reports[2]),
    topPages: rowsOf(reports[3])
      .filter((row) => row.pagePath && row.pagePath !== "(not set)")
      .slice(0, 8)
      .map((row) => ({
        path: row.pagePath,
        views: num(row.screenPageViews),
        users: num(row.activeUsers),
      })),
    channels: rowsOf(reports[4])
      .filter((row) => row.sessionDefaultChannelGroup)
      .slice(0, 8)
      .map((row) => ({
        name: row.sessionDefaultChannelGroup,
        sessions: num(row.sessions),
        users: num(row.activeUsers),
      })),
    countries: rowsOf(reports[5])
      .filter((row) => row.country)
      .slice(0, 8)
      .map((row) => ({
        name: row.country,
        users: num(row.activeUsers),
      })),
    devices: rowsOf(reports[6])
      .filter((row) => row.deviceCategory)
      .map((row) => ({
        name: row.deviceCategory,
        sessions: num(row.sessions),
      })),
  };
}

function googleError(status: number, body: string): string {
  let message = "";
  let code = "";
  try {
    const data = JSON.parse(body) as { error?: { message?: string; status?: string } };
    message = data.error?.message || "";
    code = data.error?.status || "";
  } catch {
    message = "";
  }
  if (status === 403 || code === "PERMISSION_DENIED") {
    return "Google ha rechazado la lectura. Añade el correo de la cuenta de servicio como Lector en la propiedad de Analytics.";
  }
  if (status === 404 || code === "NOT_FOUND") {
    return "No existe esa propiedad. El ID es el número de Administrar → Detalles de la propiedad, no el que empieza por G-.";
  }
  return message || `Google ha respondido ${status}.`;
}

type GaBatchRequest = Record<string, unknown>;

/** Google admite como máximo 5 informes por llamada. */
function reportRequests(days: GaRangeDays): GaBatchRequest[] {
  const current = [{ startDate: `${days}daysAgo`, endDate: "yesterday" }];
  const previous = [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }];
  const dayMetrics = [
    { name: "activeUsers" },
    { name: "sessions" },
    { name: "screenPageViews" },
  ];
  const byDay = (range: { startDate: string; endDate: string }[]): GaBatchRequest => ({
    dateRanges: range,
    dimensions: [{ name: "date" }],
    metrics: dayMetrics,
    orderBys: [{ dimension: { dimensionName: "date" } }],
    keepEmptyRows: true,
    limit: String(days + 2),
  });
  return [
    {
      dateRanges: [
        { startDate: `${days}daysAgo`, endDate: "yesterday", name: "current" },
        { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo`, name: "previous" },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
      ],
    },
    byDay(current),
    byDay(previous),
    {
      dateRanges: current,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: "8",
    },
    {
      dateRanges: current,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "8",
    },
    {
      dateRanges: current,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "8",
    },
    {
      dateRanges: current,
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "6",
    },
  ];
}

async function runGaBatch(
  propertyId: string,
  token: string,
  requests: GaBatchRequest[]
): Promise<ApiReport[]> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ requests }),
    }
  );
  const body = await response.text();
  if (!response.ok) throw new Error(googleError(response.status, body));
  const data = JSON.parse(body) as { reports?: ApiReport[] };
  return data.reports || [];
}

const cache = new Map<string, { at: number; report: GaReport }>();
const CACHE_MS = 10 * 60 * 1000;

export function clearGaReportCache() {
  cache.clear();
}

export async function fetchGaReport(
  propertyId: string,
  account: GaServiceAccount,
  options?: { fresh?: boolean; days?: GaRangeDays }
): Promise<GaReport> {
  const days = normalizeGaDays(options?.days);
  const key = `${propertyId}:${account.clientEmail}:${days}`;
  const hit = cache.get(key);
  if (!options?.fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.report;

  const token = await accessToken(account);
  const requests = reportRequests(days);
  const reports: ApiReport[] = [];
  for (let index = 0; index < requests.length; index += 5) {
    const part = await runGaBatch(
      propertyId,
      token,
      requests.slice(index, index + 5)
    );
    reports.push(...part);
  }
  const report = parseGaBatch(reports, days);
  cache.set(key, { at: Date.now(), report });
  return report;
}

export function credentialsFromEnv(): {
  propertyId: string;
  account: GaServiceAccount;
} | null {
  const propertyId = normalizePropertyId(process.env.GA4_PROPERTY_ID || "");
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON || "";
  if (!propertyId || !raw.trim()) return null;
  try {
    const account = parseServiceAccount(raw);
    if (!account) return null;
    return { propertyId, account };
  } catch {
    return null;
  }
}

export async function analyticsStatus(input: {
  propertyId: string;
  account: GaServiceAccount | null;
  source: "panel" | "env" | "none";
  fresh?: boolean;
  days?: GaRangeDays;
}): Promise<GaAnalyticsStatus> {
  if (!input.propertyId || !input.account || input.source === "none") {
    return {
      connected: false,
      propertyId: input.propertyId,
      clientEmail: input.account?.clientEmail || "",
      source: "none",
      report: null,
      error: "",
    };
  }
  try {
    const report = await fetchGaReport(input.propertyId, input.account, {
      fresh: input.fresh,
      days: input.days,
    });
    return {
      connected: true,
      propertyId: input.propertyId,
      clientEmail: input.account.clientEmail,
      source: input.source,
      report,
      error: "",
    };
  } catch (error) {
    return {
      connected: true,
      propertyId: input.propertyId,
      clientEmail: input.account.clientEmail,
      source: input.source,
      report: null,
      error: error instanceof Error ? error.message : "No se pudieron leer las visitas.",
    };
  }
}
