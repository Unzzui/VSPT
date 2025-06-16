// ============================================================================
// DEBT.JS - CRONOGRAMA DE DEUDA CON AMORTIZACIÓN FRANCESA
// ============================================================================

function calculateDebtStructure() {
    console.log('💳 Calculando cronograma de deuda francesa...');
    
    const params = getFinancialParams();
    
    // Obtener CAPEX total dinámico (incluyendo inventario)
    const inventoryParams = getInventoryParams();
    const totalBottlesNeeded = (inventoryParams.initialStockMonths || 3) * 1000;
    const containersNeeded = Math.ceil(totalBottlesNeeded / (inventoryParams.bottlesPerContainer || 1200));
    const inventoryInvestment = containersNeeded * (inventoryParams.containerCost || 8500);
    
    const baseCapex = 800000; // CAPEX base
    const totalCapex = baseCapex + inventoryInvestment; // CAPEX total incluyendo inventario
    
    const debtAmount = totalCapex * params.debtRatio;
    const equityAmount = totalCapex * params.equityRatio;
    
    console.log('📊 Parámetros de deuda dinámicos:', {
        'CAPEX Base': `$${(baseCapex/1000).toFixed(0)}K`,
        'Inventario': `$${(inventoryInvestment/1000).toFixed(0)}K`,
        'CAPEX Total': `$${(totalCapex/1000).toFixed(0)}K`,
        'Monto Deuda': `$${(debtAmount/1000).toFixed(0)}K`,
        'Ratio Deuda': `${(params.debtRatio * 100).toFixed(1)}%`,
        'Tasa Interés': `${(params.interestRate * 100).toFixed(1)}%`,
        'Plazo': `${params.debtTermYears} años`
    });
    
    const debt = {
        totalCapex: totalCapex,
        debtAmount: debtAmount,
        equityAmount: equityAmount,
        interestRate: params.interestRate,
        termYears: params.debtTermYears,
        schedule: {}
    };
    
    // Calcular cuota francesa
    const monthlyRate = params.interestRate / 12;
    const totalPayments = params.debtTermYears * 12;
    const monthlyPayment = debtAmount > 0 ? 
        debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;
    
    let remainingBalance = debtAmount;
    
    // Generar cronograma anual
    for (let year = 2025; year <= 2025 + params.debtTermYears; year++) {
        debt.schedule[year] = {
            beginningBalance: remainingBalance,
            interestPayment: 0,
            principalPayment: 0,
            totalPayment: 0,
            endingBalance: remainingBalance,
            monthlyPayment: monthlyPayment
        };
        
        if (remainingBalance > 0 && year >= 2025) {
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;
            
            // Calcular pagos mensuales para el año
            for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
                const monthlyInterest = remainingBalance * monthlyRate;
                const monthlyPrincipal = Math.min(monthlyPayment - monthlyInterest, remainingBalance);
                
                yearlyInterest += monthlyInterest;
                yearlyPrincipal += monthlyPrincipal;
                remainingBalance = Math.max(0, remainingBalance - monthlyPrincipal);
            }
            
            debt.schedule[year].interestPayment = yearlyInterest;
            debt.schedule[year].principalPayment = yearlyPrincipal;
            debt.schedule[year].totalPayment = yearlyInterest + yearlyPrincipal;
            debt.schedule[year].endingBalance = remainingBalance;
        }
    }
    
    // Calcular métricas adicionales
    debt.metrics = calculateDebtMetrics(debt);
    
    updateDebtScheduleTable(debt);
    updateDebtMetrics(debt);
    modelData.debt = debt;
    
    console.log('✅ Cronograma de deuda calculado:', {
        'Monto Total': `$${(debtAmount/1000).toFixed(0)}K`,
        'Cuota Mensual': `$${(monthlyPayment).toFixed(0)}`,
        'Plazo': `${params.debtTermYears} años`
    });
}

function calculateDebtMetrics(debt) {
    const metrics = {
        totalInterestPaid: 0,
        totalPayments: 0,
        averageBalance: 0,
        effectiveRate: 0,
        debtServiceCoverage: []
    };
    
    // Sumar intereses y pagos totales
    Object.keys(debt.schedule).forEach(year => {
        const schedule = debt.schedule[year];
        metrics.totalInterestPaid += schedule.interestPayment;
        metrics.totalPayments += schedule.totalPayment;
    });
    
    // Calcular balance promedio
    const balances = Object.values(debt.schedule).map(s => s.beginningBalance);
    metrics.averageBalance = balances.reduce((sum, bal) => sum + bal, 0) / balances.length;
    
    // Tasa efectiva
    metrics.effectiveRate = debt.debtAmount > 0 ? 
        (metrics.totalInterestPaid / debt.debtAmount) * 100 : 0;
    
    return metrics;
}

