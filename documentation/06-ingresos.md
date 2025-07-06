# Ingresos - Proyecciones de Revenue por Mercado

## Descripción General

Esta pestaña calcula las proyecciones de ingresos basadas en los parámetros operativos, distribución geográfica y cronograma de expansión internacional.

## Modelo de Ingresos Base

### Fórmula Fundamental

```javascript
// Revenue = Tráfico × Conversión × Ticket Promedio × Meses
function calculateBaseRevenue(traffic, conversion, ticket, months = 12) {
  const orders = traffic * (conversion / 100);
  const monthlyRevenue = orders * ticket;
  return monthlyRevenue * months;
}
```

### Parámetros Base (2025)

```javascript
const baseParameters2025 = {
  initialTraffic: 9100, // Visitantes/mes
  initialConversion: 2.0, // 2.0% conversión
  initialTicket: 50, // $50 USD ticket promedio
  operatingMonths: 6, // Solo Q3-Q4 2025
};

// Revenue 2025 = 9,100 × 2.0% × $50 × 6 meses = $54,600
const revenue2025 = calculateBaseRevenue(9100, 2.0, 50, 6);
```

## Crecimiento y Evolución

### Crecimiento de Tráfico

```javascript
const trafficGrowthRates = {
  2026: 1.0, // 100% crecimiento (18,200 visitantes/mes)
  2027: 0.8, // 80% crecimiento (32,760 visitantes/mes)
  2028: 0.6, // 60% crecimiento (52,416 visitantes/mes)
  2029: 0.4, // 40% crecimiento (73,382 visitantes/mes)
  2030: 0.2, // 20% crecimiento (88,058 visitantes/mes)
};

function calculateTrafficByYear(year, baseTraffic) {
  if (year === 2025) return baseTraffic;

  let currentTraffic = baseTraffic;
  for (let y = 2026; y <= year; y++) {
    const growthRate = trafficGrowthRates[y] || 0;
    currentTraffic *= 1 + growthRate;
  }

  return Math.round(currentTraffic);
}
```

### Mejora de Conversión

```javascript
const conversionGrowthRates = {
  2026: 0.4, // 40% mejora (2.8% conversión)
  2027: 0.32, // 32% mejora (3.7% conversión)
  2028: 0.24, // 24% mejora (4.6% conversión)
  2029: 0.16, // 16% mejora (5.3% conversión)
  2030: 0.08, // 8% mejora (5.7% conversión)
};

function calculateConversionByYear(year, baseConversion) {
  if (year === 2025) return baseConversion;

  let currentConversion = baseConversion;
  for (let y = 2026; y <= year; y++) {
    const growthRate = conversionGrowthRates[y] || 0;
    currentConversion *= 1 + growthRate;
  }

  return Math.round(currentConversion * 100) / 100; // 2 decimales
}
```

### Crecimiento del Ticket

```javascript
const ticketGrowthRate = 0.08; // 8% anual constante

function calculateTicketByYear(year, baseTicket) {
  if (year === 2025) return baseTicket;

  const yearsGrowth = year - 2025;
  return baseTicket * Math.pow(1 + ticketGrowthRate, yearsGrowth);
}

// Evolución del ticket promedio:
// 2025: $50.00
// 2026: $54.00
// 2027: $58.32
// 2028: $62.99
// 2029: $68.03
// 2030: $73.47
```

## Distribución Geográfica

### Cronograma de Expansión

```javascript
const marketLaunchSchedule = {
  chile: 2025, // Lanzamiento Q3 2025
  mexico: 2026, // Expansión 2026
  brazil: 2027, // Expansión 2027
  canada: 2028, // Expansión 2028
  usa: 2029, // Expansión 2029
};

const marketWeights = {
  chile: 0.4, // 40% del revenue total
  mexico: 0.25, // 25% del revenue total
  brazil: 0.15, // 15% del revenue total
  canada: 0.1, // 10% del revenue total
  usa: 0.1, // 10% del revenue total
};
```

### Cálculo por Mercado

