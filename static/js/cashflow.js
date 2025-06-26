// ============================================================================
// CASHFLOW.JS - FLUJOS DE CAJA ECONÓMICO Y FINANCIERO
// ============================================================================

function calculateEconomicCashFlow() {
   
    
    const params = getFinancialParams();
    const economicFlow = {};
    
    // Debug: verificar disponibilidad de datos

    
    for (let year = 2025; year <= 2030; year++) {
        economicFlow[year] = {
            revenues: 0,
            cogs: 0,
            grossProfit: 0,
            operatingExpenses: 0,
            ebitda: 0,
            depreciation: 0,
            ebit: 0,
            taxes: 0,
            nopat: 0,
            capex: 0,
            deltaWC: 0,
            fcf: 0
        };
        
        // Ingresos (desde 2025 Q3-Q4)
        if (year >= 2025 && modelData.revenues && modelData.revenues[year]) {
            if (typeof marketDistribution !== 'undefined') {
                Object.keys(marketDistribution).forEach(market => {
                    const revenueData = modelData.revenues[year][market];
                    if (revenueData) {
                        economicFlow[year].revenues += revenueData.netRevenue;
                    }
                });
            }
        }
        
        // COGS y gastos operativos
        economicFlow[year].cogs = economicFlow[year].revenues * params.cogsPct;
        economicFlow[year].grossProfit = economicFlow[year].revenues - economicFlow[year].cogs;
        
        // Gastos operativos (del modelo de costos REAL)
        if (modelData.costs && modelData.costs[year]) {
            economicFlow[year].operatingExpenses = modelData.costs[year].operatingExpenses.total + 
                                                   modelData.costs[year].fixedCosts.total;
        } else {
            // Fallback usando parámetros reales del modelo
            const businessParams = getBusinessParams();
            economicFlow[year].operatingExpenses = economicFlow[year].revenues * businessParams.marketingPct + // Marketing
                                                   economicFlow[year].revenues * 0.08 + // Otros gastos operativos
                                                   (year >= 2026 ? businessParams.salesSalary || 50000 : 0) + // Salario comercial
                                                   120000 * Math.pow(1.035, year - 2025); // Costos fijos base con inflación
        }
        
        // EBITDA
        economicFlow[year].ebitda = economicFlow[year].grossProfit - economicFlow[year].operatingExpenses;
        
        // Depreciación (usando datos REALES del módulo de depreciación)
        if (modelData.depreciation && modelData.depreciation.schedule) {
            const totalDepreciationYear = modelData.depreciation.schedule
                .filter(item => !item.concepto.includes('TOTAL'))
                .reduce((sum, item) => sum + (item[year] || 0), 0);
            economicFlow[year].depreciation = totalDepreciationYear; // Ya está en USD
        } else {
            // Fallback: depreciación lineal del CAPEX acumulado hasta ese año usando datos REALES
            let accumulatedCapex = 0;
            if (modelData.investments) {
                for (let y = 2025; y <= year; y++) {
                    if (modelData.investments[y]) {
                        accumulatedCapex += modelData.investments[y].total || 0;
                    }
                }
            }
            // Usar vida útil promedio de 5 años
            economicFlow[year].depreciation = accumulatedCapex / 5;
        }
        
        // EBIT y impuestos
        economicFlow[year].ebit = economicFlow[year].ebitda - economicFlow[year].depreciation;
        economicFlow[year].taxes = Math.max(0, economicFlow[year].ebit * params.taxRate);
        economicFlow[year].nopat = economicFlow[year].ebit - economicFlow[year].taxes;
        
        // CAPEX - usar datos del CAPEX optimizado
        if (modelData.investments && modelData.investments[year]) {
            economicFlow[year].capex = modelData.investments[year].total || 0;
        } else {
            economicFlow[year].capex = 0;
        }
        
        // Working Capital (usando datos REALES del módulo de working capital)
        if (modelData.workingCapital && modelData.workingCapital[year]) {
            economicFlow[year].deltaWC = modelData.workingCapital[year].deltaWC || 0;
        } else {
            // Fallback: estimar working capital como % de ingresos incrementales
            const previousRevenue = year > 2025 && modelData.revenues && modelData.revenues[year-1] ? 
                Object.values(modelData.revenues[year-1]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
            const currentRevenue = economicFlow[year].revenues;
            const revenueGrowth = currentRevenue - previousRevenue;
            economicFlow[year].deltaWC = revenueGrowth * 0.15; // 15% del crecimiento de ingresos
        }
        
        // Valor residual en el último año (2030) usando CAPEX OPTIMIZADO REAL
        economicFlow[year].residualValue = 0;
        if (year === 2030) {
            // Calcular valor residual como % del CAPEX total optimizado REAL
            const totalCapex = modelData.investments ? 
                Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
                565000; // CAPEX optimizado base como fallback
            
            // Usar parámetro real de valor residual o 10% por defecto
            const residualValuePct = modelData.depreciation?.residualValuePct || 0.1;
            economicFlow[year].residualValue = totalCapex * residualValuePct;
        }
        
        // Free Cash Flow (incluyendo valor residual en 2030)
        economicFlow[year].fcf = economicFlow[year].nopat + economicFlow[year].depreciation - 
                                 economicFlow[year].capex - economicFlow[year].deltaWC +
                                 economicFlow[year].residualValue;
    }
    
    // Calcular VAN y TIR
    const cashFlows = Object.keys(economicFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => economicFlow[year].fcf);
    
    const npv = calculateNPV(cashFlows, params.wacc);
    const irr = calculateIRR(cashFlows);
    
    economicFlow.metrics = { npv, irr, wacc: params.wacc };
    
    updateEconomicFlowTable(economicFlow);
    modelData.economicCashFlow = economicFlow;
    

}

function calculateFinancialCashFlow() {

    
    const params = getFinancialParams();
    const financialFlow = {};
    
    for (let year = 2025; year <= 2030; year++) {
        // Comenzar con el flujo económico
        const economicData = modelData.economicCashFlow && modelData.economicCashFlow[year] ? 
            modelData.economicCashFlow[year] : {};
        
        financialFlow[year] = {
            nopat: economicData.nopat || 0,
            depreciation: economicData.depreciation || 0,
            capex: economicData.capex || 0,
            deltaWC: economicData.deltaWC || 0,
            residualValue: economicData.residualValue || 0,
            interestExpense: 0,
            taxShield: 0,
            debtService: 0,
            debtProceeds: 0, // Ingresos por préstamo recibido
            equityContribution: 0,
            fcfe: 0
        };
        
        // Ingresos por préstamo (solo en 2025 - monto total)
        if (year === 2025) {
            // Calcular deuda total basada en CAPEX total optimizado
            const totalCapex = 565000; // CAPEX optimizado total
            const params = getFinancialParams();
            financialFlow[year].debtProceeds = totalCapex * params.debtRatio;
        } else {
            financialFlow[year].debtProceeds = 0;
        }
        
        // Gastos financieros (intereses de la deuda REAL)
        if (modelData.debt && modelData.debt.schedule && modelData.debt.schedule[year]) {
            financialFlow[year].interestExpense = modelData.debt.schedule[year].interestPayment || 0;
            financialFlow[year].debtService = modelData.debt.schedule[year].principalPayment || 0;
        } else {
            // Fallback usando parámetros reales de deuda
            const financialParams = getFinancialParams();
            const totalDebt = modelData.debt?.totalAmount || 0;
            if (totalDebt > 0 && year >= 2025) {
                // Estimación simple de intereses (deuda promedio * tasa)
                const avgDebt = totalDebt * (1 - (year - 2025) / 5); // Asumiendo amortización lineal en 5 años
                financialFlow[year].interestExpense = avgDebt * financialParams.interestRate;
                financialFlow[year].debtService = totalDebt / 5; // Amortización lineal
            }
        }
        
        // Escudo fiscal por intereses
        financialFlow[year].taxShield = financialFlow[year].interestExpense * params.taxRate;
        
        // Aporte de capital (equity) en años de CAPEX
        if (modelData.capexFinancing && modelData.capexFinancing[year]) {
            financialFlow[year].equityContribution = -(modelData.capexFinancing[year].equity || 0);
        } else {
            financialFlow[year].equityContribution = 0;
        }
        
        // Free Cash Flow to Equity
        financialFlow[year].fcfe = financialFlow[year].nopat + 
                                   financialFlow[year].depreciation + 
                                   financialFlow[year].taxShield -
                                   financialFlow[year].capex - 
                                   financialFlow[year].deltaWC - 
                                   financialFlow[year].interestExpense - // Restar intereses explícitamente
                                   financialFlow[year].debtService + // Restar amortización
                                   financialFlow[year].debtProceeds + // Sumar ingresos por préstamo
                                   financialFlow[year].equityContribution +
                                   financialFlow[year].residualValue;
    }
    
    // Calcular VAN del equity y TIR del proyecto
    const equityCashFlows = Object.keys(financialFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => financialFlow[year].fcfe);
    
    const equityNPV = calculateNPV(equityCashFlows, params.equityCost);
    const projectIRR = calculateIRR(equityCashFlows);
    
    financialFlow.metrics = { 
        equityNPV, 
        projectIRR,
        equityCost: params.equityCost,
        wacc: params.wacc
    };
    
    updateFinancialFlowTable(financialFlow);
    modelData.financialCashFlow = financialFlow;
    

}

function updateEconomicFlowTable(economicFlow) {
    const tbody = document.getElementById('economicFlowBody');
    if (!tbody) {
        console.warn('⚠️ Tabla flujo económico no encontrada');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Header
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'FLUJO DE CAJA ECONÓMICO';
    headerRow.insertCell(1).innerHTML = '2025';
    headerRow.insertCell(2).innerHTML = '2026';
    headerRow.insertCell(3).innerHTML = '2027';
    headerRow.insertCell(4).innerHTML = '2028';
    headerRow.insertCell(5).innerHTML = '2029';
    headerRow.insertCell(6).innerHTML = '2030';
    
    const metrics = [
        { key: 'revenues', label: 'Ingresos', format: 'currency' },
        { key: 'cogs', label: 'COGS', format: 'currency' },
        { key: 'grossProfit', label: 'Margen Bruto', format: 'currency', highlight: true },
        { key: 'operatingExpenses', label: 'Gastos Operativos', format: 'currency' },
        { key: 'ebitda', label: 'EBITDA', format: 'currency', highlight: true },
        { key: 'depreciation', label: 'Depreciación', format: 'currency' },
        { key: 'ebit', label: 'EBIT', format: 'currency' },
        { key: 'taxes', label: 'Impuestos', format: 'currency' },
        { key: 'nopat', label: 'NOPAT', format: 'currency', highlight: true },
        { key: 'capex', label: 'CAPEX', format: 'currency' },
        { key: 'deltaWC', label: 'Δ Working Capital', format: 'currency' },
        { key: 'residualValue', label: 'Valor Residual', format: 'currency', highlight: true },
        { key: 'fcf', label: 'Flujo Libre', format: 'currency', highlight: true }
    ];
    
    metrics.forEach(metric => {
        const row = tbody.insertRow();
        if (metric.highlight) row.className = 'total-row';
        else row.className = 'subcategory';
        
        row.insertCell(0).innerHTML = metric.label;
        
        for (let year = 2025; year <= 2030; year++) {
            const value = economicFlow[year] ? economicFlow[year][metric.key] : 0;
            const cell = row.insertCell(year - 2024);
            
            cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
            if (value < 0) cell.style.color = '#dc3545';
            else if (metric.highlight && value > 0) cell.style.color = '#28a745';
        }
    });
    
    // Métricas finales
    if (economicFlow.metrics) {
        const npvRow = tbody.insertRow();
        npvRow.className = 'category-header';
        npvRow.insertCell(0).innerHTML = 'VAN Económico';
        npvRow.insertCell(1).innerHTML = '';
        npvRow.insertCell(2).innerHTML = '';
        npvRow.insertCell(3).innerHTML = '';
        npvRow.insertCell(4).innerHTML = '';
        npvRow.insertCell(5).innerHTML = '';
        const npvCell = npvRow.insertCell(6);
        npvCell.innerHTML = `$${(economicFlow.metrics.npv/1000).toFixed(0)}K`;
        npvCell.style.fontWeight = 'bold';
        npvCell.style.color = economicFlow.metrics.npv > 0 ? '#28a745' : '#dc3545';
        
        const irrRow = tbody.insertRow();
        irrRow.className = 'category-header';
        irrRow.insertCell(0).innerHTML = 'TIR Económica';
        irrRow.insertCell(1).innerHTML = '';
        irrRow.insertCell(2).innerHTML = '';
        irrRow.insertCell(3).innerHTML = '';
        irrRow.insertCell(4).innerHTML = '';
        irrRow.insertCell(5).innerHTML = '';
        const irrCell = irrRow.insertCell(6);
        irrCell.innerHTML = `${(economicFlow.metrics.irr * 100).toFixed(1)}%`;
        irrCell.style.fontWeight = 'bold';
        irrCell.style.color = economicFlow.metrics.irr > economicFlow.metrics.wacc ? '#28a745' : '#dc3545';
    }
    
    // Actualizar banners de métricas
    if (economicFlow.metrics) {
        // Actualizar VAN Económico
        const economicNPVElement = document.getElementById('economicNPV');
        if (economicNPVElement) {
            economicNPVElement.innerHTML = `$${(economicFlow.metrics.npv/1000000).toFixed(1)}M`;
        }
        // Actualizar TIR Económica
        const economicIRRElement = document.getElementById('economicIRR');
        if (economicIRRElement) {
            economicIRRElement.innerHTML = `${(economicFlow.metrics.irr * 100).toFixed(1)}%`;
        }
        // Actualizar label de WACC dinámicamente
        const economicWACCLabel = document.querySelector('#economicFlow .metric-label');
        if (economicWACCLabel && economicFlow.metrics.wacc) {
            economicWACCLabel.innerHTML = `VAN Económico (WACC ${(economicFlow.metrics.wacc * 100).toFixed(1)}%)`;
        }
        // Calcular y mostrar FCF promedio
        const fcfYears = [];
        for (let year = 2025; year <= 2030; year++) {
            if (economicFlow[year] && typeof economicFlow[year].fcf === 'number') {
                fcfYears.push(economicFlow[year].fcf);
            }
        }
        const avgFCF = fcfYears.length > 0 ? fcfYears.reduce((a, b) => a + b, 0) / fcfYears.length : 0;
        const economicFCFElement = document.getElementById('economicFCF');
        if (economicFCFElement) {
            economicFCFElement.innerHTML = `$${(avgFCF/1000000).toFixed(2)}M`;
        }
    }
}

function updateFinancialFlowTable(financialFlow) {
    const tbody = document.getElementById('financialFlowBody');
    if (!tbody) {
        console.warn('⚠️ Tabla flujo financiero no encontrada');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Header
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'FLUJO DE CAJA FINANCIERO';
    headerRow.insertCell(1).innerHTML = '2025';
    headerRow.insertCell(2).innerHTML = '2026';
    headerRow.insertCell(3).innerHTML = '2027';
    headerRow.insertCell(4).innerHTML = '2028';
    headerRow.insertCell(5).innerHTML = '2029';
    headerRow.insertCell(6).innerHTML = '2030';
    
    const metrics = [
        { key: 'nopat', label: 'NOPAT', format: 'currency' },
        { key: 'depreciation', label: 'Depreciación', format: 'currency' },
        { key: 'taxShield', label: 'Escudo Fiscal', format: 'currency' },
        { key: 'debtProceeds', label: 'Ingresos por Préstamo', format: 'currency' },
        { key: 'capex', label: 'CAPEX', format: 'currency' },
        { key: 'deltaWC', label: 'Δ Working Capital', format: 'currency' },
        { key: 'interestExpense', label: 'Gastos Financieros (Intereses)', format: 'currency' },
        { key: 'debtService', label: 'Amortización Capital', format: 'currency' },
        { key: 'equityContribution', label: 'Aporte Equity', format: 'currency' },
        { key: 'residualValue', label: 'Valor Residual', format: 'currency', highlight: true },
        { key: 'fcfe', label: 'FCFE', format: 'currency', highlight: true }
    ];
    
    metrics.forEach(metric => {
        const row = tbody.insertRow();
        if (metric.highlight) row.className = 'total-row';
        else row.className = 'subcategory';
        
        row.insertCell(0).innerHTML = metric.label;
        
        for (let year = 2025; year <= 2030; year++) {
            const value = financialFlow[year] ? financialFlow[year][metric.key] : 0;
            const cell = row.insertCell(year - 2024);
            
            cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
            if (value < 0) cell.style.color = '#dc3545';
            else if (metric.highlight && value > 0) cell.style.color = '#28a745';
        }
    });
    
    // Métricas del proyecto
    if (financialFlow.metrics) {
        const npvRow = tbody.insertRow();
        npvRow.className = 'category-header';
        npvRow.insertCell(0).innerHTML = 'VAN del Equity';
        npvRow.insertCell(1).innerHTML = '';
        npvRow.insertCell(2).innerHTML = '';
        npvRow.insertCell(3).innerHTML = '';
        npvRow.insertCell(4).innerHTML = '';
        npvRow.insertCell(5).innerHTML = '';
        const npvCell = npvRow.insertCell(6);
        npvCell.innerHTML = `$${(financialFlow.metrics.equityNPV/1000).toFixed(0)}K`;
        npvCell.style.fontWeight = 'bold';
        npvCell.style.color = financialFlow.metrics.equityNPV > 0 ? '#28a745' : '#dc3545';
        
        const irrRow = tbody.insertRow();
        irrRow.className = 'category-header';
        irrRow.insertCell(0).innerHTML = 'TIR del Proyecto';
        irrRow.insertCell(1).innerHTML = '';
        irrRow.insertCell(2).innerHTML = '';
        irrRow.insertCell(3).innerHTML = '';
        irrRow.insertCell(4).innerHTML = '';
        irrRow.insertCell(5).innerHTML = '';
        const irrCell = irrRow.insertCell(6);
        irrCell.innerHTML = `${(financialFlow.metrics.projectIRR * 100).toFixed(1)}%`;
        irrCell.style.fontWeight = 'bold';
        irrCell.style.color = financialFlow.metrics.projectIRR > financialFlow.metrics.equityCost ? '#28a745' : '#dc3545';
    }
    
    // Actualizar banners de métricas financieras
    if (financialFlow.metrics) {
        // Actualizar VAN Financiero
        const financialNPVElement = document.getElementById('financialNPV');
        if (financialNPVElement) {
            financialNPVElement.innerHTML = `$${(financialFlow.metrics.equityNPV/1000000).toFixed(1)}M`;
        }
        
        // Actualizar TIR Financiera
        const financialIRRElement = document.getElementById('financialIRR');
        if (financialIRRElement) {
            financialIRRElement.innerHTML = `${(financialFlow.metrics.projectIRR * 100).toFixed(1)}%`;
        }
        
        // Actualizar label de WACC dinámicamente para flujo financiero
        const financialWACCLabel = document.querySelector('#financialFlow .metric-label');
        if (financialWACCLabel && financialFlow.metrics.equityCost) {
            financialWACCLabel.innerHTML = `VAN Financiero (Ke ${(financialFlow.metrics.equityCost * 100).toFixed(1)}%)`;
        }
    }
}

// Funciones auxiliares para cálculos financieros
function calculateNPV(cashFlows, discountRate) {
    return cashFlows.reduce((npv, cf, index) => {
        return npv + cf / Math.pow(1 + discountRate, index);
    }, 0);
}

function calculateIRR(cashFlows) {
    // Implementación simple de TIR usando método de Newton-Raphson
    if (cashFlows.length === 0) return 0;
    
    // Validar que hay flujos positivos y negativos
    const hasPositive = cashFlows.some(cf => cf > 0);
    const hasNegative = cashFlows.some(cf => cf < 0);
    
    if (!hasPositive || !hasNegative) {
        console.warn('⚠️ Flujos de caja no válidos para TIR, usando 0%');
        return 0; // 0% por defecto
    }
    
    let rate = 0.1; // Tasa inicial 10%
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;
        
        for (let j = 0; j < cashFlows.length; j++) {
            const factor = Math.pow(1 + rate, j);
            npv += cashFlows[j] / factor;
            if (j > 0) {
                dnpv -= j * cashFlows[j] / (factor * (1 + rate));
            }
        }
        
        if (Math.abs(npv) < tolerance) {
            // Validar que el resultado es razonable
            if (rate > 0 && rate < 5) { // Entre 0% y 500%
                return rate;
            } else {
                console.warn('⚠️ TIR fuera de rango razonable, usando 0%');
                return 0; // 0% por defecto
            }
        }
        
        if (Math.abs(dnpv) < tolerance) break;
        
        rate = rate - npv / dnpv;
        
        // Evitar tasas negativas o muy altas
        if (rate < -0.99) rate = -0.99;
        if (rate > 5) rate = 5; // Máximo 500%
    }
    
    // Si no converge, usar 0%
    console.warn('⚠️ TIR no convergió, usando 0%');
    return 0; // 0% por defecto
}
