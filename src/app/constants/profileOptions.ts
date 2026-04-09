// ══════════════════════════════════════════════════════════════════════════════
// ── PROFILE OPTIONS & CONSTANTS ──
// ══════════════════════════════════════════════════════════════════════════════
// Predefined options for mentor and student profiles (MentorCruise-style)

// ──────────────────────────────────────────────────────────────────────────────
// MENTOR OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

export const EXPERTISE_AREAS = [
  'Software Engineering',
  'Product Management',
  'Data Science & Analytics',
  'UX/UI Design',
  'Marketing & Growth',
  'Finance & Investment Banking',
  'Consulting (Strategy & Management)',
  'Entrepreneurship & Startups',
  'DevOps & Cloud Engineering',
  'Cybersecurity',
  'Artificial Intelligence & Machine Learning',
  'Mobile Development (iOS/Android)',
  'Web Development (Frontend/Backend)',
  'Sales & Business Development',
  'Human Resources & Talent',
  'Healthcare & Medicine',
  'Law & Legal',
  'Engineering (Mechanical, Civil, Electrical)',
  'Academia & Research',
  'Accounting',
  'Supply Chain & Operations',
  'Architecture',
  'Media & Communications',
  'Education & Teaching',
  'Non-Profit & Social Impact',
] as const;

export const WHAT_I_CAN_HELP_WITH = [
  'Career planning & goal setting',
  'Resume/CV review & optimization',
  'Interview preparation (technical)',
  'Interview preparation (behavioral)',
  'Technical skills mentorship (coding, design, etc.)',
  'Portfolio & project reviews',
  'Navigating workplace culture',
  'Work visa & immigration advice (H1B, skilled worker, etc.)',
  'Graduate school applications (Masters, PhD)',
  'Networking strategies',
  'Salary negotiation',
  'Study abroad guidance',
  'Entrepreneurship & startup advice',
  'Leadership development',
  'Career transitions (switching fields)',
  'Breaking into FAANG/Big Tech',
  'Breaking into consulting',
  'Breaking into finance/banking',
  'Freelancing & contract work',
  'Personal branding & LinkedIn',
  'Work-life balance',
  'Imposter syndrome & confidence building',
] as const;

export const INDUSTRIES = [
  'Tech/Software',
  'Finance/Banking',
  'Consulting',
  'Healthcare/Biotech',
  'Education',
  'Manufacturing',
  'Retail/E-commerce',
  'Media/Entertainment',
  'Telecommunications',
  'Energy/Utilities',
  'Real Estate',
  'Transportation/Logistics',
  'Hospitality/Tourism',
  'Non-Profit/NGO',
  'Government/Public Sector',
  'Agriculture',
  'Aerospace/Defense',
  'Automotive',
  'Construction',
  'Insurance',
  'Legal Services',
  'Pharmaceuticals',
] as const;

export const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Kaduna',
  'Benin City',
  'Enugu',
  'Jos',
  'Ilorin',
  'Abeokuta',
  'Owerri',
  'Calabar',
  'Warri',
  'Akure',
  'Uyo',
  'Maiduguri',
  'Aba',
  'Onitsha',
  'Sokoto',
  'Zaria',
  'Osogbo',
  'Asaba',
  'Umuahia',
  'Ado-Ekiti',
  'Other',
] as const;

export const LANGUAGES = [
  'English',
  'Yoruba',
  'Igbo',
  'Hausa',
  'Pidgin',
  'Fulani',
  'Edo',
  'Ijaw',
  'Kanuri',
  'Ibibio',
  'Tiv',
  'French',
  'Spanish',
  'Portuguese',
  'Other',
] as const;

export const MENTEE_LEVELS = [
  'High School Students',
  'Undergraduate (1st-2nd year)',
  'Undergraduate (3rd-4th year)',
  'Recent Graduates (0-1 year)',
  'Early Career (1-3 years)',
  'Mid-Career (3-5 years)',
  'Career Changers',
  'Graduate Students (Masters)',
  'Graduate Students (PhD)',
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// STUDENT OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

export const CAREER_INTERESTS = EXPERTISE_AREAS; // Students can pick from same list as mentor expertise

export const LEARNING_GOALS = [
  'Land an internship',
  'Prepare for job interviews',
  'Learn new technical skills',
  'Get into graduate school abroad',
  'Switch career paths',
  'Start a business/startup',
  'Study abroad (Masters/PhD)',
  'Improve my resume/CV',
  'Build a professional network',
  'Learn about specific industry',
  'Get a mentor in my field',
  'Develop leadership skills',
  'Improve my portfolio',
  'Understand workplace culture',
  'Get career guidance',
  'Learn about visa/immigration process',
  'Prepare for competitive exams (GRE, GMAT, etc.)',
  'Build confidence',
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// YEARS OF EXPERIENCE OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

export const YEARS_OF_EXPERIENCE_OPTIONS = [
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-8 years',
  '8-10 years',
  '10-15 years',
  '15-20 years',
  '20+ years',
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// AVAILABILITY OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

export const AVAILABILITY_HOURS_OPTIONS = [2, 4, 6, 8, 10, 12] as const;

// ──────────────────────────────────────────────────────────────────────────────
// YEAR OF STUDY OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

export const YEAR_OF_STUDY_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate Student',
  'Recent Graduate',
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// TYPE HELPERS
// ──────────────────────────────────────────────────────────────────────────────

export type ExpertiseArea = typeof EXPERTISE_AREAS[number];
export type WhatICanHelpWith = typeof WHAT_I_CAN_HELP_WITH[number];
export type Industry = typeof INDUSTRIES[number];
export type NigerianCity = typeof NIGERIAN_CITIES[number];
export type Language = typeof LANGUAGES[number];
export type MenteeLevel = typeof MENTEE_LEVELS[number];
export type CareerInterest = typeof CAREER_INTERESTS[number];
export type LearningGoal = typeof LEARNING_GOALS[number];