```javascript
function calculateMarketRevenue(year, market, totalRevenue) {
  const launchYear = marketLaunchSchedule[market];
  const marketWeight = marketWeights[market];

  // Solo incluir si el mercado ya está lanzado
  if (year < launchYear) {
    return 0;
  }

  // Factor de ramping para nuevos mercados
  const rampingFactor = calculateRampingFactor(year, launchYear);

  return totalRevenue * marketWeight * rampingFactor;
}

function calculateRampingFactor(currentYear, launchYear) {
  const yearsActive = currentYear - launchYear;

  if (yearsActive === 0) return 0.3; // 30% primer año
  if (yearsActive === 1) return 0.7; // 70% segundo año
  return 1.0; // 100% tercer año en adelante
}
```

## Proyecciones Anuales

### Revenue Total por Año

```javascript
function calculateAnnualRevenue(year) {
  const traffic = calculateTrafficByYear(year, 9100);
  const conversion = calculateConversionByYear(year, 2.0);
  const ticket = calculateTicketByYear(year, 50);

  // Meses de operación
  const months = year === 2025 ? 6 : 12;

  return calculateBaseRevenue(traffic, conversion, ticket, months);
}

// Proyecciones base:
const revenueProjections = {
  2025: 54600, // $54.6K (6 meses)
  2026: 435456, // $435.5K
  2027: 1014883, // $1.01M
  2028: 1886234, // $1.89M
  2029: 2916045, // $2.92M
  2030: 4009182, // $4.01M
};
```

### Distribución por Mercado

```javascript
function calculateMarketDistribution(year) {
  const totalRevenue = calculateAnnualRevenue(year);
  const distribution = {};

  Object.keys(marketWeights).forEach((market) => {
    distribution[market] = {
      grossRevenue: calculateMarketRevenue(year, market, totalRevenue),
      netRevenue: 0, // Se calcula después de costos
      weight: marketWeights[market],
      active: year >= marketLaunchSchedule[market],
    };
  });

  return distribution;
}
```

## Costos y Márgenes

### Estructura de Costos por Revenue

```javascript
const costStructure = {
  marketing: 0.12, // 12% marketing
  operations: 0.25, // 25% operaciones
  logistics: 0.17, // 17% logística
  cogs: 0.46, // 46% costo de mercadería (separado)
};

const totalCostRate = Object.values(costStructure).reduce(
  (sum, rate) => sum + rate,
  0
);
// Total: 54% costos operativos + 46% COGS = 100% (sin margen)
```

### Cálculo de Revenue Neto

```javascript
function calculateNetRevenue(grossRevenue) {
  const operatingCosts =
    grossRevenue *
    (costStructure.marketing +
      costStructure.operations +
      costStructure.logistics);

  const cogs = grossRevenue * costStructure.cogs;

  return {
    grossRevenue,
    operatingCosts,
    cogs,
    netRevenue: grossRevenue - operatingCosts - cogs,
    margin: ((grossRevenue - operatingCosts - cogs) / grossRevenue) * 100,
  };
}
```

## Análisis de Estacionalidad

### Factores Estacionales

```javascript
const seasonalityFactors = {
  Q1: 0.85, // Enero-Marzo: 85% del promedio
  Q2: 0.95, // Abril-Junio: 95% del promedio
  Q3: 1.1, // Julio-Septiembre: 110% del promedio
  Q4: 1.3, // Octubre-Diciembre: 130% del promedio (fiestas)
};

function calculateQuarterlyRevenue(annualRevenue, quarter) {
  const quarterlyBase = annualRevenue / 4;
  const seasonalFactor = seasonalityFactors[quarter];

  return quarterlyBase * seasonalFactor;
}

// Distribución trimestral ejemplo para $1M anual:
// Q1: $212,500 (85% × $250K)
// Q2: $237,500 (95% × $250K)
// Q3: $275,000 (110% × $250K)
// Q4: $325,000 (130% × $250K)
```

## Tipos de Cambio y Conversión

### Monedas por Mercado

```javascript
const marketCurrencies = {
  chile: "CLP",
  mexico: "MXN",
  brazil: "BRL",
  canada: "CAD",
  usa: "USD",
};

const exchangeRates = {
  CLP: 800, // 800 CLP por USD
  MXN: 17, // 17 MXN por USD
  BRL: 5.2, // 5.2 BRL por USD
  CAD: 1.35, // 1.35 CAD por USD
  USD: 1.0, // Base currency
};
```

