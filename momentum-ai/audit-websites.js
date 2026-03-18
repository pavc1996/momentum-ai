const Database = require('better-sqlite3');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

const db = new Database(path.join(__dirname, 'leads.db'));

// Ensure audit columns exist
try { db.exec('ALTER TABLE outreach ADD COLUMN website_score TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE outreach ADD COLUMN website_issues TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE outreach ADD COLUMN audit_done INTEGER DEFAULT 0'); } catch(e) {}

const BATCH_SIZE = parseInt(process.env.BATCH || '20');
const OFFSET = parseInt(process.env.OFFSET || '0');
const leads = db.prepare("SELECT id, business_name, website, city, industry FROM outreach WHERE website != '' AND website IS NOT NULL AND (audit_done IS NULL OR audit_done = 0) LIMIT ? OFFSET ?").all(BATCH_SIZE, OFFSET);

console.log(`\nAuditing ${leads.length} websites...\n`);

function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  try { new URL(url); return url; } catch(e) { return null; }
}

function fetchUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const timer = setTimeout(() => resolve({ error: 'timeout', html: '', status: 0, time: timeout }), timeout);
    const start = Date.now();
    try {
      const req = mod.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditBot/1.0)' },
        timeout: timeout,
        rejectUnauthorized: false,
      }, (res) => {
        clearTimeout(timer);
        let html = '';
        res.on('data', (chunk) => { html += chunk; if (html.length > 80000) res.destroy(); });
        res.on('end', () => resolve({ html, status: res.statusCode, time: Date.now() - start, url: res.headers.location || url, ssl: parsed.protocol === 'https:' }));
        res.on('error', () => resolve({ error: 'stream error', html, status: res.statusCode, time: Date.now() - start }));
      });
      req.on('error', (e) => { clearTimeout(timer); resolve({ error: e.message, html: '', status: 0, time: Date.now() - start }); });
      req.on('timeout', () => { clearTimeout(timer); req.destroy(); resolve({ error: 'timeout', html: '', status: 0, time: Date.now() - start }); });
    } catch(e) {
      clearTimeout(timer);
      resolve({ error: e.message, html: '', status: 0, time: 0 });
    }
  });
}

function analyzeHtml(html, url, fetchTime, ssl) {
  const issues = [];
  const h = html.toLowerCase();

  // Mobile responsive
  const hasMeta = h.includes('viewport');
  if (!hasMeta) issues.push('No mobile viewport (not mobile-friendly)');

  // Has contact form
  const hasForm = h.includes('<form') || h.includes('contact') || h.includes('book') || h.includes('reservation');
  if (!hasForm) issues.push('No contact form or booking');

  // Has chatbot
  const hasChatbot = h.includes('intercom') || h.includes('tawk') || h.includes('crisp') || h.includes('zendesk') || h.includes('drift') || h.includes('chat') || h.includes('tidio');

  // Speed proxy
  if (fetchTime > 5000) issues.push(`Slow load (${(fetchTime/1000).toFixed(1)}s)`);
  else if (fetchTime > 3000) issues.push(`Moderate load time (${(fetchTime/1000).toFixed(1)}s)`);

  // SSL
  if (!ssl) issues.push('No SSL/HTTPS');

  // Outdated tech signals
  if (h.includes('jquery-1.') || h.includes('jquery/1.')) issues.push('Outdated jQuery');
  if (h.includes('bootstrap-3') || h.includes('bootstrap/3')) issues.push('Outdated Bootstrap 3');
  if (h.includes('wp-content') || h.includes('wordpress')) {
    if (!h.includes('wp-rocket') && !h.includes('elementor') && !h.includes('divi')) {
      issues.push('WordPress (likely outdated/unoptimized)');
    }
  }

  // No analytics
  const hasAnalytics = h.includes('google-analytics') || h.includes('gtag') || h.includes('ga(') || h.includes('analytics.js') || h.includes('plausible') || h.includes('_ga');
  if (!hasAnalytics) issues.push('No analytics tracking');

  // Social links missing
  const hasSocial = h.includes('instagram') || h.includes('facebook') || h.includes('tiktok');
  if (!hasSocial) issues.push('No social media links');

  // SEO basics
  const hasTitle = h.includes('<title');
  const hasDesc = h.includes('meta name="description"') || h.includes("meta name='description'");
  if (!hasTitle) issues.push('Missing page title');
  if (!hasDesc) issues.push('No meta description (bad SEO)');

  // Score
  let score = 100;
  score -= issues.length * 12;
  if (hasChatbot) score += 5;
  score = Math.max(5, Math.min(100, score));

  let rating;
  if (score >= 75) rating = 'GOOD';
  else if (score >= 50) rating = 'AVERAGE';
  else if (score >= 25) rating = 'WEAK';
  else rating = 'TERRIBLE';

  return { score, rating, issues, hasChatbot, hasMobile: hasMeta, hasForm, hasAnalytics };
}

