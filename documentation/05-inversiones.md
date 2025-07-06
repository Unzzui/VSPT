# Inversiones - CAPEX y Cronograma de Inversiones

## Descripción General

Esta pestaña gestiona todas las inversiones de capital (CAPEX) requeridas para el lanzamiento y operación del proyecto VSPT, incluyendo cronograma de desembolsos y depreciación.

## Categorías de Inversión

### 1. Tecnología y Sistemas

#### Plataforma E-commerce

```javascript
const technologyInvestments = {
  ecommercePlatform: {
    amount: 150000, // $150K
    description: "Desarrollo plataforma web y mobile",
    timeline: "2025 Q1-Q2",
    depreciation: 3, // 3 años vida útil
    components: [
      { item: "Frontend Development", cost: 60000 },
      { item: "Backend & Database", cost: 50000 },
      { item: "Mobile App", cost: 25000 },
      { item: "Testing & QA", cost: 15000 },
    ],
  },

  systemsIntegration: {
    amount: 75000, // $75K
    description: "ERP, CRM, y sistemas de gestión",
    timeline: "2025 Q2",
    depreciation: 5, // 5 años vida útil
    components: [
      { item: "ERP System", cost: 30000 },
      { item: "CRM Platform", cost: 20000 },
      { item: "Inventory Management", cost: 15000 },
      { item: "Analytics & BI", cost: 10000 },
    ],
  },
};
```

#### Infraestructura IT

```javascript
const itInfrastructure = {
  servers: {
    amount: 25000, // $25K
    description: "Servidores y cloud infrastructure",
    depreciation: 3,
    annualMaintenance: 0.15, // 15% anual
  },

  security: {
    amount: 20000, // $20K
    description: "Sistemas de seguridad y compliance",
    depreciation: 3,
    components: ["SSL Certificates", "Security Audits", "Compliance Tools"],
  },
};
```

### 2. Infraestructura Operacional

#### Almacén y Logística

```javascript
const warehouseInvestments = {
  warehouseSetup: {
    amount: 100000, // $100K
    description: "Acondicionamiento almacén principal",
    timeline: "2025 Q2",
    depreciation: 10, // 10 años vida útil
    components: [
      { item: "Climate Control System", cost: 40000 },
      { item: "Racking & Storage", cost: 30000 },
      { item: "Security System", cost: 15000 },
      { item: "Office Setup", cost: 15000 },
    ],
  },

  logisticsEquipment: {
    amount: 50000, // $50K
    description: "Equipos de manejo y transporte",
    depreciation: 7, // 7 años vida útil
    components: [
      { item: "Forklifts", cost: 25000 },
      { item: "Packaging Equipment", cost: 15000 },
      { item: "Vehicles", cost: 10000 },
    ],
  },
};
```

### 3. Marketing y Marca

#### Desarrollo de Marca

```javascript
const brandingInvestments = {
  brandDevelopment: {
    amount: 80000, // $80K
    description: "Desarrollo de marca y identidad",
    timeline: "2025 Q1",
    depreciation: 5, // 5 años vida útil
    components: [
      { item: "Brand Strategy & Design", cost: 30000 },
      { item: "Website Design & UX", cost: 25000 },
      { item: "Marketing Materials", cost: 15000 },
      { item: "Photography & Content", cost: 10000 },
    ],
  },

  launchCampaign: {
    amount: 120000, // $120K
    description: "Campaña de lanzamiento inicial",
    timeline: "2025 Q3",
    expenseType: "Marketing", // No se deprecia, es gasto
    distribution: {
      digital: 0.7, // 70% marketing digital
      traditional: 0.2, // 20% medios tradicionales
      events: 0.1, // 10% eventos y activaciones
    },
  },
};
```

### 4. Capital de Trabajo Inicial

#### Inventario Inicial

