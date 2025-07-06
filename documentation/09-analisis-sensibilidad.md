# Análisis de Sensibilidad - Evaluación de Riesgos

## Descripción General

El análisis de sensibilidad evalúa cómo las variaciones en factores clave afectan la rentabilidad del proyecto, proporcionando una evaluación robusta de riesgos y oportunidades.

## Tasas de Descuento Utilizadas

### WACC (Costo Promedio Ponderado de Capital)

```javascript
// Cálculo del WACC
const WACC = (Ke × E/V) + (Kd × (1-T) × D/V)

// Donde:
const Ke = 0.12;    // Costo del patrimonio (12%)
const Kd = 0.06;    // Costo de la deuda (6%)
const E_V = 0.65;   // Patrimonio / Valor total (65%)
const D_V = 0.35;   // Deuda / Valor total (35%)
const T = 0.25;     // Tasa de impuestos (25%)

// WACC = (12% × 65%) + (6% × (1-25%) × 35%) = 9.375%
// Redondeado a 8% para el modelo base
```

### Ke (Costo del Patrimonio)

```javascript
// Modelo CAPM
const Ke = Rf + β × (Rm - Rf)

// Donde:
const Rf = 0.045;   // Tasa libre de riesgo (4.5%)
const beta = 1.0;   // Beta del proyecto (1.0)
const Rm_Rf = 0.075; // Prima de riesgo de mercado (7.5%)

// Ke = 4.5% + 1.0 × 7.5% = 12%
```

## Factores de Sensibilidad

### 1. Tráfico Web

```javascript
const trafficSensitivity = {
  name: "Tráfico Web",
  variations: [-50, -25, 0, 25, 50], // Porcentajes
  unit: "%",
  impactLevel: "Alto",
  description:
    "Base del modelo de ingresos. Variaciones impactan directamente revenue y FCF.",
};

// Cálculo del impacto
function calculateTrafficImpact(baseMetrics, variation) {
  const newTraffic = baseMetrics.baseTraffic * (1 + variation / 100);
  const revenueImpact =
    newTraffic * baseMetrics.conversion * baseMetrics.ticket * 12;
  const npvChange = revenueImpact * 0.46 * 3; // 46% margen × múltiplo 3

  return { npvChange, revenueImpact };
}
```

### 2. Tasa de Conversión

```javascript
const conversionSensitivity = {
  name: "Tasa de Conversión",
  variations: [-40, -20, 0, 20, 40], // Porcentajes
  unit: "%",
  impactLevel: "Alto",
  description:
    "Eficiencia de conversión. Crítico para la rentabilidad del modelo.",
};

// Cálculo del impacto
function calculateConversionImpact(baseMetrics, variation) {
  const newConversion = baseMetrics.conversion * (1 + variation / 100);
  const revenueImpact =
    baseMetrics.traffic * newConversion * baseMetrics.ticket * 12;
  const npvChange = revenueImpact * 0.46 * 3;

  return { npvChange, revenueImpact };
}
```

### 3. WACC (Tasa de Descuento)

```javascript
const waccSensitivity = {
  name: "WACC",
  variations: [-2, -1, 0, 1, 2], // Puntos porcentuales
  unit: "pp",
  impactLevel: "Alto",
  description:
    "Tasa de descuento para VAN económico. Afecta directamente la valoración.",
};

// Cálculo del impacto
function calculateWACCImpact(baseCashFlows, variation) {
  const newWACC = 0.08 + variation / 100; // 8% base + variación

  let newNPV = 0;
  baseCashFlows.forEach((cf, year) => {
    newNPV += cf / Math.pow(1 + newWACC, year + 1);
  });

  return newNPV / 1000000; // En millones
}
```

### 4. Ke (Costo del Patrimonio)

```javascript
const keSensitivity = {
  name: "Ke (Costo Patrimonio)",
  variations: [-3, -2, 0, 2, 3], // Puntos porcentuales
  unit: "pp",
  impactLevel: "Alto",
  description:
    "Tasa de descuento para VAN financiero. Afecta rentabilidad del accionista.",
};

// Cálculo del impacto
function calculateKeImpact(financialCashFlows, variation) {
  const newKe = 0.12 + variation / 100; // 12% base + variación

  let newFinancialNPV = 0;
  financialCashFlows.forEach((cf, year) => {
    newFinancialNPV += cf / Math.pow(1 + newKe, year + 1);
  });

  return newFinancialNPV / 1000000; // En millones
}
```

## Escenarios de Análisis

### Escenario Pesimista

```javascript
const pessimisticScenario = {
  traffic: -30, // -30% tráfico
  conversion: -25, // -25% conversión
  ticket: -15, // -15% ticket promedio
  costs: +20, // +20% costos
  wacc: +2.5, // +2.5 pp WACC (10.5%)
  ke: +3.0, // +3.0 pp Ke (15.0%)
};
```

### Escenario Base

```javascript
const baseScenario = {
  traffic: 0, // Sin variación
  conversion: 0, // Sin variación
  ticket: 0, // Sin variación
  costs: 0, // Sin variación
  wacc: 0, // WACC 8.0%
  ke: 0, // Ke 12.0%
};
```

