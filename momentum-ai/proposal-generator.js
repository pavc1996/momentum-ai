const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PROPOSALS_DIR = path.join(__dirname, 'proposals');
if (!fs.existsSync(PROPOSALS_DIR)) fs.mkdirSync(PROPOSALS_DIR);

const PACKAGES = {
  'Starter': {
    price: 299,
    features: [
      'Professional website (5 pages)',
      'Mobile responsive design',
      'Basic SEO setup',
      'Contact form + lead capture',
      'Google Analytics integration',
      '1 revision round per month'
    ]
  },
  'Growth': {
    price: 699,
    features: [
      'Everything in Starter',
      'AI chatbot for your website',
      'Email automation (welcome + follow-up sequences)',
      'Monthly SEO content (4 blog posts)',
      'Google Business Profile optimization',
      'Monthly performance report',
      '3 revision rounds per month'
    ]
  },
  'Scale': {
    price: 1499,
    features: [
      'Everything in Growth',
      'Full business automation suite',
      'Custom AI tools built for your workflow',
      'Social media content (12 posts/month)',
      'Competitor monitoring & strategy',
      'Dedicated account manager',
      'Unlimited revisions',
      'Priority support (response within 2h)'
    ]
  }
};

async function generateProposal({ name, business, service, email, package: pkg }) {
  const pkgName = pkg || 'Growth';
  const pkgData = PACKAGES[pkgName] || PACKAGES['Growth'];
  const date = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const slug = `${(business || name).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}`;
  const outputPath = path.join(PROPOSALS_DIR, `${slug}.pdf`);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: white; }
  .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 48px; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
  .logo span { opacity: 0.7; }
  .tagline { font-size: 13px; opacity: 0.8; letter-spacing: 0.05em; text-transform: uppercase; }
  .hero-label { font-size: 12px; opacity: 0.7; margin-top: 32px; text-transform: uppercase; letter-spacing: 0.1em; }
  .hero-title { font-size: 36px; font-weight: 700; margin-top: 8px; line-height: 1.2; }
  .hero-sub { font-size: 14px; opacity: 0.85; margin-top: 12px; }
  .content { padding: 48px; }
  .section { margin-bottom: 40px; }
  .section h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #7c3aed; margin-bottom: 16px; border-bottom: 2px solid #ede9fe; padding-bottom: 8px; }
  .intro { font-size: 15px; line-height: 1.7; color: #374151; }
  .package-box { background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 12px; padding: 28px; }
  .package-name { font-size: 22px; font-weight: 800; color: #7c3aed; }
  .package-price { font-size: 36px; font-weight: 900; color: #1a1a2e; margin: 8px 0 4px; }
  .package-price span { font-size: 16px; font-weight: 400; color: #6b7280; }
  .features { list-style: none; margin-top: 20px; }
  .features li { padding: 8px 0; font-size: 14px; color: #374151; display: flex; align-items: flex-start; gap: 10px; border-bottom: 1px solid #ede9fe; }
  .features li:last-child { border-bottom: none; }
  .check { color: #7c3aed; font-weight: 700; flex-shrink: 0; }
  .timeline { display: flex; gap: 0; }
  .timeline-step { flex: 1; padding: 20px 16px; text-align: center; background: #f9fafb; border-right: 1px solid #e5e7eb; }
  .timeline-step:last-child { border-right: none; }
  .step-num { width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; margin: 0 auto 10px; }
  .step-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .step-desc { font-size: 11px; color: #6b7280; }
  .cta-box { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border-radius: 12px; padding: 32px; text-align: center; }
  .cta-box h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .cta-box p { font-size: 14px; opacity: 0.85; margin-bottom: 20px; }
  .cta-email { background: white; color: #7c3aed; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; }
  .footer { padding: 24px 48px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af; }
  .meta-row { display: flex; gap: 32px; margin-bottom: 24px; }
  .meta-item { flex: 1; }
  .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 4px; }
  .meta-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">Momentum<span>AI</span></div>
  <div class="tagline">We Build The Tools. You Make The Money.</div>
  <div class="hero-label">Custom Growth Proposal For</div>
  <div class="hero-title">${business || name}</div>
  <div class="hero-sub">Prepared exclusively for ${name} · ${date}</div>
</div>

<div class="content">

  <div class="section">
    <div class="meta-row">
      <div class="meta-item"><div class="meta-label">Prepared For</div><div class="meta-value">${name}</div></div>
      <div class="meta-item"><div class="meta-label">Business</div><div class="meta-value">${business || '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Interested In</div><div class="meta-value">${service || 'Full Growth Package'}</div></div>
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${date}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Why Momentum AI</h2>
    <p class="intro">
      We help small and medium businesses compete with the big players — using AI-powered websites, automation, and marketing that actually drives revenue. No jargon, no fluff. Just real tools that save you time and grow your bottom line.<br><br>
      This proposal outlines a custom package designed for ${business || 'your business'}, based on your goals and where you are today.
    </p>
  </div>

  <div class="section">
    <h2>Recommended Package</h2>
    <div class="package-box">
      <div class="package-name">${pkgName} Plan</div>
      <div class="package-price">$${pkgData.price.toLocaleString()}<span>/month</span></div>
      <ul class="features">
        ${pkgData.features.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>How We Work Together</h2>
    <div class="timeline">
      <div class="timeline-step">
        <div class="step-num">1</div>
        <div class="step-title">Discovery Call</div>
        <div class="step-desc">30-min strategy session to understand your goals</div>
      </div>
      <div class="timeline-step">
        <div class="step-num">2</div>
        <div class="step-title">Build & Setup</div>
        <div class="step-desc">We build your tools in the first 2 weeks</div>
      </div>
      <div class="timeline-step">
        <div class="step-num">3</div>
        <div class="step-title">Launch</div>
        <div class="step-desc">Go live, review performance together</div>
      </div>
      <div class="timeline-step">
        <div class="step-num">4</div>
        <div class="step-title">Grow</div>
        <div class="step-desc">Monthly optimization and reporting</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Next Step</h2>
    <div class="cta-box">
      <h3>Ready to move forward?</h3>
      <p>Reply to this proposal or book your free 30-minute strategy call. No pressure — just a conversation about your growth.</p>
      <div class="cta-email">hello@momentum-ai.ca</div>
    </div>
  </div>

</div>

<div class="footer">
  <span>© 2026 Momentum AI · hello@momentum-ai.ca</span>
  <span>Confidential — prepared for ${name} only</span>
</div>

</body>
</html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();

  return outputPath;
}

module.exports = { generateProposal, PACKAGES };
