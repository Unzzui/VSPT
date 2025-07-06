# Dashboard - Métricas Principales

## Descripción General

El Dashboard presenta un resumen ejecutivo de las métricas financieras clave del proyecto, incluyendo evaluación de viabilidad económica y financiera.

## Métricas Calculadas

### 1. Viabilidad Económica

#### TIR Económica

```javascript
// Cálculo iterativo usando Newton-Raphson
function calculateIRRIterative(cashFlows) {
  let rate = 0.1; // Estimación inicial 10%
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0; // Derivada del NPV

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      npv += cf / Math.pow(1 + rate, t);
      if (t > 0) {
        dnpv -= (t * cf) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Convertir a porcentaje
    }

    rate = rate - npv / dnpv; // Newton-Raphson
  }
}
```

#### VAN Económico

```javascript
function calculateNPV() {
  const discountRate = 0.08; // WACC 8%
  const initialInvestment = this.data.capex?.totalCapex || 800000;
  const yearlyFCF = this.data.cashflow?.yearlyFCF || {};

  let npv = -initialInvestment; // Inversión inicial negativa

  Object.keys(yearlyFCF).forEach((year, index) => {
    const fcf = yearlyFCF[year];
    const discountedFCF = fcf / Math.pow(1 + discountRate, index + 1);
    npv += discountedFCF;
  });

  return npv;
}
```

### 2. Viabilidad Financiera

#### TIR Financiera

- Utiliza los flujos de caja financieros (después de intereses y amortización de deuda)
- Inversión base: Patrimonio aportado (65% del CAPEX total)

#### VAN Financiero

```javascript
// Tasa de descuento: Ke = 12%
const ke = 0.12;
const equityInvestment = totalCapex * 0.65; // 65% patrimonio
```

### 3. Criterios de Viabilidad

#### Económica

```javascript
function evaluateEconomicViability(economicIRR, economicNPV, WACC) {
  const irrViable = economicIRR >= WACC;
  const npvViable = economicNPV > 0;

  if (irrViable && npvViable) {
    return { status: "viable", level: "high" };
  } else if (irrViable || npvViable) {
    return { status: "marginal", level: "medium" };
  } else {
    return { status: "not_viable", level: "low" };
  }
}
```

#### Financiera

```javascript
function evaluateFinancialViability(financialIRR, financialNPV, Ke) {
  const irrViable = financialIRR >= Ke;
  const npvViable = financialNPV > 0;

  // Misma lógica que viabilidad económica
  // pero comparando con Ke en lugar de WACC
}
```

## KPIs Principales

### Revenue Total 2030

```javascript
// Suma de ingresos netos de todos los mercados en 2030
const revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
  return sum + (modelData.revenues[2030][market]?.netRevenue || 0);
}, 0);
```

### CAPEX Total

```javascript
// Suma de todas las inversiones del proyecto
const totalCapex = Object.values(modelData.investments).reduce(
  (sum, yearData) => {
    return sum + (yearData.total || 0);
  },
  0
);
```

### TIR y VAN

- Se obtienen de los cálculos de flujo económico y financiero
- Actualizados dinámicamente cuando cambian los parámetros

## Gráficos y Visualizaciones

### Evolución de Flujos de Caja

- Muestra FCF proyectados desde 2026 hasta 2030
- Identifica cuándo el proyecto se vuelve cash-flow positivo

### Distribución por Mercado 2030

```javascript
// Basado en marketDistribution global
const marketShares = {
  Chile: marketDistribution.chile.weight,
  México: marketDistribution.mexico?.weight || 0,
  // etc.
};
```

## Actualización Dinámica

El Dashboard se actualiza automáticamente cuando:

1. Cambian los parámetros de negocio
2. Se modifican los parámetros financieros
3. Se ajustan las proyecciones de inventario
4. Se actualizan las inversiones

```javascript
// Función principal de actualización
function evaluateProjectViability(retryCount = 0) {
  // Obtener métricas calculadas
  const economicIRR = getEconomicIRR();
  const financialIRR = getFinancialIRR();
  const economicNPV = getEconomicNPV();
  const financialNPV = getFinancialNPV();

  // Tasas de descuento
  const WACC = 8.0;
  const Ke = 12.0;

  // Evaluar viabilidad
  const economicViability = evaluateEconomicViability(
    economicIRR,
    economicNPV,
    WACC
  );
  const financialViability = evaluateFinancialViability(
    financialIRR,
    financialNPV,
    Ke
  );

  // Mostrar resultados
  displayViabilityResults(economicViability, financialViability);
}
```

## Referencias de Código

- **Archivo principal**: `static/js/dashboard.js`
- **Funciones clave**:
  - `calculateNPV()`
  - `calculateIRRIterative()`
  - `evaluateProjectViability()`
  - `updateDashboardKPIs()`
