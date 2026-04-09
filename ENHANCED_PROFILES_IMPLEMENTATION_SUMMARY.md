# 🎯 Enhanced Mentor/Student Profiles - Implementation Summary

**Status:** Phase 1 & 2 Complete | Phase 3 & 4 In Progress

---

## ✅ **COMPLETED**

### **Phase 1: Type Definitions** 
**File:** `/src/app/types/index.ts`

Added new fields to the `User` interface:

**For Mentors:**
- `nigerianCityOfOrigin?: string` - Nigerian city of origin (e.g., "Lagos", "Abuja")
- `expertiseAreas?: string[]` - Areas of expertise (e.g., ["Software Engineering", "Product Management"])
- `whatICanHelpWith?: string[]` - Specific offerings (e.g., ["Interview prep", "Resume reviews"])
- `industriesWorkedIn?: string[]` - Industries they've worked in
- `languagesSpoken?: string[]` - Languages they speak
- `availabilityHoursPerMonth?: number` - How many hours/month they can mentor
- `preferredMenteeLevel?: string[]` - Preferred mentee levels (undergrad, grad, etc.)

**For Students:**
- `careerInterests?: string[]` - Career interests
- `learningGoals?: string[]` - What they want to achieve
- `lookingForHelpWith?: string` - Free text for what they're seeking

---

### **Phase 2: Profile Options Constants**
**File:** `/src/app/constants/profileOptions.ts`

Created comprehensive predefined options:
- **25+ Expertise Areas**: Software Engineering, Product Management, Data Science, UX/UI Design, etc.
- **22+ "What I Can Help With"**: Career planning, Resume reviews, Interview prep, etc.
- **22+ Industries**: Tech/Software, Finance/Banking, Consulting, Healthcare, etc.
- **26+ Nigerian Cities**: Lagos, Abuja, Port Harcourt, Kano, Ibadan, etc.
- **15+ Languages**: English, Yoruba, Igbo, Hausa, Pidgin, French, etc.
- **Mentee Levels**: High School, Undergraduate, Graduate, Early Career, etc.
- **Learning Goals**: Land internship, Prepare for interviews, Learn skills, etc.

---

### **Phase 2.5: Profile Component Updates**
**File:** `/src/app/components/Profile.tsx`

**Updated:**
- ✅ Added imports for new constants and icons
- ✅ Updated `ProfileData` interface with all new fields
- ✅ Updated `useEffect` to fetch new fields from backend
- ✅ Added new fields to profileData initialization

**Still Needed:**
- ⏳ Add UI section to display the new fields
- ⏳ Add "Edit Enhanced Profile" modal with multi-select dropdowns

---

### **Phase 3: FindMentor Component**
**File:** `/src/app/components/FindMentor.tsx`

**Updated:**
- ✅ Imported new constants (EXPERTISE_AREAS, INDUSTRIES, NIGERIAN_CITIES, etc.)
- ✅ Updated Mentor interface with all new fields
- ✅ Profile modal already displays new fields if they exist

**Still Needed:**
- ⏳ Update filters to use new expertiseAreas instead of basic field filter
- ⏳ Add Nigerian city filter
- ⏳ Add industry filter
- ⏳ Display new fields on mentor cards (expertise badges, Nigerian city badge)

---

## ⏳ **TODO: Phase 3 - Enhance FindMentor UI**

### **A. Update Filters Section**

Replace current basic filters with smart filters:

```tsx
// Current filters (lines 237-290):
<select value={filterField} onChange={...}>
  <option value="">All Fields</option>
  <option value="software">Software Engineering</option>
  ...
</select>

// NEW: Replace with:
<select value={filterExpertise} onChange={(e) => setFilterExpertise(e.target.value)}>
  <option value="">All Expertise</option>
  {EXPERTISE_AREAS.map(area => (
    <option key={area} value={area}>{area}</option>
  ))}
</select>

<select value={filterIndustry} onChange={...}>
  <option value="">All Industries</option>
  {INDUSTRIES.map(industry => (
    <option key={industry} value={industry}>{industry}</option>
  ))}
</select>

<select value={filterNigerianCity} onChange={...}>
  <option value="">All Cities</option>
  {NIGERIAN_CITIES.map(city => (
    <option key={city} value={city}>{city}</option>
  ))}
</select>
```

### **B. Update Filter Logic**

