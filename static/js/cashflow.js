// ============================================================================
// CASHFLOW.JS - FLUJOS DE CAJA ECONÓMICO Y FINANCIERO
// ============================================================================

function calculateEconomicCashFlow() {
    console.log('📊 Calculando flujo de caja económico...');
    
    const params = getFinancialParams();
    const economicFlow = {};
    
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
            Object.keys(marketDistribution).forEach(market => {
                const revenueData = modelData.revenues[year][market];
                if (revenueData) {
                    economicFlow[year].revenues += revenueData.netRevenue;
                }
            });
        }
        
        // COGS y gastos operativos
        economicFlow[year].cogs = economicFlow[year].revenues * params.cogsPct;
        economicFlow[year].grossProfit = economicFlow[year].revenues - economicFlow[year].cogs;
        
        // Gastos operativos (del modelo de costos)
        if (modelData.costs && modelData.costs[year]) {
            economicFlow[year].operatingExpenses = modelData.costs[year].operatingExpenses.total + 
                                                   modelData.costs[year].fixedCosts.total;
        } else {
            // Fallback calculation
            economicFlow[year].operatingExpenses = economicFlow[year].revenues * params.operatingExpensesPct;
            if (year >= 2026) {
                economicFlow[year].operatingExpenses += getBusinessParams().salesSalary;
            }
            economicFlow[year].operatingExpenses += 168000 * Math.pow(1.035, year - 2025); // Costos fijos base actualizados
        }
        
        // EBITDA
        economicFlow[year].ebitda = economicFlow[year].grossProfit - economicFlow[year].operatingExpenses;
        
        // Depreciación (usando datos del módulo de depreciación si están disponibles)
        if (modelData.depreciation && modelData.depreciation.schedule) {
            const totalDepreciationYear = modelData.depreciation.schedule
                .filter(item => !item.concepto.includes('TOTAL'))
                .reduce((sum, item) => sum + (item[year] || 0), 0);
            economicFlow[year].depreciation = totalDepreciationYear * 1000; // Convertir de K a USD
        } else {
            // Fallback: depreciación lineal del CAPEX acumulado
            const accumulatedCapex = getAccumulatedCapex(year);
            economicFlow[year].depreciation = accumulatedCapex / params.depreciationYears;
        }
        
        // EBIT y impuestos
        economicFlow[year].ebit = economicFlow[year].ebitda - economicFlow[year].depreciation;
        economicFlow[year].taxes = Math.max(0, economicFlow[year].ebit * params.taxRate);
        economicFlow[year].nopat = economicFlow[year].ebit - economicFlow[year].taxes;
        
        // CAPEX
        const capexData = capexDistribution[year];
        economicFlow[year].capex = capexData ? 800000 * capexData.pct : 0;
        
        // Working Capital
        economicFlow[year].deltaWC = modelData.workingCapital && modelData.workingCapital[year] ? 
            modelData.workingCapital[year].deltaWC || 0 : 0;
        
        // Valor residual en el último año (2030)
        economicFlow[year].residualValue = 0;
        if (year === 2030) {
            // Calcular valor residual como % del CAPEX total
            const totalCapex = 800000;
            const residualValuePct = modelData.depreciation?.residualValuePct || 0.1; // 10% por defecto
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
    
    console.log('✅ Flujo económico calculado:', {
        'NPV': `$${(npv/1000).toFixed(0)}K`,
        'IRR': `${(irr*100).toFixed(1)}%`,
        'WACC': `${(params.wacc*100).toFixed(1)}%`
    });
}

