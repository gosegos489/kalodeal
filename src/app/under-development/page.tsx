import { Construction, Sparkles } from 'lucide-react'

export default function UnderDevelopmentPage() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-center text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.32),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.18),transparent_26%)]" />
      <div className="absolute top-12 -left-20 -z-10 size-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -right-16 -bottom-20 -z-10 size-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur sm:p-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-black/20">
          <Construction className="size-7" />
        </div>

        <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-100">
          <Sparkles className="size-4" />
          Kalodeal
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Under development</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-pretty text-slate-300 sm:text-lg">
          We’re making a few final improvements. Please check back soon.
        </p>
      </section>
    </main>
  )
}
