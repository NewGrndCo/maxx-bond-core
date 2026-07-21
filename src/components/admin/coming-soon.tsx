export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-neutral-400 mt-1 text-sm">{description}</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-xs uppercase tracking-widest text-amber-300/70">
          Coming next phase
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          The schema and storage are ready. This surface will be built out in an upcoming phase.
        </p>
      </div>
    </div>
  );
}
