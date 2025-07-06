# Inventario - Gestión de Stock y Capital de Trabajo

## Descripción General

Esta pestaña gestiona los niveles de inventario requeridos para soportar las ventas proyectadas, calculando el capital de trabajo necesario y su impacto en los flujos de caja.

## Parámetros de Inventario

### 1. Días de Inventario

#### Definición Base

```javascript
const inventoryDays = {
  baseLevel: 45, // 45 días de inventario base
  unit: "días",
  description: "Días de ventas que representa el inventario promedio",
};

// Cálculo del inventario requerido
function calculateInventoryLevel(annualSales, inventoryDays) {
  const dailySales = annualSales / 365;
  return dailySales * inventoryDays;
}
```

#### Variación por Estacionalidad

```javascript
const seasonalityFactors = {
  Q1: 0.85, // Enero-Marzo: 85% del promedio
  Q2: 0.95, // Abril-Junio: 95% del promedio
  Q3: 1.1, // Julio-Septiembre: 110% del promedio (alta temporada)
  Q4: 1.3, // Octubre-Diciembre: 130% del promedio (fiestas)
};

function calculateSeasonalInventory(baseInventory, quarter) {
  return baseInventory * seasonalityFactors[quarter];
}
```

### 2. Costo de Mercadería Vendida (COGS)

#### Estructura de Costos

```javascript
const cogsStructure = {
  productCost: 0.46, // 46% del revenue (costo directo del vino)

  // Desglose del 46%
  breakdown: {
    wineAcquisition: 0.35, // 35% - Compra de vinos
    importDuties: 0.05, // 5% - Aranceles e impuestos
    qualityControl: 0.02, // 2% - Control de calidad
    shrinkage: 0.04, // 4% - Mermas y pérdidas
  },
};

// Cálculo del COGS
function calculateCOGS(revenue) {
  return revenue * cogsStructure.productCost;
}
```

#### COGS por Mercado

```javascript
const cogsByMarket = {
  chile: {
    rate: 0.42, // 42% (mercado local, menores costos logísticos)
    factors: {
      localSourcing: -0.04, // -4% por sourcing local
      lowerDuties: -0.02, // -2% menores aranceles
    },
  },

  mexico: {
    rate: 0.46, // 46% (mercado base)
    factors: {
      standardImport: 0.0, // Mercado de referencia
    },
  },

  brazil: {
    rate: 0.52, // 52% (altos aranceles)
    factors: {
      highDuties: +0.06, // +6% por altos aranceles brasileños
    },
  },

  canada: {
    rate: 0.44, // 44% (mercado desarrollado)
    factors: {
      efficientLogistics: -0.02, // -2% logística eficiente
    },
  },

  usa: {
    rate: 0.48, // 48% (regulaciones complejas)
    factors: {
      regulatoryCompliance: +0.02, // +2% cumplimiento regulatorio
    },
  },
};
```

## Cálculo del Capital de Trabajo

### 1. Inventario Requerido por Año

```javascript
function calculateYearlyInventory(year, revenues, inventoryDays) {
  const yearRevenues = revenues[year] || {};
  let totalInventoryValue = 0;

  // Calcular inventario por mercado
  Object.keys(yearRevenues).forEach((market) => {
    const marketRevenue = yearRevenues[market]?.netRevenue || 0;
    const cogRate = cogsByMarket[market]?.rate || 0.46;
    const cogs = marketRevenue * cogRate;
    const inventoryValue = (cogs / 365) * inventoryDays;

    totalInventoryValue += inventoryValue;
  });

  return totalInventoryValue;
}
```

### 2. Variación del Capital de Trabajo

```javascript
function calculateWorkingCapitalChange(
  currentYear,
  previousYear,
  inventoryData
) {
  const currentInventory = inventoryData[currentYear] || 0;
  const previousInventory = inventoryData[previousYear] || 0;

  // Cambio en capital de trabajo = Incremento en inventario
  const workingCapitalChange = currentInventory - previousInventory;

  return {
    currentInventory,
    previousInventory,
    change: workingCapitalChange,
    cashImpact: -workingCapitalChange, // Negativo porque incremento requiere cash
  };
}
```

### 3. Componentes del Capital de Trabajo

```javascript
const workingCapitalComponents = {
  inventory: {
    description: "Stock de vinos para ventas",
    calculation: "COGS × (Días Inventario / 365)",
    impact: "Negativo en FCF cuando aumenta",
  },

  accountsReceivable: {
    days: 0, // 0 días (ventas al contado/tarjeta)
    value: 0,
    description: "E-commerce con pago inmediato",
  },

  accountsPayable: {
    days: 30, // 30 días pago a proveedores
    calculation: "COGS × (30/365)",
    impact: "Positivo en FCF (financiamiento de proveedores)",
  },
};

function calculateNetWorkingCapital(cogs, inventoryDays) {
  const inventory = (cogs / 365) * inventoryDays;
  const accountsReceivable = 0; // Pago inmediato
  const accountsPayable = (cogs / 365) * 30; // 30 días pago proveedores

  return inventory + accountsReceivable - accountsPayable;
}
```

## Políticas de Inventario

### 1. Niveles Mínimos y Máximos