function calculateFinancialCashFlow() {
    console.log('💸 Calculando flujo de caja financiero...');
    
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
            equityContribution: 0,
            fcfe: 0
        };
        
        // Gastos financieros (intereses de la deuda)
        if (modelData.debt && modelData.debt.schedule && modelData.debt.schedule[year]) {
            financialFlow[year].interestExpense = modelData.debt.schedule[year].interestPayment || 0;
            financialFlow[year].debtService = modelData.debt.schedule[year].principalPayment || 0;
        }
        
        // Escudo fiscal por intereses
        financialFlow[year].taxShield = financialFlow[year].interestExpense * params.taxRate;
        
        // Aporte de capital (equity) en años de CAPEX
        if (year <= 2028 && capexDistribution[year]) {
            financialFlow[year].equityContribution = -(800000 * capexDistribution[year].pct * params.equityRatio);
        }
        
        // Free Cash Flow to Equity
        financialFlow[year].fcfe = financialFlow[year].nopat + 
                                   financialFlow[year].depreciation + 
                                   financialFlow[year].taxShield -
                                   financialFlow[year].capex - 
                                   financialFlow[year].deltaWC - 
                                   financialFlow[year].debtService +
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
    
    console.log('✅ Flujo financiero calculado:', {
        'Equity NPV': `$${(equityNPV/1000).toFixed(0)}K`,
        'Project IRR': `${(projectIRR*100).toFixed(1)}%`,
        'Equity Cost': `${(params.equityCost*100).toFixed(1)}%`
    });
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
        { key: 'capex', label: 'CAPEX', format: 'currency' },
        { key: 'deltaWC', label: 'Δ Working Capital', format: 'currency' },
        { key: 'debtService', label: 'Servicio Deuda', format: 'currency' },
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

// Funciones para exportar a Excel
function createEconomicFlowSheet() {
    const data = [
        ['FLUJO DE CAJA ECONÓMICO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.economicCashFlow) {
        const metrics = [
            { key: 'revenues', label: 'Ingresos' },
            { key: 'cogs', label: 'COGS' },
            { key: 'grossProfit', label: 'Margen Bruto' },
            { key: 'operatingExpenses', label: 'Gastos Operativos' },
            { key: 'ebitda', label: 'EBITDA' },
            { key: 'depreciation', label: 'Depreciación' },
            { key: 'ebit', label: 'EBIT' },
            { key: 'taxes', label: 'Impuestos' },
            { key: 'nopat', label: 'NOPAT' },
            { key: 'capex', label: 'CAPEX' },
            { key: 'deltaWC', label: 'Δ Working Capital' },
            { key: 'fcf', label: 'Flujo Libre' }
        ];
        
        metrics.forEach(metric => {
            const row = [metric.label];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.economicCashFlow[year] ? 
                    modelData.economicCashFlow[year][metric.key] : 0;
                row.push(value);
            }
            data.push(row);
        });
        
        // Métricas
        data.push([]);
        data.push(['VAN Económico', '', '', '', '', '', modelData.economicCashFlow.metrics?.npv || 0]);
        data.push(['TIR Económica', '', '', '', '', '', (modelData.economicCashFlow.metrics?.irr || 0) * 100]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createFinancialFlowSheet() {
    const data = [
        ['FLUJO DE CAJA FINANCIERO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.financialCashFlow) {
        const metrics = [
            { key: 'nopat', label: 'NOPAT' },
            { key: 'depreciation', label: 'Depreciación' },
            { key: 'taxShield', label: 'Escudo Fiscal' },
            { key: 'capex', label: 'CAPEX' },
            { key: 'deltaWC', label: 'Δ Working Capital' },
            { key: 'debtService', label: 'Servicio Deuda' },
            { key: 'equityContribution', label: 'Aporte Capital' },
            { key: 'fcfe', label: 'Flujo al Accionista' }
        ];
        
        metrics.forEach(metric => {
            const row = [metric.label];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.financialCashFlow[year] ? 
                    modelData.financialCashFlow[year][metric.key] : 0;
                row.push(value);
            }
            data.push(row);
        });
        
        // Métricas
        data.push([]);
        data.push(['VAN del Equity', '', '', '', '', '', modelData.financialCashFlow.metrics?.equityNPV || 0]);
        data.push(['TIR del Proyecto', '', '', '', '', '', (modelData.financialCashFlow.metrics?.projectIRR || 0) * 100]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}