### Escenario Optimista

```javascript
const optimisticScenario = {
  traffic: +40, // +40% tráfico
  conversion: +30, // +30% conversión
  ticket: +15, // +15% ticket promedio
  costs: -15, // -15% costos
  wacc: -2.5, // -2.5 pp WACC (5.5%)
  ke: -2.0, // -2.0 pp Ke (10.0%)
};
```

### Escenario Stress Test

```javascript
const stressScenario = {
  traffic: -50, // -50% tráfico
  conversion: -40, // -40% conversión
  ticket: -25, // -25% ticket promedio
  costs: +30, // +30% costos
  wacc: +4.0, // +4.0 pp WACC (12.0%)
  ke: +4.0, // +4.0 pp Ke (16.0%)
};
```

## Cálculo de Métricas por Escenario

### VAN Económico

```javascript
function calculateEconomicNPV(scenario) {
  const adjustedParams = applyScenarioFactors(baseParams, scenario);
  const cashFlows = generateCashFlows(adjustedParams);
  const wacc = 0.08 + scenario.wacc / 100;

  let npv = 0;
  cashFlows.forEach((cf, year) => {
    npv += cf / Math.pow(1 + wacc, year + 1);
  });

  return npv / 1000000; // En millones
}
```

### VAN Financiero

```javascript
function calculateFinancialNPV(scenario) {
  const adjustedParams = applyScenarioFactors(baseParams, scenario);
  const financialCashFlows = generateFinancialCashFlows(adjustedParams);
  const ke = 0.12 + scenario.ke / 100;

  let npv = 0;
  financialCashFlows.forEach((cf, year) => {
    npv += cf / Math.pow(1 + ke, year + 1);
  });

  return npv / 1000000; // En millones
}
```

### TIR (Tasa Interna de Retorno)

```javascript
function calculateScenarioIRR(cashFlows) {
  // Método Newton-Raphson para encontrar la TIR
  let rate = 0.1; // Estimación inicial 10%
  const tolerance = 0.0001;
  const maxIterations = 1000;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    cashFlows.forEach((cf, year) => {
      npv += cf / Math.pow(1 + rate, year);
      if (year > 0) {
        dnpv -= (year * cf) / Math.pow(1 + rate, year + 1);
      }
    });

    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Convertir a porcentaje
    }

    rate = rate - npv / dnpv;
  }

  return rate * 100;
}
```

## Clasificación de Impactos

### Niveles de Riesgo

```javascript
function classifyImpactLevel(npvImpact) {
  const absImpact = Math.abs(npvImpact);

  if (absImpact >= 2.0) {
    return { level: "Alto", color: "#d32f2f", priority: 1 };
  } else if (absImpact >= 1.0) {
    return { level: "Medio", color: "#f57c00", priority: 2 };
  } else {
    return { level: "Bajo", color: "#388e3c", priority: 3 };
  }
}
```

### Factores Críticos

```javascript
const criticalFactors = [
  {
    name: "Tráfico Web",
    maxImpact: "±$3.2M",
    riskLevel: "Alto",
    drivers: ["SEO/SEM", "Marketing Digital"],
  },
  {
    name: "Tasa de Conversión",
    maxImpact: "±$2.8M",
    riskLevel: "Alto",
    drivers: ["UX/UI", "Pricing"],
  },
  {
    name: "WACC",
    maxImpact: "±$2.1M",
    riskLevel: "Alto",
    drivers: ["Condiciones de Mercado", "Riesgo País"],
  },
];
```

## Valor Terminal en Sensibilidad

### Cálculo del Valor Terminal

```javascript
function calculateTerminalValue(finalFCF, wacc, growthRate = 0.02) {
  // Fórmula: TV = FCF × (1+g) / (WACC-g)
  if (wacc <= growthRate) {
    return 0; // Evitar división por cero o negativo
  }

  return (finalFCF * (1 + growthRate)) / (wacc - growthRate);
}

// Aplicar en el último año (2030)
if (year === 2030) {
  const terminalValue = calculateTerminalValue(fcf, wacc, 0.02);
  fcf += terminalValue;
}
```

## Actualización Dinámica

### Recálculo Automático

```javascript
class SensitivityAnalysis {
  constructor() {
    this.baseScenario = null;
    this.sensitivityResults = {};
  }

  init() {
    this.calculateBaseScenario();
    this.calculateSensitivities();
    this.updateSensitivityDisplay();
  }

  recalculate() {
    // Recalcular cuando cambien parámetros base
    this.calculateBaseScenario();
    this.calculateSensitivities();
    this.updateSensitivityDisplay();
  }
}
```

## Referencias de Código

- **Archivo principal**: `static/js/sensitivity.js`
- **Funciones clave**:
  - `SensitivityAnalysis.calculateBaseScenario()`
  - `SensitivityAnalysis.calculateSensitivities()`
  - `calculateScenarioMetrics()`
  - `updateSensitivityDisplay()`
  - `updateDiscountRatesDisplay()`
