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
    
    // Generar cronograma anual con año de gracia y amortización lineal
    for (let year = 2025; year <= 2025 + params.debtTermYears; year++) {
        debt.schedule[year] = {
            beginningBalance: remainingBalance,
            interestPayment: 0,
            principalPayment: 0,
            totalPayment: 0,
            endingBalance: remainingBalance,
            monthlyPayment: monthlyPayment
        };
        
        if (remainingBalance > 0) {
            if (year === 2025) {
                // AÑO DE GRACIA COMPLETO (2025): No se paga nada, intereses se capitalizan
                const capitalizedInterest = remainingBalance * params.interestRate;
                debt.schedule[year].interestPayment = 0; // No se paga nada
                debt.schedule[year].principalPayment = 0;
                debt.schedule[year].totalPayment = 0;
                debt.schedule[year].endingBalance = remainingBalance; // El saldo se mantiene igual
                
                console.log(`🔍 Año de Gracia Completo 2025 (Capitalización):`);
                console.log(`  Saldo inicial: $${remainingBalance.toFixed(0)}`);
                console.log(`  Intereses capitalizados: $${capitalizedInterest.toFixed(0)}`);
                console.log(`  Intereses pagados: $0`);
                console.log(`  Principal pagado: $0`);
                console.log(`  Saldo final: $${debt.schedule[year].endingBalance.toFixed(0)}`);
                
                // El saldo se mantiene igual para el siguiente año
                // remainingBalance = debt.schedule[year].endingBalance; // Comentado para mantener saldo original
            } else {
                // AÑOS NORMALES (2026+): Amortización lineal simple
                // El principal a amortizar es el capital original más los intereses capitalizados del año de gracia
                const capitalizedInterest = debt.debtAmount * params.interestRate; // Intereses del año de gracia
                const totalPrincipalToAmortize = debt.debtAmount + capitalizedInterest; // Capital + intereses capitalizados
                const yearlyPrincipal = totalPrincipalToAmortize / params.debtTermYears; // Amortización lineal
                const yearlyInterest = remainingBalance * params.interestRate;
                
                debt.schedule[year].interestPayment = yearlyInterest;
                debt.schedule[year].principalPayment = yearlyPrincipal;
                debt.schedule[year].totalPayment = yearlyInterest + yearlyPrincipal;
                debt.schedule[year].endingBalance = remainingBalance - yearlyPrincipal;
                
                remainingBalance = debt.schedule[year].endingBalance;
                
                if (year === 2026) {
                    console.log(`🔍 Primer Año de Amortización Lineal 2026:`);
                    console.log(`  Saldo inicial: $${debt.schedule[year].beginningBalance.toFixed(0)}`);
                    console.log(`  Intereses capitalizados año gracia: $${capitalizedInterest.toFixed(0)}`);
                    console.log(`  Principal total a amortizar: $${totalPrincipalToAmortize.toFixed(0)}`);
                    console.log(`  Amortización anual: $${yearlyPrincipal.toFixed(0)}`);
                    console.log(`  Intereses pagados: $${yearlyInterest.toFixed(0)}`);
                    console.log(`  Principal pagado: $${yearlyPrincipal.toFixed(0)}`);
                    console.log(`  Saldo final: $${remainingBalance.toFixed(0)}`);
                }
            }
        }
    }
    
    // Calcular métricas adicionales
    debt.metrics = calculateDebtMetrics(debt);
    
    updateDebtScheduleTable(debt);
    updateDebtMetrics(debt);
    modelData.debt = debt;
    
    // Debug: Verificar que los datos se guardaron correctamente
    console.log('🔍 Verificación Datos Deuda Guardados:');
    console.log('  modelData.debt existe:', !!modelData.debt);
    console.log('  Cronograma 2025:', modelData.debt?.schedule?.[2025]);
    console.log('  Cronograma 2026:', modelData.debt?.schedule?.[2026]);
    console.log('  Total deuda:', modelData.debt?.debtAmount);
    

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
    infoRow.insertCell(0).innerHTML = 'CRONOGRAMA AMORTIZACIÓN LINEAL (CON AÑO DE GRACIA)';
    infoRow.insertCell(1).innerHTML = `Deuda: $${(debt.debtAmount/1000).toFixed(0)}K de $${(debt.totalCapex/1000).toFixed(0)}K`;
    infoRow.insertCell(2).innerHTML = `Tasa: ${(debt.interestRate*100).toFixed(1)}% anual`;
    infoRow.insertCell(3).innerHTML = `Plazo: ${debt.termYears} años`;
    infoRow.insertCell(4).innerHTML = `Amortización: $${(debt.debtAmount/debt.termYears/1000).toFixed(0)}K/año`;
    infoRow.insertCell(5).innerHTML = `Año Gracia: 2025`;
    
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
            
            // Resaltar año de gracia y años especiales
            if (year === 2025) {
                row.className = 'total-row';
                row.style.backgroundColor = '#fff3cd'; // Color amarillo para año de gracia
                row.cells[0].innerHTML = `${year} (Gracia)`;
                row.cells[3].innerHTML = '$0K (Solo Intereses)';
            } else if (year === 2026) {
                row.className = 'subcategory';
                row.style.backgroundColor = '#d1ecf1'; // Color azul para primer año de amortización
                row.cells[0].innerHTML = `${year} (Inicia Amort.)`;
            } else if (schedule.endingBalance === 0) {
                row.className = 'subcategory';
            }
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
    const yearlyPrincipal = debt.debtAmount / debt.termYears; // Amortización anual lineal
    const debtToEquityRatio = debt.equityAmount > 0 ? (debt.debtAmount / debt.equityAmount) * 100 : 0;
    
    const elements = {
        // Controles dinámicos en la parte superior
        'dynamicDebtAmount': `$${(debt.debtAmount/1000).toFixed(0)}K (${(debt.debtAmount/debt.totalCapex*100).toFixed(0)}% del CAPEX)`,
        'dynamicDebtTerm': `${debt.termYears} años (lineal, gracia 2025)`,
        'dynamicInterestRate': `${(debt.interestRate*100).toFixed(1)}% anual`,
        'dynamicMonthlyPayment': `$${(yearlyPrincipal/12).toFixed(0)}/mes (desde 2026)`,
        
        // Banners de métricas
        'totalDebtAmount': `$${(debt.debtAmount/1000).toFixed(0)}K`,
        'monthlyPaymentAmount': `$${(yearlyPrincipal/12).toFixed(0)}`,
        'totalInterestPaid': `$${(debt.metrics.totalInterestPaid/1000).toFixed(0)}K`,
        'debtServiceRatio': `${debtToEquityRatio.toFixed(0)}%`,
        
        // IDs alternativos por si existen en otros lugares
        'totalDebt': `$${(debt.debtAmount/1000).toFixed(0)}K`,
        'monthlyPayment': `$${(yearlyPrincipal/12).toFixed(0)}`,
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