async function auditBatch(leads) {
  const results = [];
  for (const lead of leads) {
    const url = normalizeUrl(lead.website);
    if (!url) {
      console.log(`  ⚠️  [${lead.id}] ${lead.business_name} — invalid URL: ${lead.website}`);
      db.prepare('UPDATE outreach SET website_score=?, website_issues=?, audit_done=1 WHERE id=?').run('INVALID', 'URL could not be parsed', lead.id);
      continue;
    }

    try {
      const result = await fetchUrl(url);
      if (result.error || result.status === 0) {
        console.log(`  ❌ [${lead.id}] ${lead.business_name} — ${result.error || 'no response'}`);
        db.prepare('UPDATE outreach SET website_score=?, website_issues=?, audit_done=1 WHERE id=?').run('UNREACHABLE', result.error || 'Site unreachable', lead.id);
        results.push({ ...lead, rating: 'UNREACHABLE', issues: [result.error] });
        continue;
      }

      const analysis = analyzeHtml(result.html, url, result.time, result.ssl !== false);
      const issueStr = analysis.issues.join(' | ');

      db.prepare('UPDATE outreach SET website_score=?, website_issues=?, audit_done=1, notes=? WHERE id=?')
        .run(analysis.rating, issueStr, `[AUDIT ${analysis.rating}] ${issueStr}`, lead.id);

      const icon = analysis.rating === 'TERRIBLE' || analysis.rating === 'WEAK' ? '🎯' : analysis.rating === 'AVERAGE' ? '📊' : '✅';
      console.log(`  ${icon} [${lead.id}] ${lead.business_name} (${lead.city}) — ${analysis.rating} (${analysis.score}/100)`);
      if (analysis.issues.length) console.log(`       Issues: ${analysis.issues.slice(0,3).join(', ')}`);

      results.push({ ...lead, ...analysis });
    } catch(e) {
      console.log(`  ❌ [${lead.id}] ${lead.business_name} — error: ${e.message}`);
      db.prepare('UPDATE outreach SET website_score=?, website_issues=?, audit_done=1 WHERE id=?').run('ERROR', e.message, lead.id);
    }

    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

async function main() {
  const results = await auditBatch(leads);

  // Summary
  const done = db.prepare("SELECT website_score, COUNT(*) as c FROM outreach WHERE audit_done=1 GROUP BY website_score ORDER BY c DESC").all();
  console.log('\n========= AUDIT COMPLETE =========');
  done.forEach(r => console.log(`  ${r.website_score}: ${r.c}`));

  const hotLeads = db.prepare("SELECT business_name, city, industry, website, website_issues FROM outreach WHERE website_score IN ('WEAK','TERRIBLE') ORDER BY industry").all();
  console.log(`\n🎯 HOT PROSPECTS (Weak/Terrible websites): ${hotLeads.length}`);
  hotLeads.forEach(l => console.log(`  ${l.business_name} | ${l.city} | ${l.industry}`));

  console.log('\nDone. Check CRM at http://localhost:8080/crm.html');
}

main().catch(console.error);
