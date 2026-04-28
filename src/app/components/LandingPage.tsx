import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, User, CheckCircle2, Sparkles } from 'lucide-react';
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
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes underIn {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        
        @keyframes cardFloat1 {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-6px) rotate(0.5deg); }
        }
        
        @keyframes cardFloat2 {
          0%, 100% { transform: translateY(0) rotate(0.3deg); }
          50% { transform: translateY(-5px) rotate(-0.3deg); }
        }
        
        @keyframes cardFloat3 {
          0%, 100% { transform: translateY(0) rotate(-0.2deg); }
          50% { transform: translateY(-4px) rotate(0.2deg); }
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
      <nav className={`fixed top-0 left-0 right-0 z-[200] h-[66px] flex items-center px-[7vw] justify-between transition-all duration-300 ${
        scrolled ? 'bg-white/98 shadow-[var(--ispora-shadow-sm)]' : 'bg-white/82 backdrop-blur-[20px]'
      } border-b-[1.5px] border-[var(--ispora-border)]`}>
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Ispora" className="h-10 w-10 rounded-full shadow-sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/auth?mode=signin"
            className="hidden sm:inline-flex bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] px-[18px] py-2 rounded-full text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 bg-[var(--ispora-brand)] text-white px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_20px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center px-[7vw] pt-[140px] sm:pt-[120px] pb-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'linear-gradient(var(--ispora-border) 1px, transparent 1px), linear-gradient(90deg, var(--ispora-border) 1px, transparent 1px)',
              backgroundSize: '52px 52px'
            }}
          />
          <div className="absolute top-[-200px] right-[-100px] w-[700px] h-[700px] bg-[radial-gradient(ellipse,rgba(2,31,246,0.1)_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(184,240,74,0.08)_0%,transparent_65%)] pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-[60px] w-full max-w-[1200px] mx-auto">
          {/* Hero Left */}
          <div className="flex-1 max-w-[600px] text-center md:text-left">
            {/* H1 */}
            <h1 className="font-syne text-[clamp(36px,4.5vw,58px)] font-black leading-[1.06] tracking-[-2px] text-[var(--ispora-text)] mb-5 text-[48px]">
              Africa's best <em className="italic text-[var(--ispora-brand)] font-bold relative inline-block whitespace-nowrap">lift<span className="absolute bottom-[-3px] left-0 right-0 h-[3px] bg-[var(--ispora-accent)] rounded-sm animate-[underIn_0.6s_ease_0.5s_both]" /></em>{' '}the next generation.
            </h1>

            <p className="text-[17px] text-[var(--ispora-text2)] leading-[1.65] mb-8 max-w-[500px] mx-auto md:mx-0">
              Connect with verified diaspora professionals and Africa's top home-based experts for real mentorship, insider opportunities, and the guidance that changes careers.
            </p>

            {/* Hero Actions */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap mb-10">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-[var(--ispora-brand)] text-white px-[30px] py-[15px] rounded-xl text-[15px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_10px_32px_rgba(2,31,246,0.28)] hover:-translate-y-0.5 transition-all group"
              >
                Get started — it's free
                <ArrowRight className="w-[15px] h-[15px] group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </Link>
              <Link
                to="/auth?mode=signin"
                className="inline-flex items-center gap-2 bg-white text-[var(--ispora-text2)] px-7 py-3.5 rounded-xl text-[15px] font-semibold border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:-translate-y-0.5 transition-all"
              >
                <User className="w-3.5 h-3.5" strokeWidth={2} />
                Sign in
              </Link>
            </div>
          </div>

          {/* Hero Right - Image */}
          <div className="flex-shrink-0 w-full max-w-[380px]">
            <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(2,31,246,0.14)] h-[360px]">
              <img 
                src={heroImage} 
                alt="African professionals in mentorship" 
                className="w-full h-full object-cover"
              />
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
      <section id="how" className="py-20 px-[7vw] max-w-[1200px] mx-auto">
        <div className="reveal">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3">
            <div className="w-4 h-0.5 bg-[var(--ispora-brand)] rounded-full" />
            HOW IT WORKS
          </div>
          <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
            Three simple steps to <em className="italic text-[var(--ispora-brand)] font-semibold">success</em>
          </h2>
          <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px]">
            Whether you're a student seeking guidance or a professional ready to give back, getting started is easy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { num: '01', title: 'Create your profile', text: 'Sign up and tell us about your background, interests, and career goals or areas of expertise.' },
            { num: '02', title: 'Get matched', text: 'Our platform connects you with the perfect mentor or mentee based on shared interests and goals.' },
            { num: '03', title: 'Start growing', text: 'Schedule sessions, share resources, and unlock opportunities that accelerate your career journey.' }
          ].map((step, idx) => (
            <div
              key={idx}
              className={`reveal rd${idx + 1} bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-7 hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-1 transition-all relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--ispora-brand-light)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 bg-[var(--ispora-brand)] rounded-[10px] grid place-items-center font-syne font-extrabold text-[15px] text-white mb-4 relative z-10">{step.num}</div>
              <h3 className="font-syne text-[17px] font-bold text-[var(--ispora-text)] mb-2 leading-tight relative z-10">{step.title}</h3>
              <p className="text-[13px] text-[var(--ispora-text3)] leading-relaxed relative z-10">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Who */}
      <section id="who" className="py-20 px-[7vw] max-w-[1200px] mx-auto">
        <div className="reveal text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3">
            <div className="w-4 h-0.5 bg-[var(--ispora-brand)] rounded-full" />
            WHO WE SERVE
          </div>
          <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
            Built for <em className="italic text-[var(--ispora-brand)] font-semibold">everyone</em>
          </h2>
          <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px] mx-auto md:mx-0">
            Whether you're seeking mentorship or ready to give back, Ispora is your platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          {/* Youth Card */}
          <div className="reveal rd1 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-[20px] p-8 md:p-9 relative overflow-hidden">
            <div className="text-[10px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ispora-accent)]" />
              FOR YOUTH
            </div>
            <h3 className="font-syne text-2xl font-extrabold leading-tight text-[var(--ispora-text)] mb-2.5 tracking-tight relative z-10">
              Get guidance from those who've been there
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] leading-relaxed mb-5 relative z-10">
              Connect with professionals who understand your journey and want to help you succeed.
            </p>
            <div className="flex flex-col gap-2 mb-6 relative z-10">
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
              className="inline-flex items-center gap-2 bg-[var(--ispora-brand)] text-white px-5 py-3 rounded-[10px] text-[13px] font-bold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_20px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all relative z-10"
            >
              Find a mentor
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Mentors Card */}
          <div className="reveal rd2 bg-[var(--ispora-brand)] border-[1.5px] border-[var(--ispora-brand)] rounded-[20px] p-8 md:p-9 relative overflow-hidden">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
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
              className="inline-flex items-center gap-2 bg-[var(--ispora-accent)] text-[var(--ispora-text)] px-5 py-3 rounded-[10px] text-[13px] font-bold hover:bg-white hover:shadow-[0_6px_20px_rgba(184,240,74,0.3)] hover:-translate-y-0.5 transition-all relative z-10"
            >
              Become a mentor
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* Opportunities Showcase */}
      <div className="bg-white border-t-[1.5px] border-b-[1.5px] border-[var(--ispora-border)] py-20">
        <div className="px-[7vw] max-w-[1200px] mx-auto">
          <div className="reveal text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3">
              <div className="w-4 h-0.5 bg-[var(--ispora-brand)] rounded-full" />
              OPPORTUNITIES
            </div>
            <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
              Curated <em className="italic text-[var(--ispora-brand)] font-semibold">opportunities</em> for you
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

          <div className="reveal text-center mt-5">
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ispora-brand)] hover:text-[var(--ispora-brand-hover)] transition-colors group">
              See all opportunities
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <section id="stories" className="bg-[var(--ispora-bg)] border-t-[1.5px] border-b-[1.5px] border-[var(--ispora-border)] py-20 px-[7vw]">
        <div className="max-w-[1200px] mx-auto">
          <div className="reveal text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-widest mb-3">
              <div className="w-4 h-0.5 bg-[var(--ispora-brand)] rounded-full" />
              SUCCESS STORIES
            </div>
            <h2 className="font-syne text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-[var(--ispora-text)] mb-2.5">
              Real stories, <em className="italic text-[var(--ispora-brand)] font-semibold">real impact</em>
            </h2>
            <p className="text-base text-[var(--ispora-text3)] leading-relaxed max-w-[500px] mx-auto mb-10">
              See how Ispora is transforming careers and creating opportunities across Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <section className="py-20 px-[7vw]">
        <div className="max-w-[1200px] mx-auto">
          <div className="reveal bg-[var(--ispora-brand)] rounded-3xl p-12 md:p-14 text-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 rounded-3xl" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[rgba(4,5,46,0.3)] blur-[80px] top-[-120px] right-[-80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-syne text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.08] tracking-[-1.5px] text-white mb-3">
                Ready to <em className="italic text-[var(--ispora-accent)] font-semibold">transform</em> your future?
              </h2>
              <p className="text-base text-white/65 mb-7 max-w-[440px] mx-auto leading-relaxed">
                Join thousands of youth and professionals building the future of Africa together.
              </p>
              <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3.5">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 bg-[var(--ispora-accent)] text-[var(--ispora-text)] px-[30px] py-3.5 rounded-xl text-[15px] font-bold hover:bg-white hover:shadow-[0_10px_28px_rgba(184,240,74,0.3)] hover:-translate-y-0.5 transition-all"
                >
                  Get started for free
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center bg-white/12 text-white px-[26px] py-3 rounded-xl text-[15px] font-semibold border-[1.5px] border-white/20 hover:bg-white/20 transition-all"
                >
                  Learn more
                </Link>
              </div>
              <p className="text-xs text-white/35">No credit card required • Free forever for youth & mentors</p>
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
