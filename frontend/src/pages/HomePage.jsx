import Dashboard from "./Dashboard.jsx";

export default function HomePage({ onNavigate }) {
  return (
    <main className="mx-auto max-w-[1440px] px-6 py-16 md:px-10">
      <section className="max-w-2xl pb-14">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-cyan-400">
          Your daily mirror, made mindful
        </p>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink-50 md:text-7xl">
          A calmer way to understand your routine.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-ink-400 md:text-lg">
          MIRA brings your skincare routine, wellness signals, and private on-device insights into one thoughtful daily view.
        </p>
      </section>
      
    </main>
  );
}
