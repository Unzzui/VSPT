// ============================================================================
// WORKINGCAPITAL.JS - CAPITAL DE TRABAJO CORREGIDO (ESTRUCTURA ORIGINAL)
// ============================================================================

function calculateWorkingCapital() {
    const workingCapital = {};
    const params = getFinancialParams();
    
    // ========== DEBUG CRÍTICO ==========
    console.log('🔍 DEBUG - Verificando ingresos por país en 2025:');
    if (modelData.revenues && modelData.revenues[2025]) {
        Object.keys(marketDistribution).forEach(market => {
            const revenueData = modelData.revenues[2025][market];
            console.log(`${market}:`, revenueData ? `$${revenueData.netRevenue}` : 'NO DATA');
        });
    } else {
        console.log('❌ NO hay modelData.revenues[2025]');
    }
    
    console.log('🔍 PaymentDays configurados:');
    Object.keys(marketDistribution).forEach(market => {
        console.log(`${market}: ${marketDistribution[market].paymentDays} días`);
    });
    // ================================
    
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

        // Cálculo de WC cuando hay ingresos
        if (year >= 2025 && modelData.revenues && modelData.revenues[year]) {
            Object.keys(marketDistribution).forEach(market => {
                const marketData = marketDistribution[market];
                const revenueData = modelData.revenues[year][market];
                
                // ========== DEBUG ADICIONAL ==========
                if (year === 2025) {
                    console.log(`📊 ${market} 2025: revenueData existe?`, !!revenueData);
                    if (revenueData) {
                        console.log(`📊 ${market} 2025: netRevenue =`, revenueData.netRevenue);
                    }
                }
                // ===================================
                
                if (revenueData && revenueData.netRevenue) {
                    // CORRECCIÓN: Determinar si es año completo o parcial
                    let operatingMonths = 12;
                    if (year === 2025) {
                        operatingMonths = 6; // Solo 6 meses de operación en 2025
                    }
                    
                    // CORRECCIÓN: Usar revenue como base para el período que representa
                    const periodRevenue = revenueData.netRevenue;
                    const periodCOGS = periodRevenue * params.cogsPct;
                    
                    // Anualizar para usar fórmulas estándar de WC
                    const annualizedRevenue = periodRevenue; // Ya viene anualizado
                    const annualizedCOGS = periodCOGS;
                    
                    // CORRECCIÓN CRÍTICA: Usar gastos operativos reales de costs.js
                    let annualizedOpEx = 0;
                    if (modelData.costs && modelData.costs[year]) {
                        // Usar el total de gastos operativos calculado en costs.js
                        // Los costos ya están ajustados para 6 meses en 2025
                        annualizedOpEx = modelData.costs[year].operatingExpenses.total;
                        
                        // CORRECCIÓN: NO anualizar porque ya vienen ajustados por 6 meses
                        // Para WC, usar directamente los costos ya ajustados
                        if (year === 2025) {
                            // Los costos ya están por 6 meses, multiplicar por 2 para anualizar para fórmulas WC
                            annualizedOpEx = annualizedOpEx * 2;
                        }
                    } else {
                        // Fallback: usar porcentaje fijo si no hay costs calculados
                        annualizedOpEx = annualizedRevenue * params.operatingExpensesPct;
                        console.warn(`⚠️ ${year}: Usando OpEx fijo porque no hay costs calculados`);
                    }
                    
                    // Fórmulas corregidas usando base de 365 días
                    const accountsReceivable = (marketData.paymentDays / 365) * annualizedRevenue;
                    const inventory = (marketData.inventoryDays / 365) * annualizedCOGS;
                    
                    // CORRECCIÓN: Cuentas por pagar usando gastos operativos reales
                    const payablesCOGS = (params.payableDays / 365) * annualizedCOGS;
                    const payablesServices = (params.payableDays / 365) * annualizedOpEx; // TODOS los OpEx son pagables
                    const accountsPayable = payablesCOGS + payablesServices;
                    
                    // Ajustar a período real de operación
                    const operatingFactor = operatingMonths / 12;
                    
                    // ========== DEBUG DETALLADO CUENTAS POR PAGAR ==========
                    if (year === 2025) {
                        console.log(`🔍 ${market} 2025 - Debug Cuentas por Pagar:`);
                        console.log(`  COGS anualizado: $${annualizedCOGS.toFixed(0)}`);
                        console.log(`  OpEx anualizado: $${annualizedOpEx.toFixed(0)}`);
                        console.log(`  Base total (COGS + OpEx): $${(annualizedCOGS + annualizedOpEx).toFixed(0)}`);
                        console.log(`  Días de pago: ${params.payableDays}`);
                        console.log(`  Factor: ${params.payableDays}/365 = ${(params.payableDays/365).toFixed(4)}`);
                        console.log(`  Payables COGS: $${payablesCOGS.toFixed(0)}`);
                        console.log(`  Payables Services (100%): $${payablesServices.toFixed(0)}`);
                        console.log(`  AP antes de ajuste: $${accountsPayable.toFixed(0)}`);
                        console.log(`  Factor operación: ${operatingFactor}`);
                        console.log(`  AP final: $${(accountsPayable * operatingFactor).toFixed(0)}`);
                    }
                    // ======================================================
                    
                    const finalAR = accountsReceivable * operatingFactor;
                    const finalInv = inventory * operatingFactor;
                    const finalAP = accountsPayable * operatingFactor;
                    
                    const countryWC = finalAR + finalInv - finalAP;
                    
                    // ========== DEBUG RESULTADOS ==========
                    if (year === 2025) {
                        console.log(`✅ ${market} 2025 WC calculado:`);
                        console.log(`  AR: $${finalAR.toFixed(0)} (${marketData.paymentDays} días)`);
                        console.log(`  Inv: $${finalInv.toFixed(0)} (${marketData.inventoryDays} días)`);
                        console.log(`  AP: $${finalAP.toFixed(0)} (${params.payableDays} días)`);
                        console.log(`  WC Total: $${countryWC.toFixed(0)}`);
                    }
                    // ====================================
                    
                    workingCapital[year].byCountry[market] = {
                        accountsReceivable: finalAR,
                        inventory: finalInv,
                        accountsPayable: finalAP,
                        total: countryWC,
                        // Métricas adicionales
                        receivableDays: marketData.paymentDays,
                        inventoryDays: marketData.inventoryDays,
                        payableDays: params.payableDays,
                        operatingMonths: operatingMonths,
                        monthlyRevenue: periodRevenue / operatingMonths,
                        monthlyCOGS: periodCOGS / operatingMonths,
                        // Validación
                        impliedARDays: (finalAR / periodRevenue) * (365 * operatingMonths / 12),
                        impliedInvDays: (finalInv / periodCOGS) * (365 * operatingMonths / 12)
                    };
                    
                    // Consolidar
                    workingCapital[year].consolidated.accountsReceivable += finalAR;
                    workingCapital[year].consolidated.inventory += finalInv;
                    workingCapital[year].consolidated.accountsPayable += finalAP;
                    workingCapital[year].consolidated.total += countryWC;
                } else {
                    // ========== DEBUG PAÍSES SIN INGRESOS ==========
                    if (year === 2025) {
                        console.log(`❌ ${market} 2025: NO tiene ingresos válidos`);
                    }
                    // ============================================
                }
            });
        }
        
        // WC inicial para 2025 (componente adicional)
        if (year === 2025) {
            // CORRECCIÓN: Solo WC operativo, sin capital inicial ni inventario inicial
            // Los componentes pre-operativos van en otra parte del modelo
            
            // Métricas especiales para 2025 (solo para debugging)
            workingCapital[year].preOperativeComponents = {
                operativeWC: workingCapital[year].consolidated.accountsReceivable - workingCapital[year].consolidated.accountsPayable,
                totalInventory: workingCapital[year].consolidated.inventory
            };
        }
    }

    // Calcular incrementos de WC (Δ WC)
    for (let year = 2026; year <= 2030; year++) {
        const previousWC = workingCapital[year - 1].consolidated.total;
        const currentWC = workingCapital[year].consolidated.total;
        workingCapital[year].deltaWC = currentWC - previousWC;
    }
    workingCapital[2025].deltaWC = workingCapital[2025].consolidated.total; // WC inicial

    // Validación antes de actualizar tablas
    console.log('🔍 VALIDACIÓN WC - SOLO OPERATIVO');
    if (workingCapital[2025].preOperativeComponents) {
        const comp = workingCapital[2025].preOperativeComponents;
        console.log(`📊 2025 WC Operativo: AR $${(workingCapital[2025].consolidated.accountsReceivable/1000).toFixed(0)}K - AP $${(workingCapital[2025].consolidated.accountsPayable/1000).toFixed(0)}K + Inv $${(comp.totalInventory/1000).toFixed(0)}K = $${(workingCapital[2025].consolidated.total/1000).toFixed(0)}K`);
    }
    
    // Validar días implícitos vs esperados
    Object.keys(workingCapital).forEach(year => {
        Object.keys(workingCapital[year].byCountry || {}).forEach(market => {
            const country = workingCapital[year].byCountry[market];
            if (country.impliedARDays) {
                const daysDiff = Math.abs(country.impliedARDays - country.receivableDays);
                if (daysDiff > 5) {
                    console.warn(`⚠️ ${year} ${market}: AR Days error: Expected ${country.receivableDays}, Got ${country.impliedARDays.toFixed(1)}`);
                }
            }
        });
    });

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
            const cell = countryRow.insertCell(year - 2024);
            cell.innerHTML = value ? `$${(value/1000).toFixed(0)}K` : '-';
            
            // Indicador para 2025 (operación parcial)
            if (year === 2025 && wc[year].byCountry[market] && wc[year].byCountry[market].operatingMonths === 6) {
                cell.innerHTML += '*';
                cell.title = '6 meses de operación';
            }
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
        const cell = totalWCRow.insertCell(year - 2024);
        cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
        
        // Nota especial para 2025
        if (year === 2025 && wc[year].preOperativeComponents) {
            cell.innerHTML += '*';
            cell.title = 'Solo WC operativo (6 meses)';
        }
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
    
    // Nota explicativa
    const noteRow = tbody.insertRow();
    noteRow.insertCell(0).innerHTML = '';
    noteRow.insertCell(1).innerHTML = '* 6 meses (solo operativo)';
    noteRow.insertCell(1).colSpan = 6;
    noteRow.style.fontSize = '10px';
    noteRow.style.fontStyle = 'italic';
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