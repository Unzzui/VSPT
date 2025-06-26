// ============================================================================
// WORKINGCAPITAL.JS - CAPITAL DE TRABAJO POR PAÍS
// ============================================================================

function calculateWorkingCapital() {

    
    const workingCapital = {};
    const params = getFinancialParams();
    
    for (let year = 2025; year <= 2030; year++) {
        workingCapital[year] = {
            byCountry: {},
            consolidated: {
                accountsReceivable: 0,
                inventory: 0,
                accountsPayable: 0,
                total: 0
            }
        };

        // Solo calcular WC cuando hay ingresos (desde 2025)
        if (year >= 2025 && modelData.revenues && modelData.revenues[year]) {
            Object.keys(marketDistribution).forEach(market => {
                const marketData = marketDistribution[market];
                const revenueData = modelData.revenues[year][market];
                
                if (revenueData && revenueData.netRevenue) {
                    const monthlyRevenue = revenueData.netRevenue / 12;
                    const monthlyCOGS = monthlyRevenue * params.cogsPct; // 45% COGS
                    
                    // Cuentas por cobrar (días de cobro por país)
                    const accountsReceivable = (marketData.paymentDays / 30) * monthlyRevenue;
                    
                    // Inventario (días de inventario por país)
                    const inventory = (marketData.inventoryDays / 30) * monthlyCOGS;
                    
                    // Cuentas por pagar (proveedores + servicios)
                    const payablesCOGS = (params.payableDays / 30) * monthlyCOGS;
                    const payablesServices = (params.serviceDays / 30) * (monthlyRevenue * params.operatingExpensesPct);
                    const accountsPayable = payablesCOGS + payablesServices;
                    
                    const countryWC = accountsReceivable + inventory - accountsPayable;
                    
                    workingCapital[year].byCountry[market] = {
                        accountsReceivable,
                        inventory,
                        accountsPayable,
                        total: countryWC,
                        // Métricas adicionales
                        receivableDays: marketData.paymentDays,
                        inventoryDays: marketData.inventoryDays,
                        payableDays: params.payableDays,
                        monthlyRevenue,
                        monthlyCOGS
                    };
                    
                    // Consolidar
                    workingCapital[year].consolidated.accountsReceivable += accountsReceivable;
                    workingCapital[year].consolidated.inventory += inventory;
                    workingCapital[year].consolidated.accountsPayable += accountsPayable;
                    workingCapital[year].consolidated.total += countryWC;
                }
            });
        } else if (year === 2025) {
            // WC inicial mínimo para setup y inventario inicial
            const inventoryParams = getInventoryParams();
            
            // Cálculo realista del inventario inicial
            const totalBottlesNeeded = inventoryParams.initialStockMonths * 1000; // 6 meses × 1000 botellas/mes = 6,000 botellas
            const containersNeeded = Math.ceil(totalBottlesNeeded / inventoryParams.bottlesPerContainer); // 6,000 ÷ 12,000 = 0.5 → 1 contenedor
            const initialInventoryValue = containersNeeded * inventoryParams.containerCost; // 1 × $5,000 = $5,000 USD
            
            workingCapital[year].consolidated.inventory = initialInventoryValue;
            workingCapital[year].consolidated.total = initialInventoryValue + 25000; // + capital operativo inicial
        }
    }

    // Calcular incrementos de WC (Δ WC)
    for (let year = 2026; year <= 2030; year++) {
        const previousWC = workingCapital[year - 1].consolidated.total;
        const currentWC = workingCapital[year].consolidated.total;
        workingCapital[year].deltaWC = currentWC - previousWC;
    }
    workingCapital[2025].deltaWC = workingCapital[2025].consolidated.total; // WC inicial

    updateWorkingCapitalTable(workingCapital);
    updateWorkingCapitalMetrics(workingCapital);
    modelData.workingCapital = workingCapital;
    

}