### Conversión a USD

```javascript
function convertToUSD(localRevenue, currency) {
  if (currency === "USD") return localRevenue;

  const rate = exchangeRates[currency];
  return localRevenue / rate;
}

function calculateMarketRevenueInUSD(market, localRevenue) {
  const currency = marketCurrencies[market];
  return convertToUSD(localRevenue, currency);
}
```

## Métricas de Performance

### KPIs de Revenue

```javascript
const revenueKPIs = {
  // Revenue per visitor
  calculateRPV: function (revenue, traffic, months) {
    const totalVisitors = traffic * months;
    return revenue / totalVisitors;
  },

  // Average order value
  calculateAOV: function (revenue, orders) {
    return revenue / orders;
  },

  // Revenue growth rate
  calculateGrowthRate: function (currentYear, previousYear) {
    return ((currentYear - previousYear) / previousYear) * 100;
  },

  // Market share by revenue
  calculateMarketShare: function (marketRevenue, totalRevenue) {
    return (marketRevenue / totalRevenue) * 100;
  },
};
```

### Targets y Benchmarks

```javascript
const revenueTargets = {
  2025: { target: 55000, tolerance: 0.1 }, // ±10%
  2026: { target: 435000, tolerance: 0.15 }, // ±15%
  2027: { target: 1015000, tolerance: 0.12 }, // ±12%
  2028: { target: 1886000, tolerance: 0.1 }, // ±10%
  2029: { target: 2916000, tolerance: 0.08 }, // ±8%
  2030: { target: 4009000, tolerance: 0.06 }, // ±6%
};

function evaluateRevenuePerformance(year, actualRevenue) {
  const target = revenueTargets[year];
  if (!target) return null;

  const variance = (actualRevenue - target.target) / target.target;
  const withinTolerance = Math.abs(variance) <= target.tolerance;

  return {
    target: target.target,
    actual: actualRevenue,
    variance: variance * 100,
    withinTolerance,
    status: withinTolerance ? "On Track" : "Off Track",
  };
}
```

## Sensibilidad de Ingresos

### Factores de Riesgo

```javascript
const revenueSensitivity = {
  trafficRisk: {
    impact: "High",
    variations: [-30, -15, 0, 15, 30], // % variation
    description: "Cambios en tráfico web",
  },

  conversionRisk: {
    impact: "High",
    variations: [-25, -10, 0, 10, 25], // % variation
    description: "Cambios en tasa de conversión",
  },

  ticketRisk: {
    impact: "Medium",
    variations: [-15, -7, 0, 7, 15], // % variation
    description: "Cambios en ticket promedio",
  },

  marketRisk: {
    impact: "Medium",
    variations: [-20, -10, 0, 10, 20], // % variation
    description: "Retrasos en expansión geográfica",
  },
};
```

### Escenarios de Revenue

```javascript
const revenueScenarios = {
  pessimistic: {
    trafficFactor: 0.7, // -30% tráfico
    conversionFactor: 0.75, // -25% conversión
    ticketFactor: 0.85, // -15% ticket
    marketDelayMonths: 6, // 6 meses retraso expansión
  },

  base: {
    trafficFactor: 1.0, // Sin cambios
    conversionFactor: 1.0, // Sin cambios
    ticketFactor: 1.0, // Sin cambios
    marketDelayMonths: 0, // Sin retrasos
  },

  optimistic: {
    trafficFactor: 1.3, // +30% tráfico
    conversionFactor: 1.25, // +25% conversión
    ticketFactor: 1.15, // +15% ticket
    marketDelayMonths: -3, // 3 meses adelanto
  },
};

function calculateScenarioRevenue(year, scenario) {
  const baseRevenue = calculateAnnualRevenue(year);
  const factors = revenueScenarios[scenario];

  return (
    baseRevenue *
    factors.trafficFactor *
    factors.conversionFactor *
    factors.ticketFactor
  );
}
```

## Referencias de Código

- **Archivo principal**: `static/js/revenues.js`
- **Funciones clave**:
  - `calculateBaseRevenue()`
  - `calculateMarketRevenue()`
  - `calculateNetRevenue()`
  - `calculateQuarterlyRevenue()`
  - `evaluateRevenuePerformance()`
