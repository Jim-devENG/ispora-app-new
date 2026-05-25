import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[var(--ispora-bg)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(var(--ispora-border) 1px, transparent 1px), linear-gradient(90deg, var(--ispora-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(2,31,246,0.14)_0%,transparent_70%)]" />
        <div className="absolute -bottom-28 -left-24 w-[420px] h-[420px] bg-[radial-gradient(circle,rgba(184,240,74,0.12)_0%,transparent_70%)]" />
      </div>

      <section className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-6">
        <img src={logo} alt="iSpora" className="w-16 h-16 rounded-full mb-8 shadow-[var(--ispora-shadow)]" />

        <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-[var(--ispora-brand)] mb-4">
          Scheduled Maintenance
        </p>

        <h1 className="font-syne text-[clamp(34px,5vw,62px)] leading-[1.04] tracking-[-0.03em] font-black text-[var(--ispora-text)] max-w-4xl">
          iSpora is getting an upgrade.
        </h1>

        <p className="mt-5 text-[15px] md:text-[18px] leading-relaxed text-[var(--ispora-text2)] max-w-2xl">
          We are currently performing maintenance to improve performance and reliability.
          The platform will be back online shortly.
        </p>

        <p className="mt-8 text-[13px] text-[var(--ispora-text3)]">
          Thank you for your patience.
        </p>
      </section>
    </main>
  );
}
