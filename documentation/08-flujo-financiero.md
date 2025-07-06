# Flujo Financiero - FCF Considerando Estructura de Deuda

## Descripción General

Esta pestaña calcula el flujo de caja libre financiero del proyecto, considerando la estructura de deuda, pagos de intereses, amortización de capital y el impacto del escudo fiscal.

## Estructura del Flujo Financiero

### Diferencias vs Flujo Económico

```javascript
const financialVsEconomicDifferences = {
  startingPoint: "NOPAT (mismo que económico)",
  additions: ["Escudo fiscal por intereses", "Depreciación (add-back no cash)"],
  subtractions: [
    "Pago de intereses",
    "Amortización de capital",
    "Cambio en capital de trabajo",
    "CAPEX",
  ],
  result: "FCF disponible para accionistas",
};
```

### Fórmula del FCF Financiero

```javascript
function calculateFinancialFCF(year, modelData) {
  // 1. Partir del flujo económico base
  const economicFlow = calculateEconomicFCF(year, modelData);

  // 2. Ajustar por efectos financieros
  const debtService = calculateDebtService(year, modelData);
  const taxShield = calculateTaxShield(year, debtService.interest);

  // 3. FCF Financiero
  const financialFCF =
    economicFlow.nopat +
    economicFlow.depreciation +
    taxShield -
    debtService.interest -
    debtService.principal -
    economicFlow.workingCapitalChange -
    economicFlow.capex;

  return {
    ...economicFlow,
    debtService,
    taxShield,
    financialFCF,
  };
}
```

## Estructura de Deuda

### Parámetros de la Deuda

```javascript
const debtStructure = {
  principal: 280000, // $280K (35% del CAPEX)
  interestRate: 0.06, // 6% anual
  term: 5, // 5 años
  paymentType: "monthly", // Pagos mensuales
  startDate: "2025-Q2", // Inicio Q2 2025
};

// Cálculo de cuota mensual
function calculateMonthlyPayment(principal, rate, years) {
  const monthlyRate = rate / 12;
  const totalPayments = years * 12;

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  return monthlyPayment;
}

const monthlyPayment = calculateMonthlyPayment(280000, 0.06, 5);
// Resultado: $5,373.09 mensual
```

### Cronograma de Amortización

```javascript
function generateAmortizationSchedule(principal, rate, years) {
  const monthlyRate = rate / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, rate, years);

  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= years * 12; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      year: Math.ceil(month / 12) + 2024, // Empezar en 2025
      payment: monthlyPayment,
      interest: interestPayment,
      principal: principalPayment,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
}

// Agregación anual del servicio de deuda
function calculateAnnualDebtService(year) {
  const schedule = generateAmortizationSchedule(280000, 0.06, 5);

  const yearPayments = schedule.filter((payment) => payment.year === year);

  return {
    totalPayment: yearPayments.reduce((sum, p) => sum + p.payment, 0),
    totalInterest: yearPayments.reduce((sum, p) => sum + p.interest, 0),
    totalPrincipal: yearPayments.reduce((sum, p) => sum + p.principal, 0),
    endingBalance:
      yearPayments.length > 0
        ? yearPayments[yearPayments.length - 1].balance
        : 0,
  };
}
```

## Escudo Fiscal

### Cálculo del Escudo Fiscal

```javascript
function calculateTaxShield(year, interestExpense) {
  const taxRate = 0.25; // 25% tasa impositiva

  // Escudo fiscal = Intereses × Tasa impositiva
  const taxShield = interestExpense * taxRate;

  return {
    interestExpense,
    taxRate: taxRate * 100, // En porcentaje
    taxShield,
    description: "Ahorro fiscal por deducibilidad de intereses",
  };
}

// Escudo fiscal anual proyectado
const taxShieldProjections = {
  2025: 2520, // $16.8K interés × 25% × 6/12 meses
  2026: 4200, // $16.8K interés × 25%
  2027: 3675, // $14.7K interés × 25%
  2028: 3045, // $12.2K interés × 25%
  2029: 2310, // $9.2K interés × 25%
  2030: 1470, // $5.9K interés × 25%
};
```

