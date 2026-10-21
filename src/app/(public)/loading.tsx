export default function PublicLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="min-h-[60vh] px-4 py-14 sm:px-6">
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true" className="mx-auto max-w-7xl animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-24 rounded bg-sky/40" />
        <div className="mt-4 h-10 max-w-xl rounded-xl bg-navy/10" />
        <div className="mt-3 h-4 max-w-2xl rounded bg-navy/10" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-52 rounded-2xl border border-navy/10 bg-white shadow-card" />)}
        </div>
      </div>
    </main>
  );
}
