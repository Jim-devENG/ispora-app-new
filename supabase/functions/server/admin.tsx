// Admin routes module for Ispora
// This file contains all admin-only API endpoints

export function setupAdminRoutes(app: any, authenticateAdmin: any, generateId: any, kv: any, supabaseAdmin: any) {
  
  // ══════════════════════════════════════════════════════════════════════════════
  // ── ADMIN STATISTICS ──
  // ══════════════════════════════════════════════════════════════════════════════
  
  // Get platform statistics (admin only)
  app.get("/make-server-b8526fa6/admin/stats", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const allUsers = await kv.getByPrefix('user:');
      const allMentorships = await kv.getByPrefix('mentorship:');
      const allSessions = await kv.getByPrefix('session:');
      const allOpportunities = await kv.getByPrefix('opportunity:');
      const allRequests = await kv.getByPrefix('request:');
      const allGoals = await kv.getByPrefix('goal:');
      const allMessages = await kv.getByPrefix('message:');
      const allResources = await kv.getByPrefix('resource:');

      const students = allUsers.filter((u: any) => u.role === 'student');
      const mentors = allUsers.filter((u: any) => u.role === 'diaspora');
      const activeMentorships = allMentorships.filter((m: any) => m.status === 'active');
      const completedSessions = allSessions.filter((s: any) => s.status === 'completed');
      const pendingRequests = allRequests.filter((r: any) => r.status === 'pending');

      // Extract unique countries from users
      const countries = new Set<string>();
      allUsers.forEach((u: any) => {
        if (u.country) countries.add(u.country);
        if (u.location) countries.add(u.location);
      });

      // Extract unique universities from students
      const universities = new Set<string>();
      students.forEach((s: any) => {
        if (s.university) universities.add(s.university);
      });

      // Extract unique companies from mentors
      const companies = new Set<string>();
      mentors.forEach((m: any) => {
        if (m.company) companies.add(m.company);
      });

      // Calculate opportunity engagement
      let totalViews = 0;
      let totalClicks = 0;
      allOpportunities.forEach((o: any) => {
        totalViews += o.views || 0;
        totalClicks += o.clicks || 0;
      });

      // Calculate growth (new users in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = allUsers.filter((u: any) => {
        return new Date(u.createdAt) >= thirtyDaysAgo;
      }).length;

      // Calculate average session duration (mock for now as we don't track duration yet)
      const avgSessionDuration = completedSessions.length > 0 ? 45 : 0; // minutes

      // Calculate engagement metrics
      const totalMessagesCount = allMessages.length;
      const totalResourcesShared = allResources.length;
      const totalGoalsCompleted = allGoals.filter((g: any) => g.completed).length;

      // Calculate mentor acceptance rate
      const acceptedRequests = allRequests.filter((r: any) => r.status === 'accepted').length;
      const mentorAcceptanceRate = allRequests.length > 0 
        ? Math.round((acceptedRequests / allRequests.length) * 100) 
        : 0;

      // Calculate session completion rate
      const sessionCompletionRate = allSessions.length > 0
        ? Math.round((completedSessions.length / allSessions.length) * 100)
        : 0;

      // Generate time-series data for charts (last 12 months)
      const monthlyData = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthUsers = allUsers.filter((u: any) => {
          const createdDate = new Date(u.createdAt);
          return createdDate >= monthDate && createdDate < nextMonth;
        });

        const monthSessions = allSessions.filter((s: any) => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate >= monthDate && sessionDate < nextMonth;
        });

        const monthMentorships = allMentorships.filter((m: any) => {
          const mentorshipDate = new Date(m.startedAt || m.createdAt);
          return mentorshipDate >= monthDate && mentorshipDate < nextMonth;
        });

        monthlyData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: monthUsers.length,
          students: monthUsers.filter((u: any) => u.role === 'student').length,
          mentors: monthUsers.filter((u: any) => u.role === 'diaspora').length,
          sessions: monthSessions.length,
          mentorships: monthMentorships.length,
        });
      }

      // Calculate country distribution with counts
      const countryStats = new Map<string, number>();
      allUsers.forEach((u: any) => {
        const country = u.country || u.location;
        if (country) {
          countryStats.set(country, (countryStats.get(country) || 0) + 1);
        }
      });
      const topCountriesWithCounts = Array.from(countryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Calculate university distribution
      const universityStats = new Map<string, number>();
      students.forEach((s: any) => {
        if (s.university) {
          universityStats.set(s.university, (universityStats.get(s.university) || 0) + 1);
        }
      });
      const topUniversitiesWithCounts = Array.from(universityStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Opportunity performance table data
      const opportunityPerformance = allOpportunities.map((o: any) => ({
        id: o.id,
        title: o.title,
        company: o.company,
        type: o.type,
        views: o.views || 0,
        clicks: o.clicks || 0,
        ctr: o.views > 0 ? Math.round((o.clicks / o.views) * 100) : 0,
        createdAt: o.createdAt,
      })).sort((a: any, b: any) => b.views - a.views);

      // Top mentors by activity
      const mentorActivity = new Map<string, any>();
      mentors.forEach((m: any) => {
        const mentorSessions = allSessions.filter((s: any) => s.mentorId === m.id);
        const mentorMentorships = allMentorships.filter((ms: any) => ms.mentorId === m.id);
        const mentorMessages = allMessages.filter((msg: any) => msg.senderId === m.id);
        
        mentorActivity.set(m.id, {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          email: m.email,
          company: m.company,
          sessions: mentorSessions.length,
          completedSessions: mentorSessions.filter((s: any) => s.status === 'completed').length,
          mentorships: mentorMentorships.length,
          messages: mentorMessages.length,
        });
      });
      const topMentors = Array.from(mentorActivity.values())
        .sort((a: any, b: any) => b.sessions - a.sessions)
        .slice(0, 20);

      // Top students by engagement
      const studentActivity = new Map<string, any>();
      students.forEach((s: any) => {
        const studentSessions = allSessions.filter((sess: any) => sess.studentId === s.id);
        const studentMentorships = allMentorships.filter((ms: any) => ms.studentId === s.id);
        const studentMessages = allMessages.filter((msg: any) => msg.senderId === s.id);
        const studentGoals = allGoals.filter((g: any) => g.userId === s.id);
        
        studentActivity.set(s.id, {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          university: s.university,
          sessions: studentSessions.length,
          mentorships: studentMentorships.length,
          messages: studentMessages.length,
          goalsCompleted: studentGoals.filter((g: any) => g.completed).length,
        });
      });
      const topStudents = Array.from(studentActivity.values())
        .sort((a: any, b: any) => b.sessions - a.sessions)
        .slice(0, 20);

      const stats = {
        users: {
          total: allUsers.length,
          students: students.length,
          mentors: mentors.length,
          admins: allUsers.filter((u: any) => u.role === 'admin').length,
          newLast30Days: newUsersLast30Days,
          countries: countries.size,
          universities: universities.size,
          companies: companies.size
        },
        mentorships: {
          total: allMentorships.length,
          active: activeMentorships.length,
          completed: allMentorships.filter((m: any) => m.status === 'completed').length,
          ended: allMentorships.filter((m: any) => m.status === 'ended').length
        },
        sessions: {
          total: allSessions.length,
          scheduled: allSessions.filter((s: any) => s.status === 'scheduled').length,
          completed: completedSessions.length,
          cancelled: allSessions.filter((s: any) => s.status === 'cancelled').length,
          avgDuration: avgSessionDuration,
          completionRate: sessionCompletionRate
        },
        opportunities: {
          total: allOpportunities.length,
          internships: allOpportunities.filter((o: any) => o.type === 'internships').length,
          jobs: allOpportunities.filter((o: any) => o.type === 'jobs').length,
          scholarships: allOpportunities.filter((o: any) => o.type === 'scholarships').length,
          totalViews: totalViews,
          totalClicks: totalClicks,
          clickThroughRate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0
        },
        requests: {
          total: allRequests.length,
          pending: pendingRequests.length,
          accepted: acceptedRequests,
          declined: allRequests.filter((r: any) => r.status === 'declined').length,
          acceptanceRate: mentorAcceptanceRate
        },
        goals: {
          total: allGoals.length,
          completed: totalGoalsCompleted,
          completionRate: allGoals.length > 0 ? Math.round((totalGoalsCompleted / allGoals.length) * 100) : 0
        },
        engagement: {
          totalMessages: totalMessagesCount,
          totalResources: totalResourcesShared,
          avgMessagesPerMentorship: activeMentorships.length > 0 
            ? Math.round(totalMessagesCount / activeMentorships.length) 
            : 0
        },
        geography: {
          topCountries: Array.from(countries).slice(0, 10),
          topUniversities: Array.from(universities).slice(0, 10),
          topCompanies: Array.from(companies).slice(0, 10)
        },
        charts: {
          monthlyData: monthlyData,
          topCountries: topCountriesWithCounts,
          topUniversities: topUniversitiesWithCounts,
          opportunityPerformance: opportunityPerformance,
          topMentors: topMentors,
          topStudents: topStudents
        }
      };

      return c.json({ success: true, stats });
    } catch (error: any) {
      console.log('Get admin stats error:', error);
      return c.json({ error: error.message || 'Failed to get admin stats' }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // ── USER MANAGEMENT ──
  // ══════════════════════════════════════════════════════════════════════════════

  // Get all users (admin only)
  app.get("/make-server-b8526fa6/admin/users", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const role = c.req.query('role');
      const search = c.req.query('search');

      let users = await kv.getByPrefix('user:');

      // Filter by role
      if (role && role !== 'all') {
        users = users.filter((u: any) => u.role === role);
      }

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter((u: any) =>
          u.firstName?.toLowerCase().includes(searchLower) ||
          u.lastName?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
        );
      }

      // Users already contain all profile data directly on the user object
      // No need to fetch separately - just return them
      return c.json({ success: true, users });
    } catch (error: any) {
      console.log('Get admin users error:', error);
      return c.json({ error: error.message || 'Failed to get users' }, 500);
    }
  });

  // Update user (admin only)
  app.put("/make-server-b8526fa6/admin/users/:userId", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const userId = c.req.param('userId');
      const body = await c.req.json();

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      const updatedUser = {
        ...user,
        ...body,
        id: userId, // Prevent ID change
        updatedAt: new Date().toISOString()
      };

      await kv.set(`user:${userId}`, updatedUser);

      return c.json({ success: true, user: updatedUser });
    } catch (error: any) {
      console.log('Update user error:', error);
      return c.json({ error: error.message || 'Failed to update user' }, 500);
    }
  });

  // Delete user (admin only)
  app.delete("/make-server-b8526fa6/admin/users/:userId", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const userId = c.req.param('userId');
      
      // Get the user to check if they're an admin
      const userToDelete = await kv.get(`user:${userId}`);
      
      if (userToDelete?.role === 'admin') {
        // Find the first admin (earliest created admin)
        const allUsers = await kv.getByPrefix('user:');
        const allAdmins = allUsers
          .filter((u: any) => u.role === 'admin')
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        // Check if this is the first admin
        if (allAdmins.length > 0 && allAdmins[0].id === userId) {
          return c.json({ 
            error: 'Cannot delete the primary admin account. This is a protected account to ensure platform access.' 
          }, 403);
        }
      }
      
      // Delete from Supabase Auth FIRST - this is critical
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.log('Error deleting from Supabase Auth:', authDeleteError);
        return c.json({ error: 'Failed to delete user from authentication system: ' + authDeleteError.message }, 500);
      }

      // Only delete from KV after Supabase Auth deletion succeeds
      await kv.del(`user:${userId}`);
      await kv.del(`profile:${userId}`);
      await kv.del(`settings:${userId}`);
      await kv.del(`sessions:${userId}`);
      
      // Delete user's mentorships
      const allMentorships = await kv.getByPrefix('mentorship:');
      const userMentorships = allMentorships.filter((m: any) => m.mentorId === userId || m.studentId === userId);
      for (const mentorship of userMentorships) {
        await kv.del(`mentorship:${mentorship.id}`);
      }
      
      // Delete user's sessions
      const allSessions = await kv.getByPrefix('session:');
      const userSessions = allSessions.filter((s: any) => s.mentorId === userId || s.studentId === userId);
      for (const session of userSessions) {
        await kv.del(`session:${session.id}`);
      }
      
      // Delete user's notifications
      const allNotifications = await kv.getByPrefix('notification:');
      const userNotifications = allNotifications.filter((n: any) => n.userId === userId);
      for (const notification of userNotifications) {
        await kv.del(`notification:${notification.id}`);
      }

      return c.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.log('Delete user error:', error);
      return c.json({ error: error.message || 'Failed to delete user' }, 500);
    }
  });

  // Create admin user (super admin only - for initial setup)
  app.post("/make-server-b8526fa6/admin/create-admin", async (c: any) => {
    try {
      // This endpoint should be protected with an API key in production
      const apiKey = c.req.header('X-Admin-Key');
      const expectedKey = Deno.env.get('ADMIN_API_KEY') || 'ispora-initial-setup-2026';
      
      if (apiKey !== expectedKey) {
        return c.json({ error: 'Invalid API key' }, 403);
      }

      const body = await c.req.json();
      const { email, password, firstName, lastName } = body;

      if (!email || !password || !firstName || !lastName) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // Check if admin already exists
      const allUsers = await kv.getByPrefix('user:');
      const existingAdmin = allUsers.find((u: any) => u.email === email);
      
      if (existingAdmin) {
        return c.json({ error: 'User with this email already exists' }, 400);
      }

      // Create admin user with Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { 
          firstName,
          lastName,
          role: 'admin',
          name: `${firstName} ${lastName}`,
        },
        email_confirm: true
      });

      if (error) {
        console.log('Create admin error:', error);
        return c.json({ error: error.message }, 400);
      }

      const userId = data.user!.id;

      // Create user record in KV store
      const userRecord = {
        id: userId,
        email,
        firstName,
        lastName,
        role: 'admin',
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`user:${userId}`, userRecord);

      console.log('✓ Admin user created successfully:', email);

      return c.json({ 
        success: true, 
        message: 'Admin user created successfully',
        user: { id: userId, email, firstName, lastName, role: 'admin' }
      });
    } catch (error: any) {
      console.log('Create admin user error:', error);
      return c.json({ error: error.message || 'Failed to create admin user' }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // ── OPPORTUNITY MANAGEMENT ──
  // ══════════════════════════════════════════════════════════════════════════════

  // Admin post opportunity (allows admin to post opportunities)
  app.post("/make-server-b8526fa6/admin/opportunities", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { user } = auth;
      const body = await c.req.json();

      const opportunityId = generateId('opp');
      const opportunity = {
        id: opportunityId,
        ...body,
        postedBy: user.id,
        postedByAdmin: true, // Flag to indicate admin post
        status: 'active',
        createdAt: new Date().toISOString(),
        bookmarkedBy: [],
      };

      await kv.set(`opportunity:${opportunityId}`, opportunity);
      console.log('✓ Admin created opportunity:', opportunityId);

      return c.json({ success: true, opportunity });
    } catch (error: any) {
      console.log('Admin create opportunity error:', error);
      return c.json({ error: error.message || 'Failed to create opportunity' }, 500);
    }
  });

  // Admin update opportunity
  app.put("/make-server-b8526fa6/admin/opportunities/:opportunityId", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const opportunityId = c.req.param('opportunityId');
      const body = await c.req.json();

      const opportunity = await kv.get(`opportunity:${opportunityId}`);
      if (!opportunity) {
        return c.json({ error: 'Opportunity not found' }, 404);
      }

      const updatedOpportunity = {
        ...opportunity,
        ...body,
        id: opportunityId,
        updatedAt: new Date().toISOString()
      };

      await kv.set(`opportunity:${opportunityId}`, updatedOpportunity);
      console.log('✓ Admin updated opportunity:', opportunityId);

      return c.json({ success: true, opportunity: updatedOpportunity });
    } catch (error: any) {
      console.log('Admin update opportunity error:', error);
      return c.json({ error: error.message || 'Failed to update opportunity' }, 500);
    }
  });

  // Admin delete opportunity
  app.delete("/make-server-b8526fa6/admin/opportunities/:opportunityId", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const opportunityId = c.req.param('opportunityId');
      const opportunity = await kv.get(`opportunity:${opportunityId}`);

      if (!opportunity) {
        return c.json({ error: 'Opportunity not found' }, 404);
      }

      await kv.del(`opportunity:${opportunityId}`);
      console.log('✓ Admin deleted opportunity:', opportunityId);

      return c.json({ success: true, message: 'Opportunity deleted successfully' });
    } catch (error: any) {
      console.log('Admin delete opportunity error:', error);
      return c.json({ error: error.message || 'Failed to delete opportunity' }, 500);
    }
  });

  // Get all opportunities (admin only - includes inactive)
  app.get("/make-server-b8526fa6/admin/all-opportunities", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const opportunities = await kv.getByPrefix('opportunity:');

      // Enrich with poster data
      const opportunitiesWithPosters = await Promise.all(
        opportunities.map(async (opp: any) => {
          const poster = await kv.get(`user:${opp.postedBy}`);
          return {
            ...opp,
            poster: poster ? {
              id: poster.id,
              firstName: poster.firstName,
              lastName: poster.lastName,
              role: poster.role
            } : null,
            postedByName: poster ? `${poster.firstName} ${poster.lastName}` : (opp.postedByAdmin ? 'Ispora Team' : null),
            postedByRole: poster ? (poster.role === 'diaspora' ? 'Mentor' : poster.role === 'student' ? 'Student' : poster.role === 'admin' ? 'Admin' : 'Member') : (opp.postedByAdmin ? 'Platform Admin' : null),
          };
        })
      );

      return c.json({ success: true, opportunities: opportunitiesWithPosters });
    } catch (error: any) {
      console.log('Get admin opportunities error:', error);
      return c.json({ error: error.message || 'Failed to get opportunities' }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DATA MANAGEMENT ──
  // ══════════════════════════════════════════════════════════════════════════════

  // Get all mentorships (admin only)
  app.get("/make-server-b8526fa6/admin/mentorships", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const status = c.req.query('status');
      let mentorships = await kv.getByPrefix('mentorship:');

      if (status && status !== 'all') {
        mentorships = mentorships.filter((m: any) => m.status === status);
      }

      // Enrich with user data
      const mentorshipsWithUsers = await Promise.all(
        mentorships.map(async (m: any) => {
          const mentor = await kv.get(`user:${m.mentorId}`);
          const student = await kv.get(`user:${m.studentId}`);
          return {
            ...m,
            mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName, email: mentor.email } : null,
            student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, email: student.email } : null
          };
        })
      );

      return c.json({ success: true, mentorships: mentorshipsWithUsers });
    } catch (error: any) {
      console.log('Get admin mentorships error:', error);
      return c.json({ error: error.message || 'Failed to get mentorships' }, 500);
    }
  });

  // Get all sessions (admin only)
  app.get("/make-server-b8526fa6/admin/sessions", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const status = c.req.query('status');
      let sessions = await kv.getByPrefix('session:');

      if (status && status !== 'all') {
        sessions = sessions.filter((s: any) => s.status === status);
      }

      // Enrich with user data
      const sessionsWithUsers = await Promise.all(
        sessions.map(async (s: any) => {
          const mentor = await kv.get(`user:${s.mentorId}`);
          const student = await kv.get(`user:${s.studentId}`);
          return {
            ...s,
            mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName, email: mentor.email } : null,
            student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, email: student.email } : null
          };
        })
      );

      // Sort by scheduled date
      sessionsWithUsers.sort((a: any, b: any) => 
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      return c.json({ success: true, sessions: sessionsWithUsers });
    } catch (error: any) {
      console.log('Get admin sessions error:', error);
      return c.json({ error: error.message || 'Failed to get sessions' }, 500);
    }
  });

  // Get all requests (admin only)
  app.get("/make-server-b8526fa6/admin/requests", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const status = c.req.query('status');
      let requests = await kv.getByPrefix('request:');

      if (status && status !== 'all') {
        requests = requests.filter((r: any) => r.status === status);
      }

      // Enrich with user data
      const requestsWithUsers = await Promise.all(
        requests.map(async (r: any) => {
          const mentor = await kv.get(`user:${r.mentorId}`);
          const student = await kv.get(`user:${r.studentId}`);
          return {
            ...r,
            mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName } : null,
            student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName } : null
          };
        })
      );

      return c.json({ success: true, requests: requestsWithUsers });
    } catch (error: any) {
      console.log('Get admin requests error:', error);
      return c.json({ error: error.message || 'Failed to get requests' }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DONATION LINKS MANAGEMENT ──
  // ══════════════════════════════════════════════════════════════════════════════

  // Get donation links (public - no auth required)
  app.get("/make-server-b8526fa6/donation-links", async (c: any) => {
    try {
      const links = await kv.get('settings:donation-links') || {
        creditCard: { url: '', active: false },
        paypal: { url: '', active: false },
        bankTransfer: { url: '', active: false }
      };
      return c.json({ success: true, links });
    } catch (error: any) {
      console.log('Get donation links error:', error);
      return c.json({ error: error.message || 'Failed to get donation links' }, 500);
    }
  });

  // Update donation links (admin only)
  app.put("/make-server-b8526fa6/admin/donation-links", async (c: any) => {
    try {
      const auth = await authenticateAdmin(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { creditCard, paypal, bankTransfer } = await c.req.json();

      const links = {
        creditCard: {
          url: creditCard?.url || '',
          active: creditCard?.active || false
        },
        paypal: {
          url: paypal?.url || '',
          active: paypal?.active || false
        },
        bankTransfer: {
          url: bankTransfer?.url || '',
          active: bankTransfer?.active || false
        },
        updatedAt: new Date().toISOString(),
        updatedBy: auth.userId
      };

      await kv.set('settings:donation-links', links);
      console.log('✓ Admin updated donation links');

      return c.json({ success: true, links });
    } catch (error: any) {
      console.log('Update donation links error:', error);
      return c.json({ error: error.message || 'Failed to update donation links' }, 500);
    }
  });

  console.log('✓ Admin routes initialized');
}