function updateWorkingCapitalTable(wc) {
    const tbody = document.getElementById('workingCapitalBody');
    if (!tbody) {
        console.warn('⚠️ Tabla Working Capital no encontrada');
        return;
    }
    
    tbody.innerHTML = '';

    // Header
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'WORKING CAPITAL POR PAÍS';
    headerRow.insertCell(1).innerHTML = '2025';
    headerRow.insertCell(2).innerHTML = '2026';
    headerRow.insertCell(3).innerHTML = '2027';
    headerRow.insertCell(4).innerHTML = '2028';
    headerRow.insertCell(5).innerHTML = '2029';
    headerRow.insertCell(6).innerHTML = '2030';

    // Por cada país
    Object.keys(marketDistribution).forEach(market => {
        const marketLabel = marketDistribution[market].label;
        
        // WC total por país
        const countryRow = tbody.insertRow();
        countryRow.insertCell(0).innerHTML = `${marketLabel} WC Total`;
        
        for (let year = 2025; year <= 2030; year++) {
            const value = wc[year].byCountry[market] ? wc[year].byCountry[market].total : 0;
            countryRow.insertCell(year - 2024).innerHTML = value ? `$${(value/1000).toFixed(0)}K` : '-';
        }
        
        // Detalle de componentes (solo para países principales)
        if (market === 'chile' || market === 'mexico') {
            // Cuentas por cobrar
            const arRow = tbody.insertRow();
            arRow.className = 'subcategory';
            arRow.insertCell(0).innerHTML = `├─ ${marketLabel} Ctas. Cobrar`;
            
            for (let year = 2025; year <= 2030; year++) {
                const value = wc[year].byCountry[market] ? wc[year].byCountry[market].accountsReceivable : 0;
                arRow.insertCell(year - 2024).innerHTML = value ? `$${(value/1000).toFixed(0)}K` : '-';
            }
            
            // Inventario
            const invRow = tbody.insertRow();
            invRow.className = 'subcategory';
            invRow.insertCell(0).innerHTML = `├─ ${marketLabel} Inventario`;
            
            for (let year = 2025; year <= 2030; year++) {
                const value = wc[year].byCountry[market] ? wc[year].byCountry[market].inventory : 0;
                invRow.insertCell(year - 2024).innerHTML = value ? `$${(value/1000).toFixed(0)}K` : '-';
            }
            
            // Cuentas por pagar
            const apRow = tbody.insertRow();
            apRow.className = 'subcategory';
            apRow.insertCell(0).innerHTML = `└─ ${marketLabel} Ctas. Pagar`;
            
            for (let year = 2025; year <= 2030; year++) {
                const value = wc[year].byCountry[market] ? wc[year].byCountry[market].accountsPayable : 0;
                apRow.insertCell(year - 2024).innerHTML = value ? `($${(value/1000).toFixed(0)}K)` : '-';
            }
        }
    });

    // Separador
    const separator = tbody.insertRow();
    separator.style.height = '10px';

    // CONSOLIDADO
    const consolidatedHeader = tbody.insertRow();
    consolidatedHeader.className = 'category-header';
    consolidatedHeader.insertCell(0).innerHTML = 'CONSOLIDADO';
    for (let i = 1; i <= 6; i++) consolidatedHeader.insertCell(i).innerHTML = '';

    // Total WC
    const totalWCRow = tbody.insertRow();
    totalWCRow.className = 'total-row';
    totalWCRow.insertCell(0).innerHTML = 'Working Capital Total';
    
    for (let year = 2025; year <= 2030; year++) {
        const value = wc[year].consolidated.total;
        totalWCRow.insertCell(year - 2024).innerHTML = `$${(value/1000).toFixed(0)}K`;
    }

    // Delta WC (incremento anual)
    const deltaRow = tbody.insertRow();
    deltaRow.className = 'subcategory';
    deltaRow.insertCell(0).innerHTML = 'Δ Working Capital';
    
    for (let year = 2025; year <= 2030; year++) {
        const value = wc[year].deltaWC || 0;
        const cell = deltaRow.insertCell(year - 2024);
        cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
        if (value > 0) cell.style.color = '#dc3545'; // Rojo para uso de caja
        else if (value < 0) cell.style.color = '#28a745'; // Verde para liberación
    }
}

function updateWorkingCapitalMetrics(wc) {
    // Calcular métricas de eficiencia del WC
    const wc2030 = wc[2030].consolidated.total;
    const revenue2030 = modelData.revenues && modelData.revenues[2030] ? 
        Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0) : 0;
    
    const wcAsPercentOfRevenue = revenue2030 > 0 ? (wc2030 / revenue2030) * 100 : 0;
    const totalDeltaWC = wc2030 - wc[2025].consolidated.total;
    
    // Días promedio de WC
    const avgInventoryDays = Object.keys(marketDistribution).reduce((sum, market, index, arr) => {
        return sum + marketDistribution[market].inventoryDays / arr.length;
    }, 0);
    
    const avgPaymentDays = Object.keys(marketDistribution).reduce((sum, market, index, arr) => {
        return sum + marketDistribution[market].paymentDays / arr.length;
    }, 0);
    
    // Actualizar elementos del dashboard
    const elements = {
        'workingCapital2030': `$${(wc2030/1000).toFixed(0)}K`,
        'wcPercentRevenue': `${wcAsPercentOfRevenue.toFixed(1)}%`,
        'totalDeltaWC': `$${(totalDeltaWC/1000).toFixed(0)}K`,
        'avgInventoryDays': `${avgInventoryDays.toFixed(0)} días`,
        'avgPaymentDays': `${avgPaymentDays.toFixed(0)} días`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
        }
    });
    

}
