// Canadian-specific financial tips engine
// Returns personalized tips based on user's financial profile

function generateTips(summary) {
  const tips = [];
  const { monthlyNetIncome, monthlyExpenses, monthlySurplus, totalSavings, totalDebt, netWorth, taxInfo, debtToIncomeRatio, goals, profile } = summary;

  const annualNet = monthlyNetIncome * 12;
  const annualGross = taxInfo?.grossAnnual || 0;
  const province = profile?.province || 'ON';

  // Emergency fund
  const emergencyGoal = goals?.find(g => g.type === 'emergency_fund');
  const emergencyTarget = monthlyExpenses * 3;
  if (!emergencyGoal || emergencyGoal.current_amount < emergencyTarget) {
    tips.push({
      priority: 'high',
      category: 'emergency',
      title: '🛡️ Build Your Emergency Fund First',
      body: `You should have 3–6 months of expenses ($${Math.round(emergencyTarget).toLocaleString()}–$${Math.round(emergencyTarget*2).toLocaleString()}) in a liquid account before aggressively investing. Keep it in a HISA (High-Interest Savings Account) — EQ Bank, Oaken, or Wealthsimple Cash typically offer 4–5% in Canada.`,
      action: 'Add an Emergency Fund goal and track it in Goals'
    });
  }

  // TFSA opportunity
  if (monthlySurplus > 0) {
    tips.push({
      priority: 'high',
      category: 'tfsa',
      title: '🏦 Maximize Your TFSA First',
      body: `The TFSA is Canada's best savings tool — growth is completely tax-free and withdrawals don't affect your income-tested benefits. 2024 limit is $7,000/year (~$583/month). If you haven't maxed since 2009, your room could be up to $95,000. Check your CRA My Account for exact room.`,
      action: 'Add your TFSA under Accounts and track your contribution room'
    });
  }

  // RRSP timing
  if (annualGross > 50000) {
    tips.push({
      priority: annualGross > 100000 ? 'high' : 'medium',
      category: 'rrsp',
      title: '💡 RRSP Strategy — Timing Matters',
      body: `RRSP contributions reduce your taxable income. At ${taxInfo?.effectiveRate || 0}% effective rate, every $1,000 contributed saves you ~$${Math.round((taxInfo?.effectiveRate||0)*10)} in taxes. Best strategy: contribute in high-income years, withdraw in retirement when you're in a lower bracket. Deadline: March 1, ${new Date().getFullYear()} for ${new Date().getFullYear()-1} tax year.`,
      action: 'Track your RRSP balance and contribution room under Accounts'
    });
  }

  // FHSA for first-time buyers
  tips.push({
    priority: 'medium',
    category: 'fhsa',
    title: '🏡 FHSA — Canada\'s Newest Account (2023)',
    body: `The First Home Savings Account gives you RRSP-style deductions on contributions AND tax-free withdrawals like a TFSA — but only for your first home. $8,000/year, $40,000 lifetime. If you\'re a first-time buyer, open one ASAP — unused room carries forward one year. Open at any bank or Wealthsimple.`,
    action: 'Add an FHSA account under Accounts if you\'re saving for a first home'
  });

  // Debt advice
  if (totalDebt > 0) {
    const avgRate = debtToIncomeRatio > 0 ? 'high' : 'medium';
    tips.push({
      priority: 'high',
      category: 'debt',
      title: '💳 Tackle High-Interest Debt First (Avalanche)',
      body: `Credit card debt in Canada averages 19.99–22.99% APR. Paying it off is a guaranteed 20% return — better than any investment. Use the Avalanche method: pay minimums on everything, then throw every extra dollar at the highest-rate debt. Debt tab shows your payoff order.`,
      action: 'Check the Debts tab for your personalized avalanche payoff order'
    });
  }

  // Tax optimization
  if (annualGross > 80000) {
    tips.push({
      priority: 'medium',
      category: 'tax',
      title: '🇨🇦 Tax Optimization at Your Income Level',
      body: `At $${annualGross.toLocaleString()} income in ${province}, you\'re in the ${taxInfo?.effectiveRate || 0}% effective rate bracket. Key moves: (1) Maximize RRSP to bring income below $111,733 federal threshold, (2) Consider income-splitting if you have a spouse, (3) Claim all home office expenses if self-employed, (4) FHSA if first-time buyer.`,
      action: 'Use the Tax Calculator to model different RRSP contribution scenarios'
    });
  }

  // CPP/OAS awareness
  if (profile?.birth_year && new Date().getFullYear() - profile.birth_year > 45) {
    tips.push({
      priority: 'medium',
      category: 'retirement',
      title: '👴 CPP & OAS — Know Your Numbers',
      body: `CPP: Maximum 2024 benefit is ~$1,364/month at age 65 (or $1,940 at 70). Delaying CPP past 65 increases it 8.4%/year. OAS: $698/month at 65. Use Service Canada\'s My Account to see your projected CPP amount. Factor both into your retirement plan.`,
      action: 'Add CPP/OAS as future income sources in the Income tab'
    });
  }

  // Surplus allocation
  if (monthlySurplus > 500) {
    tips.push({
      priority: 'medium',
      category: 'investing',
      title: '📈 Invest Your Surplus — Canadian Options',
      body: `With $${Math.round(monthlySurplus).toLocaleString()}/month surplus, consider: (1) Fill TFSA first — tax-free forever, (2) Top up RRSP if high income, (3) Leftover → non-registered account. Low-cost index ETFs: XEQT (all-equity), XBAL (balanced), or VEQT on TSX. MER under 0.25%. Wealthsimple has no commission.`,
      action: 'Set up automatic transfers to your TFSA on payday'
    });
  }

  // Province-specific
  if (province === 'QC') {
    tips.push({
      priority: 'medium',
      category: 'quebec',
      title: '🌸 Quebec-Specific: RQAP & Prescription Drug',
      body: `Quebec has its own parental insurance plan (RQAP) with higher benefits than federal EI. Also note: if your employer doesn't offer drug insurance, you must enroll in the RAMQ public plan. Quebec also has lower EI premiums offset by RQAP premiums.`,
      action: 'Ensure your RAMQ drug coverage is accounted for in expenses'
    });
  }

  if (province === 'AB') {
    tips.push({
      priority: 'medium',
      category: 'alberta',
      title: '🤠 Alberta Advantage: No Provincial Sales Tax',
      body: `Alberta has no PST — you save 0–10% vs other provinces on purchases. Also: Alberta has a flat 10% provincial rate up to $148,269, making it tax-friendly for middle-to-high earners. The Alberta Advantage Account (AISH, AFSL) may apply if eligible.`,
      action: 'Your tax rate is calculated correctly for Alberta in the Tax tab'
    });
  }

  // 50/30/20 rule check
  const housingExpenses = monthlyExpenses; // simplified
  const incomeRatio = monthlyNetIncome > 0 ? monthlyExpenses / monthlyNetIncome : 0;
  if (incomeRatio > 0.7) {
    tips.push({
      priority: 'high',
      category: 'budgeting',
      title: '⚠️ Expenses Exceed 70% of Net Income',
      body: `Your expenses are ${Math.round(incomeRatio*100)}% of take-home pay. The 50/30/20 rule: 50% needs, 30% wants, 20% savings. In Canada\'s high-cost cities, 60/20/20 is more realistic. Look for quick wins: unused subscriptions, insurance shopping, refinancing high-rate debt.`,
      action: 'Review your Expenses tab and identify categories to reduce'
    });
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  tips.sort((a,b) => order[a.priority] - order[b.priority]);
  return tips.slice(0, 8); // return top 8
}

module.exports = { generateTips };