## Cronograma de Servicio de Deuda

### Proyecciones Anuales

```javascript
const debtServiceSchedule = {
  2025: {
    // Solo 6 meses (Q3-Q4)
    payment: 32238, // $5,373 × 6 meses
    interest: 10080, // Interés promedio 6 meses
    principal: 22158, // Amortización capital
    endingBalance: 257842,
  },

  2026: {
    payment: 64477, // $5,373 × 12 meses
    interest: 16800, // Interés sobre saldo promedio
    principal: 47677, // Amortización capital
    endingBalance: 210165,
  },

  2027: {
    payment: 64477,
    interest: 14700,
    principal: 49777,
    endingBalance: 160388,
  },

  2028: {
    payment: 64477,
    interest: 12180,
    principal: 52297,
    endingBalance: 108091,
  },

  2029: {
    payment: 64477,
    interest: 9240,
    principal: 55237,
    endingBalance: 52854,
  },

  2030: {
    payment: 64477,
    interest: 5880,
    principal: 58597,
    endingBalance: 0, // Deuda totalmente pagada
  },
};
```

## Cálculo del FCF Financiero por Año

### 2025 - Año de Lanzamiento

```javascript
const financialFCF2025 = {
  // Flujo económico base
  nopat: 0, // Sin utilidades operativas
  depreciation: 0, // Sin depreciación año 1

  // Efectos financieros
  taxShield: 2520, // Escudo fiscal 6 meses
  interestPayment: 10080, // Interés 6 meses
  principalPayment: 22158, // Amortización 6 meses

  // Capital de trabajo y CAPEX
  workingCapitalChange: 25116,
  capex: 800000,

  // FCF Financiero
  fcf: 0 + 0 + 2520 - 10080 - 22158 - 25116 - 800000,
  result: -854834, // Fuertemente negativo por inversión inicial
};
```

### 2026 - Primer Año Completo

```javascript
const financialFCF2026 = {
  // Flujo económico base
  nopat: -65597, // NOPAT negativo por depreciación
  depreciation: 108143, // Add-back depreciación

  // Efectos financieros
  taxShield: 4200, // Escudo fiscal completo
  interestPayment: 16800, // Interés año completo
  principalPayment: 47677, // Amortización año completo

  // Capital de trabajo y CAPEX
  workingCapitalChange: 15000,
  capex: 0, // Sin CAPEX adicional

  // FCF Financiero
  fcf: -65597 + 108143 + 4200 - 16800 - 47677 - 15000 - 0,
  result: -32731, // Negativo pero mejorando
};
```

### 2030 - Año Final

```javascript
const financialFCF2030 = {
  // Flujo económico base
  nopat: 305576, // NOPAT positivo y creciente
  depreciation: 74143, // Depreciación menor

  // Efectos financieros
  taxShield: 1470, // Escudo fiscal menor (menos deuda)
  interestPayment: 5880, // Interés menor
  principalPayment: 58597, // Última amortización

  // Capital de trabajo y CAPEX
  workingCapitalChange: 8000,
  capex: 25000, // CAPEX mantenimiento

  // FCF Financiero antes de valor terminal
  fcfBeforeTV: 305576 + 74143 + 1470 - 5880 - 58597 - 8000 - 25000,
  result: 283712,

  // Valor terminal (solo para accionistas)
  terminalValue: 5778983,
  totalFCF: 6062695, // FCF + TV
};
```

## Métricas Financieras

### VAN Financiero

```javascript
function calculateFinancialNPV(financialCashFlows, ke = 0.12) {
  let npv = 0;

  financialCashFlows.forEach((cf, index) => {
    const year = index + 1;
    const discountedCF = cf / Math.pow(1 + ke, year);
    npv += discountedCF;
  });

  // Restar inversión de patrimonio (50% del CAPEX)
  const equityInvestment = 850000 * 0.5; // $425K
  npv -= equityInvestment;

  return npv;
}

// Tasa de descuento: Ke = 12% (costo del patrimonio)
```

