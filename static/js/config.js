// ============================================================================
// CONFIGURACIÓN Y CONSTANTES DEL MODELO FINANCIERO
// ============================================================================

// Tasas de cambio (conservadoras)
const exchangeRates = {
    MXN: 18.5,
    BRL: 5.2,
    CAD: 1.35,
    USD: 1.0
};

// Distribución de mercados con configuración de working capital
const marketDistribution = {
    mexico: { 
        weight: 0.35, 
        currency: 'MXN', 
        tax: 0.16, 
        premium: 1.1, 
        paymentDays: 0, 
        inventoryDays: 45,
        label: 'México'
    },
    brasil: { 
        weight: 0.25, 
        currency: 'BRL', 
        tax: 0.18, 
        premium: 1.2, 
        paymentDays: 30, 
        inventoryDays: 60,
        label: 'Brasil'
    },
    canada: { 
        weight: 0.20, 
        currency: 'CAD', 
        tax: 0.13, 
        premium: 1.3, 
        paymentDays: 0, 
        inventoryDays: 45,
        label: 'Canadá'
    },
    usa: { 
        weight: 0.20, 
        currency: 'USD', 
        tax: 0.08, 
        premium: 1.4, 
        paymentDays: 0, 
        inventoryDays: 45,
        label: 'Estados Unidos'
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
    payableDays: 45,
    serviceDays: 30,
    cogsPct: 0.54,
    operatingExpensesPct: 0.10, // Cambiado de 0.25 a 0.10 (10%)
    depreciationYears: 5
};

// Distribución de CAPEX por años (total $800K)
const capexDistribution = {
    2025: { pct: 0.45, label: '45%' }, // $360K
    2026: { pct: 0.30, label: '30%' }, // $240K
    2027: { pct: 0.20, label: '20%' }, // $160K
    2028: { pct: 0.05, label: '5%' }   // $40K
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
        depreciationYears: defaultFinancialParams.depreciationYears
    };
}

// ============================================================================
// CONFIGURACIÓN DE INVENTARIO
// ============================================================================

function getInventoryParams() {
    const bottlesPerContainerElement = document.getElementById('bottlesPerContainer');
    const containerCostElement = document.getElementById('containerCost');
    const initialStockElement = document.getElementById('initialStock');
    
    const bottlesPerContainer = bottlesPerContainerElement ? parseInt(bottlesPerContainerElement.value) : 1200;
    const containerCost = containerCostElement ? parseInt(containerCostElement.value) : 8500;
    const initialStockMonths = initialStockElement ? parseInt(initialStockElement.value) : 3;
    
    // Validación para evitar NaN
    const validatedParams = {
        bottlesPerContainer: isNaN(bottlesPerContainer) || bottlesPerContainer <= 0 ? 1200 : bottlesPerContainer,
        containerCost: isNaN(containerCost) || containerCost <= 0 ? 8500 : containerCost,
        initialStockMonths: isNaN(initialStockMonths) || initialStockMonths <= 0 ? 3 : initialStockMonths
    };
    
    console.log('📦 Parámetros de inventario obtenidos:', validatedParams);
    return validatedParams;
}

// ============================================================================
// CONFIGURACIÓN DE BUSINESS MODEL
// ============================================================================

function getBusinessParams() {
    const initialTrafficElement = document.getElementById('initialTraffic');
    const trafficGrowthElement = document.getElementById('trafficGrowth');
    const initialConversionElement = document.getElementById('initialConversion');
    const conversionGrowthElement = document.getElementById('conversionGrowthRate');
    const avgTicketElement = document.getElementById('avgTicket');
    const salesSalaryElement = document.getElementById('salesSalary');
    const marketingPctElement = document.getElementById('marketingPct');
    const inflationElement = document.getElementById('inflation');
    

    return {
        initialTraffic: initialTrafficElement ? parseInt(initialTrafficElement.value) : 9100,
        trafficGrowth: trafficGrowthElement ? parseFloat(trafficGrowthElement.value) / 100 : 0.45,
        initialConversion: initialConversionElement ? parseFloat(initialConversionElement.value) / 100 : 0.02,
        conversionGrowthRate: conversionGrowthElement ? parseFloat(conversionGrowthElement.value) / 100 : 0.20,
        avgTicket: avgTicketElement ? parseInt(avgTicketElement.value) : 40,
        salesSalary: salesSalaryElement ? parseInt(salesSalaryElement.value) : 120000,
        marketingPct: marketingPctElement ? parseFloat(marketingPctElement.value) / 100 : 0.12,
        inflation: inflationElement ? parseFloat(inflationElement.value) / 100 : 0.035
    };
}
