export default function LocaleLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6" aria-hidden>
      <div className="h-10 w-48 animate-pulse rounded bg-sand-line/70" />
      <div className="mt-6 h-4 w-full max-w-xl animate-pulse rounded bg-sand-line/50" />
      <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-sand-line/40" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl bg-sand-line/40"
          />
        ))}
      </div>
    </div>
  );
}