function updateDebtScheduleTable(debt) {
    const tbody = document.getElementById('debtScheduleBody');
    if (!tbody) {
        console.warn('⚠️ Tabla cronograma de deuda no encontrada (ID: debtScheduleBody)');
        return;
    }
    
    console.log('📋 Actualizando tabla de cronograma de deuda:', {
        'Monto Deuda': `$${(debt.debtAmount/1000).toFixed(0)}K`,
        'Tasa': `${(debt.interestRate*100).toFixed(1)}%`,
        'Plazo': `${debt.termYears} años`,
        'CAPEX Total': `$${(debt.totalCapex/1000).toFixed(0)}K`
    });
    
    tbody.innerHTML = '';
    
    const endYear = 2025 + debt.termYears;
    
    // Header informativo con parámetros dinámicos
    const infoRow = tbody.insertRow();
    infoRow.className = 'category-header';
    infoRow.insertCell(0).innerHTML = 'CRONOGRAMA AMORTIZACIÓN FRANCESA';
    infoRow.insertCell(1).innerHTML = `Deuda: $${(debt.debtAmount/1000).toFixed(0)}K de $${(debt.totalCapex/1000).toFixed(0)}K`;
    infoRow.insertCell(2).innerHTML = `Tasa: ${(debt.interestRate*100).toFixed(1)}% anual`;
    infoRow.insertCell(3).innerHTML = `Plazo: ${debt.termYears} años`;
    infoRow.insertCell(4).innerHTML = `Cuota: $${debt.schedule[2025]?.monthlyPayment?.toFixed(0) || 0}/mes`;
    infoRow.insertCell(5).innerHTML = '';
    
    // Headers de columnas
    const headerRow = tbody.insertRow();
    headerRow.className = 'subcategory-header';
    headerRow.insertCell(0).innerHTML = 'AÑO';
    headerRow.insertCell(1).innerHTML = 'SALDO INICIAL';
    headerRow.insertCell(2).innerHTML = 'INTERESES';
    headerRow.insertCell(3).innerHTML = 'PRINCIPAL';
    headerRow.insertCell(4).innerHTML = 'CUOTA ANUAL';
    headerRow.insertCell(5).innerHTML = 'SALDO FINAL';
    
    for (let year = 2025; year <= endYear; year++) {
        const schedule = debt.schedule[year];
        if (schedule && (schedule.beginningBalance > 0 || year === 2025)) {
            const row = tbody.insertRow();
            
            row.insertCell(0).innerHTML = year;
            row.insertCell(1).innerHTML = `$${(schedule.beginningBalance/1000).toFixed(0)}K`;
            row.insertCell(2).innerHTML = `$${(schedule.interestPayment/1000).toFixed(0)}K`;
            row.insertCell(3).innerHTML = `$${(schedule.principalPayment/1000).toFixed(0)}K`;
            row.insertCell(4).innerHTML = `$${(schedule.totalPayment/1000).toFixed(0)}K`;
            row.insertCell(5).innerHTML = `$${(schedule.endingBalance/1000).toFixed(0)}K`;
            
            // Resaltar primer y último año
            if (year === 2025) row.className = 'total-row';
            if (schedule.endingBalance === 0) row.className = 'subcategory';
        }
    }
    
    // Resumen final
    const summaryRow = tbody.insertRow();
    summaryRow.className = 'total-row';
    summaryRow.insertCell(0).innerHTML = 'TOTALES';
    summaryRow.insertCell(1).innerHTML = '';
    summaryRow.insertCell(2).innerHTML = `$${(debt.metrics.totalInterestPaid/1000).toFixed(0)}K`;
    summaryRow.insertCell(3).innerHTML = `$${(debt.debtAmount/1000).toFixed(0)}K`;
    summaryRow.insertCell(4).innerHTML = `$${(debt.metrics.totalPayments/1000).toFixed(0)}K`;
    summaryRow.insertCell(5).innerHTML = '$0K';
}