Update the `useEffect` filter logic (lines 84-129):

```tsx
// Add new filter state:
const [filterExpertise, setFilterExpertise] = useState('');
const [filterIndustry, setFilterIndustry] = useState('');
const [filterNigerianCity, setFilterNigerianCity] = useState('');

// Update filter logic:
if (filterExpertise) {
  filtered = filtered.filter(m =>
    m.expertiseAreas?.includes(filterExpertise)
  );
}

if (filterIndustry) {
  filtered = filtered.filter(m =>
    m.industriesWorkedIn?.includes(filterIndustry)
  );
}

if (filterNigerianCity) {
  filtered = filtered.filter(m =>
    m.nigerianCityOfOrigin === filterNigerianCity
  );
}
```

### **C. Enhance Mentor Cards**

Update the MentorCard component (grid view) to show new fields:

```tsx
{/* Add Nigerian City Badge */}
{mentor.nigerianCityOfOrigin && (
  <div className=\"flex items-center gap-1 text-[11px] text-[var(--ispora-text3)] mb-1\">
    <Flag className=\"w-[11px] h-[11px]\" strokeWidth={2} />
    🇳🇬 {mentor.nigerianCityOfOrigin}
  </div>
)}

{/* Replace generic skills with expertiseAreas */}
<div className=\"flex flex-wrap gap-1 justify-center\">
  {(mentor.expertiseAreas || mentor.skills)?.slice(0, 3).map((area, idx) => (
    <span key={idx} className=\"text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]\">
      {area}
    </span>
  ))}
</div>
```

---

## ⏳ **TODO: Phase 4 - Backend Updates**

### **A. Check Profile Update Endpoint**

The `authApi.updateProfile()` should already handle any fields passed to it via the KV store. 

**Verify:** The backend accepts and stores the new fields (nigerianCityOfOrigin, expertiseAreas, etc.)

### **B. Check User Fetch Endpoint**

The `userApi.getUser()` should return all fields from the KV store.

**Verify:** The backend returns the new fields when fetching user profiles

### **C. Update User List Endpoint**

When fetching all mentors (`userApi.getAll({ role: 'diaspora' })`), ensure new fields are included.

---

## 📋 **IMPLEMENTATION PRIORITY**

### **HIGH PRIORITY** (Do Now):
1. ✅ Add state variables for new filters in FindMentor
2. ✅ Update filter dropdowns with EXPERTISE_AREAS, INDUSTRIES, NIGERIAN_CITIES
3. ✅ Update filter logic in useEffect
4. ✅ Display expertiseAreas and nigerianCityOfOrigin on mentor cards
5. ⏳ Add "Enhanced Profile" section to Profile component
6. ⏳ Create "Edit Enhanced Profile" modal with multi-select inputs

### **MEDIUM PRIORITY** (Next):
1. ⏳ Test backend - verify new fields are saved/retrieved
2. ⏳ Add profile completion check for new fields
3. ⏳ Update Student Profile component with similar enhancements

### **LOW PRIORITY** (Later):
1. Search improvements (search by expertise, industry, Nigerian city)
2. Sort options (by expertise match, location, etc.)
3. Matching algorithm (recommend mentors based on student interests)

---

## 🎨 **UI MOCKUP: Enhanced Profile Section**

Add this section to Profile component (in Left Column, after "Availability"):

