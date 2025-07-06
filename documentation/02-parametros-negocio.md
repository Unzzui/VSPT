# Parámetros de Negocio - Variables Operativas

## Descripción General

Esta pestaña define las variables operativas clave que impulsan el modelo de ingresos del proyecto VSPT.

## Parámetros Principales

### 1. Tráfico Web

#### Tráfico Inicial (2025)

- **Valor base**: 9,100 visitantes/mes
- **Período**: Solo Q3-Q4 2025 (6 meses de operación)

#### Crecimiento de Tráfico

```javascript
// Crecimiento anual decreciente
const trafficGrowthRates = {
  2026: 1.0, // 100% crecimiento año 1
  2027: 0.8, // 80% crecimiento año 2
  2028: 0.6, // 60% crecimiento año 3
  2029: 0.4, // 40% crecimiento año 4
  2030: 0.2, // 20% crecimiento año 5
};

// Cálculo de tráfico por año
function calculateTraffic(year, baseTraffic, cumulativeGrowth) {
  const yearIndex = year - 2025;
  return baseTraffic * Math.pow(1 + cumulativeGrowth, yearIndex);
}
```

### 2. Tasa de Conversión

#### Conversión Inicial

- **Valor base**: 2.0% (tasa de conversión inicial)
- **Mejora anual**: Decreciente año tras año

#### Evolución de la Conversión

```javascript
const conversionGrowthRates = {
  2026: 0.4, // 40% mejora año 1
  2027: 0.32, // 32% mejora año 2
  2028: 0.24, // 24% mejora año 3
  2029: 0.16, // 16% mejora año 4
  2030: 0.08, // 8% mejora año 5
};

// Conversión efectiva por año
function calculateConversion(year, baseConversion, cumulativeGrowth) {
  const yearIndex = year - 2025;
  return baseConversion * Math.pow(1 + cumulativeGrowth, yearIndex);
}
```

### 3. Ticket Promedio

#### Ticket Inicial

- **Valor base**: $50 USD
- **Crecimiento**: Vinculado a inflación y estrategia premium

#### Evolución del Ticket

```javascript
const ticketGrowthRate = 0.08; // 8% anual

function calculateTicket(year, baseTicket) {
  const yearIndex = year - 2025;
  return baseTicket * Math.pow(1 + ticketGrowthRate, yearIndex);
}
```

### 4. Costos Operativos

#### Estructura de Costos

```javascript
const costStructure = {
  marketing: 0.12, // 12% del revenue
  operations: 0.25, // 25% del revenue
  logistics: 0.17, // 17% del revenue
};

// Total: 54% del revenue
const totalCostRate = Object.values(costStructure).reduce(
  (sum, rate) => sum + rate,
  0
);
```

#### Costos por Categoría

**Marketing (12% del Revenue)**

- Publicidad digital
- SEO/SEM
- Marketing de contenidos
- Eventos y degustaciones

**Operaciones (25% del Revenue)**

- Personal administrativo
- Sistemas y tecnología
- Gastos generales
- Seguros y licencias

**Logística (17% del Revenue)**

- Almacenamiento
- Distribución
- Packaging
- Shipping internacional

### 5. Expansión Geográfica

#### Cronograma de Expansión

```javascript
const expansionTimeline = {
  2025: ["Chile"], // Solo Chile (Q3-Q4)
  2026: ["Chile", "México"], // Expansión a México
  2027: ["Chile", "México", "Brasil"], // Expansión a Brasil
  2028: ["Chile", "México", "Brasil", "Canadá"], // Expansión a Canadá
  2029: ["Chile", "México", "Brasil", "Canadá", "USA"], // Expansión a USA
  2030: ["Chile", "México", "Brasil", "Canadá", "USA"], // Consolidación
};
```

#### Distribución por Mercado

```javascript
const marketDistribution = {
  chile: {
    weight: 0.4, // 40% del revenue total
    currency: "CLP",
    launchYear: 2025,
  },
  mexico: {
    weight: 0.25, // 25% del revenue total
    currency: "MXN",
    launchYear: 2026,
  },
  brazil: {
    weight: 0.15, // 15% del revenue total
    currency: "BRL",
    launchYear: 2027,
  },
  canada: {
    weight: 0.1, // 10% del revenue total
    currency: "CAD",
    launchYear: 2028,
  },
  usa: {
    weight: 0.1, // 10% del revenue total
    currency: "USD",
    launchYear: 2029,
  },
};
```

## Cálculos Derivados

### Órdenes Mensuales

```javascript
function calculateMonthlyOrders(traffic, conversion) {
  return traffic * (conversion / 100);
}
```

### Revenue Mensual

```javascript
function calculateMonthlyRevenue(orders, ticket) {
  return orders * ticket;
}
```

### Revenue Anual por Mercado

```javascript
function calculateMarketRevenue(year, market, baseRevenue) {
  const marketData = marketDistribution[market];

  // Solo incluir mercados ya lanzados
  if (year < marketData.launchYear) {
    return 0;
  }

  // Aplicar peso del mercado
  return baseRevenue * marketData.weight;
}
```

### Conversión a USD

```javascript
function convertToUSD(localRevenue, currency, exchangeRates) {
  if (currency === "USD") {
    return localRevenue;
  }
  return localRevenue / exchangeRates[currency];
}
```

## Validaciones y Restricciones

### Rangos Permitidos

```javascript
const parameterRanges = {
  initialTraffic: { min: 1000, max: 50000 },
  trafficGrowth: { min: 0, max: 200 },
  initialConversion: { min: 0.5, max: 10 },
  conversionGrowth: { min: 0, max: 100 },
  avgTicket: { min: 20, max: 200 },
  ticketGrowth: { min: 0, max: 20 },
  marketingPct: { min: 5, max: 25 },
  operationsPct: { min: 15, max: 40 },
  logisticsPct: { min: 10, max: 30 },
};
```

### Validación de Inputs

```javascript
function validateBusinessParams(params) {
  const errors = [];

  Object.keys(parameterRanges).forEach((param) => {
    const value = params[param];
    const range = parameterRanges[param];

    if (value < range.min || value > range.max) {
      errors.push(`${param} debe estar entre ${range.min} y ${range.max}`);
    }
  });

  return errors;
}
```

## Actualización Dinámica

Los parámetros se actualizan en tiempo real y recalculan:

1. Proyecciones de ingresos
2. Flujos de caja económicos y financieros
3. Métricas de rentabilidad (VAN, TIR)
4. Análisis de sensibilidad

## Referencias de Código

- **Archivo principal**: `static/js/business.js`
- **Funciones clave**:
  - `updateBusinessParams()`
  - `calculateBusinessMetrics()`
  - `validateBusinessParams()`
  - `updateBusinessDisplay()`