function updateDebtMetrics(debt) {
    // Actualizar métricas de deuda en el dashboard y controles dinámicos
    const monthlyPayment = debt.schedule[2025]?.monthlyPayment || 0;
    const debtToEquityRatio = debt.equityAmount > 0 ? (debt.debtAmount / debt.equityAmount) * 100 : 0;
    
    const elements = {
        // Controles dinámicos en la parte superior
        'dynamicDebtAmount': `$${(debt.debtAmount/1000).toFixed(0)}K (${(debt.debtAmount/debt.totalCapex*100).toFixed(0)}% del CAPEX)`,
        'dynamicDebtTerm': `${debt.termYears} años`,
        'dynamicInterestRate': `${(debt.interestRate*100).toFixed(1)}% anual`,
        'dynamicMonthlyPayment': `$${monthlyPayment.toFixed(0)}`,
        
        // Banners de métricas
        'totalDebtAmount': `$${(debt.debtAmount/1000).toFixed(0)}K`,
        'monthlyPaymentAmount': `$${monthlyPayment.toFixed(0)}`,
        'totalInterestPaid': `$${(debt.metrics.totalInterestPaid/1000).toFixed(0)}K`,
        'debtServiceRatio': `${debtToEquityRatio.toFixed(0)}%`,
        
        // IDs alternativos por si existen en otros lugares
        'totalDebt': `$${(debt.debtAmount/1000).toFixed(0)}K`,
        'monthlyPayment': `$${monthlyPayment.toFixed(0)}`,
        'totalInterest': `$${(debt.metrics.totalInterestPaid/1000).toFixed(0)}K`,
        'effectiveRate': `${debt.metrics.effectiveRate.toFixed(1)}%`,
        'debtToEquity': `${debtToEquityRatio.toFixed(0)}%`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
        }
    });
    
    console.log('📊 Métricas de deuda actualizadas dinámicamente:', {
        'Total Debt': elements.totalDebtAmount,
        'Monthly Payment': elements.monthlyPaymentAmount,
        'Total Interest': elements.totalInterestPaid,
        'Debt/Equity': elements.debtServiceRatio
    });
}

// Función para exportar cronograma de deuda a Excel
function createDebtSheet() {
    const data = [
        ['CRONOGRAMA DE DEUDA', '', '', '', '', ''],
        ['Año', 'Saldo Inicial', 'Intereses', 'Principal', 'Cuota Anual', 'Saldo Final'],
        []
    ];
    
    if (modelData.debt && modelData.debt.schedule) {
        const debt = modelData.debt;
        const endYear = 2025 + debt.termYears;
        
        // Información del préstamo
        data.push([
            `Monto: $${(debt.debtAmount/1000).toFixed(0)}K`,
            `Tasa: ${(debt.interestRate*100).toFixed(1)}%`,
            `Plazo: ${debt.termYears} años`,
            `Cuota Mensual: $${debt.schedule[2025]?.monthlyPayment?.toFixed(0) || 0}`,
            '', ''
        ]);
        data.push([]);
        
        // Cronograma
        for (let year = 2025; year <= endYear; year++) {
            const schedule = debt.schedule[year];
            if (schedule && (schedule.beginningBalance > 0 || year === 2025)) {
                data.push([
                    year,
                    schedule.beginningBalance,
                    schedule.interestPayment,
                    schedule.principalPayment,
                    schedule.totalPayment,
                    schedule.endingBalance
                ]);
            }
        }
        
        // Totales
        data.push([]);
        data.push([
            'TOTALES',
            '',
            debt.metrics.totalInterestPaid,
            debt.debtAmount,
            debt.metrics.totalPayments,
            0
        ]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

// Función de debug para cronograma de deuda
function debugDebt() {
    console.log('🔍 Debug del cronograma de deuda:');
    
    const params = getFinancialParams();
    console.log('📊 Parámetros financieros:', params);
    
    const inventoryParams = getInventoryParams();
    console.log('📦 Parámetros de inventario:', inventoryParams);
    
    const totalBottlesNeeded = (inventoryParams.initialStockMonths || 3) * 1000;
    const containersNeeded = Math.ceil(totalBottlesNeeded / (inventoryParams.bottlesPerContainer || 1200));
    const inventoryInvestment = containersNeeded * (inventoryParams.containerCost || 8500);
    
    const baseCapex = 800000;
    const totalCapex = baseCapex + inventoryInvestment;
    const debtAmount = totalCapex * params.debtRatio;
    
    console.log('💰 Cálculos de deuda:');
    console.log('- CAPEX Base:', `$${(baseCapex/1000).toFixed(0)}K`);
    console.log('- Inventario:', `$${(inventoryInvestment/1000).toFixed(0)}K`);
    console.log('- CAPEX Total:', `$${(totalCapex/1000).toFixed(0)}K`);
    console.log('- Monto Deuda:', `$${(debtAmount/1000).toFixed(0)}K`);
    console.log('- Ratio Deuda:', `${(params.debtRatio * 100).toFixed(1)}%`);
    console.log('- Tasa Interés:', `${(params.interestRate * 100).toFixed(1)}%`);
    console.log('- Plazo:', `${params.debtTermYears} años`);
    
    // Calcular cuota francesa
    const monthlyRate = params.interestRate / 12;
    const totalPayments = params.debtTermYears * 12;
    const monthlyPayment = debtAmount > 0 ? 
        debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;
    
    console.log('- Cuota Mensual:', `$${monthlyPayment.toFixed(0)}`);
    console.log('- Cuota Anual:', `$${(monthlyPayment * 12).toFixed(0)}`);
    
    return {
        params,
        inventoryParams,
        totalCapex,
        debtAmount,
        monthlyPayment
    };
}

// Exponer función de debug globalmente
window.debugDebt = debugDebt;
