// api/daily-digest.js — Vercel Cron Job (runs daily at 8am UTC)
// Add to vercel.json: { "crons": [{ "path": "/api/daily-digest", "schedule": "0 8 * * *" }] }

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron (or allow manual trigger)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // ── Gather stats ──
  const [
    { count: newUsers },
    { count: newRooms },
    { data: swipesToday },
    { data: feedbackToday },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('swipes').select('user_id, direction').gte('created_at', todayISO),
    supabase.from('feedback').select('user_name, message, created_at').gte('created_at', todayISO).order('created_at', { ascending: false }),
  ]);

  const totalSwipes  = swipesToday?.length || 0;
  const totalMatches = swipesToday?.filter(s => s.direction === 'like').length || 0;

  // Top user by swipe count today
  const swipesByUser = {};
  (swipesToday || []).forEach(s => {
    swipesByUser[s.user_id] = (swipesByUser[s.user_id] || 0) + 1;
  });
  const topUserId = Object.entries(swipesByUser).sort((a,b)=>b[1]-a[1])[0];
  let topUserName = 'N/A';
  if (topUserId) {
    const { data: topProfile } = await supabase.from('profiles').select('name').eq('id', topUserId[0]).single();
    topUserName = topProfile ? `${topProfile.name} (${topUserId[1]} swipes)` : `${topUserId[1]} swipes`;
  }

  // ── Build email HTML ──
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const feedbackHTML = feedbackToday?.length
    ? feedbackToday.map(f => `
        <div style="background:#f9f9f9;border-left:4px solid #f97316;padding:12px 16px;margin-bottom:12px;border-radius:4px">
          <div style="font-weight:600;color:#333;margin-bottom:4px">${f.user_name}</div>
          <div style="color:#555;line-height:1.6">${f.message}</div>
          <div style="color:#999;font-size:12px;margin-top:6px">${new Date(f.created_at).toLocaleTimeString()}</div>
        </div>`).join('')
    : '<p style="color:#999;font-style:italic">No feedback submitted today.</p>';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#f97316,#ec4899);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">🍿 DuoFlix Daily Digest</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">${dateStr}</p>
      </div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
        <h2 style="color:#f97316;border-bottom:2px solid #f97316;padding-bottom:8px">📊 Today's Stats</h2>
        <table style="width:100%;border-collapse:collapse">
          ${[
            ['👤 New Users', newUsers || 0],
            ['🏠 New Rooms Created', newRooms || 0],
            ['👆 Total Swipes', totalSwipes],
            ['❤️ Total Matches', totalMatches],
            ['🏆 Top User (most swipes)', topUserName],
          ].map(([label, val], i) => `
            <tr style="background:${i%2===0?'#f9f9f9':'white'}">
              <td style="padding:10px 12px;font-weight:600">${label}</td>
              <td style="padding:10px 12px;text-align:right;color:#f97316;font-weight:700">${val}</td>
            </tr>`).join('')}
        </table>
        <h2 style="color:#f97316;border-bottom:2px solid #f97316;padding-bottom:8px;margin-top:28px">💬 User Feedback (${feedbackToday?.length || 0})</h2>
        ${feedbackHTML}
        <p style="color:#ccc;font-size:11px;text-align:center;margin-top:24px">DuoFlix Daily Digest · Sent automatically every day at 8am UTC</p>
      </div>
    </div>`;

  // ── Send via Resend ──
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'DuoFlix Digest <onboarding@resend.dev>',
      to: ['adlavelle134@gmail.com'],
      subject: `🍿 DuoFlix Daily Digest — ${dateStr}`,
      html,
    }),
  });

  const result = await emailRes.json();
  console.log('Resend result:', result);
  res.status(200).json({ ok: true, stats: { newUsers, newRooms, totalSwipes, totalMatches }, feedbackCount: feedbackToday?.length });
}
