// WhatsApp Notification Service using Twilio
// Handles all notification triggers and scheduling

interface NotificationPayload {
  to: string; // Phone number with country code (e.g., +2348012345678)
  message: string;
  link?: string;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

interface NotificationPreferences {
  whatsappEnabled: boolean;
  sessionReminders: boolean;
  newRequests: boolean;
  newMessages: boolean;
  opportunities: boolean;
  sessionUpdates: boolean;
}

// Send WhatsApp notification via Twilio
export async function sendWhatsAppNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER'); // e.g., whatsapp:+14155238886

  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
    console.log('⚠️  Twilio credentials not configured. Skipping WhatsApp notification.');
    return { success: false, error: 'Twilio credentials not configured' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', twilioWhatsAppNumber);
    formData.append('To', `whatsapp:${payload.to}`);
    formData.append('Body', payload.message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Twilio API error:', errorText);
      return { success: false, error: `Twilio API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('✓ WhatsApp notification sent successfully:', data.sid);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send WhatsApp notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Get user notification preferences
export async function getUserNotificationPreferences(userId: string, kvGet: any): Promise<NotificationPreferences> {
  const settings = await kvGet(`settings:${userId}`);
  
  return {
    whatsappEnabled: settings?.notifications?.whatsapp ?? true,
    sessionReminders: settings?.notifications?.sessionReminders ?? true,
    newRequests: settings?.notifications?.newRequests ?? true,
    newMessages: settings?.notifications?.newMessages ?? true,
    opportunities: settings?.notifications?.opportunities ?? true,
    sessionUpdates: settings?.notifications?.sessionUpdates ?? true,
  };
}

// Check if user should receive this type of notification
export async function shouldSendNotification(
  userId: string, 
  notificationType: keyof Omit<NotificationPreferences, 'whatsappEnabled'>,
  kvGet: any
): Promise<boolean> {
  const prefs = await getUserNotificationPreferences(userId, kvGet);
  
  if (!prefs.whatsappEnabled) {
    return false;
  }
  
  return prefs[notificationType] === true;
}

// Send push notification to user's devices
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload,
  kvGetByPrefix: any
): Promise<void> {
  try {
    // Get all push subscriptions for this user
    const allSubscriptions = await kvGetByPrefix('push_subscription:') || [];
    const userSubscriptions = allSubscriptions.filter((s: any) => s.userId === userId);
    
    if (userSubscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return;
    }
    
    // Import webPush dynamically to avoid circular dependencies
    const webPush = await import('./webPush.tsx');
    
    // Send push notification to all user's devices
    const result = await webPush.broadcastPushNotification(
      userSubscriptions.map((s: any) => ({
        endpoint: s.endpoint,
        keys: s.keys
      })),
      payload
    );
    
    console.log(`Push notification sent to user ${userId}: ${result.success} success, ${result.failed} failed`);
    
    // Clean up expired subscriptions
    if (result.expiredSubscriptions.length > 0) {
      console.log(`Cleaning up ${result.expiredSubscriptions.length} expired subscriptions`);
      for (const endpoint of result.expiredSubscriptions) {
        // The cleanup will be handled by the caller if they pass kv.del
      }
    }
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message);
  }
}

// Send session reminder notification
export async function sendSessionReminder(session: any, user: any, kvGet: any, timeUntil: string) {
  const prefs = await getUserNotificationPreferences(user.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.sessionReminders || !user.phoneNumber) {
    return;
  }

  const otherParticipant = session.mentorId === user.id ? session.studentName : session.mentorName;
  const message = `🎓 Ispora Reminder: Your mentorship session with ${otherParticipant} is starting in ${timeUntil}!\n\nDate: ${new Date(session.date).toLocaleDateString()}\nTime: ${session.time}\nType: ${session.type}\n\nJoin session: https://ispora.com/sessions/${session.id}`;

  await sendWhatsAppNotification({
    to: user.phoneNumber,
    message,
    link: `https://ispora.com/sessions/${session.id}`,
  });
}

// Send new mentorship request notification
export async function sendMentorshipRequestNotification(mentorship: any, mentor: any, student: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(mentor.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.newRequests || !mentor.phoneNumber) {
    return;
  }

  const message = `🎓 New Mentorship Request on Ispora!\n\n${student.firstName} ${student.lastName} has requested you as a mentor.\n\nMessage: "${mentorship.message}"\n\nView request: https://ispora.com/mentorships/${mentorship.id}`;

  await sendWhatsAppNotification({
    to: mentor.phoneNumber,
    message,
    link: `https://ispora.com/mentorships/${mentorship.id}`,
  });
}

// Send mentorship request accepted notification
export async function sendMentorshipAcceptedNotification(mentorship: any, mentor: any, student: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(student.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.newRequests || !student.phoneNumber) {
    return;
  }

  const message = `🎉 Great news! ${mentor.firstName} ${mentor.lastName} accepted your mentorship request on Ispora!\n\nStart messaging your mentor and schedule your first session.\n\nView mentorship: https://ispora.com/mentorships/${mentorship.id}`;

  await sendWhatsAppNotification({
    to: student.phoneNumber,
    message,
    link: `https://ispora.com/mentorships/${mentorship.id}`,
  });
}

// Send new message notification
export async function sendNewMessageNotification(message: any, sender: any, receiver: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(receiver.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.newMessages || !receiver.phoneNumber) {
    return;
  }

  const messagePreview = message.content.length > 100 
    ? message.content.substring(0, 100) + '...' 
    : message.content;

  const msg = `💬 New message from ${sender.firstName} ${sender.lastName} on Ispora:\n\n"${messagePreview}"\n\nReply: https://ispora.com/messages?mentorship=${message.mentorshipId}`;

  await sendWhatsAppNotification({
    to: receiver.phoneNumber,
    message: msg,
    link: `https://ispora.com/messages?mentorship=${message.mentorshipId}`,
  });
}

// Send new opportunity notification
export async function sendOpportunityNotification(opportunity: any, user: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(user.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.opportunities || !user.phoneNumber) {
    return;
  }

  const message = `🌟 New Opportunity on Ispora!\n\n${opportunity.title}\nType: ${opportunity.type}\nDeadline: ${new Date(opportunity.deadline).toLocaleDateString()}\n\nView details: https://ispora.com/opportunities/${opportunity.id}`;

  await sendWhatsAppNotification({
    to: user.phoneNumber,
    message,
    link: `https://ispora.com/opportunities/${opportunity.id}`,
  });
}

// Send session scheduled notification
export async function sendSessionScheduledNotification(session: any, creator: any, participant: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(participant.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.sessionUpdates || !participant.phoneNumber) {
    return;
  }

  const message = `📅 Session Scheduled on Ispora!\n\n${creator.firstName} ${creator.lastName} scheduled a session with you.\n\nDate: ${new Date(session.date).toLocaleDateString()}\nTime: ${session.time}\nType: ${session.type}\n\nView session: https://ispora.com/sessions/${session.id}`;

  await sendWhatsAppNotification({
    to: participant.phoneNumber,
    message,
    link: `https://ispora.com/sessions/${session.id}`,
  });
}

// Send session cancelled notification
export async function sendSessionCancelledNotification(session: any, cancelledBy: any, participant: any, kvGet: any) {
  const prefs = await getUserNotificationPreferences(participant.id, kvGet);
  
  if (!prefs.whatsappEnabled || !prefs.sessionUpdates || !participant.phoneNumber) {
    return;
  }

  const message = `❌ Session Cancelled on Ispora\n\n${cancelledBy.firstName} ${cancelledBy.lastName} cancelled the session scheduled for ${new Date(session.date).toLocaleDateString()} at ${session.time}.\n\n${session.reason ? `Reason: ${session.reason}\n\n` : ''}View details: https://ispora.com/sessions/${session.id}`;

  await sendWhatsAppNotification({
    to: participant.phoneNumber,
    message,
    link: `https://ispora.com/sessions/${session.id}`,
  });
}

// Check and send upcoming session reminders (called by cron or periodic check)
export async function checkAndSendSessionReminders(kvGetByPrefix: any, kvGet: any) {
  console.log('🔔 Checking for upcoming sessions to send reminders...');
  
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  const allSessions = await kvGetByPrefix('session:');
  
  for (const session of allSessions) {
    if (session.status !== 'scheduled') continue;
    
    const sessionDate = new Date(session.date);
    
    // Check if we should send 24-hour reminder
    const timeDiff = sessionDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 23 && hoursDiff < 25 && !session.reminder24hSent) {
      // Send 24-hour reminder
      const mentor = await kvGet(`user:${session.mentorId}`);
      const student = await kvGet(`user:${session.studentId}`);
      
      if (mentor && student) {
        await sendSessionReminder(
          { ...session, mentorName: `${mentor.firstName} ${mentor.lastName}`, studentName: `${student.firstName} ${student.lastName}` },
          mentor,
          kvGet,
          '24 hours'
        );
        await sendSessionReminder(
          { ...session, mentorName: `${mentor.firstName} ${mentor.lastName}`, studentName: `${student.firstName} ${student.lastName}` },
          student,
          kvGet,
          '24 hours'
        );
        
        // Mark as sent
        session.reminder24hSent = true;
        await kvGet.set(`session:${session.id}`, session);
      }
    }
    
    if (hoursDiff > 0.5 && hoursDiff < 1.5 && !session.reminder1hSent) {
      // Send 1-hour reminder
      const mentor = await kvGet(`user:${session.mentorId}`);
      const student = await kvGet(`user:${session.studentId}`);
      
      if (mentor && student) {
        await sendSessionReminder(
          { ...session, mentorName: `${mentor.firstName} ${mentor.lastName}`, studentName: `${student.firstName} ${student.lastName}` },
          mentor,
          kvGet,
          '1 hour'
        );
        await sendSessionReminder(
          { ...session, mentorName: `${mentor.firstName} ${mentor.lastName}`, studentName: `${student.firstName} ${student.lastName}` },
          student,
          kvGet,
          '1 hour'
        );
        
        // Mark as sent
        session.reminder1hSent = true;
        await kvGet.set(`session:${session.id}`, session);
      }
    }
  }
  
  console.log('✓ Session reminder check complete');
}
