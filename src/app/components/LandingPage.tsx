import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, User, CheckCircle2, Sparkles, Video, Star, Zap } from 'lucide-react';
import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';
import heroImage from '/src/assets/d13d17f274b3d920097f088c7c6be3b0332f81db.png';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--ispora-bg)] overflow-x-hidden">
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.on {
          opacity: 1;
          transform: translateY(0);
        }
        .rd1 { transition-delay: 0.08s; }
        .rd2 { transition-delay: 0.17s; }
        .rd3 { transition-delay: 0.26s; }

        @keyframes underIn {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }

        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.06); }
        }

        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-24px, 26px) scale(1.08); }
        }

        @keyframes cardFloat1 {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }

        @keyframes cardFloat2 {
          0%, 100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }

        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes oppScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] h-[72px] flex items-center px-[7vw] justify-between transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(7,9,74,0.06)]' : 'bg-white/70 backdrop-blur-xl'
      }`}>
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Ispora" className="h-9 w-9 rounded-full shadow-sm" />
          <span className="font-syne font-extrabold text-lg tracking-tight text-[var(--ispora-text)]">Ispora</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-[13px] font-semibold text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] transition-colors">How it works</a>
          <a href="#who" className="text-[13px] font-semibold text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] transition-colors">Who it's for</a>
          <a href="#stories" className="text-[13px] font-semibold text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] transition-colors">Success stories</a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/auth?mode=signin"
            className="hidden sm:inline-flex text-[var(--ispora-text2)] px-4 py-2 rounded-full text-[13px] font-semibold hover:text-[var(--ispora-brand)] transition-all"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 bg-[var(--ispora-brand)] text-white px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_8px_24px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center px-[7vw] pt-[150px] sm:pt-[130px] pb-24 relative overflow-hidden">
        {/* Background: solid-color blobs + fine grid, no gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'linear-gradient(var(--ispora-border) 1px, transparent 1px), linear-gradient(90deg, var(--ispora-border) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 90%)'
            }}
          />
          <div className="absolute top-[-180px] right-[-160px] w-[620px] h-[620px] rounded-full bg-[var(--ispora-brand)] opacity-[0.07] blur-[110px] animate-[blobDrift1_14s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-220px] left-[-140px] w-[520px] h-[520px] rounded-full bg-[var(--ispora-accent)] opacity-[0.10] blur-[100px] animate-[blobDrift2_16s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-14 md:gap-[60px] w-full max-w-[1200px] mx-auto">
          {/* Hero Left */}
          <div className="flex-1 max-w-[640px] text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-full pl-1.5 pr-3.5 py-1.5 mb-6 shadow-[var(--ispora-shadow-sm)]">
              <span className="bg-[var(--ispora-accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
              <span className="text-[12px] font-semibold text-[var(--ispora-text2)]">Live in-app video sessions with Ispora Live</span>
            </div>

            <h1 className="font-syne text-[clamp(38px,4.6vw,58px)] font-black leading-[1.05] tracking-[-2px] text-[var(--ispora-text)] mb-5">
              Africa's best <em className="not-italic text-[var(--ispora-brand)] relative inline-block whitespace-nowrap">lift<span className="absolute bottom-[2px] left-0 right-0 h-[6px] bg-[var(--ispora-accent)] rounded-sm -z-10 animate-[underIn_0.6s_ease_0.5s_both]" /></em>{' '}the next generation.
            </h1>

            <p className="text-[18px] text-[var(--ispora-text2)] leading-[1.65] mb-8 max-w-[520px] mx-auto md:mx-0">
              Connect with verified diaspora professionals and Africa's top home-based experts for real mentorship, insider opportunities, and the guidance that changes careers.
            </p>

            {/* Hero Actions */}
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mb-8">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-[var(--ispora-brand)] text-white px-[30px] py-[16px] rounded-xl text-[15px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_12px_32px_rgba(2,31,246,0.32)] hover:-translate-y-0.5 transition-all group"
              >
                Get started — it's free
                <ArrowRight className="w-[15px] h-[15px] group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </Link>
              <Link
                to="/auth?mode=signin"
                className="inline-flex items-center gap-2 bg-white text-[var(--ispora-text2)] px-7 py-4 rounded-xl text-[15px] font-semibold border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:-translate-y-0.5 transition-all"
              >
                <User className="w-3.5 h-3.5" strokeWidth={2} />
                Sign in
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="flex -space-x-2.5">
                {['AO', 'CU', 'FA', 'TA'].map((initials, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full border-2 border-white grid place-items-center text-[10px] font-bold text-white"
                    style={{ background: [`var(--ispora-brand)`, `var(--ispora-accent)`, `#7c3aed`, `var(--ispora-success)`][idx] }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[var(--ispora-accent)] text-[var(--ispora-accent)]" />
                  ))}
                </div>
                <p className="text-[12px] text-[var(--ispora-text3)] font-medium">Trusted by mentors &amp; students across Africa</p>
              </div>
            </div>
          </div>

          {/* Hero Right - Image with floating UI chips */}
          <div className="flex-shrink-0 w-full max-w-[400px] relative">
            <div className="relative rounded-[28px] overflow-hidden shadow-[0_28px_70px_rgba(7,9,74,0.18)] h-[380px] border-[6px] border-white">
              <img
                src={heroImage}
                alt="African professionals in mentorship"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating chip: live session */}
            <div className="hidden sm:flex absolute -left-10 top-8 items-center gap-2.5 bg-white rounded-2xl shadow-[var(--ispora-shadow-lg)] border-[1.5px] border-[var(--ispora-border)] px-4 py-3 animate-[cardFloat1_6s_ease-in-out_infinite]">
              <div className="w-9 h-9 rounded-xl bg-[var(--ispora-brand)] grid place-items-center flex-shrink-0">
                <Video className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--ispora-text)] leading-tight">Live session</div>
                <div className="text-[10px] text-[var(--ispora-text3)]">In progress now</div>
              </div>
            </div>

            {/* Floating chip: opportunity matched */}
            <div className="hidden sm:flex absolute -right-8 bottom-10 items-center gap-2.5 bg-white rounded-2xl shadow-[var(--ispora-shadow-lg)] border-[1.5px] border-[var(--ispora-border)] px-4 py-3 animate-[cardFloat2_7s_ease-in-out_infinite]">
              <div className="w-9 h-9 rounded-xl bg-[var(--ispora-accent)] grid place-items-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--ispora-text)] leading-tight">Opportunity matched</div>
                <div className="text-[10px] text-[var(--ispora-text3)]">Google STEP Internship</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Ticker */}
      <div className="border-t-[1.5px] border-b-[1.5px] border-[var(--ispora-border)] bg-white py-3.5 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex gap-7 w-max animate-[tickerScroll_30s_linear_infinite]">
          {[...Array(2)].map((_, groupIdx) => (
            <React.Fragment key={groupIdx}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--ispora-brand)] grid place-items-center text-[10px] font-bold text-white">AO</div>
                <span className="text-[13px] font-medium text-[var(--ispora-text2)]">Adaeze Okafor</span>
                <span className="text-[11px] font-bold text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)] px-2 py-0.5 rounded-full">Accepted to Google</span>
              </div>
              <span className="text-[var(--ispora-border2)] text-lg">•</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--ispora-success)] grid place-items-center text-[10px] font-bold text-white">CU</div>
                <span className="text-[13px] font-medium text-[var(--ispora-text2)]">Chidi Uzoma</span>
                <span className="text-[11px] font-bold text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)] px-2 py-0.5 rounded-full">MIT Scholarship</span>
              </div>
              <span className="text-[var(--ispora-border2)] text-lg">•</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--ispora-accent)] grid place-items-center text-[10px] font-bold text-white">FA</div>
                <span className="text-[13px] font-medium text-[var(--ispora-text2)]">Folake Adeyemi</span>
                <span className="text-[11px] font-bold text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)] px-2 py-0.5 rounded-full">Stanford Fellow</span>
              </div>
              <span className="text-[var(--ispora-border2)] text-lg">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section id="how" className="py-24 px-[7vw] max-w-[1200px] mx-auto">
        <div className="reveal">
          <div className="inline-flex items-center gap-2 bg-[var(--ispora-brand-light)] text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-brand)]" />
            How it works
          </div>
          <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
            Three simple steps to <span className="text-[var(--ispora-brand)]">success</span>
          </h2>
          <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px]">
            Whether you're a student seeking guidance or a professional ready to give back, getting started is easy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {[
            { num: '01', title: 'Create your profile', text: 'Sign up and tell us about your background, interests, and career goals or areas of expertise.' },
            { num: '02', title: 'Get matched', text: 'Our platform connects you with the perfect mentor or mentee based on shared interests and goals.' },
            { num: '03', title: 'Start growing', text: 'Schedule sessions, share resources, and unlock opportunities that accelerate your career journey.' }
          ].map((step, idx) => (
            <div
              key={idx}
              className={`reveal rd${idx + 1} bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-7 hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-1 transition-all`}
            >
              <div className="w-11 h-11 bg-[var(--ispora-brand)] rounded-[12px] grid place-items-center font-syne font-extrabold text-[15px] text-white mb-5">{step.num}</div>
              <h3 className="font-syne text-[18px] font-bold text-[var(--ispora-text)] mb-2 leading-tight">{step.title}</h3>
              <p className="text-[13px] text-[var(--ispora-text3)] leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Who */}
      <section id="who" className="py-24 px-[7vw] max-w-[1200px] mx-auto">
        <div className="reveal text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[var(--ispora-brand-light)] text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-brand)]" />
            Who we serve
          </div>
          <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
            Built for <span className="text-[var(--ispora-brand)]">everyone</span>
          </h2>
          <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px] mx-auto md:mx-0">
            Whether you're seeking mentorship or ready to give back, Ispora is your platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-12">
          {/* Youth Card */}
          <div className="reveal rd1 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-[20px] p-8 md:p-9 relative overflow-hidden">
            <div className="text-[10px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-accent)]" />
              FOR YOUTH
            </div>
            <h3 className="font-syne text-2xl font-extrabold leading-tight text-[var(--ispora-text)] mb-2.5 tracking-tight">
              Get guidance from those who've been there
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] leading-relaxed mb-5">
              Connect with professionals who understand your journey and want to help you succeed.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {[
                '1-on-1 mentorship sessions',
                'Insider job & scholarship opportunities',
                'Career guidance & interview prep',
                'Skill-building resources'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[13px] text-[var(--ispora-text2)]">
                  <div className="w-4 h-4 rounded-full bg-[var(--ispora-brand-light)] border border-[rgba(2,31,246,0.2)] grid place-items-center flex-shrink-0">
                    <CheckCircle2 className="w-2 h-2 stroke-[var(--ispora-brand)]" strokeWidth={3} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-[var(--ispora-brand)] text-white px-5 py-3 rounded-[10px] text-[13px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_20px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all"
            >
              Find a mentor
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Mentors Card */}
          <div className="reveal rd2 bg-[var(--ispora-brand)] rounded-[20px] p-8 md:p-9 relative overflow-hidden">
            <div className="absolute top-[-100px] right-[-80px] w-[280px] h-[280px] rounded-full bg-white opacity-[0.06] pointer-events-none" />
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3.5 flex items-center gap-1.5 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-accent)]" />
              FOR MENTORS
            </div>
            <h3 className="font-syne text-2xl font-extrabold leading-tight text-white mb-2.5 tracking-tight relative z-10">
              Give back and shape the next generation
            </h3>
            <p className="text-[13px] text-white/65 leading-relaxed mb-5 relative z-10">
              Share your knowledge, open doors, and make a real impact on talented African youth.
            </p>
            <div className="flex flex-col gap-2 mb-6 relative z-10">
              {[
                'Flexible scheduling that fits your life',
                'Connect with ambitious youth',
                'Share opportunities from your network',
                'Track your impact & mentee success'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[13px] text-white/85">
                  <div className="w-4 h-4 rounded-full bg-white/15 border border-white/25 grid place-items-center flex-shrink-0">
                    <CheckCircle2 className="w-2 h-2 stroke-[var(--ispora-accent)]" strokeWidth={3} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-[var(--ispora-accent)] text-white px-5 py-3 rounded-[10px] text-[13px] font-bold hover:bg-white hover:text-[var(--ispora-brand)] hover:shadow-[0_6px_20px_rgba(0,200,150,0.3)] hover:-translate-y-0.5 transition-all relative z-10"
            >
              Become a mentor
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* Opportunities Showcase */}
      <div className="bg-white border-t-[1.5px] border-b-[1.5px] border-[var(--ispora-border)] py-24">
        <div className="px-[7vw] max-w-[1200px] mx-auto">
          <div className="reveal text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--ispora-brand-light)] text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-brand)]" />
              Opportunities
            </div>
            <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
              Curated <span className="text-[var(--ispora-brand)]">opportunities</span> for you
            </h2>
            <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px] mx-auto mb-10">
              From internships to scholarships, we bring the best opportunities directly to you.
            </p>
          </div>

          {/* Opportunities Carousel */}
          <div className="overflow-hidden relative rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex gap-2.5 w-max animate-[oppScroll_34s_linear_infinite] hover:pause py-1">
              {[...Array(2)].map((_, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  {[
                    { logo: 'G', name: 'Google STEP', type: 'Internship', color: 'var(--ispora-brand)' },
                    { logo: 'M', name: 'MIT Scholarship', type: 'Scholarship', color: 'var(--ispora-accent)' },
                    { logo: 'FB', name: 'Meta Fellowship', type: 'Fellowship', color: '#7c3aed' },
                    { logo: 'Y', name: 'Y Combinator', type: 'Accelerator', color: '#ea580c' },
                    { logo: 'MS', name: 'Microsoft Internship', type: 'Internship', color: 'var(--ispora-brand)' },
                    { logo: 'F', name: 'Fullbright', type: 'Grant', color: 'var(--ispora-success)' }
                  ].map((opp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-full px-3.5 py-2 flex-shrink-0 hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                    >
                      <div className="w-7 h-7 rounded-full grid place-items-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: opp.color }}>
                        {opp.logo}
                      </div>
                      <span className="text-xs font-semibold text-[var(--ispora-text)] whitespace-nowrap">{opp.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        opp.type === 'Internship' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                        opp.type === 'Scholarship' ? 'bg-[var(--ispora-accent-light)] text-[#0f766e]' :
                        opp.type === 'Fellowship' ? 'bg-[#f3e8ff] text-[#7c3aed]' :
                        opp.type === 'Accelerator' ? 'bg-[#fff7ed] text-[#ea580c]' :
                        'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]'
                      }`}>
                        {opp.type}
                      </span>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="reveal text-center mt-6">
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ispora-brand)] hover:text-[var(--ispora-brand-hover)] transition-colors group">
              See all opportunities
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <section id="stories" className="bg-[var(--ispora-bg)] border-t-[1.5px] border-b-[1.5px] border-[var(--ispora-border)] py-24 px-[7vw]">
        <div className="max-w-[1200px] mx-auto">
          <div className="reveal text-center">
            <div className="inline-flex items-center gap-2 bg-white border-[1.5px] border-[var(--ispora-border)] text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-brand)]" />
              Success stories
            </div>
            <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
              Real stories, <span className="text-[var(--ispora-brand)]">real impact</span>
            </h2>
            <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px] mx-auto mb-10">
              See how Ispora is transforming careers and creating opportunities across Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: '"',
                text: 'My mentor helped me land my dream internship at Google Lagos. The <strong>insider tips on the application process</strong> were invaluable!',
                name: 'Chioma Eze',
                role: 'CS Student, University of Lagos',
                achievement: 'Google Intern',
                avatar: 'CE',
                color: 'var(--ispora-brand)'
              },
              {
                quote: '"',
                text: 'Being able to <strong>give back to the next generation</strong> in Nigeria while staying connected to home has been incredibly rewarding.',
                name: 'Dr. Tunde Adebayo',
                role: 'Tech Lead, Microsoft Seattle',
                achievement: 'Mentoring 8 youth',
                avatar: 'TA',
                color: 'var(--ispora-success)'
              },
              {
                quote: '"',
                text: 'Through Ispora, I found not just a mentor but a <strong>network of professionals</strong> who opened doors I didn\'t know existed.',
                name: 'Blessing Okafor',
                role: 'Engineering Student, UNILAG',
                achievement: 'MIT Scholarship',
                avatar: 'BO',
                color: 'var(--ispora-accent)'
              }
            ].map((testi, idx) => (
              <div
                key={idx}
                className={`reveal rd${idx + 1} bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-6 hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-1 transition-all`}
              >
                <div className="font-syne text-[26px] font-black text-[var(--ispora-brand)] leading-none mb-2.5">{testi.quote}</div>
                <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed mb-4 italic" dangerouslySetInnerHTML={{ __html: testi.text }} />
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-[34px] h-[34px] rounded-full grid place-items-center font-bold text-[13px] text-white flex-shrink-0" style={{ background: testi.color }}>
                    {testi.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--ispora-text)] leading-tight">{testi.name}</div>
                    <div className="text-[11px] text-[var(--ispora-text3)]">{testi.role}</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 bg-[var(--ispora-brand-light)] border border-[rgba(2,31,246,0.15)] rounded-full px-2.5 py-1 text-[10px] font-bold text-[var(--ispora-brand)]">
                  <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                  {testi.achievement}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-[7vw]">
        <div className="max-w-[1200px] mx-auto">
          <div className="reveal bg-[var(--ispora-brand)] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background: solid-color shapes, no gradients */}
            <div className="absolute inset-0 rounded-3xl opacity-[0.35]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="absolute w-[420px] h-[420px] rounded-full bg-white opacity-[0.05] top-[-140px] right-[-100px] pointer-events-none" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-[var(--ispora-accent)] opacity-[0.14] bottom-[-100px] left-[-60px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-syne text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-white mb-3">
                Ready to <span className="text-[var(--ispora-accent)]">transform</span> your future?
              </h2>
              <p className="text-base text-white/65 mb-8 max-w-[440px] mx-auto leading-relaxed">
                Join thousands of youth and professionals building the future of Africa together.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 bg-[var(--ispora-accent)] text-white px-[30px] py-4 rounded-xl text-[15px] font-bold hover:bg-white hover:text-[var(--ispora-brand)] hover:shadow-[0_12px_32px_rgba(0,200,150,0.3)] hover:-translate-y-0.5 transition-all"
                >
                  Get started for free
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center bg-white/10 text-white px-[26px] py-3.5 rounded-xl text-[15px] font-semibold border-[1.5px] border-white/20 hover:bg-white/20 transition-all"
                >
                  Learn more
                </Link>
              </div>
              <p className="text-xs text-white/40">No credit card required • Free forever for youth & mentors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-[1.5px] border-[var(--ispora-border)] py-7 px-[7vw]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3.5">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Ispora" className="w-[26px] h-[26px] rounded-full shadow-sm" />
            <span className="font-syne font-extrabold text-[15px] text-[var(--ispora-brand)]">Ispora</span>
          </div>
          <p className="text-xs text-[var(--ispora-text3)]">© 2026 Ispora. Connecting Africa's best to lift the next generation.</p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors">Privacy</a>
            <a href="#" className="text-xs text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors">Terms</a>
            <a href="#" className="text-xs text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
