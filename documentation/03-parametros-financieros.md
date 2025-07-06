# Parámetros Financieros - Estructura de Capital

## Descripción General

Esta pestaña define la estructura de financiamiento del proyecto, incluyendo tasas de descuento, costos de capital y parámetros de deuda.

## Parámetros de Costo de Capital

### 1. WACC (Weighted Average Cost of Capital)

#### Cálculo del WACC

```javascript
function calculateWACC(Ke, Kd, equityWeight, debtWeight, taxRate) {
  // WACC = (E/V × Ke) + (D/V × Kd × (1-T))
  const equityComponent = equityWeight * Ke;
  const debtComponent = debtWeight * Kd * (1 - taxRate);

  return equityComponent + debtComponent;
}

// Valores base del modelo
const baseWACC = calculateWACC(
  0.12, // Ke = 12%
  0.06, // Kd = 6%
  0.65, // E/V = 65%
  0.35, // D/V = 35%
  0.25 // T = 25%
);
// Resultado: 9.375% → Redondeado a 8% para el modelo
```

#### Componentes del WACC

```javascript
const waccComponents = {
  equityComponent: {
    weight: 0.65, // 65% patrimonio
    cost: 0.12, // Ke = 12%
    contribution: 0.078, // 7.8% al WACC total
  },
  debtComponent: {
    weight: 0.35, // 35% deuda
    cost: 0.06, // Kd = 6%
    afterTaxCost: 0.045, // 4.5% después de impuestos
    contribution: 0.01575, // 1.575% al WACC total
  },
  totalWACC: 0.09375, // 9.375% teórico → 8% modelo
};
```

### 2. Ke (Costo del Patrimonio)

#### Modelo CAPM

```javascript
function calculateKe(riskFreeRate, beta, marketRiskPremium) {
  // Ke = Rf + β × (Rm - Rf)
  return riskFreeRate + beta * marketRiskPremium;
}

// Parámetros del modelo
const capmParameters = {
  riskFreeRate: 0.045, // 4.5% (Bonos del Tesoro USA 10 años)
  beta: 1.0, // Beta del proyecto (riesgo similar al mercado)
  marketRiskPremium: 0.075, // 7.5% prima de riesgo de mercado
  calculatedKe: 0.12, // 12% resultado
};
```

#### Justificación del Beta

```javascript
const betaAnalysis = {
  industry: "E-commerce Premium",
  comparables: [
    { company: "Luxury E-commerce", beta: 1.2 },
    { company: "Wine Retail", beta: 0.8 },
    { company: "Premium Food", beta: 1.0 },
  ],
  averageBeta: 1.0,
  adjustments: {
    startupRisk: +0.2, // Riesgo de startup
    geographicDiversification: -0.1, // Diversificación geográfica
    premiumPositioning: -0.1, // Posicionamiento premium
    finalBeta: 1.0,
  },
};
```

### 3. Kd (Costo de la Deuda)

#### Estructura de la Deuda

```javascript
const debtStructure = {
  bankDebt: {
    amount: 425000, // $425K (50% de $850K CAPEX)
    rate: 0.06, // 6% tasa nominal
    term: 5, // 5 años plazo
    type: "Term Loan",
  },

  // Cálculo del costo efectivo
  effectiveCost: {
    nominalRate: 0.06,
    taxShield: 0.015, // 1.5% (6% × 25% tax rate)
    afterTaxCost: 0.045, // 4.5% costo después de impuestos
  },
};
```

#### Cronograma de Amortización

```javascript
function calculateDebtSchedule(principal, rate, years) {
  const monthlyRate = rate / 12;
  const totalPayments = years * 12;

  // Cuota fija mensual
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= totalPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      interest: interestPayment,
      principal: principalPayment,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
}
```

## Estructura de Capital Objetivo

### Composición del Financiamiento

```javascript
const capitalStructure = {
  totalCapex: 850000, // $850K inversión total

  equity: {
    amount: 425000, // $425K (50%)
    percentage: 50,
    sources: [
      { type: "Founder Investment", amount: 300000 },
      { type: "Angel/Seed Round", amount: 125000 },
    ],
  },

  debt: {
    amount: 425000, // $425K (50%)
    percentage: 50,
    sources: [{ type: "Bank Term Loan", amount: 425000 }],
  },
};
```

### Ratios Financieros Objetivo

```javascript
const targetRatios = {
  debtToEquity: 1.0, // D/E = 50%/50% = 1.0
  debtToAssets: 0.5, // D/A = 50%
  equityMultiplier: 2.0, // Assets/Equity = 1/50% = 2.0

  // Ratios de cobertura
  interestCoverage: {
    minimum: 3.0, // EBIT/Interest ≥ 3.0x
    target: 5.0, // Objetivo 5.0x
  },

  debtService: {
    maximum: 0.3, // Debt Service/FCF ≤ 30%
    target: 0.25, // Objetivo 25%
  },
};
```

