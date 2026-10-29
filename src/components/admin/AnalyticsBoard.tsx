"use client";

import { useId, useState, type MouseEvent } from "react";

export type AnalyticsRange = 7 | 28 | 90;

export type AnalyticsPoint = {
  date: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
};

export type AnalyticsTotals = {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number;
  averageSessionDuration: number;
};

export type AnalyticsReport = {
  days: AnalyticsRange;
  current: AnalyticsTotals;
  previous: AnalyticsTotals;
  byDay: AnalyticsPoint[];
  previousByDay: AnalyticsPoint[];
  topPages: { path: string; views: number; users: number }[];
  channels: { name: string; sessions: number; users: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; sessions: number }[];
};

type Metric = "activeUsers" | "sessions" | "screenPageViews";

const METRICS: { id: Metric; label: string }[] = [
  { id: "activeUsers", label: "Usuarios" },
  { id: "sessions", label: "Sesiones" },
  { id: "screenPageViews", label: "Páginas vistas" },
];

const CHANNEL_LABEL: Record<string, string> = {
  "Organic Search": "Búsqueda orgánica",
  Direct: "Directo",
  Referral: "Enlaces",
  "Organic Social": "Redes",
  "Paid Search": "Búsqueda de pago",
  Email: "Correo",
  Unassigned: "Sin asignar",
  "AI Assistant": "Asistente de IA",
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: "Móvil",
  desktop: "Ordenador",
  tablet: "Tablet",
};

const COUNTRY_LABEL: Record<string, string> = {
  Spain: "España",
  "United Kingdom": "Reino Unido",
  Germany: "Alemania",
  "United States": "Estados Unidos",
  Italy: "Italia",
  Netherlands: "Países Bajos",
  France: "Francia",
  Ireland: "Irlanda",
  Belgium: "Bélgica",
  Portugal: "Portugal",
  Switzerland: "Suiza",
  Austria: "Austria",
  Sweden: "Suecia",
  Norway: "Noruega",
  Denmark: "Dinamarca",
  Poland: "Polonia",
  Canada: "Canadá",
};

const VIEW_W = 720;
const VIEW_H = 248;
const PAD = { l: 44, r: 16, t: 18, b: 32 };

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}

function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes <= 0) return `${rest} s`;
  return `${minutes} min ${rest} s`;
}

function formatRate(rate: number) {
  return `${Math.round(rate * 1000) / 10} %`;
}

