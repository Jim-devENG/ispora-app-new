import { useState, useEffect } from 'react';
import { Layers, Users, Calendar, MessageCircle, BookOpen, Award, Globe } from 'lucide-react';
import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';

const features = [
  {
    icon: Users,
    title: 'Connect with Expert Mentors',
    description: 'Access experienced professionals from the African diaspora who understand your journey and can guide your career path.',
  },
  {
    icon: Calendar,
    title: 'Schedule Sessions Seamlessly',
    description: 'Book one-on-one mentorship sessions that fit your schedule. Video calls, voice chats, or messaging — your choice.',
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Communication',
    description: 'Stay connected with your mentor through our built-in messaging system. Get quick answers and ongoing support.',
  },
  {
    icon: BookOpen,
    title: 'Access Learning Resources',
    description: 'Explore curated resources, career guides, and materials shared by mentors to accelerate your growth.',
  },
  {
    icon: Award,
    title: 'Discover Opportunities',
    description: 'Get exclusive access to scholarships, internships, and job opportunities shared by mentors and partners.',
  },
  {
    icon: Globe,
    title: 'Join a Growing Community',
    description: 'Be part of a vibrant network bridging the African diaspora with ambitious students across Nigeria.',
  },
];

export default function LeftPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFirstSlide, setIsFirstSlide] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % (features.length + 1); // +1 for the intro slide
        setIsFirstSlide(next === 0);
        return next;
      });
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentFeature = features[currentSlide - 1]; // -1 because slide 0 is the intro

  return (
    <div className="w-full h-full flex-shrink-0 bg-[var(--ispora-brand)] flex flex-col justify-between p-9 md:p-10 relative overflow-hidden">
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Decorative orbs */}
      <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-white/[0.06] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[280px] h-[280px] bg-white/[0.04] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[120px] h-[120px] bg-white/[0.05] rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 relative z-10">
        <img src={logo} alt="iSpora" className="w-10 h-10 rounded-full shadow-md" />
      </div>

      {/* Content - Hidden on mobile, shown on desktop */}
      <div className="relative z-10 hidden md:block min-h-[280px]">
        {/* Intro Slide */}
        <div 
          className={`transition-opacity duration-700 ${isFirstSlide ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
        >
          <h1 className="font-syne text-[32px] font-extrabold text-white leading-[1.15] mb-4 tracking-tight">
            Bridge the distance.<br />
            <em className="not-italic text-white/60">Multiply the impact.</em>
          </h1>
          <p className="text-sm text-white/[0.72] leading-relaxed max-w-[340px]">
            Ispora connects African diaspora professionals with ambitious students across Nigeria — for mentorship, guidance, and real-world opportunities.
          </p>
        </div>

        {/* Feature Slides */}
        {currentFeature && (
          <div 
            className={`transition-opacity duration-700 ${!isFirstSlide ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
          >
            <div className="bg-white/10 border border-white/[0.18] rounded-2xl p-6">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-4">
                <currentFeature.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h2 className="font-syne text-[22px] font-bold text-white leading-[1.2] mb-3 tracking-tight">
                {currentFeature.title}
              </h2>
              <p className="text-sm text-white/[0.72] leading-relaxed">
                {currentFeature.description}
              </p>
            </div>
          </div>
        )}

        {/* Slide indicators */}
        <div className="flex gap-1.5 mt-6">
          {[...Array(features.length + 1)].map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'bg-white w-8' 
                  : 'bg-white/30 w-1'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile tagline - Only shown on mobile */}
      <div className="relative z-10 md:hidden bg-white/10 border border-white/[0.18] rounded-[14px] px-5 py-[18px]">
        <p className="text-sm text-white/[0.85] leading-relaxed">
          Connecting African diaspora professionals with ambitious students across Nigeria.
        </p>
      </div>
    </div>
  );
}