## Tasa de Impuestos

### Estructura Tributaria

```javascript
const taxStructure = {
  corporateRate: 0.25, // 25% tasa corporativa

  // Desglose por jurisdicción
  jurisdictions: {
    chile: { rate: 0.27, weight: 0.4 },
    mexico: { rate: 0.3, weight: 0.25 },
    brazil: { rate: 0.34, weight: 0.15 },
    canada: { rate: 0.26, weight: 0.1 },
    usa: { rate: 0.21, weight: 0.1 },
  },

  // Tasa efectiva ponderada
  effectiveRate: 0.25, // 25% promedio ponderado
};
```

### Escudo Fiscal

```javascript
function calculateTaxShield(interestExpense, taxRate) {
  return interestExpense * taxRate;
}

// Beneficio anual del escudo fiscal
const annualTaxShield = calculateTaxShield(
  280000 * 0.06, // $16.8K interés anual
  0.25 // 25% tasa impositiva
);
// Resultado: $4.2K ahorro fiscal anual
```

## Costo de Capital por Componente

### Análisis de Sensibilidad del WACC

```javascript
const waccSensitivity = {
  keVariations: [-2, -1, 0, 1, 2], // ±2pp en Ke
  kdVariations: [-1, -0.5, 0, 0.5, 1], // ±1pp en Kd

  calculateWACCMatrix: function (keBase, kdBase) {
    const matrix = [];

    this.keVariations.forEach((keVar) => {
      const row = [];
      this.kdVariations.forEach((kdVar) => {
        const newKe = keBase + keVar / 100;
        const newKd = kdBase + kdVar / 100;
        const wacc = calculateWACC(newKe, newKd, 0.65, 0.35, 0.25);
        row.push(wacc * 100); // En porcentaje
      });
      matrix.push(row);
    });

    return matrix;
  },
};
```

## Políticas Financieras

### Política de Dividendos

```javascript
const dividendPolicy = {
  payoutRatio: 0.0, // 0% en fase de crecimiento
  retentionRatio: 1.0, // 100% reinversión

  // Política futura (post 2030)
  matureDividendPolicy: {
    targetPayout: 0.4, // 40% payout ratio objetivo
    minimumCoverage: 2.0, // Cobertura mínima 2.0x
  },
};
```

### Política de Deuda

```javascript
const debtPolicy = {
  maximumLeverage: 0.4, // Máximo D/E = 40%
  minimumCoverage: 3.0, // Mínimo interest coverage

  refinancingPlan: {
    year3: {
      action: "Partial Prepayment",
      amount: 100000, // $100K prepago
      reason: "Reduce financial risk",
    },
    year5: {
      action: "Full Repayment",
      source: "Operating Cash Flow",
    },
  },
};
```

## Validación de Parámetros

### Rangos Aceptables

```javascript
const parameterValidation = {
  wacc: { min: 0.05, max: 0.15, current: 0.08 },
  ke: { min: 0.08, max: 0.2, current: 0.12 },
  kd: { min: 0.03, max: 0.12, current: 0.06 },

  equityWeight: { min: 0.5, max: 0.8, current: 0.65 },
  debtWeight: { min: 0.2, max: 0.5, current: 0.35 },
  taxRate: { min: 0.15, max: 0.35, current: 0.25 },
};
```

### Consistencia del Modelo

```javascript
function validateFinancialConsistency() {
  const checks = [];

  // Verificar que pesos sumen 100%
  if (Math.abs(equityWeight + debtWeight - 1.0) > 0.001) {
    checks.push("ERROR: Equity + Debt weights must equal 100%");
  }

  // Verificar WACC vs componentes
  const calculatedWACC = calculateWACC(
    ke,
    kd,
    equityWeight,
    debtWeight,
    taxRate
  );
  if (Math.abs(calculatedWACC - displayedWACC) > 0.005) {
    checks.push("WARNING: WACC calculation inconsistency");
  }

  // Verificar ratios de cobertura
  const projectedCoverage = calculateInterestCoverage();
  if (projectedCoverage < targetRatios.interestCoverage.minimum) {
    checks.push("ERROR: Interest coverage below minimum threshold");
  }

  return checks;
}
```

## Referencias de Código

- **Archivo principal**: `static/js/financial.js`
- **Funciones clave**:
  - `calculateWACC()`
  - `calculateKe()`
  - `calculateDebtSchedule()`
  - `validateFinancialConsistency()`
  - `updateFinancialDisplay()`