function formatDay(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function niceMax(value: number) {
  if (value <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const scaled = value / pow;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * pow;
}

function DeltaLine({
  current,
  previous,
  days,
}: {
  current: number;
  previous: number;
  days: number;
}) {
  const pct = deltaPct(current, previous);
  if (pct == null) {
    return (
      <p className="mt-1 text-xs text-ink-muted">
        El periodo anterior, de {days} días, está a cero
      </p>
    );
  }
  const tone = pct > 0 ? "text-success" : pct < 0 ? "text-coral" : "text-ink-muted";
  const sign = pct > 0 ? "+" : "";
  return (
    <p className={`mt-1 text-xs font-semibold ${tone}`}>
      {sign}
      {pct} % frente a los {days} días anteriores
    </p>
  );
}

function Bars({
  rows,
}: {
  rows: { key: string; label: string; value: number; hint?: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-ink-muted">Sin datos en este periodo.</p>;
  }
  return (
    <ul className="mt-3 space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 break-all">{row.label}</span>
            <b className="shrink-0 tabular-nums">
              {formatNumber(row.value)}
              {row.hint ? <span className="font-medium text-ink-muted"> {row.hint}</span> : null}
            </b>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-sky-mist">
            <div
              className="h-2 rounded-full bg-ocean"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendChart({
  current,
  previous,
  metric,
  compare,
  metricLabel,
}: {
  current: AnalyticsPoint[];
  previous: AnalyticsPoint[];
  metric: Metric;
  compare: boolean;
  metricLabel: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const count = Math.max(current.length, compare ? previous.length : 0, 1);
  const values = [
    ...current.map((point) => point[metric]),
    ...(compare ? previous.map((point) => point[metric]) : []),
  ];
  const max = niceMax(Math.max(1, ...values, 0));
  const innerW = VIEW_W - PAD.l - PAD.r;
  const innerH = VIEW_H - PAD.t - PAD.b;
  const xAt = (index: number) =>
    PAD.l + (count === 1 ? innerW / 2 : (index / (count - 1)) * innerW);
  const yAt = (value: number) => PAD.t + innerH - (value / max) * innerH;
  const [hover, setHover] = useState<number | null>(null);

  function line(series: AnalyticsPoint[]) {
    return series
      .map((point, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command} ${xAt(index).toFixed(1)} ${yAt(point[metric]).toFixed(1)}`;
      })
      .join(" ");
  }

  const currentLine = current.length > 0 ? line(current) : "";
  const previousLine = compare && previous.length > 0 ? line(previous) : "";
  const area =
    current.length > 0
      ? `${currentLine} L ${xAt(current.length - 1).toFixed(1)} ${yAt(0).toFixed(1)} L ${xAt(0).toFixed(1)} ${yAt(0).toFixed(1)} Z`
      : "";
  const labelIndexes = [0, Math.floor((current.length - 1) / 2), current.length - 1].filter(
    (index, position, all) => index >= 0 && all.indexOf(index) === position
  );
  const hoverPoint = hover != null ? current[hover] : undefined;
  const hoverPrevious = hover != null ? previous[hover] : undefined;

  function onMove(event: MouseEvent<SVGSVGElement>) {
    if (current.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const rel = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const ratio = (rel - PAD.l) / innerW;
    const index = Math.round(ratio * (count - 1));
    setHover(Math.max(0, Math.min(current.length - 1, index)));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block h-64 w-full max-w-full"
        role="img"
        aria-label={`Gráfica de ${metricLabel.toLowerCase()}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eb4823" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#eb4823" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((step) => {
          const value = max * (1 - step);
          const y = yAt(value);
          return (
            <g key={step}>
              <line x1={PAD.l} x2={VIEW_W - PAD.r} y1={y} y2={y} stroke="#ebe4dc" />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#4f5665">
                {formatNumber(value)}
              </text>
            </g>
          );
        })}
        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {previousLine && (
          <path d={previousLine} fill="none" stroke="#8d847c" strokeWidth="2" strokeDasharray="5 4" />
        )}
        {currentLine && <path d={currentLine} fill="none" stroke="#eb4823" strokeWidth="2.5" />}
        {hover != null && hoverPoint && (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={PAD.t}
            y2={VIEW_H - PAD.b}
            stroke="#c93412"
            strokeDasharray="3 3"
          />
        )}
        {hover != null && hoverPoint && (
          <circle cx={xAt(hover)} cy={yAt(hoverPoint[metric])} r="4.5" fill="#eb4823" />
        )}
        {labelIndexes.map((index) => (
          <text
            key={current[index]?.date || index}
            x={xAt(index)}
            y={VIEW_H - 8}
            textAnchor={index === 0 ? "start" : index === current.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill="#4f5665"
          >
            {formatDay(current[index]?.date || "")}
          </text>
        ))}
      </svg>
      {hoverPoint && (
        <div
          className="pointer-events-none absolute top-2 rounded-md bg-ink px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: `${(xAt(hover || 0) / VIEW_W) * 100}%`,
            transform: (hover || 0) > count * 0.7 ? "translateX(-110%)" : "translateX(8px)",
          }}
        >
          <p className="font-semibold">
            {formatDay(hoverPoint.date)} · {formatNumber(hoverPoint[metric])} {metricLabel.toLowerCase()}
          </p>
          {compare && hoverPrevious && (
            <p className="mt-1 text-white/80">
              {formatDay(hoverPrevious.date)} · {formatNumber(hoverPrevious[metric])}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AnalyticsBoard({
  report,
  days,
  loading,
  onDaysChange,
}: {
  report: AnalyticsReport;
  days: AnalyticsRange;
  loading: boolean;
  onDaysChange: (days: AnalyticsRange) => void;
}) {
  const [metric, setMetric] = useState<Metric>("activeUsers");
  const [compare, setCompare] = useState(true);
  const metricLabel = METRICS.find((item) => item.id === metric)?.label || "Usuarios";
  const span =
    report.byDay.length > 0
      ? `${formatDay(report.byDay[0].date)} – ${formatDay(report.byDay[report.byDay.length - 1].date)}`
      : `Últimos ${report.days} días`;

  return (
    <div className={loading ? "opacity-60" : undefined} aria-busy={loading}>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex max-w-full flex-wrap gap-1 rounded-lg bg-sky-mist p-1" role="group" aria-label="Periodo">
            {([7, 28, 90] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={days === option}
                disabled={loading}
                onClick={() => onDaysChange(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
                  days === option ? "bg-white text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                {option} días
              </button>
            ))}
          </div>
          <div className="flex max-w-full flex-wrap gap-1 rounded-lg bg-sky-mist p-1" role="group" aria-label="Métrica">
            {METRICS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={metric === option.id}
                onClick={() => setMetric(option.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  metric === option.id ? "bg-white text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={compare}
          onClick={() => setCompare((value) => !value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${
            compare ? "bg-white text-ink ring-ocean" : "bg-sky-mist text-ink-muted ring-transparent"
          }`}
        >
          Comparar con el periodo anterior
        </button>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        {span}. La línea naranja es este periodo
        {compare ? " y la gris discontinua es el periodo anterior, alineado día a día." : "."}
        {loading ? " Leyendo este periodo…" : ""}
      </p>
      {days === 90 && (
        <p className="mt-2 text-sm text-ink-muted">
          Si la gráfica no llega a 90 días, en Analytics abre Administrar → Conservación de datos. El plazo de fábrica es de 2 meses y se puede ampliar a 14.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((option) => {
          const selected = metric === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setMetric(option.id)}
              className={`rounded-md p-3 text-left ${
                selected ? "bg-white ring-2 ring-ocean" : "bg-sky-mist"
              }`}
            >
              <p className="text-xs text-ink-muted">{option.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatNumber(report.current[option.id])}
              </p>
              <DeltaLine
                current={report.current[option.id]}
                previous={report.previous[option.id]}
                days={report.days}
              />
            </button>
          );
        })}
        <article className="rounded-md bg-sky-mist p-3">
          <p className="text-xs text-ink-muted">Interacción</p>
          <p className="mt-1 text-2xl font-bold">{formatRate(report.current.engagementRate)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Duración media {formatDuration(report.current.averageSessionDuration)}
          </p>
          <DeltaLine
            current={report.current.engagementRate}
            previous={report.previous.engagementRate}
            days={report.days}
          />
        </article>
      </div>

      <div className="mt-4 rounded-lg bg-sky-soft/60 p-3 ring-1 ring-sand-line">
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-6 bg-ocean" /> Este periodo
          </span>
          {compare && (
            <span className="inline-flex items-center gap-2">
              <span className="h-0 w-6 border-t-2 border-dashed border-[#8d847c]" /> Periodo anterior
            </span>
          )}
        </div>
        {report.byDay.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">
            Google no ha devuelto días en este periodo.
          </p>
        ) : (
          <TrendChart
            current={report.byDay}
            previous={report.previousByDay || []}
            metric={metric}
            compare={compare}
            metricLabel={metricLabel}
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold">Páginas más vistas</h3>
          <Bars
            rows={report.topPages.map((page) => ({
              key: page.path,
              label: page.path,
              value: page.views,
            }))}
          />
        </div>
        <div>
          <h3 className="text-sm font-bold">De dónde llegan</h3>
          <Bars
            rows={report.channels.map((channel) => ({
              key: channel.name,
              label: CHANNEL_LABEL[channel.name] || channel.name,
              value: channel.sessions,
              hint: "sesiones",
            }))}
          />
        </div>
        <div>
          <h3 className="text-sm font-bold">Países</h3>
          <Bars
            rows={report.countries.map((country) => ({
              key: country.name,
              label: COUNTRY_LABEL[country.name] || country.name,
              value: country.users,
            }))}
          />
        </div>
        <div>
          <h3 className="text-sm font-bold">Dispositivo</h3>
          <Bars
            rows={report.devices.map((device) => ({
              key: device.name,
              label: DEVICE_LABEL[device.name] || device.name,
              value: device.sessions,
              hint: "sesiones",
            }))}
          />
        </div>
      </div>
    </div>
  );
}