### TIR Financiera

```javascript
function calculateFinancialIRR(financialCashFlows) {
  // Incluir inversión de patrimonio como CF negativo en t=0
  const equityInvestment = 850000 * 0.5; // $425K
  const fullCashFlows = [-equityInvestment, ...financialCashFlows];

  // Usar mismo método Newton-Raphson que TIR económica
  return calculateIRRIterative(fullCashFlows);
}
```

## Ratios de Cobertura

### Interest Coverage Ratio

```javascript
function calculateInterestCoverage(year, ebit, interestExpense) {
  if (interestExpense === 0) return Infinity;

  const coverage = ebit / interestExpense;

  return {
    ebit,
    interestExpense,
    coverage,
    status: coverage >= 3.0 ? "Adequate" : "Below Target",
    target: 3.0,
  };
}

// Proyecciones de cobertura
const coverageProjections = {
  2025: { coverage: 0, status: "N/A - EBIT negativo" },
  2026: { coverage: -3.9, status: "N/A - EBIT negativo" },
  2027: { coverage: 5.2, status: "Adequate" },
  2028: { coverage: 18.4, status: "Strong" },
  2029: { coverage: 34.7, status: "Very Strong" },
  2030: { coverage: 69.3, status: "Excellent" },
};
```

### Debt Service Coverage Ratio

```javascript
function calculateDebtServiceCoverage(year, fcf, debtService) {
  if (debtService === 0) return Infinity;

  // FCF disponible antes del servicio de deuda
  const fcfBeforeDebtService = fcf + debtService;
  const coverage = fcfBeforeDebtService / debtService;

  return {
    fcfBeforeDebtService,
    debtService,
    coverage,
    status: coverage >= 1.25 ? "Adequate" : "Below Target",
    target: 1.25,
  };
}
```

## Análisis de Apalancamiento

### Ratios de Endeudamiento

```javascript
function calculateLeverageRatios(year, totalDebt, totalAssets, ebitda) {
  return {
    debtToAssets: totalDebt / totalAssets,
    debtToEbitda: ebitda > 0 ? totalDebt / ebitda : null,

    targets: {
      debtToAssets: { max: 0.4, current: totalDebt / totalAssets },
      debtToEbitda: {
        max: 3.0,
        current: ebitda > 0 ? totalDebt / ebitda : null,
      },
    },
  };
}

// Evolución del apalancamiento
const leverageEvolution = {
  2025: { debtToAssets: 0.35, debtToEbitda: null },
  2026: { debtToAssets: 0.28, debtToEbitda: 4.9 },
  2027: { debtToAssets: 0.19, debtToEbitda: 1.8 },
  2028: { debtToAssets: 0.11, debtToEbitda: 0.6 },
  2029: { debtToAssets: 0.05, debtToEbitda: 0.2 },
  2030: { debtToAssets: 0.0, debtToEbitda: 0.0 },
};
```

## Comparación Económico vs Financiero

### Resumen Comparativo

```javascript
const economicVsFinancialComparison = {
  2025: {
    economic: -825116,
    financial: -854834,
    difference: -29718,
    reason: "Mayor inversión inicial (incluye deuda)",
  },

  2026: {
    economic: 27546,
    financial: -32731,
    difference: -60277,
    reason: "Servicio de deuda supera escudo fiscal",
  },

  2030: {
    economic: 6125702, // Incluye valor terminal
    financial: 6062695, // Incluye valor terminal
    difference: -62007,
    reason: "Menor por servicio de deuda acumulado",
  },

  npv: {
    economic: 2150000, // VAN económico (WACC 8%)
    financial: 1980000, // VAN financiero (Ke 12%)
    difference: -170000,
    reason: "Mayor tasa de descuento para accionistas",
  },
};
```

## Referencias de Código

- **Archivo principal**: `static/js/financial-cashflow.js`
- **Funciones clave**:
  - `calculateFinancialFCF()`
  - `calculateDebtService()`
  - `calculateTaxShield()`
  - `calculateFinancialNPV()`
  - `calculateInterestCoverage()`
