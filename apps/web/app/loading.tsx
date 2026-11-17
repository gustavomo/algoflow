export default function Loading() {
  return (
    <main
      className="mx-auto min-h-screen max-w-7xl px-6 py-28 lg:px-10"
      aria-busy="true"
      aria-label="Loading learning workspace"
    >
      <div className="h-3 w-28 animate-pulse rounded-full bg-action/30" />
      <div className="mt-6 h-12 max-w-xl animate-pulse rounded-2xl bg-ink/[0.07]" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-3xl border border-line bg-surface"
          />
        ))}
      </div>
    </main>
  );
}
