// ============================================================================
// CONFIGURACIÓN Y CONSTANTES DEL MODELO FINANCIERO
// ============================================================================

// Tasas de cambio (conservadoras)
const exchangeRates = {
    MXN: 18.5,
    BRL: 5.2,
    CAD: 1.35,
    CLP: 900,  // Peso chileno
    USD: 1.0
};

// Distribución de mercados optimizada (eliminados: Brasil, Canadá, USA)
const marketDistribution = {
    chile: { 
        weight: 0.65, // Aumentado de 40% a 65%
        currency: 'CLP', 
        tax: 0.27, 
        premium: 1.0, 
        paymentDays: 94, 
        inventoryDays: 120,
        label: 'Chile'
    },
    mexico: { 
        weight: 0.35, // Aumentado de 25% a 35%
        currency: 'MXN', 
        tax: 0.16, 
        premium: 1.1, 
        paymentDays: 94, 
        inventoryDays: 120,
        label: 'México'
    }
};

// Configuración financiera base (valores por defecto)
const defaultFinancialParams = {
    debtRatio: 0.5,
    equityRatio: 0.5,
    interestRate: 0.06,  // Cambiado de 0.085 a 0.06 (6%)
    debtTermYears: 5,
    wacc: 0.08,
    equityCost: 0.12,
    taxRate: 0.27,
    payableDays: 117,
    serviceDays: 117,
    cogsPct: 0.54,
    operatingExpensesPct: 0.10, // Cambiado de 0.25 a 0.10 (10%)
    depreciationYears: 5,
    inventoryDays: 60,
};

// Distribución de CAPEX por años (total $565K optimizado)
const capexDistribution = {
    2025: { pct: 0.45, label: '45%' }, 
    2026: { pct: 0.30, label: '30%' }, 
    2027: { pct: 0.20, label: '20%' }, 
    2028: { pct: 0.05, label: '5%' }   
};

// ============================================================================
// FUNCIÓN PARA OBTENER PARÁMETROS FINANCIEROS DINÁMICOS
// ============================================================================

function getFinancialParams() {
    const debtRatioElement = document.getElementById('debtRatio');
    const interestRateElement = document.getElementById('interestRate');
    const debtTermElement = document.getElementById('debtTerm');
    
    const debtRatio = debtRatioElement ? parseFloat(debtRatioElement.value) / 100 : defaultFinancialParams.debtRatio;
    const interestRate = interestRateElement ? parseFloat(interestRateElement.value) / 100 : defaultFinancialParams.interestRate;
    const debtTerm = debtTermElement ? parseInt(debtTermElement.value) : defaultFinancialParams.debtTermYears;
    
    return {
        debtRatio: debtRatio,
        equityRatio: 1 - debtRatio,
        interestRate: interestRate,
        debtTermYears: debtTerm,
        wacc: defaultFinancialParams.wacc,
        equityCost: defaultFinancialParams.equityCost,
        taxRate: defaultFinancialParams.taxRate,
        payableDays: defaultFinancialParams.payableDays,
        serviceDays: defaultFinancialParams.serviceDays,
        cogsPct: defaultFinancialParams.cogsPct,
        operatingExpensesPct: defaultFinancialParams.operatingExpensesPct,
        depreciationYears: defaultFinancialParams.depreciationYears,
        inventoryDays: defaultFinancialParams.inventoryDays
    };
}

// ============================================================================
// CONFIGURACIÓN DE INVENTARIO
// ============================================================================

function getInventoryParams() {
    const bottlesPerContainerElement = document.getElementById('bottlesPerContainer');
    const containerCostElement = document.getElementById('containerCost');
    const initialStockElement = document.getElementById('initialStock');
    
    // Valores por defecto REALISTAS para vinos
    const bottlesPerContainer = bottlesPerContainerElement ? parseInt(bottlesPerContainerElement.value) : 12000; // 12,000 botellas/contenedor (realista)
    const containerCost = containerCostElement ? parseInt(containerCostElement.value) : 5000; // $5,000 USD/contenedor (realista)
    const initialStockMonths = initialStockElement ? parseInt(initialStockElement.value) : 6; // 6 meses de stock inicial (realista)
    
    // Validación para evitar NaN
    const validatedParams = {
        bottlesPerContainer: isNaN(bottlesPerContainer) || bottlesPerContainer <= 0 ? 12000 : bottlesPerContainer,
        containerCost: isNaN(containerCost) || containerCost <= 0 ? 5000 : containerCost,
        initialStockMonths: isNaN(initialStockMonths) || initialStockMonths <= 0 ? 6 : initialStockMonths
    };
    

    return validatedParams;
}

// ============================================================================
// CONFIGURACIÓN DE BUSINESS MODEL
// ============================================================================

function getBusinessParams() {
    const initialTrafficElement = document.getElementById('initialTraffic');
    const initialConversionElement = document.getElementById('initialConversion');
    const avgTicketElement = document.getElementById('avgTicket');
    const salesSalaryElement = document.getElementById('salesSalary');
    const marketingPctElement = document.getElementById('marketingPct');
    const inflationElement = document.getElementById('inflation');
    
    // Patrones de crecimiento decreciente predefinidos
    // const trafficGrowthPattern = [1.00, 0.80, 0.50, 0.30, 0.20]; // Para años 2025-2030
    const trafficGrowthPattern = [1.00, 0.80, 0.60, 0.40, 0.20]; // Para años 2025-2030

    const conversionGrowthPattern = [0.40, 0.25, 0.15, 0.10, 0.05]; // Para años 2025-2030

    return {
        initialTraffic: initialTrafficElement ? parseInt(initialTrafficElement.value) : 9100,
        trafficGrowthPattern: trafficGrowthPattern, // Nuevo: patrón de crecimiento
        initialConversion: initialConversionElement ? parseFloat(initialConversionElement.value) / 100 : 0.02,
        conversionGrowthPattern: conversionGrowthPattern, // Nuevo: patrón de mejora
        avgTicket: avgTicketElement ? parseInt(avgTicketElement.value) : 50,
        salesSalary: salesSalaryElement ? parseInt(salesSalaryElement.value) : 50000,
        marketingPct: marketingPctElement ? parseFloat(marketingPctElement.value) / 100 : 0.1,
        inflation: inflationElement ? parseFloat(inflationElement.value) / 100 : 0.02,
        
        // Mantener compatibilidad con código existente (valores promedio)
        trafficGrowth: 0.60, // Promedio aproximado del patrón decreciente
        conversionGrowthRate: 0.20 // Promedio aproximado del patrón decreciente
    };
}