```javascript
const initialWorkingCapital = {
  initialInventory: {
    amount: 180000, // $180K
    description: "Stock inicial para lanzamiento",
    timeline: "2025 Q3",
    type: "Working Capital",
    breakdown: {
      premiumWines: 0.5, // 50% vinos premium
      midRange: 0.35, // 35% gama media
      entry: 0.15, // 15% entrada
    },
  },
};
```

## Cronograma de Inversiones

### Distribución Temporal

```javascript
const investmentSchedule = {
  2025: {
    Q1: {
      technology: 100000, // Desarrollo plataforma
      branding: 80000, // Desarrollo marca
      total: 180000,
    },
    Q2: {
      technology: 125000, // Sistemas + infraestructura
      warehouse: 150000, // Almacén + equipos
      total: 275000,
    },
    Q3: {
      inventory: 180000, // Inventario inicial
      marketing: 120000, // Campaña lanzamiento
      total: 300000,
    },
    Q4: {
      contingency: 45000, // 5% contingencia
      total: 45000,
    },
    yearTotal: 800000,
  },
};
```

### Flujo de Desembolsos

```javascript
function calculateInvestmentCashFlow(year, quarter) {
  const schedule = investmentSchedule[year];
  if (!schedule) return 0;

  if (quarter) {
    return schedule[quarter]?.total || 0;
  }

  return schedule.yearTotal || 0;
}

// Impacto en FCF (negativo por ser salida de efectivo)
function getInvestmentImpactOnFCF(investments) {
  return -investments; // Negativo porque es salida de caja
}
```

## Depreciación y Amortización

### Método de Depreciación

```javascript
const depreciationMethod = "straight-line"; // Línea recta

function calculateDepreciation(assetCost, usefulLife, year, purchaseYear) {
  if (year < purchaseYear) return 0;

  const yearsInService = year - purchaseYear + 1;
  if (yearsInService > usefulLife) return 0;

  return assetCost / usefulLife;
}
```

### Cronograma de Depreciación

```javascript
const depreciationSchedule = {
  2025: {
    technology: 0, // Comprado en Q2, depreciación desde 2026
    warehouse: 0, // Comprado en Q2, depreciación desde 2026
    equipment: 0, // Comprado en Q2, depreciación desde 2026
    total: 0,
  },

  2026: {
    technology: 75000, // $225K / 3 años
    warehouse: 10000, // $100K / 10 años
    equipment: 7143, // $50K / 7 años
    branding: 16000, // $80K / 5 años
    total: 108143,
  },

  // Continúa para años siguientes...
};

// Cálculo automático de depreciación anual
function calculateAnnualDepreciation(year) {
  let totalDepreciation = 0;

  Object.keys(technologyInvestments).forEach((asset) => {
    const investment = technologyInvestments[asset];
    const depreciation = calculateDepreciation(
      investment.amount,
      investment.depreciation,
      year,
      2025
    );
    totalDepreciation += depreciation;
  });

  // Repetir para otras categorías...

  return totalDepreciation;
}
```

## Análisis de Sensibilidad de CAPEX

### Variaciones de Costo

```javascript
const capexSensitivity = {
  scenarios: {
    optimistic: -0.15, // -15% costos
    base: 0, // Sin variación
    pessimistic: +0.25, // +25% costos
    stress: +0.5, // +50% costos
  },

  calculateScenarioCapex: function (baseCapex, scenario) {
    const factor = this.scenarios[scenario];
    return baseCapex * (1 + factor);
  },
};

// Impacto en métricas financieras
function analyzeCapexImpact(capexVariation) {
  const newCapex = 800000 * (1 + capexVariation);
  const equityImpact = newCapex * 0.65; // 65% patrimonio
  const debtImpact = newCapex * 0.35; // 35% deuda

  return {
    totalCapex: newCapex,
    equityRequired: equityImpact,
    debtRequired: debtImpact,
    npvImpact: -capexVariation * 800000, // Impacto directo en VAN
  };
}
```