```javascript
const inventoryLevels = {
  minimum: {
    days: 30, // 30 días mínimo
    reason: "Evitar stockouts",
    riskLevel: "Alto si se incumple",
  },

  target: {
    days: 45, // 45 días objetivo
    reason: "Balance entre servicio y costo",
    riskLevel: "Óptimo",
  },

  maximum: {
    days: 75, // 75 días máximo
    reason: "Evitar sobreinventario",
    riskLevel: "Alto costo de oportunidad",
  },
};
```

### 2. Estrategia por Producto

```javascript
const productInventoryStrategy = {
  premiumWines: {
    days: 60, // Mayor stock para vinos premium
    reason: "Menor rotación, mayor margen",
    allocation: 0.4, // 40% del inventario
  },

  midRangeWines: {
    days: 45, // Stock estándar
    reason: "Balance rotación-margen",
    allocation: 0.45, // 45% del inventario
  },

  entryLevelWines: {
    days: 30, // Menor stock, mayor rotación
    reason: "Alta rotación, menor margen",
    allocation: 0.15, // 15% del inventario
  },
};
```

## Gestión de Riesgos de Inventario

### 1. Riesgo de Obsolescencia

```javascript
const obsolescenceRisk = {
  rate: 0.02, // 2% anual de obsolescencia

  factors: {
    vintage: 0.01, // Riesgo por añada
    market: 0.005, // Riesgo de mercado
    storage: 0.005, // Riesgo de almacenamiento
  },

  // Provisión por obsolescencia
  calculateProvision: function (inventoryValue) {
    return inventoryValue * this.rate;
  },
};
```

### 2. Riesgo de Tipo de Cambio

```javascript
const fxRiskOnInventory = {
  exposure: {
    EUR: 0.6, // 60% inventario en EUR (vinos europeos)
    USD: 0.25, // 25% en USD (vinos americanos)
    CLP: 0.1, // 10% en CLP (vinos chilenos)
    Other: 0.05, // 5% otras monedas
  },

  hedgingStrategy: {
    hedgeRatio: 0.7, // 70% cobertura
    instruments: ["Forward", "Options"],
    maturity: "3-6 months",
  },
};
```

## Optimización del Inventario

### 1. Modelo EOQ (Economic Order Quantity)

```javascript
function calculateEOQ(annualDemand, orderingCost, holdingCost) {
  // EOQ = √(2 × D × S / H)
  // D = Demanda anual, S = Costo de pedido, H = Costo de mantener

  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
}

// Parámetros del modelo
const eoqParameters = {
  orderingCost: 500, // $500 por pedido
  holdingCostRate: 0.15, // 15% anual del valor del inventario

  calculateOptimalOrder: function (productDemand, unitCost) {
    const holdingCost = unitCost * this.holdingCostRate;
    return calculateEOQ(productDemand, this.orderingCost, holdingCost);
  },
};
```

### 2. Análisis ABC

```javascript
const abcAnalysis = {
  categoryA: {
    percentage: 0.2, // 20% de productos
    revenueShare: 0.8, // 80% del revenue
    inventoryDays: 60, // Mayor stock
    reviewFrequency: "Weekly",
  },

  categoryB: {
    percentage: 0.3, // 30% de productos
    revenueShare: 0.15, // 15% del revenue
    inventoryDays: 45, // Stock medio
    reviewFrequency: "Bi-weekly",
  },

  categoryC: {
    percentage: 0.5, // 50% de productos
    revenueShare: 0.05, // 5% del revenue
    inventoryDays: 30, // Menor stock
    reviewFrequency: "Monthly",
  },
};
```

## Impacto en Flujos de Caja

### 1. Flujo de Caja Operativo

```javascript
function calculateInventoryImpactOnFCF(year, inventoryChange) {
  // El incremento en inventario reduce el FCF
  // La reducción en inventario aumenta el FCF

  return {
    operatingCashFlow: {
      inventoryChange: -inventoryChange,
      description:
        inventoryChange > 0
          ? "Incremento en inventario reduce FCF"
          : "Reducción en inventario aumenta FCF",
    },
  };
}
```

### 2. Valor Terminal del Inventario

```javascript
function calculateTerminalInventoryValue(
  finalYearRevenue,
  cogsRate,
  inventoryDays
) {
  // En el valor terminal, se asume recuperación del inventario
  const finalCOGS = finalYearRevenue * cogsRate;
  const terminalInventory = (finalCOGS / 365) * inventoryDays;

  return {
    terminalValue: terminalInventory,
    recoveryAssumption: "Full recovery at book value",
    cashFlowImpact: terminalInventory, // Positivo en año terminal
  };
}
```

## Métricas de Performance

### 1. Rotación de Inventario

```javascript
function calculateInventoryTurnover(cogs, averageInventory) {
  return cogs / averageInventory;
}

// Objetivo: 8-10 veces por año (36-45 días)
const inventoryTargets = {
  turnoverRatio: { min: 8, target: 10, max: 12 },
  daysOfInventory: { min: 30, target: 45, max: 60 },
};
```

### 2. Eficiencia del Capital de Trabajo

```javascript
function calculateWorkingCapitalEfficiency(revenue, workingCapital) {
  return workingCapital / revenue; // % del revenue
}

// Objetivo: <5% del revenue anual
const workingCapitalTarget = 0.05; // 5% del revenue
```

## Referencias de Código

- **Archivo principal**: `static/js/inventory.js`
- **Funciones clave**:
  - `calculateInventoryLevel()`
  - `calculateWorkingCapitalChange()`
  - `calculateInventoryTurnover()`
  - `updateInventoryDisplay()`
  - `calculateSeasonalInventory()`
