import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar, Percent, AlertCircle, Sparkles, FileText, FileSpreadsheet, Layers } from 'lucide-react';

// Utility function for number formatting
const formatCurrency = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatPercent = (value) => `${value.toFixed(2)}%`;

// AI Optimization function using Netlify proxy
const optimizeWithAI = async (params, yearlyData) => {
  try {
    const response = await fetch("/.netlify/functions/claude-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Analysiere diese Depot-Simulation und gib konkrete Optimierungsvorschläge:

Depot-Parameter:
- Startkapital: ${formatCurrency(params.startCapital)}
- Konservatives Depot: ${params.conservativePercent}% mit ${params.conservativeReturn}% Rendite
- Aggressives Depot: ${100-params.conservativePercent}% mit ${params.aggressiveReturn}% Rendite
- Netto-Entnahme: ${formatCurrency(params.withdrawalAmount)} pro Jahr
- Inflation: ${params.inflation}%
- Steuersatz: ${params.taxRate}%
- Strategie: ${params.strategy}
- Szenario: ${params.scenario}

Simulationsergebnis:
- Depot hält ${yearlyData.length} Jahre
- Letzter Depotwert: ${formatCurrency(yearlyData[yearlyData.length-1]?.totalDepot || 0)}

Gib eine JSON-Antwort mit folgender Struktur (NUR JSON, keine Markdown-Backticks):
{
  "rating": "Sehr gut/Gut/Befriedigend/Kritisch",
  "summary": "Kurze Zusammenfassung (max 2 Sätze)",
  "recommendations": [
    "Empfehlung 1",
    "Empfehlung 2",
    "Empfehlung 3"
  ],
  "optimizedAllocation": {
    "conservative": Prozentsatz,
    "aggressive": Prozentsatz
  },
  "riskAssessment": "Bewertung des Risikos"
}`
          }
        ],
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error("AI optimization error:", error);
    return null;
  }
};

// AI Tax Optimization function
const optimizeTaxWithAI = async (params, yearlyData, summary) => {
  try {
    console.log('TAX OPTIMIZATION: Starting...');
    
    // Calculate tax statistics
    const avgYearlyTax = summary.totalTaxes / yearlyData.length;
    const taxOnGainsPercent = (summary.totalTaxOnGains / summary.totalTaxes) * 100;
    const taxOnPrincipalPercent = (summary.totalTaxOnPrincipal / summary.totalTaxes) * 100;
    const freibetragUsage = yearlyData.filter(y => y.totalGain > params.freibetrag).length;
    const yearsWithPrincipalSales = yearlyData.filter(y => y.fromPrincipal > 0).length;
    
    console.log('TAX OPTIMIZATION: Calling API...');

    const response = await fetch("/.netlify/functions/claude-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        messages: [
          { 
            role: "user", 
            content: `Du bist ein Steueroptimierungs-Experte. Analysiere diese Depot-Simulation und gib KONKRETE, UMSETZBARE Steueroptimierungs-Vorschläge:

DEPOT-PARAMETER:
- Startkapital: ${formatCurrency(params.startCapital)}
- Aufteilung: ${params.conservativePercent}% konservativ (${params.conservativeReturn}% p.a.), ${100-params.conservativePercent}% aggressiv (${params.aggressiveReturn}% p.a.)
- Entnahme: ${formatCurrency(params.withdrawalAmount)} pro Jahr
- Steuersatz: ${params.taxRate}%
- Sparerpauschbetrag: ${formatCurrency(params.freibetrag)}
- Strategie: ${params.strategy}

STEUER-STATISTIK:
- Gesamtsteuern über ${yearlyData.length} Jahre: ${formatCurrency(summary.totalTaxes)}
- Durchschnittlich pro Jahr: ${formatCurrency(avgYearlyTax)}
- Steuer auf Erträge: ${formatCurrency(summary.totalTaxOnGains)} (${taxOnGainsPercent.toFixed(1)}%)
- Steuer auf Substanz: ${formatCurrency(summary.totalTaxOnPrincipal)} (${taxOnPrincipalPercent.toFixed(1)}%)
- Freibetrag wird genutzt in: ${freibetragUsage} von ${yearlyData.length} Jahren
- Jahre mit Substanzverkauf: ${yearsWithPrincipalSales}

ERSTE 3 JAHRE (Beispiel):
${yearlyData.slice(0, 3).map(y => `Jahr ${y.year}: Ertrag ${formatCurrency(y.totalGain)}, Substanz ${formatCurrency(y.fromPrincipal)}, Steuer ${formatCurrency(y.taxPaid)}`).join('\n')}

Gib eine JSON-Antwort (NUR JSON, keine Backticks):
{
  "potentialSavings": Geschätzter Betrag in Euro,
  "savingsPercent": Prozent Ersparnis,
  "priority": "Hoch/Mittel/Niedrig",
  "recommendations": [
    {
      "title": "Kurzer prägnanter Titel",
      "description": "Detaillierte Erklärung was zu tun ist",
      "impact": "Hoch/Mittel/Niedrig",
      "savings": Geschätzte Ersparnis in Euro
    }
  ],
  "quickWins": [
    "Sofort umsetzbare Maßnahme 1",
    "Sofort umsetzbare Maßnahme 2"
  ],
  "strategicChanges": {
    "withdrawalTiming": "Empfehlung zum Timing",
    "depotStructure": "Empfehlung zur Struktur",
    "freibetragOptimization": "Wie Freibetrag besser nutzen"
  }
}

WICHTIG: Gib KONKRETE Zahlen und umsetzbare Schritte! Keine allgemeinen Tipps!`
          }
        ],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TAX OPTIMIZATION: API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    console.log('TAX OPTIMIZATION: Parsing response...');
    const data = await response.json();
    console.log('TAX OPTIMIZATION: Raw response:', data);
    
    const text = data.content.map(i => i.text || "").join("\n");
    console.log('TAX OPTIMIZATION: Extracted text:', text);
    
    const clean = text.replace(/```json|```/g, "").trim();
    console.log('TAX OPTIMIZATION: Cleaned text:', clean);
    
    const parsed = JSON.parse(clean);
    console.log('TAX OPTIMIZATION: Parsed successfully!', parsed);
    
    return parsed;
  } catch (error) {
    console.error("TAX OPTIMIZATION ERROR:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Return a fallback error object that will display in UI
    return {
      error: true,
      errorMessage: `Fehler bei der Steueroptimierung: ${error.message}`,
      potentialSavings: 0,
      savingsPercent: 0,
      priority: "Niedrig",
      recommendations: [{
        title: "API-Fehler",
        description: `Die Steueroptimierung konnte nicht durchgeführt werden. Fehler: ${error.message}`,
        impact: "Niedrig",
        savings: 0
      }],
      quickWins: [],
      strategicChanges: {}
    };
  }
};

// AI Depot Structure Optimization function
const optimizeDepotStructureWithAI = async (params) => {
  try {
    console.log('DEPOT STRUCTURE: Starting...');

    const response = await fetch("/.netlify/functions/claude-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        messages: [
          { 
            role: "user", 
            content: `Du bist ein Experte für Depot-Strukturierung und Asset-Allocation. 

AUFGABE: Erstelle konkrete Musterdepots für folgende Situation:

ECKDATEN:
- Gesamtkapital: ${formatCurrency(params.startCapital)}
- Konservatives Depot: ${params.conservativePercent}% (${formatCurrency(params.startCapital * params.conservativePercent / 100)})
- Aggressives Depot: ${100-params.conservativePercent}% (${formatCurrency(params.startCapital * (100-params.conservativePercent) / 100)})
- Erwartete Rendite konservativ: ${params.conservativeReturn}% p.a.
- Erwartete Rendite aggressiv: ${params.aggressiveReturn}% p.a.
- Alter: ${params.startAge} Jahre
- Jährliche Entnahme: ${formatCurrency(params.withdrawalAmount)}

ANFORDERUNG: Erstelle 2 konkrete Musterdepots mit:
- Maximal 5-7 Titel/Positionen pro Depot
- Prozentuale Gewichtung pro Position
- Konkrete ETF/Asset-Namen (z.B. "MSCI World ETF", "Gold", "Festgeld")
- Kurze Begründung für jede Position

Gib eine JSON-Antwort (NUR JSON, keine Backticks):
{
  "conservativeDepot": {
    "totalAmount": Betrag in Euro,
    "targetReturn": Prozent p.a.,
    "riskLevel": "Niedrig",
    "positions": [
      {
        "name": "Konkreter Name (z.B. 'Tagesgeld')",
        "allocation": Prozent,
        "amount": Betrag in Euro,
        "expectedReturn": Prozent p.a.,
        "reasoning": "Kurze Begründung"
      }
    ],
    "summary": "Kurze Zusammenfassung der Strategie"
  },
  "aggressiveDepot": {
    "totalAmount": Betrag in Euro,
    "targetReturn": Prozent p.a.,
    "riskLevel": "Mittel/Hoch",
    "positions": [
      {
        "name": "Konkreter Name (z.B. 'MSCI World ETF')",
        "allocation": Prozent,
        "amount": Betrag in Euro,
        "expectedReturn": Prozent p.a.,
        "reasoning": "Kurze Begründung"
      }
    ],
    "summary": "Kurze Zusammenfassung der Strategie"
  },
  "rebalancingAdvice": "Empfehlung wie oft und wann rebalancieren",
  "additionalNotes": "Weitere wichtige Hinweise"
}

WICHTIG: 
- Verwende echte, handelbare Produkte (ETFs, Anleihen, Tagesgeld, etc.)
- Prozentangaben müssen pro Depot auf 100% summieren
- Berücksichtige das Alter und die Entnahmestrategie`
          }
        ],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DEPOT STRUCTURE: API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    console.log('DEPOT STRUCTURE: Parsing response...');
    const data = await response.json();
    console.log('DEPOT STRUCTURE: Raw response:', data);
    
    const text = data.content.map(i => i.text || "").join("\n");
    console.log('DEPOT STRUCTURE: Extracted text:', text);
    
    const clean = text.replace(/```json|```/g, "").trim();
    console.log('DEPOT STRUCTURE: Cleaned text:', clean);
    
    const parsed = JSON.parse(clean);
    console.log('DEPOT STRUCTURE: Parsed successfully!', parsed);
    
    return parsed;
  } catch (error) {
    console.error("DEPOT STRUCTURE ERROR:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Return a fallback error object
    return {
      error: true,
      errorMessage: `Fehler bei der Depot-Struktur-Analyse: ${error.message}`,
      conservativeDepot: {
        totalAmount: 0,
        targetReturn: 0,
        riskLevel: "Fehler",
        positions: [],
        summary: `Fehler: ${error.message}`
      },
      aggressiveDepot: {
        totalAmount: 0,
        targetReturn: 0,
        riskLevel: "Fehler",
        positions: [],
        summary: `Fehler: ${error.message}`
      },
      rebalancingAdvice: "Bitte versuchen Sie es erneut.",
      additionalNotes: error.message
    };
  }
};

// Calculate age-adjusted withdrawal pattern
const getAgeAdjustedWithdrawal = (year, startAge, baseAmount, agePatterns) => {
  const currentAge = startAge + year;
  
  if (currentAge < 64) return baseAmount * (agePatterns.under64 / 100);
  if (currentAge < 75) return baseAmount * (agePatterns.age64to74 / 100);
  if (currentAge < 85) return baseAmount * (agePatterns.age75to84 / 100);
  return baseAmount * (agePatterns.age85plus / 100);
};

// Determine which years are crisis years (for manual mode)
const getCrisisYears = (totalYears, crisisCount, timing) => {
  if (crisisCount === 0) return new Set();
  
  const crisisYears = new Set();
  const validCount = Math.min(crisisCount, totalYears);
  
  switch(timing) {
    case 'beginning':
      for (let i = 1; i <= validCount; i++) {
        crisisYears.add(i);
      }
      break;
      
    case 'middle':
      const middleStart = Math.floor(totalYears / 2) - Math.floor(validCount / 2);
      for (let i = 0; i < validCount; i++) {
        crisisYears.add(Math.max(1, middleStart + i));
      }
      break;
      
    case 'end':
      for (let i = totalYears - validCount + 1; i <= totalYears; i++) {
        crisisYears.add(Math.max(1, i));
      }
      break;
      
    case 'random':
    default:
      while (crisisYears.size < validCount) {
        const randomYear = Math.floor(Math.random() * totalYears) + 1;
        crisisYears.add(randomYear);
      }
      break;
  }
  
  return crisisYears;
};

// Simulation engine - simplified (no two-phase needed)
const runSimulation = (params) => {
  // For manual crisis mode with middle/end timing, we need to know actual duration
  if (params.crisisMode === 'manual' && 
      params.simulationMode === 'withdrawal' && 
      (params.manualCrisisTiming === 'middle' || params.manualCrisisTiming === 'end')) {
    console.log('PHASE 1: Running preliminary simulation to determine duration...');
    const testResult = runSimulationCore({...params, crisisMode: 'none'}); // Run without any crisis
    const actualDuration = testResult.length;
    console.log(`PHASE 1 COMPLETE: Duration is ${actualDuration} years`);
    console.log('PHASE 2: Running with manual crisis years...');
    return runSimulationCore(params, actualDuration);
  }
  
  return runSimulationCore(params);
};

// Core simulation logic
const runSimulationCore = (params, knownDuration = null) => {
  const {
    startCapital,
    conservativePercent,
    aggressivePercent,
    conservativeReturn,
    aggressiveReturn,
    useInflation,
    inflation,
    withdrawalAmount,
    adjustForInflation,
    taxRate,
    freibetrag,
    strategy,
    scenario,
    startAge,
    useAgePattern,
    simulationMode,
    targetYears,
    crisisMode,
    manualCrisisCount,
    manualCrisisTiming,
    crisisReductionPercent,
    useMinimumBalance,
    minimumBalance,
    // NEW: Dual crisis system
    useCrisis1,
    crisis1StartYear,
    crisis1Years,
    crisis1Returns,
    crisis1Reduction,
    useCrisis2,
    crisis2StartYear,
    crisis2Years,
    crisis2Returns,
    crisis2Reduction
  } = params;

  let conservativeDepot = startCapital * (conservativePercent / 100);
  let aggressiveDepot = startCapital * (aggressivePercent / 100);
  
  const yearlyData = [];
  let year = 0;
  const maxYears = simulationMode === 'years' ? targetYears : 100;
  
  // Manual crisis years (if manual mode)
  const durationForCrisis = knownDuration || maxYears;
  const manualCrisisYears = (crisisMode === 'manual') 
    ? getCrisisYears(durationForCrisis, manualCrisisCount, manualCrisisTiming) 
    : new Set();
  
  // Auto crisis tracking (if auto mode)
  let previousAggressiveValue = aggressiveDepot;
  let inAutoCrisis = false;
  let preCrisisAggressiveValue = aggressiveDepot; // Value before first crisis
  let crisisYearCounter = 0;
  
  // Debug logging
  console.log('========================================');
  console.log('SIMULATION STARTING');
  console.log('Crisis Management Mode:', crisisMode);
  if (crisisMode === 'auto') {
    console.log('  → Automatic detection: Crash >15%');
    console.log('  → Action: Reduce withdrawals by', crisisReductionPercent + '%');
    console.log('  → Recovery: When aggressive >90% of pre-crisis value');
  } else if (crisisMode === 'manual') {
    console.log('  → Manual crisis years:', manualCrisisCount);
    console.log('  → Timing:', manualCrisisTiming);
    console.log('  → Duration for placement:', durationForCrisis);
    console.log('  → Crisis years:', Array.from(manualCrisisYears).sort((a,b) => a-b));
    console.log('  → Action: Reduce withdrawals by', crisisReductionPercent + '%');
  } else {
    console.log('  → No crisis management (test mode)');
  }
  console.log('========================================');

  // Scenario multipliers
  const getScenarioReturns = (year, baseConservative, baseAggressive) => {
    switch(scenario) {
      case 'constant':
        return { conservative: baseConservative, aggressive: baseAggressive };
      case 'volatile':
        const variance = Math.sin(year * 0.5) * 3;
        return { 
          conservative: baseConservative + variance * 0.3, 
          aggressive: baseAggressive + variance 
        };
      case 'crash':
        if (year === 3) return { conservative: baseConservative - 2, aggressive: baseAggressive - 20 };
        if (year === 4) return { conservative: baseConservative - 1, aggressive: baseAggressive - 10 };
        if (year >= 5 && year <= 7) return { conservative: baseConservative + 1, aggressive: baseAggressive + 8 };
        return { conservative: baseConservative, aggressive: baseAggressive };
      case 'boom':
        if (year <= 5) return { conservative: baseConservative + 1, aggressive: baseAggressive + 5 };
        return { conservative: baseConservative, aggressive: baseAggressive };
      default:
        return { conservative: baseConservative, aggressive: baseAggressive };
    }
  };

  while ((conservativeDepot + aggressiveDepot) > (useMinimumBalance ? minimumBalance : 0) && year < maxYears) {
    const currentYear = year + 1;
    const startTotal = conservativeDepot + aggressiveDepot;
    
    // Apply returns
    const returns = getScenarioReturns(year, conservativeReturn, aggressiveReturn);
    
    // NEW DUAL CRISIS SYSTEM - Check if we're in crisis1 or crisis2
    let inCrisis1 = false;
    let inCrisis2 = false;
    let crisis1YearIndex = -1;
    let crisis2YearIndex = -1;
    let activeCrisisReduction = 0;
    
    // Check Crisis 1
    if (useCrisis1 && crisis1StartYear && crisis1Years > 0 && crisis1Returns && crisis1Returns.length > 0) {
      if (currentYear >= crisis1StartYear && currentYear < crisis1StartYear + crisis1Years) {
        inCrisis1 = true;
        crisis1YearIndex = currentYear - crisis1StartYear;
      }
    }
    
    // Check Crisis 2
    if (useCrisis2 && crisis2StartYear && crisis2Years > 0 && crisis2Returns && crisis2Returns.length > 0) {
      if (currentYear >= crisis2StartYear && currentYear < crisis2StartYear + crisis2Years) {
        inCrisis2 = true;
        crisis2YearIndex = currentYear - crisis2StartYear;
      }
    }
    
    // Determine effective returns based on crisis status
    let effectiveAggressiveReturn = returns.aggressive;
    
    if (inCrisis1 && crisis1YearIndex >= 0 && crisis1YearIndex < crisis1Returns.length) {
      effectiveAggressiveReturn = crisis1Returns[crisis1YearIndex];
      activeCrisisReduction = crisis1Reduction || 0;
    }
    
    if (inCrisis2 && crisis2YearIndex >= 0 && crisis2YearIndex < crisis2Returns.length) {
      const crisis2Return = crisis2Returns[crisis2YearIndex];
      // If both crises active, take worse return
      if (inCrisis1) {
        effectiveAggressiveReturn = Math.min(effectiveAggressiveReturn, crisis2Return);
        activeCrisisReduction = Math.max(activeCrisisReduction, crisis2Reduction || 0);
      } else {
        effectiveAggressiveReturn = crisis2Return;
        activeCrisisReduction = crisis2Reduction || 0;
      }
    }
    
    // Apply gains with crisis-adjusted returns
    const conservativeGain = conservativeDepot * (returns.conservative / 100);
    const aggressiveGain = aggressiveDepot * (effectiveAggressiveReturn / 100);
    
    conservativeDepot += conservativeGain;
    aggressiveDepot += aggressiveGain;
    
    const totalGain = conservativeGain + aggressiveGain;
    
    // Determine if in any crisis (only use new crisis system)
    const isInNewCrisis = inCrisis1 || inCrisis2;
    let isInCrisis = isInNewCrisis;
    
    // NO LEGACY CRISIS SYSTEM - Only new crisis boxes are used
    // (Old auto/manual crisis detection is disabled)
    
    if (isInCrisis) crisisYearCounter++;
    
    // Store current aggressive value for next year's comparison (auto mode)
    previousAggressiveValue = aggressiveDepot;
    
    // Calculate withdrawal
    let baseWithdrawal = withdrawalAmount;
    if (adjustForInflation) {
      baseWithdrawal = withdrawalAmount * Math.pow(1 + inflation/100, year);
    }
    
    if (useAgePattern) {
      const agePatterns = {
        under64: params.agePatternUnder64,
        age64to74: params.agePattern64to74,
        age75to84: params.agePattern75to84,
        age85plus: params.agePattern85plus
      };
      baseWithdrawal = getAgeAdjustedWithdrawal(year, startAge, baseWithdrawal, agePatterns);
    }
    
    // Apply crisis reduction if in crisis
    let finalWithdrawal = baseWithdrawal;
    if (isInCrisis && activeCrisisReduction > 0) {
      finalWithdrawal = baseWithdrawal * (1 - activeCrisisReduction / 100);
    }
    
    // TAX CALCULATION - Correct logic
    // We need: netNeeded (after all taxes)
    // Available: totalGain (gross gains)
    const netNeeded = finalWithdrawal;
    
    let taxOnGains = 0;
    let taxOnPrincipal = 0;
    let fromGainsGross = 0;
    let fromPrincipalGross = 0;
    
    // Can we cover netNeeded purely from gains?
    // If we take X gross from gains: net = X - max(0, X - freibetrag) * taxRate
    //                                    = X * (1 - taxRate) + freibetrag * taxRate  (if X > freibetrag)
    
    // Maximum net we can get from available gains
    let maxNetFromGains;
    if (totalGain <= 0) {
      // No positive gains available (negative or zero)
      maxNetFromGains = 0;
    } else if (totalGain <= freibetrag) {
      maxNetFromGains = totalGain; // No tax
    } else {
      maxNetFromGains = totalGain - (totalGain - freibetrag) * (taxRate / 100);
    }
    
    if (netNeeded <= maxNetFromGains) {
      // Case 1: Can cover everything from gains
      if (netNeeded <= freibetrag) {
        // No tax
        fromGainsGross = netNeeded;
        taxOnGains = 0;
      } else {
        // Solve: netNeeded = X - (X - freibetrag) * taxRate
        //        netNeeded = X - X*taxRate + freibetrag*taxRate
        //        netNeeded = X*(1 - taxRate) + freibetrag*taxRate
        //        X = (netNeeded - freibetrag*taxRate) / (1 - taxRate)
        const taxRateFraction = taxRate / 100;
        fromGainsGross = (netNeeded - freibetrag * taxRateFraction) / (1 - taxRateFraction);
        taxOnGains = (fromGainsGross - freibetrag) * taxRateFraction;
      }
      fromPrincipalGross = 0;
      taxOnPrincipal = 0;
    } else {
      // Case 2: Not enough positive gains - need principal
      if (totalGain > 0) {
        // Take all positive gains we have
        fromGainsGross = totalGain;
        if (totalGain > freibetrag) {
          taxOnGains = (totalGain - freibetrag) * (taxRate / 100);
        } else {
          taxOnGains = 0;
        }
      } else {
        // No positive gains at all (negative or zero total)
        fromGainsGross = 0;
        taxOnGains = 0;
      }
      
      const netFromGains = fromGainsGross - taxOnGains;
      
      // Still need this much net
      const stillNeedNet = netNeeded - netFromGains;
      
      // From principal: Assume principalGainPercent is gains
      // If we sell P gross: tax = P * principalGainPercent * taxRate
      //                     net = P - tax = P * (1 - principalGainPercent * taxRate)
      // So: stillNeedNet = P * (1 - principalGainPercent * taxRate)
      //     P = stillNeedNet / (1 - principalGainPercent * taxRate)
      const principalGainPercent = (params.principalGainPercent || 50) / 100;
      const taxRateFraction = taxRate / 100;
      fromPrincipalGross = stillNeedNet / (1 - principalGainPercent * taxRateFraction);
      taxOnPrincipal = fromPrincipalGross * principalGainPercent * taxRateFraction;
    }
    
    const totalTax = taxOnGains + taxOnPrincipal;
    const grossWithdrawal = fromGainsGross + fromPrincipalGross;
    const principalGainPercent = (params.principalGainPercent || 50) / 100;
    const taxableGains = Math.max(0, fromGainsGross - freibetrag) + (fromPrincipalGross * principalGainPercent);
    
    // Check if withdrawal would bring us below minimum balance
    let actualWithdrawal = grossWithdrawal;
    const currentTotal = conservativeDepot + aggressiveDepot;
    const minimumRequired = useMinimumBalance ? minimumBalance : 0;
    
    if (currentTotal - grossWithdrawal < minimumRequired) {
      // Limit withdrawal to keep minimum balance
      actualWithdrawal = Math.max(0, currentTotal - minimumRequired);
      console.log(`Year ${currentYear}: Limiting withdrawal from ${formatCurrency(grossWithdrawal)} to ${formatCurrency(actualWithdrawal)} to preserve minimum balance`);
    }
    
    // STEP 1: Execute withdrawal - ALWAYS from conservative depot first
    if (conservativeDepot >= actualWithdrawal) {
      // Conservative depot has enough
      conservativeDepot -= actualWithdrawal;
    } else {
      // Conservative depot insufficient - take from aggressive as emergency
      const remainingNeeded = actualWithdrawal - conservativeDepot;
      conservativeDepot = 0;
      
      if (aggressiveDepot >= remainingNeeded) {
        aggressiveDepot -= remainingNeeded;
        console.log(`Year ${currentYear}: WARNING - Conservative depot depleted, taking ${formatCurrency(remainingNeeded)} from aggressive`);
      } else {
        // Not enough in either depot
        aggressiveDepot = 0;
        console.log(`Year ${currentYear}: WARNING - Both depots depleted!`);
      }
    }
    
    // STEP 2: Rebalancing - Refill conservative depot to 6-year buffer (if not in crisis)
    let rebalanceAmount = 0;
    if (!isInCrisis && aggressiveDepot > 0) {
      // Calculate how much we need for 6 years
      const yearlyWithdrawalEstimate = adjustForInflation 
        ? withdrawalAmount * Math.pow(1 + inflation/100, year + 1) // Next year's expected withdrawal
        : withdrawalAmount;
      
      const targetConservative = yearlyWithdrawalEstimate * 6;
      
      if (conservativeDepot < targetConservative) {
        // Need to refill conservative depot
        const needed = targetConservative - conservativeDepot;
        rebalanceAmount = Math.min(needed, aggressiveDepot * 0.5); // Max 50% of aggressive per year
        
        conservativeDepot += rebalanceAmount;
        aggressiveDepot -= rebalanceAmount;
        
        if (currentYear <= 5 || rebalanceAmount > 10000) {
          console.log(`Year ${currentYear}: Rebalancing ${formatCurrency(rebalanceAmount)} from aggressive to conservative`);
          console.log(`  Conservative now: ${formatCurrency(conservativeDepot)} (Target: ${formatCurrency(targetConservative)} = 6 years)`);
        }
      }
    } else if (isInCrisis) {
      console.log(`Year ${currentYear}: NO REBALANCING - In crisis, aggressive depot frozen`);
    }
    
    // NOTE: Inflation is already accounted for in rising withdrawals
    // The depot values stay in nominal EUR terms
    // We do NOT reduce depot by inflation here (that would be double counting)
    
    const endTotal = Math.max(0, conservativeDepot + aggressiveDepot);
    
    // Calculate depot performance metrics
    const previousYearDepot = year === 0 ? startCapital : yearlyData[year - 1].totalDepot;
    const depotChangeYoY = previousYearDepot > 0 ? ((endTotal - previousYearDepot) / previousYearDepot) * 100 : 0;
    const depotChangeTotal = startCapital > 0 ? ((endTotal - startCapital) / startCapital) * 100 : 0;
    
    yearlyData.push({
      year: currentYear,
      age: startAge + year + 1,
      conservativeDepot: Math.max(0, conservativeDepot),
      aggressiveDepot: Math.max(0, aggressiveDepot),
      totalDepot: endTotal,
      depotChangeYoY,
      depotChangeTotal,
      totalGain,
      conservativeGain,
      aggressiveGain,
      withdrawalNominal: finalWithdrawal,
      withdrawalPlanned: baseWithdrawal,
      withdrawalReal: finalWithdrawal / Math.pow(1 + inflation/100, year),
      grossWithdrawal: actualWithdrawal,
      grossWithdrawalPlanned: grossWithdrawal,
      fromGains: fromGainsGross * (actualWithdrawal / grossWithdrawal),
      fromPrincipal: fromPrincipalGross * (actualWithdrawal / grossWithdrawal),
      taxPaid: (actualWithdrawal / grossWithdrawal) * totalTax, // Proportional tax
      taxOnGains: (actualWithdrawal / grossWithdrawal) * taxOnGains, // Proportional
      taxOnPrincipal: (actualWithdrawal / grossWithdrawal) * taxOnPrincipal, // Proportional
      taxableGains: taxableGains,
      principalGainsAssumed: fromPrincipalGross * 0.5 * (actualWithdrawal / grossWithdrawal),
      conservativeReturn: returns.conservative,
      aggressiveReturn: effectiveAggressiveReturn,
      isInCrisis,
      isInCrisis1: inCrisis1,
      isInCrisis2: inCrisis2,
      crisis1YearIndex: crisis1YearIndex,
      crisis2YearIndex: crisis2YearIndex,
      limitedByMinBalance: actualWithdrawal < grossWithdrawal,
      rebalanceAmount: rebalanceAmount
    });
    
    year++;
    
    if (endTotal <= (useMinimumBalance ? minimumBalance : 0)) break;
  }
  
  // Final debug summary
  console.log('========================================');
  console.log('SIMULATION COMPLETE');
  console.log('Total years simulated:', yearlyData.length);
  console.log('Crisis years counter:', crisisYearCounter);
  console.log('Crisis years in data:', yearlyData.filter(y => y.isInCrisis).length);
  console.log('Crisis years list:', yearlyData.filter(y => y.isInCrisis).map(y => y.year));
  console.log('========================================');
  
  return yearlyData;
};

// Export functions
const exportToExcel = (data, params) => {
  let csv = 'Jahr;Alter;Status;Altersfaktor;Konservativ;Aggressiv;Gesamt;Ertrag;Entnahme Basis;Entnahme Netto;Entnahme Brutto;Aus Ertrag;Aus Substanz;Steuer Gesamt;Steuer auf Ertrag;Steuer auf Substanz;Gewinnanteil Substanz\n';
  data.forEach(row => {
    // Calculate age factor
    let ageFactor = 1.0;
    if (params.useAgePattern) {
      const currentAge = row.age;
      if (currentAge < 64) ageFactor = params.agePatternUnder64 / 100;
      else if (currentAge < 75) ageFactor = params.agePattern64to74 / 100;
      else if (currentAge < 85) ageFactor = params.agePattern75to84 / 100;
      else ageFactor = params.agePattern85plus / 100;
    }
    
    const status = row.isInCrisis ? 'KRISE' : 'Normal';
    const baseAmount = row.withdrawalPlanned || row.withdrawalNominal;
    
    csv += `${row.year};${row.age};${status};${(ageFactor * 100).toFixed(0)}%;${row.conservativeDepot.toFixed(2)};${row.aggressiveDepot.toFixed(2)};${row.totalDepot.toFixed(2)};${row.totalGain.toFixed(2)};${baseAmount.toFixed(2)};${row.withdrawalNominal.toFixed(2)};${row.grossWithdrawal.toFixed(2)};${row.fromGains.toFixed(2)};${row.fromPrincipal.toFixed(2)};${row.taxPaid.toFixed(2)};${(row.taxOnGains || 0).toFixed(2)};${(row.taxOnPrincipal || 0).toFixed(2)};${(row.principalGainsAssumed || 0).toFixed(2)}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'depot-simulation.csv';
  link.click();
};

const exportToPDF = (data, params) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  let html = `
    <html>
      <head>
        <title>Depot-Simulation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 9px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
          th { background-color: #1a1a2e; color: white; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
          .crisis { background-color: #ffebee; font-weight: bold; }
          .crisis-badge { background: #e53935; color: white; padding: 2px 6px; border-radius: 3px; font-size: 8px; }
          .age-pattern { color: #666; font-size: 8px; }
        </style>
      </head>
      <body>
        <h1>Depot-Simulation</h1>
        <div class="summary">
          <p><strong>Startkapital:</strong> ${formatCurrency(params.startCapital)}</p>
          <p><strong>Laufzeit:</strong> ${data.length} Jahre</p>
          <p><strong>Strategie:</strong> ${params.strategy === 'yield' ? 'Ertragsoptimiert' : 'Risikominimiert'}</p>
          <p><strong>Szenario:</strong> ${params.scenario}</p>
          ${params.useAgePattern ? '<p><strong>Altersprofil:</strong> Aktiv (Bis 63: +10%, 64-74: ±0%, 75-84: -15%, 85+: -30%)</p>' : ''}
          ${params.useCrisisManagement ? `<p><strong>Krisenmanagement:</strong> ${params.crisisYearsCount} Jahre (${
            params.crisisTiming === 'random' ? 'Zufällig' : 
            params.crisisTiming === 'beginning' ? 'Am Anfang' :
            params.crisisTiming === 'middle' ? 'In der Mitte' : 'Am Ende'
          }) - ${params.crisisMode === 'percentage' ? params.crisisReductionPercent + '% Reduktion' : formatCurrency(params.crisisAbsoluteAmount)}</p>` : ''}
          ${params.useMinimumBalance ? `<p><strong>Mindestbetrag:</strong> ${formatCurrency(params.minimumBalance)}</p>` : ''}
        </div>
        <table>
          <tr>
            <th>Jahr</th>
            <th>Alter</th>
            <th>Status</th>
            <th>Konservativ</th>
            <th>Aggressiv</th>
            <th>Gesamt</th>
            <th>Ertrag</th>
            <th>Entnahme</th>
          </tr>
  `;
  
  data.forEach(row => {
    let ageFactor = 1.0;
    if (params.useAgePattern) {
      const currentAge = row.age;
      if (currentAge < 64) ageFactor = params.agePatternUnder64 / 100;
      else if (currentAge < 75) ageFactor = params.agePattern64to74 / 100;
      else if (currentAge < 85) ageFactor = params.agePattern75to84 / 100;
      else ageFactor = params.agePattern85plus / 100;
    }
    
    html += `
      <tr${row.isInCrisis ? ' class="crisis"' : ''}>
        <td>${row.year}</td>
        <td>${row.age}</td>
        <td>
          ${row.isInCrisis ? '<span class="crisis-badge">KRISE</span>' : 
            (params.useAgePattern && ageFactor !== 1.0 ? `<span class="age-pattern">${(ageFactor * 100).toFixed(0)}%</span>` : '—')}
        </td>
        <td>${formatCurrency(row.conservativeDepot)}</td>
        <td>${formatCurrency(row.aggressiveDepot)}</td>
        <td>${formatCurrency(row.totalDepot)}</td>
        <td>${formatCurrency(row.totalGain)}</td>
        <td>${formatCurrency(row.withdrawalNominal)}</td>
      </tr>
    `;
  });
  
  html += '</table></body></html>';
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// Main Component
export default function DepotSimulator() {
  const [params, setParams] = useState({
    startCapital: 1900000,
    conservativePercent: 40,
    aggressivePercent: 60,
    conservativeReturn: 2.5,
    aggressiveReturn: 6,
    useInflation: true,
    inflation: 2,
    withdrawalAmount: 80000,
    adjustForInflation: true,
    taxRate: 25,
    freibetrag: 2000,
    strategy: 'optimized-risk', // 'yield' or 'risk' or 'optimized-risk'
    scenario: 'constant', // 'constant', 'volatile', 'crash', 'boom'
    startAge: 64,
    useAgePattern: true,
    // Adjustable age pattern multipliers
    agePatternUnder64: 110, // Percentage (110 = 110% of base)
    agePattern64to74: 100,
    agePattern75to84: 85,
    agePattern85plus: 70,
    simulationMode: 'withdrawal', // 'years' or 'withdrawal'
    targetYears: 30,
    // Crisis management - auto OR manual (LEGACY - keep for compatibility)
    crisisMode: 'auto', // 'auto' or 'manual'
    manualCrisisCount: 5,
    manualCrisisTiming: 'middle', // 'random', 'beginning', 'middle', 'end'
    crisisReductionPercent: 30, // How much to reduce withdrawals during crisis
    // NEW: Dual crisis system
    useCrisis1: false,
    crisis1StartYear: 2,
    crisis1Years: 4,
    crisis1Returns: [-10, -10, -10, -10],
    crisis1Reduction: 50,
    useCrisis2: false,
    crisis2StartYear: 15,
    crisis2Years: 3,
    crisis2Returns: [-30, -10, -10],
    crisis2Reduction: 30,
    useMinimumBalance: false,
    minimumBalance: 50000
  });

  const [showResults, setShowResults] = useState(false);
  const [aiOptimization, setAiOptimization] = useState(null);
  const [taxOptimization, setTaxOptimization] = useState(null);
  const [depotStructure, setDepotStructure] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimizingTax, setIsOptimizingTax] = useState(false);
  const [isOptimizingDepot, setIsOptimizingDepot] = useState(false);

  const yearlyData = useMemo(() => {
    if (!showResults) return [];
    return runSimulation(params);
  }, [params, showResults]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const optimization = await optimizeWithAI(params, yearlyData);
    setAiOptimization(optimization);
    setIsOptimizing(false);
  };

  const handleTaxOptimize = async () => {
    setIsOptimizingTax(true);
    const optimization = await optimizeTaxWithAI(params, yearlyData, summary);
    setTaxOptimization(optimization);
    setIsOptimizingTax(false);
  };

  const handleDepotStructure = async () => {
    setIsOptimizingDepot(true);
    const structure = await optimizeDepotStructureWithAI(params);
    setDepotStructure(structure);
    setIsOptimizingDepot(false);
  };

  const summary = useMemo(() => {
    if (yearlyData.length === 0) return null;
    const lastYear = yearlyData[yearlyData.length - 1];
    const totalWithdrawn = yearlyData.reduce((sum, y) => sum + y.grossWithdrawal, 0);
    const totalTaxes = yearlyData.reduce((sum, y) => sum + y.taxPaid, 0);
    const totalTaxOnGains = yearlyData.reduce((sum, y) => sum + (y.taxOnGains || 0), 0);
    const totalTaxOnPrincipal = yearlyData.reduce((sum, y) => sum + (y.taxOnPrincipal || 0), 0);
    const totalGains = yearlyData.reduce((sum, y) => sum + y.totalGain, 0);
    const crisisYears = yearlyData.filter(y => y.isInCrisis).length;
    const crisisYearsList = yearlyData.filter(y => y.isInCrisis).map(y => y.year);
    const totalRebalanced = yearlyData.reduce((sum, y) => sum + (y.rebalanceAmount || 0), 0);
    
    console.log('SUMMARY - Crisis Years Found:', crisisYears, 'Years:', crisisYearsList);
    console.log('SUMMARY - Total Rebalanced:', formatCurrency(totalRebalanced));
    console.log('SUMMARY - Tax Breakdown:', {
      total: totalTaxes,
      onGains: totalTaxOnGains,
      onPrincipal: totalTaxOnPrincipal
    });
    
    return {
      duration: yearlyData.length,
      finalAge: lastYear.age,
      finalValue: lastYear.totalDepot,
      totalWithdrawn,
      totalTaxes,
      totalTaxOnGains,
      totalTaxOnPrincipal,
      totalGains,
      avgReturn: (totalGains / params.startCapital) * 100,
      crisisYears,
      crisisYearsList,
      totalRebalanced
    };
  }, [yearlyData, params.startCapital]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0e0',
      fontFamily: '"Helvetica Neue", -apple-system, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          marginBottom: '10px'
        }}>
          <TrendingUp size={48} color="#4ecca3" />
          <h1 style={{ 
            margin: 0,
            fontSize: '42px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #4ecca3 0%, #96e6a1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Depot-Reichweiten Simulator
          </h1>
        </div>
        <p style={{ 
          margin: '0',
          fontSize: '16px',
          color: '#a0a0a0',
          fontWeight: '300'
        }}>
          Professionelle Simulation mit KI-gestützter Optimierung
        </p>
      </div>

      {/* Input Form */}
      {!showResults && (
        <div style={{ 
          maxWidth: '1400px', 
          margin: '30px auto',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            fontSize: '28px',
            marginBottom: '30px',
            color: '#4ecca3'
          }}>
            Simulationsparameter
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {/* Basic Parameters */}
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Startkapital (€)
              </label>
              <input
                type="number"
                value={params.startCapital}
                onChange={(e) => setParams({...params, startCapital: parseFloat(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Startalter
              </label>
              <input
                type="number"
                value={params.startAge}
                onChange={(e) => setParams({...params, startAge: parseInt(e.target.value) || 60})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Simulationsmodus
              </label>
              <select
                value={params.simulationMode}
                onChange={(e) => setParams({...params, simulationMode: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              >
                <option value="withdrawal">Bis Depot auf Null</option>
                <option value="years">Feste Laufzeit</option>
              </select>
            </div>

            {params.simulationMode === 'years' && (
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  color: '#c0c0c0',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Ziellaufzeit (Jahre)
                </label>
                <input
                  type="number"
                  value={params.targetYears}
                  onChange={(e) => setParams({...params, targetYears: parseInt(e.target.value) || 30})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
              </div>
            )}
          </div>

          {/* Depot Allocation */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3'
          }}>
            Depot-Aufteilung & Renditen
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Percent size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Konservatives Depot (%)
              </label>
              <input
                type="number"
                value={params.conservativePercent}
                onChange={(e) => setParams({
                  ...params, 
                  conservativePercent: parseFloat(e.target.value) || 0,
                  aggressivePercent: 100 - (parseFloat(e.target.value) || 0)
                })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Rendite Konservativ (% p.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={params.conservativeReturn}
                onChange={(e) => setParams({...params, conservativeReturn: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Percent size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Aggressives Depot (%)
              </label>
              <input
                type="number"
                value={params.aggressivePercent}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#999',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Rendite Aggressiv (% p.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={params.aggressiveReturn}
                onChange={(e) => setParams({...params, aggressiveReturn: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          {/* Withdrawal Parameters */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3'
          }}>
            Entnahme-Parameter
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Basis Netto-Entnahme pro Jahr (€)
              </label>
              <input
                type="number"
                value={params.withdrawalAmount}
                onChange={(e) => setParams({...params, withdrawalAmount: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
              {params.useAgePattern && (
                <small style={{ color: '#ffc107', display: 'block', marginTop: '5px', fontWeight: '500' }}>
                  ⚠️ Wird durch Altersprofil angepasst (z.B. {'<'}64 Jahre: +10%)
                </small>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={params.adjustForInflation}
                  onChange={(e) => setParams({...params, adjustForInflation: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                Entnahme inflationsangepasst
              </label>
            </div>

            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={params.useAgePattern}
                  onChange={(e) => setParams({...params, useAgePattern: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                Altersabhängiges Entnahmemuster
              </label>
              {params.useAgePattern && (
                <div style={{ 
                  background: 'rgba(255,193,7,0.1)',
                  border: '1px solid rgba(255,193,7,0.3)',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '12px'
                }}>
                  <small style={{ color: '#ffc107', display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '13px' }}>
                    Basis-Entnahme wird altersabhängig angepasst:
                  </small>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#e0e0e0', fontSize: '12px' }}>Bis 63 Jahre:</span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={params.agePatternUnder64}
                        onChange={(e) => setParams({...params, agePatternUnder64: parseInt(e.target.value)})}
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        value={params.agePatternUnder64}
                        onChange={(e) => setParams({...params, agePatternUnder64: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#e0e0e0', fontSize: '12px' }}>64-74 Jahre:</span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={params.agePattern64to74}
                        onChange={(e) => setParams({...params, agePattern64to74: parseInt(e.target.value)})}
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        value={params.agePattern64to74}
                        onChange={(e) => setParams({...params, agePattern64to74: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#e0e0e0', fontSize: '12px' }}>75-84 Jahre:</span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={params.agePattern75to84}
                        onChange={(e) => setParams({...params, agePattern75to84: parseInt(e.target.value)})}
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        value={params.agePattern75to84}
                        onChange={(e) => setParams({...params, agePattern75to84: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#e0e0e0', fontSize: '12px' }}>Ab 85 Jahre:</span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={params.agePattern85plus}
                        onChange={(e) => setParams({...params, agePattern85plus: parseInt(e.target.value)})}
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        value={params.agePattern85plus}
                        onChange={(e) => setParams({...params, agePattern85plus: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                  
                  <small style={{ display: 'block', marginTop: '10px', color: '#999', fontSize: '11px', fontStyle: 'italic' }}>
                    100% = Basis-Entnahme | &lt;100% = weniger | &gt;100% = mehr
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Crisis Management */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={24} />
            Krisenszenarien
          </h3>

          {/* IMPORTANT INFO BOX */}
          <div style={{
            background: 'rgba(78, 204, 163, 0.15)',
            border: '3px solid #4ecca3',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              color: '#4ecca3', 
              fontSize: '18px', 
              fontWeight: '700',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ℹ️ WICHTIG: Wie Krisen funktionieren
            </div>
            <div style={{ color: '#fff', fontSize: '15px', lineHeight: '1.8' }}>
              <strong>In Krisenzeiten:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '24px' }}>
                <li>
                  <strong style={{ color: '#eb5757' }}>📉 Aggressives Depot:</strong> Erleidet die eingestellten Verluste (z.B. -10% pro Jahr)
                </li>
                <li>
                  <strong style={{ color: '#4ecca3' }}>✅ Konservatives Depot:</strong> Erzielt weiterhin seine <strong>normale Rendite</strong> von +{params.conservativeReturn}% pro Jahr
                </li>
                <li>
                  <strong>💰 Entnahmen:</strong> Werden um den Reduktions-Prozentsatz verringert
                </li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            {/* Crisis 1 */}
            <div style={{
              background: 'rgba(235, 87, 87, 0.05)',
              border: '2px solid rgba(235, 87, 87, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#eb5757',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                <input
                  type="checkbox"
                  checked={params.useCrisis1}
                  onChange={(e) => setParams({...params, useCrisis1: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                🔴 Krise 1
              </label>

              {params.useCrisis1 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Start Jahr
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={params.crisis1StartYear}
                        onChange={(e) => setParams({...params, crisis1StartYear: parseInt(e.target.value) || 1})}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(235, 87, 87, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Jahre
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={params.crisis1Years}
                        onChange={(e) => {
                          const newYears = parseInt(e.target.value) || 1;
                          const newReturns = Array(newYears).fill(0).map((_, i) => 
                            i < params.crisis1Returns.length ? params.crisis1Returns[i] : -10
                          );
                          setParams({...params, crisis1Years: newYears, crisis1Returns: newReturns});
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(235, 87, 87, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Reduktion %
                      </label>
                      <input
                        type="number"
                        step="5"
                        value={params.crisis1Reduction}
                        onChange={(e) => setParams({...params, crisis1Reduction: parseFloat(e.target.value) || 0})}
                        min="0"
                        max="100"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(235, 87, 87, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    padding: '12px',
                    background: 'rgba(235, 87, 87, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      color: '#eb5757',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      📉 Verlust aggressives Depot pro Jahr
                    </div>
                    <small style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px', fontSize: '10px' }}>
                      Konservativ: weiterhin +{params.conservativeReturn}% p.a.
                    </small>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                      {Array(params.crisis1Years).fill(0).map((_, index) => (
                        <div key={index}>
                          <label style={{ display: 'block', color: '#eb5757', marginBottom: '4px', fontWeight: '600', fontSize: '10px' }}>
                            J{index + 1}
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={Math.abs(params.crisis1Returns[index] || 0)}
                            onChange={(e) => {
                              const newReturns = [...params.crisis1Returns];
                              newReturns[index] = -Math.abs(parseFloat(e.target.value) || 0);
                              setParams({...params, crisis1Returns: newReturns});
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              borderRadius: '4px',
                              border: '2px solid rgba(235, 87, 87, 0.4)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              fontSize: '12px',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}
                          />
                          <small style={{ display: 'block', textAlign: 'center', color: '#eb5757', marginTop: '2px', fontSize: '9px' }}>
                            {params.crisis1Returns[index] || 0}%
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '11px' }}>
                    📅 Jahr {params.crisis1StartYear}-{params.crisis1StartYear + params.crisis1Years - 1} • 
                    Σ {params.crisis1Returns.reduce((sum, r) => sum + Math.abs(r), 0).toFixed(0)}% Verlust
                  </small>
                </>
              )}
            </div>

            {/* Crisis 2 */}
            <div style={{
              background: 'rgba(255, 159, 64, 0.05)',
              border: '2px solid rgba(255, 159, 64, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#ff9f40',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                <input
                  type="checkbox"
                  checked={params.useCrisis2}
                  onChange={(e) => setParams({...params, useCrisis2: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                🟠 Krise 2
              </label>

              {params.useCrisis2 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Start Jahr
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={params.crisis2StartYear}
                        onChange={(e) => setParams({...params, crisis2StartYear: parseInt(e.target.value) || 1})}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(255, 159, 64, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Jahre
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={params.crisis2Years}
                        onChange={(e) => {
                          const newYears = parseInt(e.target.value) || 1;
                          const newReturns = Array(newYears).fill(0).map((_, i) => {
                            if (i < params.crisis2Returns.length) {
                              return params.crisis2Returns[i];
                            }
                            return i === 0 ? -30 : -10; // First year -30%, others -10%
                          });
                          setParams({...params, crisis2Years: newYears, crisis2Returns: newReturns});
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(255, 159, 64, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '6px', fontSize: '12px' }}>
                        Reduktion %
                      </label>
                      <input
                        type="number"
                        step="5"
                        value={params.crisis2Reduction}
                        onChange={(e) => setParams({...params, crisis2Reduction: parseFloat(e.target.value) || 0})}
                        min="0"
                        max="100"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid rgba(255, 159, 64, 0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    padding: '12px',
                    background: 'rgba(255, 159, 64, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      color: '#ff9f40',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      📉 Verlust aggressives Depot pro Jahr
                    </div>
                    <small style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px', fontSize: '10px' }}>
                      Konservativ: weiterhin +{params.conservativeReturn}% p.a.
                    </small>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                      {Array(params.crisis2Years).fill(0).map((_, index) => (
                        <div key={index}>
                          <label style={{ display: 'block', color: '#ff9f40', marginBottom: '4px', fontWeight: '600', fontSize: '10px' }}>
                            J{index + 1}
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={Math.abs(params.crisis2Returns[index] || 0)}
                            onChange={(e) => {
                              const newReturns = [...params.crisis2Returns];
                              newReturns[index] = -Math.abs(parseFloat(e.target.value) || 0);
                              setParams({...params, crisis2Returns: newReturns});
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              borderRadius: '4px',
                              border: '2px solid rgba(255, 159, 64, 0.4)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              fontSize: '12px',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}
                          />
                          <small style={{ display: 'block', textAlign: 'center', color: '#ff9f40', marginTop: '2px', fontSize: '9px' }}>
                            {params.crisis2Returns[index] || 0}%
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '11px' }}>
                    📅 Jahr {params.crisis2StartYear}-{params.crisis2StartYear + params.crisis2Years - 1} • 
                    Σ {params.crisis2Returns.reduce((sum, r) => sum + Math.abs(r), 0).toFixed(0)}% Verlust
                  </small>
                </>
              )}
            </div>
          </div>

          {/* Minimum Balance */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3'
          }}>
            Depot-Ziel
          </h3>

          <div style={{ 
            background: 'rgba(78, 204, 163, 0.1)',
            border: '1px solid rgba(78, 204, 163, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
              color: '#c0c0c0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={params.useMinimumBalance}
                onChange={(e) => setParams({...params, useMinimumBalance: e.target.checked})}
                style={{ width: '20px', height: '20px' }}
              />
              Mindestbetrag im Depot erhalten
            </label>

            {params.useMinimumBalance && (
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  color: '#c0c0c0',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  Gewünschter Restbetrag (€)
                </label>
                <input
                  type="number"
                  value={params.minimumBalance}
                  onChange={(e) => setParams({...params, minimumBalance: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
                <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
                  Simulation stoppt, wenn dieser Betrag erreicht wird
                </small>
              </div>
            )}

            {!params.useMinimumBalance && (
              <small style={{ color: '#999', display: 'block' }}>
                Depot wird vollständig aufgebraucht (bis 0 €)
              </small>
            )}
          </div>

          {/* Strategy & Scenario */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3'
          }}>
            Strategie & Markt-Szenario
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Entnahmestrategie
              </label>
              <select
                value={params.strategy}
                onChange={(e) => setParams({...params, strategy: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              >
                <option value="yield">Ertragsoptimiert</option>
                <option value="risk">Risikominimiert</option>
                <option value="optimized-risk">Optimiertes Risiko Modell</option>
              </select>
              <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
                {params.strategy === 'yield' && 'Entnahme aus höherrentierlichem Depot zuerst (veraltet)'}
                {params.strategy === 'risk' && 'Konservatives Depot zuerst (veraltet)'}
                {params.strategy === 'optimized-risk' && (
                  <span style={{ color: '#4ecca3', fontWeight: '500' }}>
                    ✓ Empfohlen: 6-Jahre-Puffer wird automatisch aufrechterhalten
                  </span>
                )}
              </small>
              
              <div style={{
                marginTop: '12px',
                background: 'rgba(78, 204, 163, 0.1)',
                border: '1px solid rgba(78, 204, 163, 0.3)',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                <div style={{ color: '#4ecca3', fontWeight: '600', marginBottom: '8px' }}>
                  ℹ️ 6-Jahre-Puffer-System (immer aktiv)
                </div>
                <div style={{ color: '#c0c0c0' }}>
                  <strong>So funktioniert es:</strong>
                  <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
                    <li>Konservatives Depot hält <strong>immer 6 Jahre</strong> Liquidität</li>
                    <li>Entnahmen erfolgen <strong>nur</strong> aus konservativem Depot</li>
                    <li>Aggressives Depot füllt automatisch nach (Rebalancing)</li>
                    <li><strong>Während Krise:</strong> Aggressives Depot geschützt, kein Rebalancing</li>
                  </ul>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                    💡 Dadurch werden Verkäufe aus dem aggressiven Depot in Crashphasen vermieden!
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Markt-Szenario
              </label>
              <select
                value={params.scenario}
                onChange={(e) => setParams({...params, scenario: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              >
                <option value="constant">Konstant</option>
                <option value="volatile">Volatil</option>
                <option value="crash">Börsencrash (Jahr 3-4)</option>
                <option value="boom">Boom Phase (5 Jahre)</option>
              </select>
            </div>
          </div>

          {/* Tax & Inflation */}
          <h3 style={{ 
            fontSize: '22px',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#4ecca3'
          }}>
            Steuern & Inflation
          </h3>

          <div style={{
            background: 'rgba(78, 204, 163, 0.1)',
            border: '1px solid rgba(78, 204, 163, 0.3)',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>ℹ️</span>
              <div style={{ fontSize: '13px', color: '#c0c0c0', lineHeight: '1.6' }}>
                <strong style={{ color: '#4ecca3' }}>Steuerberechnung:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li><strong>Erträge:</strong> Abgeltungssteuer auf Jahreserträge (nach Sparerpauschbetrag)</li>
                  <li><strong>Substanzverkauf:</strong> Abgeltungssteuer auf <strong>50% Gewinnanteil</strong> (Vereinfachung)</li>
                </ul>
                <small style={{ color: '#999', fontStyle: 'italic' }}>
                  Beispiel: Bei 10.000€ Substanzverkauf werden 5.000€ als Gewinn angenommen → 1.250€ Steuer (25%)
                </small>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Percent size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Abgeltungssteuer (%)
              </label>
              <input
                type="number"
                value={params.taxRate}
                onChange={(e) => setParams({...params, taxRate: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Sparerpauschbetrag (€)
              </label>
              <input
                type="number"
                value={params.freibetrag}
                onChange={(e) => setParams({...params, freibetrag: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={params.useInflation}
                  onChange={(e) => setParams({...params, useInflation: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                Inflation berücksichtigen
              </label>
            </div>

            {params.useInflation && (
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  color: '#c0c0c0',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Inflationsrate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.inflation}
                  onChange={(e) => setParams({...params, inflation: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowResults(true)}
            style={{
              marginTop: '40px',
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #4ecca3 0%, #3a9d87 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(78, 204, 163, 0.4)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Simulation starten
          </button>
        </div>
      )}

      {/* Results */}
      {showResults && summary && (
        <div style={{ 
          maxWidth: '1400px', 
          margin: '30px auto'
        }}>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {params.useCrisisManagement && summary.crisisYears > 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(255, 193, 7, 0.15)',
                border: '2px solid rgba(255, 193, 7, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <AlertCircle size={24} color="#ffc107" />
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#ffc107' }}>
                    Krisenmanagement aktiv
                  </h3>
                </div>
                <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px' }}>
                  <strong>{summary.crisisYears} Krisenjahre</strong> mit reduzierten Entnahmen
                  {params.crisisMode === 'percentage' 
                    ? ` (${params.crisisReductionPercent}% Reduktion)` 
                    : ` (${formatCurrency(params.crisisAbsoluteAmount)})`}
                  {' • '}
                  <span style={{ color: '#ffc107' }}>
                    {params.crisisTiming === 'random' && 'Zufällig verteilt'}
                    {params.crisisTiming === 'beginning' && 'Am Anfang platziert'}
                    {params.crisisTiming === 'middle' && 'In der Mitte platziert'}
                    {params.crisisTiming === 'end' && 'Am Ende platziert'}
                  </span>
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#ffc107', fontSize: '12px' }}>
                  Krisenjahre: {summary.crisisYearsList.join(', ')}
                </p>
              </div>
            )}
            
            {params.useCrisisManagement && summary.crisisYears === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(235, 87, 87, 0.15)',
                border: '2px solid rgba(235, 87, 87, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={24} color="#eb5757" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#eb5757' }}>
                      ⚠️ Keine Krisenjahre gefunden
                    </h3>
                    <p style={{ margin: '5px 0 0 0', color: '#e0e0e0', fontSize: '14px' }}>
                      Krisenmanagement ist aktiviert, aber keine Krisenjahre wurden in die Simulation aufgenommen.
                      Überprüfen Sie die Einstellungen.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {summary.crisisYears > 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(235, 87, 87, 0.15)',
                border: '2px solid rgba(235, 87, 87, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <AlertCircle size={24} color="#eb5757" />
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#eb5757' }}>
                    Krisenmanagement aktiv
                  </h3>
                </div>
                <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px' }}>
                  <strong>{summary.crisisYears} Krisenjahre</strong> 
                  {params.crisisMode === 'auto' ? ' erkannt (Aggressives Depot sank >15%)' : ' simuliert (manuell definiert)'}
                  {' • '}
                  <span style={{ color: '#eb5757' }}>
                    Entnahmen reduziert & Aggressives Depot geschützt
                  </span>
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#eb5757', fontSize: '12px' }}>
                  {params.crisisMode === 'auto' ? '🤖 Auto-Modus' : '⚙️ Manuell-Modus'} • Krisenjahre: {summary.crisisYearsList.join(', ')}
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#c0c0c0', fontSize: '13px', fontStyle: 'italic' }}>
                  💡 Während der Krise: Entnahmen um {params.crisisReductionPercent}% reduziert, 
                  nur aus konservativem Depot entnommen
                </p>
              </div>
            )}
            
            {summary.totalRebalanced > 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(78, 204, 163, 0.1)',
                border: '2px solid rgba(78, 204, 163, 0.4)',
                borderRadius: '16px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px' }}>⚖️</span>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#4ecca3' }}>
                    Automatisches Rebalancing
                  </h3>
                </div>
                <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px' }}>
                  <strong>{formatCurrency(summary.totalRebalanced)}</strong> insgesamt vom aggressiven ins konservative Depot transferiert
                  {' • '}
                  <span style={{ color: '#4ecca3' }}>
                    6-Jahre-Puffer aufrechterhalten
                  </span>
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#c0c0c0', fontSize: '13px', fontStyle: 'italic' }}>
                  💡 Das konservative Depot wird automatisch nachgefüllt, um stets 6 Jahre Liquidität zu garantieren. 
                  Während Krisenzeiten wird das aggressive Depot geschützt (kein Transfer).
                </p>
              </div>
            )}
            
            <div style={{
              background: 'rgba(78, 204, 163, 0.1)',
              border: '1px solid rgba(78, 204, 163, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Calendar size={24} color="#4ecca3" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#c0c0c0' }}>Laufzeit</h3>
              </div>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#4ecca3' }}>
                {summary.duration} Jahre
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
                Bis Alter {summary.finalAge}
              </p>
            </div>

            <div style={{
              background: summary.finalValue > 0 ? 'rgba(78, 204, 163, 0.1)' : 'rgba(235, 87, 87, 0.1)',
              border: summary.finalValue > 0 ? '1px solid rgba(78, 204, 163, 0.3)' : '1px solid rgba(235, 87, 87, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <DollarSign size={24} color={summary.finalValue > 0 ? '#4ecca3' : '#eb5757'} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#c0c0c0' }}>Endwert</h3>
              </div>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: summary.finalValue > 0 ? '#4ecca3' : '#eb5757' }}>
                {formatCurrency(summary.finalValue)}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
                {params.useMinimumBalance && summary.finalValue >= params.minimumBalance
                  ? `✅ Mindestbetrag von ${formatCurrency(params.minimumBalance)} erhalten` 
                  : params.useMinimumBalance && summary.finalValue > 0 && summary.finalValue < params.minimumBalance
                    ? `⚠️ Unter Mindestbetrag (Ziel: ${formatCurrency(params.minimumBalance)})`
                    : summary.finalValue > 0 
                      ? 'Restguthaben' 
                      : 'Depot aufgebraucht'}
              </p>
            </div>

            <div style={{
              background: 'rgba(78, 204, 163, 0.1)',
              border: '1px solid rgba(78, 204, 163, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <TrendingUp size={24} color="#4ecca3" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#c0c0c0' }}>Gesamtertrag</h3>
              </div>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#4ecca3' }}>
                {formatCurrency(summary.totalGains)}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
                {formatPercent(summary.avgReturn)} ROI
              </p>
            </div>

            <div style={{
              background: 'rgba(235, 87, 87, 0.1)',
              border: '1px solid rgba(235, 87, 87, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <TrendingDown size={24} color="#eb5757" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#c0c0c0' }}>Steuern</h3>
              </div>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#eb5757' }}>
                {formatCurrency(summary.totalTaxes)}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
                {formatPercent((summary.totalTaxes / summary.totalWithdrawn) * 100)} der Entnahmen
              </p>
              {(summary.totalTaxOnGains > 0 || summary.totalTaxOnPrincipal > 0) && (
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(235, 87, 87, 0.3)',
                  fontSize: '12px',
                  color: '#c0c0c0',
                  lineHeight: '1.6'
                }}>
                  {summary.totalTaxOnGains > 0 && (
                    <div>↳ Auf Erträge: {formatCurrency(summary.totalTaxOnGains)}</div>
                  )}
                  {summary.totalTaxOnPrincipal > 0 && (
                    <div>↳ Auf Substanz: {formatCurrency(summary.totalTaxOnPrincipal)}</div>
                  )}
                  <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
                    (Substanz: 50% Gewinnanteil)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Optimization */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={24} color="#4ecca3" />
                <h3 style={{ margin: 0, fontSize: '22px', color: '#4ecca3' }}>KI-gestützte Optimierung</h3>
              </div>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4ecca3 0%, #3a9d87 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isOptimizing ? 'not-allowed' : 'pointer',
                  opacity: isOptimizing ? 0.6 : 1
                }}
              >
                {isOptimizing ? 'Analysiere...' : 'Mit Claude optimieren'}
              </button>
            </div>

            {aiOptimization && (
              <div>
                <div style={{ 
                  background: 'rgba(78, 204, 163, 0.1)',
                  border: '1px solid rgba(78, 204, 163, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <AlertCircle size={20} color="#4ecca3" />
                    <strong style={{ color: '#4ecca3' }}>Bewertung: {aiOptimization.rating}</strong>
                  </div>
                  <p style={{ margin: '10px 0', color: '#e0e0e0' }}>{aiOptimization.summary}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#c0c0c0', marginBottom: '10px' }}>Empfehlungen:</h4>
                  <ul style={{ color: '#a0a0a0', lineHeight: '1.8' }}>
                    {aiOptimization.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {aiOptimization.optimizedAllocation && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <strong style={{ color: '#c0c0c0' }}>Optimierte Aufteilung:</strong>
                    <p style={{ margin: '10px 0 0 0', color: '#a0a0a0' }}>
                      Konservativ: {aiOptimization.optimizedAllocation.conservative}% | 
                      Aggressiv: {aiOptimization.optimizedAllocation.aggressive}%
                    </p>
                  </div>
                )}

                {aiOptimization.riskAssessment && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '15px',
                    marginTop: '10px'
                  }}>
                    <strong style={{ color: '#c0c0c0' }}>Risikobewertung:</strong>
                    <p style={{ margin: '10px 0 0 0', color: '#a0a0a0' }}>{aiOptimization.riskAssessment}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tax Optimization */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(235, 87, 87, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingDown size={24} color="#eb5757" />
                <h3 style={{ margin: 0, fontSize: '22px', color: '#eb5757' }}>KI-Steueroptimierung</h3>
              </div>
              <button
                onClick={handleTaxOptimize}
                disabled={isOptimizingTax}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #eb5757 0%, #c94545 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isOptimizingTax ? 'not-allowed' : 'pointer',
                  opacity: isOptimizingTax ? 0.6 : 1
                }}
              >
                {isOptimizingTax ? 'Analysiere Steuern...' : 'Steuern optimieren'}
              </button>
            </div>

            <div style={{
              background: 'rgba(235, 87, 87, 0.1)',
              border: '1px solid rgba(235, 87, 87, 0.3)',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#c0c0c0',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#eb5757' }}>💡 Was macht der Steueroptimierer?</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Analysiert Ihre Simulation und findet konkrete Wege, um Steuern zu senken:
                Bessere Nutzung des Freibetrags, optimiertes Timing, Depot-Restrukturierung und mehr.
              </p>
            </div>

            {taxOptimization && (
              <div>
                {/* Savings Overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '25px'
                }}>
                  <div style={{
                    background: 'rgba(78, 204, 163, 0.1)',
                    border: '2px solid rgba(78, 204, 163, 0.4)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#4ecca3', marginBottom: '5px' }}>
                      Einsparpotenzial
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#4ecca3' }}>
                      {formatCurrency(taxOptimization.potentialSavings)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      {taxOptimization.savingsPercent}% der Gesamtsteuern
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '2px solid rgba(255, 193, 7, 0.4)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#ffc107', marginBottom: '5px' }}>
                      Priorität
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffc107' }}>
                      {taxOptimization.priority}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      Handlungsbedarf
                    </div>
                  </div>
                </div>

                {/* Quick Wins */}
                {taxOptimization.quickWins && taxOptimization.quickWins.length > 0 && (
                  <div style={{
                    background: 'rgba(78, 204, 163, 0.1)',
                    border: '1px solid rgba(78, 204, 163, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '20px' }}>⚡</span>
                      <strong style={{ color: '#4ecca3', fontSize: '16px' }}>Quick Wins (Sofort umsetzbar)</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '25px', color: '#e0e0e0', lineHeight: '1.8' }}>
                      {taxOptimization.quickWins.map((win, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{win}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Recommendations */}
                {taxOptimization.recommendations && taxOptimization.recommendations.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#c0c0c0', marginBottom: '15px', fontSize: '18px' }}>
                      Detaillierte Empfehlungen:
                    </h4>
                    {taxOptimization.recommendations.map((rec, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderLeft: `4px solid ${rec.impact === 'Hoch' ? '#4ecca3' : rec.impact === 'Mittel' ? '#ffc107' : '#999'}`,
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                          <strong style={{ color: '#4ecca3', fontSize: '16px' }}>{rec.title}</strong>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              background: rec.impact === 'Hoch' ? 'rgba(78, 204, 163, 0.2)' : rec.impact === 'Mittel' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(150, 150, 150, 0.2)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: rec.impact === 'Hoch' ? '#4ecca3' : rec.impact === 'Mittel' ? '#ffc107' : '#999',
                              marginBottom: '5px'
                            }}>
                              {rec.impact} Impact
                            </div>
                            <div style={{ fontSize: '13px', color: '#4ecca3', fontWeight: '600' }}>
                              ~{formatCurrency(rec.savings)}
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#c0c0c0', lineHeight: '1.6', fontSize: '14px' }}>
                          {rec.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strategic Changes */}
                {taxOptimization.strategicChanges && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{ color: '#c0c0c0', marginBottom: '15px', fontSize: '18px' }}>
                      Strategische Anpassungen:
                    </h4>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {taxOptimization.strategicChanges.withdrawalTiming && (
                        <div>
                          <strong style={{ color: '#4ecca3', fontSize: '14px' }}>
                            📅 Entnahme-Timing:
                          </strong>
                          <p style={{ margin: '5px 0 0 0', color: '#c0c0c0', fontSize: '13px' }}>
                            {taxOptimization.strategicChanges.withdrawalTiming}
                          </p>
                        </div>
                      )}
                      {taxOptimization.strategicChanges.depotStructure && (
                        <div>
                          <strong style={{ color: '#4ecca3', fontSize: '14px' }}>
                            🏗️ Depot-Struktur:
                          </strong>
                          <p style={{ margin: '5px 0 0 0', color: '#c0c0c0', fontSize: '13px' }}>
                            {taxOptimization.strategicChanges.depotStructure}
                          </p>
                        </div>
                      )}
                      {taxOptimization.strategicChanges.freibetragOptimization && (
                        <div>
                          <strong style={{ color: '#4ecca3', fontSize: '14px' }}>
                            💰 Freibetrag-Optimierung:
                          </strong>
                          <p style={{ margin: '5px 0 0 0', color: '#c0c0c0', fontSize: '13px' }}>
                            {taxOptimization.strategicChanges.freibetragOptimization}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Depot Structure Optimization */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(78, 204, 163, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} color="#4ecca3" />
                <h3 style={{ margin: 0, fontSize: '22px', color: '#4ecca3' }}>KI-Depot-Struktur Vorschläge</h3>
              </div>
              <button
                onClick={handleDepotStructure}
                disabled={isOptimizingDepot}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4ecca3 0%, #3a9d87 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isOptimizingDepot ? 'not-allowed' : 'pointer',
                  opacity: isOptimizingDepot ? 0.6 : 1
                }}
              >
                {isOptimizingDepot ? 'Analysiere Struktur...' : 'Musterdepots erstellen'}
              </button>
            </div>

            <div style={{
              background: 'rgba(78, 204, 163, 0.1)',
              border: '1px solid rgba(78, 204, 163, 0.3)',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#c0c0c0',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#4ecca3' }}>💡 Was macht der Depot-Struktur-Vorschlag?</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Erstellt konkrete Musterdepots mit 5-7 spezifischen Titeln (ETFs, Gold, Anleihen, etc.) 
                inklusive prozentualer Gewichtung und Begründung für Ihre persönliche Situation.
              </p>
            </div>

            {depotStructure && (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Conservative Depot */}
                <div style={{
                  background: 'rgba(66, 135, 245, 0.1)',
                  border: '2px solid rgba(66, 135, 245, 0.4)',
                  borderRadius: '16px',
                  padding: '25px'
                }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#4287f5', fontSize: '20px', marginBottom: '8px' }}>
                      🛡️ Konservatives Depot
                    </h4>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#c0c0c0' }}>
                      <span><strong>Betrag:</strong> {formatCurrency(depotStructure.conservativeDepot.totalAmount)}</span>
                      <span><strong>Zielrendite:</strong> {depotStructure.conservativeDepot.targetReturn}% p.a.</span>
                      <span><strong>Risiko:</strong> {depotStructure.conservativeDepot.riskLevel}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    {depotStructure.conservativeDepot.positions.map((pos, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#4ecca3', fontSize: '15px' }}>{pos.name}</strong>
                            <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                              Erwartete Rendite: {pos.expectedReturn}% p.a.
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4287f5' }}>
                              {pos.allocation}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {formatCurrency(pos.amount)}
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#c0c0c0', fontSize: '13px', lineHeight: '1.5' }}>
                          {pos.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(66, 135, 245, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#e0e0e0',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#4287f5' }}>Strategie:</strong> {depotStructure.conservativeDepot.summary}
                  </div>
                </div>

                {/* Aggressive Depot */}
                <div style={{
                  background: 'rgba(235, 87, 87, 0.1)',
                  border: '2px solid rgba(235, 87, 87, 0.4)',
                  borderRadius: '16px',
                  padding: '25px'
                }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#eb5757', fontSize: '20px', marginBottom: '8px' }}>
                      🚀 Aggressives Depot
                    </h4>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#c0c0c0' }}>
                      <span><strong>Betrag:</strong> {formatCurrency(depotStructure.aggressiveDepot.totalAmount)}</span>
                      <span><strong>Zielrendite:</strong> {depotStructure.aggressiveDepot.targetReturn}% p.a.</span>
                      <span><strong>Risiko:</strong> {depotStructure.aggressiveDepot.riskLevel}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    {depotStructure.aggressiveDepot.positions.map((pos, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#4ecca3', fontSize: '15px' }}>{pos.name}</strong>
                            <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                              Erwartete Rendite: {pos.expectedReturn}% p.a.
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#eb5757' }}>
                              {pos.allocation}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {formatCurrency(pos.amount)}
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#c0c0c0', fontSize: '13px', lineHeight: '1.5' }}>
                          {pos.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(235, 87, 87, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#e0e0e0',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#eb5757' }}>Strategie:</strong> {depotStructure.aggressiveDepot.summary}
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#4ecca3', fontSize: '15px' }}>
                      📊 Rebalancing-Empfehlung:
                    </strong>
                    <p style={{ margin: '8px 0 0 0', color: '#c0c0c0', fontSize: '14px', lineHeight: '1.6' }}>
                      {depotStructure.rebalancingAdvice}
                    </p>
                  </div>

                  {depotStructure.additionalNotes && (
                    <div>
                      <strong style={{ color: '#4ecca3', fontSize: '15px' }}>
                        💡 Weitere Hinweise:
                      </strong>
                      <p style={{ margin: '8px 0 0 0', color: '#c0c0c0', fontSize: '14px', lineHeight: '1.6' }}>
                        {depotStructure.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Charts */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '22px', marginBottom: '20px', color: '#4ecca3' }}>
              Depotverlauf über die Zeit
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={yearlyData}>
                <defs>
                  <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecca3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4ecca3" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#96e6a1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#96e6a1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="#a0a0a0" label={{ value: 'Jahr', position: 'insideBottom', offset: -5, fill: '#a0a0a0' }} />
                <YAxis stroke="#a0a0a0" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(26, 26, 46, 0.95)', 
                    border: '1px solid rgba(78, 204, 163, 0.3)',
                    borderRadius: '8px',
                    color: '#e0e0e0'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Area type="monotone" dataKey="conservativeDepot" stackId="1" stroke="#4ecca3" fillOpacity={1} fill="url(#colorConservative)" name="Konservatives Depot" />
                <Area type="monotone" dataKey="aggressiveDepot" stackId="1" stroke="#96e6a1" fillOpacity={1} fill="url(#colorAggressive)" name="Aggressives Depot" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '22px', marginBottom: '20px', color: '#4ecca3' }}>
              Entnahmen: Ertrag vs. Substanz
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(26, 26, 46, 0.95)', 
                    border: '1px solid rgba(78, 204, 163, 0.3)',
                    borderRadius: '8px',
                    color: '#e0e0e0'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="fromGains" stackId="a" fill="#4ecca3" name="Aus Ertrag" />
                <Bar dataKey="fromPrincipal" stackId="a" fill="#eb5757" name="Aus Substanz" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)',
            overflowX: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', margin: 0, color: '#4ecca3' }}>
                Detaillierte Jahresübersicht
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => exportToExcel(yearlyData, params)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(78, 204, 163, 0.2)',
                    border: '1px solid rgba(78, 204, 163, 0.4)',
                    borderRadius: '8px',
                    color: '#4ecca3',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Excel Export
                </button>
                <button
                  onClick={() => exportToPDF(yearlyData, params)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(78, 204, 163, 0.2)',
                    border: '1px solid rgba(78, 204, 163, 0.4)',
                    borderRadius: '8px',
                    color: '#4ecca3',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileText size={16} />
                  PDF Export
                </button>
              </div>
            </div>

            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ 
                  background: 'rgba(78, 204, 163, 0.1)',
                  borderBottom: '2px solid rgba(78, 204, 163, 0.3)'
                }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#4ecca3' }}>Jahr</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#4ecca3' }}>Alter</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#4ecca3' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Konservativ</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Aggressiv</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Gesamt</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Δ Vorjahr</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Δ Gesamt</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Ertrag</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#96e6a1', fontSize: '11px' }} title="Bleibt auch in Krisen stabil!">
                    ↳ Konserv.
                    <div style={{ fontSize: '9px', color: '#4ecca3', marginTop: '2px' }}>
                      (stabil)
                    </div>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#96e6a1', fontSize: '11px' }} title="Verliert in Krisen">
                    ↳ Aggressiv
                    <div style={{ fontSize: '9px', color: '#eb5757', marginTop: '2px' }}>
                      (Krise)
                    </div>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Netto Entnahme</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Brutto</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Aus Ertrag</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Aus Substanz</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#4ecca3' }}>Steuer (Details)</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.map((row, index) => {
                  // Calculate age factor for display
                  let ageFactor = 1.0;
                  if (params.useAgePattern) {
                    const currentAge = row.age;
                    if (currentAge < 64) ageFactor = params.agePatternUnder64 / 100;
                    else if (currentAge < 75) ageFactor = params.agePattern64to74 / 100;
                    else if (currentAge < 85) ageFactor = params.agePattern75to84 / 100;
                    else ageFactor = params.agePattern85plus / 100;
                  }
                  
                  return (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      background: row.isInCrisis 
                        ? 'rgba(235, 87, 87, 0.25)' 
                        : (index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
                      borderLeft: row.isInCrisis ? '4px solid #eb5757' : 'none'
                    }}>
                      <td style={{ padding: '10px', color: '#e0e0e0', fontWeight: row.isInCrisis ? '600' : 'normal' }}>
                        {row.year}
                      </td>
                      <td style={{ padding: '10px', color: '#e0e0e0' }}>{row.age}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {row.isInCrisis ? (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#eb5757',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            <AlertCircle size={12} />
                            KRISE
                          </span>
                        ) : row.rebalanceAmount > 0 ? (
                          <span style={{ 
                            fontSize: '11px',
                            color: '#4ecca3',
                            fontWeight: '500'
                          }}>
                            ⚖️ 
                          </span>
                        ) : params.useAgePattern && ageFactor !== 1.0 ? (
                          <span style={{ 
                            fontSize: '11px',
                            color: '#ffc107',
                            fontWeight: '500'
                          }}>
                            {(ageFactor * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#666' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#4ecca3' }}>
                        {formatCurrency(row.conservativeDepot)}
                        {row.rebalanceAmount > 0 && (
                          <small style={{ display: 'block', color: '#4ecca3', fontSize: '10px', marginTop: '2px' }}>
                            ⬆️ +{formatCurrency(row.rebalanceAmount)}
                          </small>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#96e6a1' }}>
                        {formatCurrency(row.aggressiveDepot)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#fff', fontWeight: '600' }}>
                        {formatCurrency(row.totalDepot)}
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'right', 
                        color: row.depotChangeYoY >= 0 ? '#4ecca3' : '#eb5757',
                        fontWeight: '500'
                      }}>
                        {row.depotChangeYoY >= 0 ? '+' : ''}{row.depotChangeYoY.toFixed(2)}%
                        <small style={{ display: 'block', fontSize: '10px', color: '#999', marginTop: '2px' }}>
                          zum Vorjahr
                        </small>
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'right', 
                        color: row.depotChangeTotal >= 0 ? '#4ecca3' : '#eb5757',
                        fontWeight: '500'
                      }}>
                        {row.depotChangeTotal >= 0 ? '+' : ''}{row.depotChangeTotal.toFixed(2)}%
                        <small style={{ display: 'block', fontSize: '10px', color: '#999', marginTop: '2px' }}>
                          zum Start
                        </small>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: row.totalGain >= 0 ? '#4ecca3' : '#eb5757' }}>
                        {formatCurrency(row.totalGain)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: row.conservativeGain >= 0 ? '#96e6a1' : '#eb5757', fontSize: '12px' }}>
                        {formatCurrency(row.conservativeGain)}
                        {row.isInCrisis && row.conservativeGain > 0 && (
                          <span style={{ color: '#4ecca3', marginLeft: '4px', fontSize: '10px' }} title="Bleibt stabil!">✓</span>
                        )}
                        <small style={{ display: 'block', fontSize: '9px', color: '#999', marginTop: '2px' }}>
                          {row.conservativeReturn?.toFixed(1)}%
                        </small>
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'right', 
                        color: row.aggressiveGain >= 0 ? '#96e6a1' : '#eb5757', 
                        fontSize: '12px',
                        background: row.isInCrisis && row.aggressiveGain < 0 ? 'rgba(235, 87, 87, 0.1)' : 'transparent'
                      }}>
                        {formatCurrency(row.aggressiveGain)}
                        {row.isInCrisis && row.aggressiveGain < 0 && (
                          <span style={{ color: '#eb5757', marginLeft: '4px', fontSize: '10px' }} title="Krisenverlust!">⚠️</span>
                        )}
                        <small style={{ display: 'block', fontSize: '9px', color: row.isInCrisis && row.aggressiveGain < 0 ? '#eb5757' : '#999', marginTop: '2px' }}>
                          {row.aggressiveReturn?.toFixed(1)}%
                        </small>
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'right', 
                        color: row.isInCrisis ? '#eb5757' : '#e0e0e0',
                        fontWeight: row.isInCrisis ? '700' : 'normal'
                      }}>
                        {formatCurrency(row.withdrawalNominal)}
                        {params.useAgePattern && ageFactor !== 1.0 && !row.isInCrisis && (
                          <small style={{ display: 'block', color: '#999', fontSize: '10px' }}>
                            (Basis × {(ageFactor * 100).toFixed(0)}%)
                          </small>
                        )}
                        {row.isInCrisis && row.withdrawalPlanned && (
                          <small style={{ display: 'block', color: '#eb5757', fontSize: '10px', fontWeight: '600' }}>
                            ↓ von {formatCurrency(row.withdrawalPlanned)}
                          </small>
                        )}
                        {row.limitedByMinBalance && (
                          <small style={{ display: 'block', color: '#ffc107', fontSize: '10px', fontWeight: '600' }}>
                            ⚠️ Mindestbetrag erreicht
                          </small>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#e0e0e0' }}>
                        {formatCurrency(row.grossWithdrawal)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#4ecca3' }}>
                        {formatCurrency(row.fromGains)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#eb5757' }}>
                        {formatCurrency(row.fromPrincipal)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#eb5757' }}>
                        <div style={{ fontWeight: '600' }}>
                          {formatCurrency(row.taxPaid)}
                        </div>
                        {row.taxPaid > 0 && (
                          <div style={{ 
                            marginTop: '4px',
                            paddingTop: '4px',
                            borderTop: '1px solid rgba(235, 87, 87, 0.2)',
                            fontSize: '10px',
                            color: '#999',
                            lineHeight: '1.5'
                          }}>
                            {row.taxOnGains > 0 && (
                              <div>
                                ↳ Ertrag: {formatCurrency(row.taxOnGains)}
                              </div>
                            )}
                            {row.taxOnPrincipal > 0 && (
                              <>
                                <div>
                                  ↳ Substanz: {formatCurrency(row.taxOnPrincipal)}
                                </div>
                                <div style={{ fontStyle: 'italic', color: '#777', fontSize: '9px' }}>
                                  (50% Gewinn = {formatCurrency(row.principalGainsAssumed)})
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setShowResults(false);
              setAiOptimization(null);
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Neue Simulation starten
          </button>
        </div>
      )}
    </div>
  );
}