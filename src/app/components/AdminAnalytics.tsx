import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  stats: any;
}

const COLORS = ['#0123F5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AdminAnalytics({ stats }: Props) {
  const [oppSort, setOppSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'views', dir: 'desc' });
  const [mentorSort, setMentorSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'sessions', dir: 'desc' });
  const [studentSort, setStudentSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'sessions', dir: 'desc' });

  if (!stats?.charts) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--ispora-text3)]">No analytics data available</p>
      </div>
    );
  }

  const { charts } = stats;

  // Add unique IDs to monthly data to prevent duplicate keys
  const monthlyDataWithIds = charts.monthlyData.map((item: any, idx: number) => ({
    ...item,
    id: `month-${idx}-${item.month}`,
  }));

  // Add unique IDs to country data
  const topCountriesWithIds = charts.topCountries.map((item: any, idx: number) => ({
    ...item,
    id: `country-${idx}-${item.name}`,
  }));

  // Add unique IDs to university data
  const topUniversitiesWithIds = charts.topUniversities.map((item: any, idx: number) => ({
    ...item,
    id: `university-${idx}-${item.name}`,
  }));

  // Sort opportunities
  const sortedOpportunities = useMemo(() => {
    return [...charts.opportunityPerformance].sort((a: any, b: any) => {
      const aVal = a[oppSort.field];
      const bVal = b[oppSort.field];
      return oppSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [oppSort, charts.opportunityPerformance]);

  // Sort mentors
  const sortedMentors = useMemo(() => {
    return [...charts.topMentors].sort((a: any, b: any) => {
      const aVal = a[mentorSort.field];
      const bVal = b[mentorSort.field];
      return mentorSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [mentorSort, charts.topMentors]);

  // Sort students
  const sortedStudents = useMemo(() => {
    return [...charts.topStudents].sort((a: any, b: any) => {
      const aVal = a[studentSort.field];
      const bVal = b[studentSort.field];
      return studentSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [studentSort, charts.topStudents]);

  // Prepare data for user distribution pie chart
  const userDistribution = [
    { name: 'Students', value: stats.users.students },
    { name: 'Mentors', value: stats.users.mentors },
    { name: 'Admins', value: stats.users.admins },
  ];

  // Prepare data for opportunity types
  const opportunityTypes = [
    { name: 'Internships', value: stats.opportunities.internships },
    { name: 'Jobs', value: stats.opportunities.jobs },
    { name: 'Scholarships', value: stats.opportunities.scholarships },
  ];

  const handleSort = (field: string, type: 'opp' | 'mentor' | 'student') => {
    if (type === 'opp') {
      setOppSort(prev => ({
        field,
        dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
      }));
    } else if (type === 'mentor') {
      setMentorSort(prev => ({
        field,
        dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
      }));
    } else {
      setStudentSort(prev => ({
        field,
        dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
      }));
    }
  };

  const SortIcon = ({ field, currentSort }: { field: string; currentSort: { field: string; dir: 'asc' | 'desc' } }) => {
    if (currentSort.field !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return currentSort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Over Time */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">User Growth (12 Months)</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-user-growth">
            <LineChart data={monthlyDataWithIds} id="user-growth-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line key="line-users" type="monotone" dataKey="users" stroke="#0123F5" strokeWidth={2} name="Total Users" />
              <Line key="line-students" type="monotone" dataKey="students" stroke="#10B981" strokeWidth={2} name="Students" />
              <Line key="line-mentors" type="monotone" dataKey="mentors" stroke="#F59E0B" strokeWidth={2} name="Mentors" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sessions & Mentorships Activity */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Platform Activity (12 Months)</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-platform-activity">
            <BarChart data={monthlyDataWithIds} id="platform-activity-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar key="bar-sessions" dataKey="sessions" fill="#8B5CF6" name="Sessions" />
              <Bar key="bar-mentorships" dataKey="mentorships" fill="#EC4899" name="Mentorships" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-user-distribution">
            <PieChart id="user-distribution-chart">
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistribution.map((entry, index) => (
                  <Cell key={`user-dist-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunity Types Distribution */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Opportunity Types</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-opportunity-types">
            <BarChart data={opportunityTypes} layout="horizontal" id="opportunity-types-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#0123F5" name="Count">
                {opportunityTypes.map((entry, index) => (
                  <Cell key={`opp-type-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Top Countries by Users</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-top-countries">
            <BarChart data={topCountriesWithIds} layout="horizontal" id="top-countries-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar key="bar-countries" dataKey="count" fill="#10B981" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Universities */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Top Universities</h3>
          <ResponsiveContainer width="100%" height={300} key="chart-top-universities">
            <BarChart data={topUniversitiesWithIds} layout="horizontal" id="top-universities-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar key="bar-universities" dataKey="count" fill="#F59E0B" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables Section */}
      <div className="space-y-6">
        {/* Opportunity Performance Table */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Opportunity Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ispora-border)]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('title', 'opp')} className="flex items-center gap-1 hover:text-[var(--ispora-brand)]">
                      Title <SortIcon field="title" currentSort={oppSort} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Company</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Type</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('views', 'opp')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Views <SortIcon field="views" currentSort={oppSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('clicks', 'opp')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Clicks <SortIcon field="clicks" currentSort={oppSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('ctr', 'opp')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      CTR <SortIcon field="ctr" currentSort={oppSort} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOpportunities.slice(0, 20).map((opp: any, idx: number) => (
                  <tr key={opp.id} className="border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors">
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] font-medium">{opp.title}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text2)]">{opp.company}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                        {opp.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{opp.views}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{opp.clicks}</td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span className={`font-bold ${opp.ctr >= 10 ? 'text-[var(--ispora-success)]' : 'text-[var(--ispora-text2)]'}`}>
                        {opp.ctr}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Mentors Table */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Top Performing Mentors</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ispora-border)]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Company</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('sessions', 'mentor')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Sessions <SortIcon field="sessions" currentSort={mentorSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('completedSessions', 'mentor')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Completed <SortIcon field="completedSessions" currentSort={mentorSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('mentorships', 'mentor')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Mentorships <SortIcon field="mentorships" currentSort={mentorSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('messages', 'mentor')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Messages <SortIcon field="messages" currentSort={mentorSort} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMentors.slice(0, 20).map((mentor: any, idx: number) => (
                  <tr key={mentor.id} className="border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-sm font-medium text-[var(--ispora-text)]">{mentor.name}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">{mentor.email}</div>
                    </td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text2)]">{mentor.company || 'N/A'}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{mentor.sessions}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-success)] text-right font-semibold">{mentor.completedSessions}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{mentor.mentorships}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{mentor.messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Students Table */}
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Most Engaged Students</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ispora-border)]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">University</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('sessions', 'student')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Sessions <SortIcon field="sessions" currentSort={studentSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('mentorships', 'student')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Mentorships <SortIcon field="mentorships" currentSort={studentSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('messages', 'student')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Messages <SortIcon field="messages" currentSort={studentSort} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">
                    <button onClick={() => handleSort('goalsCompleted', 'student')} className="flex items-center gap-1 ml-auto hover:text-[var(--ispora-brand)]">
                      Goals <SortIcon field="goalsCompleted" currentSort={studentSort} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.slice(0, 20).map((student: any, idx: number) => (
                  <tr key={student.id} className="border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-sm font-medium text-[var(--ispora-text)]">{student.name}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">{student.email}</div>
                    </td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text2)]">{student.university || 'N/A'}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{student.sessions}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{student.mentorships}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-text)] text-right font-semibold">{student.messages}</td>
                    <td className="py-3 px-3 text-sm text-[var(--ispora-success)] text-right font-semibold">{student.goalsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}