```tsx
{/* Enhanced Mentor Profile - NEW SECTION */}
<div className=\"bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden\">
  <div className=\"px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between\">
    <div className=\"flex items-center gap-2\">
      <h3 className=\"font-syne text-sm font-bold text-[var(--ispora-text)]\">
        Mentorship Profile
      </h3>
      <span className=\"text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold\">
        NEW
      </span>
    </div>
    <button
      onClick={() => setShowEditEnhanced(true)}
      className=\"flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] rounded-lg text-xs font-semibold hover:bg-[#e0e3ff] transition-colors\"
    >
      <Edit className=\"w-3 h-3\" strokeWidth={2} />
      Edit
    </button>
  </div>
  <div className=\"px-5 py-4.5 space-y-3.5\">
    {/* Nigerian City */}
    {profileData.nigerianCityOfOrigin && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5 flex items-center gap-1\">
          <Flag className=\"w-3 h-3\" />
          Nigerian City
        </div>
        <div className=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold\">
          🇳🇬 {profileData.nigerianCityOfOrigin}
        </div>
      </div>
    )}

    {/* Expertise Areas */}
    {profileData.expertiseAreas && profileData.expertiseAreas.length > 0 && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2\">
          Expertise Areas
        </div>
        <div className=\"flex flex-wrap gap-1.5\">
          {profileData.expertiseAreas.map((area, idx) => (
            <span key={idx} className=\"text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]\">
              {area}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* What I Can Help With */}
    {profileData.whatICanHelpWith && profileData.whatICanHelpWith.length > 0 && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2\">
          What I Can Help With
        </div>
        <div className=\"space-y-1.5\">
          {profileData.whatICanHelpWith.map((item, idx) => (
            <div key={idx} className=\"flex items-start gap-2 text-[13px] text-[var(--ispora-text2)]\">
              <CheckCircle className=\"w-4 h-4 text-[var(--ispora-success)] flex-shrink-0 mt-0.5\" strokeWidth={2} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Industries Worked In */}
    {profileData.industriesWorkedIn && profileData.industriesWorkedIn.length > 0 && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2\">
          Industries
        </div>
        <div className=\"flex flex-wrap gap-1.5\">
          {profileData.industriesWorkedIn.map((industry, idx) => (
            <span key={idx} className=\"text-[11px] font-medium px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600\">
              {industry}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Languages Spoken */}
    {profileData.languagesSpoken && profileData.languagesSpoken.length > 0 && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2 flex items-center gap-1\">
          <Languages className=\"w-3 h-3\" />
          Languages
        </div>
        <div className=\"flex flex-wrap gap-1.5\">
          {profileData.languagesSpoken.map((lang, idx) => (
            <span key={idx} className=\"text-[11px] font-medium px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600\">
              {lang}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Availability Hours */}
    {profileData.availabilityHoursPerMonth && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5 flex items-center gap-1\">
          <Clock className=\"w-3 h-3\" />
          Monthly Availability
        </div>
        <div className=\"text-[13px] text-[var(--ispora-text)]\">
          {profileData.availabilityHoursPerMonth} hours/month
        </div>
      </div>
    )}

    {/* Preferred Mentee Level */}
    {profileData.preferredMenteeLevel && profileData.preferredMenteeLevel.length > 0 && (
      <div>
        <div className=\"text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2 flex items-center gap-1\">
          <Target className=\"w-3 h-3\" />
          Preferred Mentees
        </div>
        <div className=\"flex flex-wrap gap-1.5\">
          {profileData.preferredMenteeLevel.map((level, idx) => (
            <span key={idx} className=\"text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600\">
              {level}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Empty State */}
    {(!profileData.nigerianCityOfOrigin && 
      !profileData.expertiseAreas?.length &&
      !profileData.whatICanHelpWith?.length &&
      !profileData.industriesWorkedIn?.length &&
      !profileData.languagesSpoken?.length &&
      !profileData.availabilityHoursPerMonth &&
      !profileData.preferredMenteeLevel?.length) && (
      <div className=\"text-center py-6\">
        <Lightbulb className=\"w-10 h-10 text-[var(--ispora-text3)] mx-auto mb-2\" strokeWidth={1.5} />
        <p className=\"text-[13px] text-[var(--ispora-text3)] mb-3\">
          Complete your mentorship profile to help students find you more easily
        </p>
        <button
          onClick={() => setShowEditEnhanced(true)}
          className=\"text-xs font-semibold text-[var(--ispora-brand)] hover:underline\"
        >
          Add Details →
        </button>
      </div>
    )}
  </div>
</div>
```

---

## 🚀 **NEXT STEPS**

1. **Complete FindMentor enhancements** (filters + cards) - ~30 min
2. **Add Enhanced Profile section to Profile component** - ~20 min
3. **Create Edit Enhanced Profile modal** - ~40 min
4. **Test backend integration** - ~15 min
5. **Polish & bug fixes** - ~15 min

**Total Estimated Time:** ~2 hours

---

## 📝 **NOTES**

- Backend should handle new fields automatically via KV store (no schema changes needed)
- All multi-select inputs should use checkboxes, not comma-separated text
- Profile completion percentage should factor in new fields
- Consider adding tooltips explaining each field
- Mobile responsiveness needs testing

---

**Last Updated:** Just now
**Status:** Ready for Phase 3 & 4 implementation
