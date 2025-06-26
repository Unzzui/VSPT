// ============================================================================
// DEBT.JS - CRONOGRAMA DE DEUDA CON AMORTIZACIÓN FRANCESA
// ============================================================================

function calculateDebtStructure() {

    
    const params = getFinancialParams();
    
    // CAPEX OPTIMIZADO - Reducido de $800K a $565K (-29.4%)
    const optimizedCapex = 565000; // CAPEX optimizado base (sin inventario)
    const totalCapex = optimizedCapex; // CAPEX total (inventario va en Working Capital)
    
    const debtAmount = totalCapex * params.debtRatio;
    const equityAmount = totalCapex * params.equityRatio;
    

    
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
    

    
    tbody.innerHTML = '';
    
    const endYear = 2025 + debt.termYears;
    
    // Header informativo con parámetros optimizados
    const infoRow = tbody.insertRow();
    infoRow.className = 'category-header';
    infoRow.insertCell(0).innerHTML = 'CRONOGRAMA AMORTIZACIÓN FRANCESA (CAPEX OPTIMIZADO)';
    infoRow.insertCell(1).innerHTML = `Deuda: $${(debt.debtAmount/1000).toFixed(0)}K de $${(debt.totalCapex/1000).toFixed(0)}K`;
    infoRow.insertCell(2).innerHTML = `Tasa: ${(debt.interestRate*100).toFixed(1)}% anual`;
    infoRow.insertCell(3).innerHTML = `Plazo: ${debt.termYears} años`;
    infoRow.insertCell(4).innerHTML = `Cuota: $${debt.schedule[2025]?.monthlyPayment?.toFixed(0) || 0}/mes`;
    infoRow.insertCell(5).innerHTML = `Ahorro: $${((800000 - 565000)/1000).toFixed(0)}K (-29.4%)`;
    
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
    

}

// Función de debug para cronograma de deuda optimizado
function debugDebt() {

    
    const params = getFinancialParams();

    
    const optimizedCapex = 565000; // CAPEX optimizado
    const originalCapex = 800000; // CAPEX original
    const totalCapex = optimizedCapex; // Sin inventario (va en Working Capital)
    const debtAmount = totalCapex * params.debtRatio;
    const savings = originalCapex - optimizedCapex;
    

    
    // Calcular cuota francesa
    const monthlyRate = params.interestRate / 12;
    const totalPayments = params.debtTermYears * 12;
    const monthlyPayment = debtAmount > 0 ? 
        debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;
    

    
    return {
        params,
        optimizedCapex,
        originalCapex,
        savings,
        totalCapex,
        debtAmount,
        monthlyPayment
    };
}

// Exponer función de debug globalmente
window.debugDebt = debugDebt;