## Contingencias y Reservas

### Fondo de Contingencia

```javascript
const contingencyFund = {
  percentage: 0.05, // 5% del CAPEX total
  amount: 40000, // $40K
  purpose: "Imprevistos y sobrecostos",

  triggers: [
    "Sobrecostos de desarrollo > 10%",
    "Retrasos en cronograma > 30 días",
    "Cambios regulatorios",
    "Fluctuaciones de tipo de cambio > 15%",
  ],

  utilizationPlan: {
    technology: 0.4, // 40% para tecnología
    operations: 0.3, // 30% para operaciones
    marketing: 0.2, // 20% para marketing
    working_capital: 0.1, // 10% para capital de trabajo
  },
};
```

### Reserva de Crecimiento

```javascript
const growthReserve = {
  amount: 200000, // $200K adicional disponible
  purpose: "Expansión acelerada si performance > plan",

  triggers: [
    "Revenue Q1 2026 > 150% plan",
    "Conversion rate > 3.0%",
    "Customer acquisition cost < $25",
  ],

  allocationPriority: [
    "Additional inventory",
    "Marketing acceleration",
    "Technology enhancements",
    "Geographic expansion",
  ],
};
```

## ROI por Categoría de Inversión

### Retorno Esperado

```javascript
const roiByCategory = {
  technology: {
    investment: 270000, // $270K total tecnología
    expectedROI: 0.35, // 35% ROI anual
    paybackPeriod: 2.5, // 2.5 años
    riskLevel: "Medium",
  },

  warehouse: {
    investment: 150000, // $150K infraestructura
    expectedROI: 0.2, // 20% ROI anual
    paybackPeriod: 4.0, // 4 años
    riskLevel: "Low",
  },

  branding: {
    investment: 200000, // $200K marca + marketing
    expectedROI: 0.45, // 45% ROI anual
    paybackPeriod: 2.0, // 2 años
    riskLevel: "High",
  },
};

function calculateCategoryROI(category, annualBenefit) {
  const investment = roiByCategory[category].investment;
  return (annualBenefit / investment) * 100; // ROI en porcentaje
}
```

## Financiamiento de Inversiones

### Estructura de Financiamiento

```javascript
const investmentFinancing = {
  totalCapex: 800000,

  sources: {
    equity: {
      amount: 520000, // $520K (65%)
      timing: "Q1 2025",
      cost: 0.12, // Ke = 12%
    },

    debt: {
      amount: 280000, // $280K (35%)
      timing: "Q2 2025",
      cost: 0.06, // 6% interés
      term: 5, // 5 años
    },
  },

  // Cronograma de financiamiento
  fundingSchedule: {
    "Q1 2025": 300000, // Equity inicial
    "Q2 2025": 500000, // Equity + Debt
    totalAvailable: 800000,
  },
};
```

## Métricas de Eficiencia de Inversión

### Capital Efficiency Ratios

```javascript
const capitalEfficiencyMetrics = {
  // Revenue per $ invested
  revenuePerCapex: function (annualRevenue, totalCapex) {
    return annualRevenue / totalCapex;
  },

  // Asset turnover
  assetTurnover: function (revenue, totalAssets) {
    return revenue / totalAssets;
  },

  // CAPEX intensity
  capexIntensity: function (capex, revenue) {
    return capex / revenue;
  },

  // Targets
  targets: {
    revenuePerCapex: 2.5, // $2.50 revenue per $1 invested
    assetTurnover: 1.5, // 1.5x asset turnover
    capexIntensity: 0.15, // <15% of revenue
  },
};
```

## Referencias de Código

- **Archivo principal**: `static/js/investments.js`
- **Funciones clave**:
  - `calculateInvestmentCashFlow()`
  - `calculateDepreciation()`
  - `analyzeCapexImpact()`
  - `updateInvestmentDisplay()`
  - `calculateCategoryROI()`
