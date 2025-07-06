// ============================================================================
// CASHFLOW.JS - FLUJOS DE CAJA ECONÓMICO Y FINANCIERO
// ============================================================================

function calculateEconomicCashFlow() {
    console.log('🔄 Calculando Flujo Económico - CON VALOR TERMINAL');
    
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
        
        // COGS y gastos operativos - CORRECCIÓN: Usar costos reales de costs.js
        if (modelData.costs && modelData.costs[year]) {
            // Usar COGS real calculado en costs.js (ya ajustado para 6 meses en 2025)
            economicFlow[year].cogs = modelData.costs[year].cogs;
        } else {
            // Fallback: calcular COGS como porcentaje de ingresos
            economicFlow[year].cogs = economicFlow[year].revenues * params.cogsPct;
        }
        
        economicFlow[year].grossProfit = economicFlow[year].revenues - economicFlow[year].cogs;
        
        // Gastos operativos (del modelo de costos REAL)
        if (modelData.costs && modelData.costs[year]) {
            // INCLUIR tanto gastos operativos como costos fijos estructurales
            economicFlow[year].operatingExpenses = modelData.costs[year].operatingExpenses.total + 
                                                   modelData.costs[year].fixedCosts.total;
        } else {
            // Fallback usando parámetros reales del modelo
            const businessParams = getBusinessParams();
            // CORRECCIÓN: Ajustar fallback para 6 meses en 2025
            let operatingFactor = 1;
            if (year === 2025) {
                operatingFactor = 6 / 12; // Solo 6 meses de operación
            }
            
            economicFlow[year].operatingExpenses = (economicFlow[year].revenues * businessParams.marketingPct + // Marketing
                                                   economicFlow[year].revenues * 0.08 + // Otros gastos operativos
                                                   (year >= 2026 ? businessParams.salesSalary || 50000 : 0)) * operatingFactor + // Salario comercial
                                                   120000 * Math.pow(1.035, year - 2025) * operatingFactor; // Costos fijos base con inflación
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
        
        // Valor residual en el último año (2030) usando fórmula del valor terminal
        economicFlow[year].residualValue = 0;
        if (year === 2030) {
            // Fórmula del valor terminal: TV = FCFn × (1+g) / (WACC-g)
            const lastFCF = economicFlow[year].nopat + economicFlow[year].depreciation - 
                           economicFlow[year].capex - economicFlow[year].deltaWC;
            
            // Parámetros para el valor terminal
            const growthRate = 0.02; // 2% crecimiento perpetuo (conservador para vinos premium)
            const wacc = params.wacc;
            
            // Calcular valor terminal
            if (wacc > growthRate) {
                economicFlow[year].residualValue = lastFCF * (1 + growthRate) / (wacc - growthRate);
            } else {
                // Fallback si WACC <= growth rate
                console.warn('⚠️ WACC <= growth rate, usando valor residual alternativo');
                const totalCapex = modelData.investments ? 
                    Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
                    565000;
                economicFlow[year].residualValue = totalCapex * 0.1; // 10% del CAPEX como fallback
            }
            
            // Debug del valor terminal
            console.log('🔍 Valor Terminal 2030 (Máxima Precisión):');
            console.log(`  Último FCF: ${lastFCF}`);
            console.log(`  Growth Rate: ${growthRate}`);
            console.log(`  WACC: ${wacc}`);
            console.log(`  Valor Terminal (precisión completa): ${economicFlow[year].residualValue}`);
            console.log(`  Valor Terminal (formateado): $${economicFlow[year].residualValue.toFixed(0)}`);
        }
        
        // Free Cash Flow (incluyendo valor residual en 2030)
        economicFlow[year].fcf = economicFlow[year].nopat + economicFlow[year].depreciation - 
                                 economicFlow[year].capex - economicFlow[year].deltaWC +
                                 economicFlow[year].residualValue;
        
        // Debug adicional del FCF final
        if (year === 2030) {
            console.log('🔍 Verificación FCF Final 2030 (Máxima Precisión):');
            console.log(`  NOPAT: ${economicFlow[year].nopat}`);
            console.log(`  Depreciación: ${economicFlow[year].depreciation}`);
            console.log(`  CAPEX: ${economicFlow[year].capex}`);
            console.log(`  ΔWC: ${economicFlow[year].deltaWC}`);
            console.log(`  Valor Terminal: ${economicFlow[year].residualValue}`);
            console.log(`  Cálculo: ${economicFlow[year].nopat} + ${economicFlow[year].depreciation} - ${economicFlow[year].capex} - ${economicFlow[year].deltaWC} + ${economicFlow[year].residualValue}`);
            console.log(`  FCF Final (precisión completa): ${economicFlow[year].fcf}`);
            console.log(`  FCF Final (formateado): $${economicFlow[year].fcf.toFixed(0)}`);
        }
    }
    
    // Calcular VAN, TIR e IR (CON valor terminal)
    const cashFlows = Object.keys(economicFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => economicFlow[year].fcf);
    
    const npv = calculateNPV(cashFlows, params.wacc);
    const irr = calculateIRR(cashFlows);
    const ir = calculateIR(cashFlows, params.wacc);
    
    // Calcular inversión inicial (CAPEX total)
    const initialInvestment = modelData.investments ? 
        Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
        565000; // Valor por defecto
    
    // Calcular Payback Period (SIN valor terminal - más conservador)
    const cashFlowsWithoutTerminal = Object.keys(economicFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => {
            // Usar FCF sin valor terminal para payback
            const fcfWithoutTerminal = economicFlow[year].nopat + economicFlow[year].depreciation - 
                                     economicFlow[year].capex - economicFlow[year].deltaWC;
            return fcfWithoutTerminal;
        });
    
    const paybackPeriod = calculatePaybackPeriod(cashFlowsWithoutTerminal, -initialInvestment);
    
    // Comparar con método alternativo
    const npvExcel = calculateNPVExcel(cashFlows, params.wacc);
    
    // Debug del VAN, TIR y Payback
    console.log('🔍 Cálculo VAN, TIR y Payback Económico:');
    console.log(`  WACC: ${(params.wacc * 100).toFixed(1)}%`);
    console.log(`  Inversión inicial: $${initialInvestment.toFixed(0)}`);
    console.log(`  Flujos de caja (precisión completa):`, cashFlows.map(fcf => fcf));
    console.log(`  Flujos de caja (formateados):`, cashFlows.map(fcf => `$${fcf.toFixed(0)}`));
    console.log(`  VAN (método principal): ${npv}`);
    console.log(`  VAN (método Excel): ${npvExcel}`);
    console.log(`  Diferencia: ${npv - npvExcel}`);
    console.log(`  VAN (formateado): $${npv.toFixed(0)}`);
    console.log(`  TIR: ${(irr * 100).toFixed(1)}%`);
    console.log(`  Payback Period (SIN valor terminal): ${paybackPeriod.toFixed(1)} años`);
    console.log(`  Flujos para payback (sin valor terminal):`, cashFlowsWithoutTerminal.map(fcf => `$${fcf.toFixed(0)}`));
    
    economicFlow.metrics = { npv, irr, ir, wacc: params.wacc, paybackPeriod, initialInvestment };
    
    // VALIDACIÓN: Verificar consistencia con costs.js
    console.log('🔍 VALIDACIÓN CASHFLOW - Consistencia con Costs.js');
    if (modelData.costs && modelData.costs[2025]) {
        const costs2025 = modelData.costs[2025];
        const flow2025 = economicFlow[2025];
        console.log(`📊 2025 Consistencia:`);
        
    // Guardar en modelData
    modelData.economicCashFlow = economicFlow;
    
    // Debug: verificar que los datos se guarden correctamente
    console.log('🔍 Verificación datos económicos guardados:');
    console.log('  modelData.economicCashFlow existe:', !!modelData.economicCashFlow);
    if (modelData.economicCashFlow) {
        console.log('  Años disponibles:', Object.keys(modelData.economicCashFlow));
        console.log('  Datos 2025:', modelData.economicCashFlow[2025]);
        console.log('  Datos 2030:', modelData.economicCashFlow[2030]);
    }
    
    // Calcular también la versión SIN valor terminal
    calculateEconomicCashFlowWithoutTerminal();
    
    return economicFlow;
        console.log(`  COGS: Costs.js $${costs2025.cogs.toFixed(0)} vs Cashflow $${flow2025.cogs.toFixed(0)}`);
        console.log(`  OpEx + Fixed: Costs.js $${(costs2025.operatingExpenses.total + costs2025.fixedCosts.total).toFixed(0)} vs Cashflow $${flow2025.operatingExpenses.toFixed(0)}`);
        console.log(`  - OpEx: $${costs2025.operatingExpenses.total.toFixed(0)}`);
        console.log(`  - Fixed: $${costs2025.fixedCosts.total.toFixed(0)}`);
        
        // Verificar si hay diferencias
        const cogsDiff = Math.abs(costs2025.cogs - flow2025.cogs);
        const opExDiff = Math.abs((costs2025.operatingExpenses.total + costs2025.fixedCosts.total) - flow2025.operatingExpenses);
        
        if (cogsDiff > 1) {
            console.warn(`⚠️ Diferencia en COGS 2025: $${cogsDiff.toFixed(0)}`);
        }
        if (opExDiff > 1) {
            console.warn(`⚠️ Diferencia en OpEx+Fixed 2025: $${opExDiff.toFixed(0)}`);
        }
    }
    
    updateEconomicFlowTable(economicFlow);
    modelData.economicCashFlow = economicFlow;
    
    // Calcular también la versión SIN valor terminal
    calculateEconomicCashFlowWithoutTerminal();
    
    return economicFlow;
}

// Función para forzar la visualización de la tabla económica
function forceShowEconomicTable() {
    console.log('🔧 Forzando visualización de tabla económica...');
    
    // Verificar que la pestaña esté visible
    const economicFlowTab = document.getElementById('economicFlow');
    if (economicFlowTab) {
        economicFlowTab.classList.remove('hidden');
        console.log('✅ Pestaña económica visible');
    }
    
    // Verificar que la tabla tenga contenido
    const tbody = document.getElementById('economicFlowBody');
    if (tbody) {
        console.log(`📊 Tabla tiene ${tbody.rows.length} filas`);
        
        // Si no hay filas, forzar recálculo
        if (tbody.rows.length === 0) {
            console.log('🔄 Forzando recálculo de tabla...');
            if (modelData.economicCashFlow) {
                updateEconomicFlowTable(modelData.economicCashFlow);
            }
        }
    }
    
    // Verificar estilos CSS
    const table = document.getElementById('economicFlowTable');
    if (table) {
        console.log('📋 Tabla encontrada, verificando estilos...');
        console.log('  Display:', window.getComputedStyle(table).display);
        console.log('  Visibility:', window.getComputedStyle(table).visibility);
        console.log('  Opacity:', window.getComputedStyle(table).opacity);
    }
}

// ============================================================================
// FLUJO ECONÓMICO SIN VALOR TERMINAL
// ============================================================================

function calculateEconomicCashFlowWithoutTerminal() {
    console.log('🔄 Calculando Flujo Económico - SIN VALOR TERMINAL');
    
    const params = getFinancialParams();
    const economicFlowNoTerminal = {};
    
    for (let year = 2025; year <= 2030; year++) {
        economicFlowNoTerminal[year] = {
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
            fcf: 0,
            residualValue: 0 // SIEMPRE 0 en esta versión
        };
        
        // Ingresos (desde 2025 Q3-Q4)
        if (year >= 2025 && modelData.revenues && modelData.revenues[year]) {
            if (typeof marketDistribution !== 'undefined') {
                Object.keys(marketDistribution).forEach(market => {
                    const revenueData = modelData.revenues[year][market];
                    if (revenueData) {
                        economicFlowNoTerminal[year].revenues += revenueData.netRevenue;
                    }
                });
            }
        }
        
        // COGS y gastos operativos - Usar costos reales de costs.js
        if (modelData.costs && modelData.costs[year]) {
            economicFlowNoTerminal[year].cogs = modelData.costs[year].cogs;
        } else {
            economicFlowNoTerminal[year].cogs = economicFlowNoTerminal[year].revenues * params.cogsPct;
        }
        
        economicFlowNoTerminal[year].grossProfit = economicFlowNoTerminal[year].revenues - economicFlowNoTerminal[year].cogs;
        
        // Gastos operativos (del modelo de costos REAL)
        if (modelData.costs && modelData.costs[year]) {
            economicFlowNoTerminal[year].operatingExpenses = modelData.costs[year].operatingExpenses.total + 
                                                             modelData.costs[year].fixedCosts.total;
        } else {
            const businessParams = getBusinessParams();
            let operatingFactor = 1;
            if (year === 2025) {
                operatingFactor = 6 / 12;
            }
            
            economicFlowNoTerminal[year].operatingExpenses = (economicFlowNoTerminal[year].revenues * businessParams.marketingPct + 
                                                             economicFlowNoTerminal[year].revenues * 0.08 + 
                                                             (year >= 2026 ? businessParams.salesSalary || 50000 : 0)) * operatingFactor + 
                                                             120000 * Math.pow(1.035, year - 2025) * operatingFactor;
        }
        
        // EBITDA
        economicFlowNoTerminal[year].ebitda = economicFlowNoTerminal[year].grossProfit - economicFlowNoTerminal[year].operatingExpenses;
        
        // Depreciación
        if (modelData.depreciation && modelData.depreciation.schedule) {
            const totalDepreciationYear = modelData.depreciation.schedule
                .filter(item => !item.concepto.includes('TOTAL'))
                .reduce((sum, item) => sum + (item[year] || 0), 0);
            economicFlowNoTerminal[year].depreciation = totalDepreciationYear;
        } else {
            let accumulatedCapex = 0;
            if (modelData.investments) {
                for (let y = 2025; y <= year; y++) {
                    if (modelData.investments[y]) {
                        accumulatedCapex += modelData.investments[y].total || 0;
                    }
                }
            }
            economicFlowNoTerminal[year].depreciation = accumulatedCapex / 5;
        }
        
        // EBIT y impuestos
        economicFlowNoTerminal[year].ebit = economicFlowNoTerminal[year].ebitda - economicFlowNoTerminal[year].depreciation;
        economicFlowNoTerminal[year].taxes = Math.max(0, economicFlowNoTerminal[year].ebit * params.taxRate);
        economicFlowNoTerminal[year].nopat = economicFlowNoTerminal[year].ebit - economicFlowNoTerminal[year].taxes;
        
        // CAPEX
        if (modelData.investments && modelData.investments[year]) {
            economicFlowNoTerminal[year].capex = modelData.investments[year].total || 0;
        } else {
            economicFlowNoTerminal[year].capex = 0;
        }
        
        // Working Capital
        if (modelData.workingCapital && modelData.workingCapital[year]) {
            economicFlowNoTerminal[year].deltaWC = modelData.workingCapital[year].deltaWC || 0;
        } else {
            const previousRevenue = year > 2025 && modelData.revenues && modelData.revenues[year-1] ? 
                Object.values(modelData.revenues[year-1]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
            const currentRevenue = economicFlowNoTerminal[year].revenues;
            const revenueGrowth = currentRevenue - previousRevenue;
            economicFlowNoTerminal[year].deltaWC = revenueGrowth * 0.15;
        }
        
        // IMPORTANTE: NO VALOR TERMINAL en esta versión
        economicFlowNoTerminal[year].residualValue = 0;
        
        // Free Cash Flow (SIN valor terminal)
        economicFlowNoTerminal[year].fcf = economicFlowNoTerminal[year].nopat + economicFlowNoTerminal[year].depreciation - 
                                          economicFlowNoTerminal[year].capex - economicFlowNoTerminal[year].deltaWC;
        
        // Debug del FCF final (sin valor terminal)
        if (year === 2030) {
            console.log('🔍 FCF Final 2030 - SIN VALOR TERMINAL:');
            console.log(`  NOPAT: ${economicFlowNoTerminal[year].nopat}`);
            console.log(`  Depreciación: ${economicFlowNoTerminal[year].depreciation}`);
            console.log(`  CAPEX: ${economicFlowNoTerminal[year].capex}`);
            console.log(`  ΔWC: ${economicFlowNoTerminal[year].deltaWC}`);
            console.log(`  Valor Terminal: ${economicFlowNoTerminal[year].residualValue} (SIEMPRE 0)`);
            console.log(`  FCF Final: $${economicFlowNoTerminal[year].fcf.toFixed(0)}`);
        }
    }
    
    // Calcular VAN y TIR SIN valor terminal
    const cashFlowsNoTerminal = Object.keys(economicFlowNoTerminal)
        .filter(year => parseInt(year) >= 2025)
        .map(year => economicFlowNoTerminal[year].fcf);
    
    const npvNoTerminal = calculateNPV(cashFlowsNoTerminal, params.wacc);
    const irrNoTerminal = calculateIRR(cashFlowsNoTerminal);
    
    console.log('🔍 Cálculo VAN y TIR - SIN VALOR TERMINAL:');
    console.log(`  WACC: ${(params.wacc * 100).toFixed(1)}%`);
    console.log(`  Flujos de caja:`, cashFlowsNoTerminal.map(fcf => `$${fcf.toFixed(0)}`));
    console.log(`  VAN: $${npvNoTerminal.toFixed(0)}`);
    console.log(`  TIR: ${(irrNoTerminal * 100).toFixed(1)}%`);
    
    // Explicación del resultado esperado para startups sin valor terminal
    console.log('📊 INTERPRETACIÓN - SIN VALOR TERMINAL:');
    console.log(`  ⚠️ VAN negativo ($${npvNoTerminal.toFixed(0)}) es NORMAL para startups sin valor terminal`);
    console.log(`  📈 El proyecto requiere más tiempo para ser rentable`);
    console.log(`  💡 Esto justifica la necesidad del valor terminal en la evaluación completa`);
    
    economicFlowNoTerminal.metrics = { 
        npv: npvNoTerminal, 
        irr: irrNoTerminal, 
        wacc: params.wacc,
        hasTerminalValue: false 
    };
    
    // Guardar en modelData
    modelData.economicCashFlowNoTerminal = economicFlowNoTerminal;
    
    // COMPARACIÓN: Mostrar diferencia entre CON y SIN valor terminal
    const economicFlowWithTerminal = modelData.economicCashFlow;
    if (economicFlowWithTerminal && economicFlowWithTerminal.metrics) {
        console.log('📊 COMPARACIÓN - CON vs SIN VALOR TERMINAL:');
        console.log(`  VAN CON valor terminal: $${economicFlowWithTerminal.metrics.npv.toFixed(0)}`);
        console.log(`  VAN SIN valor terminal: $${npvNoTerminal.toFixed(0)}`);
        console.log(`  Diferencia (valor terminal): $${(economicFlowWithTerminal.metrics.npv - npvNoTerminal).toFixed(0)}`);
        console.log(`  % del VAN que viene del valor terminal: ${((economicFlowWithTerminal.metrics.npv - npvNoTerminal) / economicFlowWithTerminal.metrics.npv * 100).toFixed(1)}%`);
        
        if (economicFlowWithTerminal.metrics.irr) {
            console.log(`  TIR CON valor terminal: ${(economicFlowWithTerminal.metrics.irr * 100).toFixed(1)}%`);
            console.log(`  TIR SIN valor terminal: ${(irrNoTerminal * 100).toFixed(1)}%`);
        }
        
        // Análisis de la dependencia del valor terminal
        const terminalValueDependency = ((economicFlowWithTerminal.metrics.npv - npvNoTerminal) / economicFlowWithTerminal.metrics.npv * 100);
        console.log('🔍 ANÁLISIS DE DEPENDENCIA:');
        if (terminalValueDependency > 100) {
            console.log(`  ⚠️ ALTA DEPENDENCIA: ${terminalValueDependency.toFixed(1)}% del VAN viene del valor terminal`);
            console.log(`  📊 Esto indica que el proyecto NO es viable sin valor terminal`);
            console.log(`  💡 Recomendación: Considerar extensión del horizonte o reestructuración`);
        } else if (terminalValueDependency > 50) {
            console.log(`  ⚠️ DEPENDENCIA MODERADA: ${terminalValueDependency.toFixed(1)}% del VAN viene del valor terminal`);
            console.log(`  📊 El proyecto es marginal sin valor terminal`);
        } else {
            console.log(`  ✅ BAJA DEPENDENCIA: ${terminalValueDependency.toFixed(1)}% del VAN viene del valor terminal`);
            console.log(`  📊 El proyecto es robusto incluso sin valor terminal`);
        }
    }
    
    return economicFlowNoTerminal;
}

function calculateFinancialCashFlow() {
    console.log('🔍 Iniciando cálculo flujo financiero...');
    
    // Obtener parámetros financieros al inicio
    const financialParams = getFinancialParams();
    
    // Verificar que el flujo económico esté disponible
    if (!modelData.economicCashFlow) {
        console.warn('⚠️ Flujo económico no disponible, ejecutando calculateEconomicCashFlow...');
        if (typeof calculateEconomicCashFlow === 'function') {
            calculateEconomicCashFlow();
            console.log('✅ calculateEconomicCashFlow ejecutado');
        } else {
            console.error('❌ calculateEconomicCashFlow no disponible');
            return;
        }
    } else {
        console.log('✅ Flujo económico ya disponible');
        console.log('  Datos económicos:', modelData.economicCashFlow);
    }
    
    // Verificar que el módulo de deuda esté disponible
    if (!modelData.debt || !modelData.debt.schedule) {
        console.warn('⚠️ Módulo de deuda no disponible, ejecutando calculateDebtStructure...');
        if (typeof calculateDebtStructure === 'function') {
            calculateDebtStructure();
            console.log('✅ calculateDebtStructure ejecutado');
        } else {
            console.error('❌ calculateDebtStructure no disponible');
        }
    } else {
        console.log('✅ Módulo de deuda ya disponible');
        console.log('  Datos deuda:', modelData.debt);
    }
    
    const financialFlow = {};
    
    for (let year = 2025; year <= 2030; year++) {
        console.log(`🔍 Procesando año ${year} - Verificación deuda:`);
        console.log(`  modelData.debt existe:`, !!modelData.debt);
        console.log(`  modelData.debt.schedule existe:`, !!modelData.debt?.schedule);
        // Comenzar con el flujo económico
        const economicData = modelData.economicCashFlow && modelData.economicCashFlow[year] ? 
            modelData.economicCashFlow[year] : {};
        
        // Debug: verificar datos económicos
        console.log(`🔍 Datos económicos ${year}:`, {
            nopat: economicData.nopat,
            depreciation: economicData.depreciation,
            capex: economicData.capex,
            deltaWC: economicData.deltaWC,
            fcf: economicData.fcf,
            residualValue: economicData.residualValue
        });
        
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
            // Calcular deuda total basada en CAPEX total actualizado
            const totalCapex = modelData.investments ? 
                Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
                850000; // CAPEX actualizado total
            financialFlow[year].debtProceeds = totalCapex * financialParams.debtRatio;
            
            console.log(`🔍 Deuda 2025:`);
            console.log(`  CAPEX total: $${totalCapex.toFixed(0)}`);
            console.log(`  Ratio deuda: ${(financialParams.debtRatio * 100).toFixed(1)}%`);
            console.log(`  Préstamo: $${financialFlow[year].debtProceeds.toFixed(0)}`);
        } else {
            financialFlow[year].debtProceeds = 0;
        }
        
        // Gastos financieros (intereses de la deuda REAL)
        if (modelData.debt && modelData.debt.schedule && modelData.debt.schedule[year]) {
            financialFlow[year].interestExpense = modelData.debt.schedule[year].interestPayment || 0;
            financialFlow[year].debtService = modelData.debt.schedule[year].principalPayment || 0;
            
            // Debug del cronograma de deuda
            console.log(`🔍 Cronograma Deuda ${year}:`);
            console.log(`  Intereses: $${financialFlow[year].interestExpense.toFixed(0)}`);
            console.log(`  Principal: $${financialFlow[year].debtService.toFixed(0)}`);
        } else {
            // Fallback usando parámetros reales de deuda
            const financialParams = getFinancialParams();
            const totalDebt = modelData.debt?.totalAmount || 0;
            if (totalDebt > 0 && year >= 2025) {
                // Estimación simple de intereses (deuda promedio * tasa)
                const avgDebt = totalDebt * (1 - (year - 2025) / 5); // Asumiendo amortización lineal en 5 años
                financialFlow[year].interestExpense = avgDebt * financialParams.interestRate;
                financialFlow[year].debtService = totalDebt / 5; // Amortización lineal
                
                console.log(`⚠️ Usando fallback para deuda ${year}:`);
                console.log(`  Intereses: $${financialFlow[year].interestExpense.toFixed(0)}`);
                console.log(`  Principal: $${financialFlow[year].debtService.toFixed(0)}`);
            }
        }
        
        // Escudo fiscal por intereses
        financialFlow[year].taxShield = financialFlow[year].interestExpense * financialParams.taxRate;
        
        // Debug del escudo fiscal
        console.log(`🔍 Escudo Fiscal ${year}:`);
        console.log(`  Intereses: $${financialFlow[year].interestExpense.toFixed(0)}`);
        console.log(`  Tasa de impuestos: ${(financialParams.taxRate * 100).toFixed(1)}%`);
        console.log(`  Escudo fiscal: $${financialFlow[year].taxShield.toFixed(0)}`);
        console.log(`  Verificación: $${financialFlow[year].interestExpense.toFixed(0)} × ${financialParams.taxRate} = $${financialFlow[year].taxShield.toFixed(0)}`);
        
        // Aporte de capital (equity) en años de CAPEX
        if (modelData.capexFinancing && modelData.capexFinancing[year]) {
            financialFlow[year].equityContribution = -(modelData.capexFinancing[year].equity || 0);
        } else {
            financialFlow[year].equityContribution = 0;
        }
        
        // Free Cash Flow to Equity - Usar FCF del flujo económico como base
        const economicFCF = modelData.economicCashFlow && modelData.economicCashFlow[year] ? 
                           modelData.economicCashFlow[year].fcf : 0;
        
        // Para el flujo financiero, usar FCF económico SIN valor terminal
        let economicFCFWithoutTerminal = economicFCF;
        if (year === 2030 && modelData.economicCashFlow && modelData.economicCashFlow[year]) {
            // Restar el valor terminal del FCF económico para 2030
            economicFCFWithoutTerminal = economicFCF - (modelData.economicCashFlow[year].residualValue || 0);
        }
        
        // Para años que no son 2030, el FCF ya está sin valor terminal
        if (year !== 2030) {
            economicFCFWithoutTerminal = economicFCF;
        }
        
        // Guardar FCF económico para mostrar en tabla
        financialFlow[year].economicFCF = economicFCFWithoutTerminal;
        
        // FCFE = FCF Económico (sin valor terminal) + Escudo Fiscal - Intereses - Amortización + Préstamos + Aporte Equity
        financialFlow[year].fcfe = economicFCFWithoutTerminal + 
                                   financialFlow[year].taxShield -
                                   financialFlow[year].interestExpense - 
                                   financialFlow[year].debtService + 
                                   financialFlow[year].debtProceeds + 
                                   financialFlow[year].equityContribution;
        
        // Guardar FCFE sin valor terminal para todos los años
        financialFlow[year].fcfeWithoutTerminal = financialFlow[year].fcfe;
        
        // Debug del FCFE
        console.log(`🔍 FCFE ${year} (Método Excel):`);
        console.log(`  FCF Económico: $${economicFCFWithoutTerminal.toFixed(0)}`);
        console.log(`  Escudo Fiscal: $${financialFlow[year].taxShield.toFixed(0)}`);
        console.log(`  Intereses: -$${financialFlow[year].interestExpense.toFixed(0)}`);
        console.log(`  Amortización: -$${financialFlow[year].debtService.toFixed(0)}`);
        console.log(`  Préstamos: +$${financialFlow[year].debtProceeds.toFixed(0)}`);
        console.log(`  Aporte Equity: $${financialFlow[year].equityContribution.toFixed(0)}`);
        console.log(`  FCFE Final: $${financialFlow[year].fcfe.toFixed(0)}`);
        
        // Valor terminal se calculará después de todos los FCFE
        financialFlow[year].residualValue = 0;
    }
    
    // Calcular valor terminal para 2030 después de todos los FCFE
    if (financialFlow[2030]) {
        const lastFCFE = financialFlow[2030].fcfe; // FCFE sin valor terminal
        const growthRate = 0.02; // 2% crecimiento perpetuo
        const ke = financialParams.equityCost; // Costo de equity
        
        // Calcular valor terminal financiero más conservador
        if (ke > growthRate) {
            // Usar un múltiplo más conservador o limitar el valor terminal
            const maxTerminalMultiple = 10; // Máximo 10x el FCFE
            const calculatedTerminal = lastFCFE * (1 + growthRate) / (ke - growthRate);
            financialFlow[2030].residualValue = Math.min(calculatedTerminal, lastFCFE * maxTerminalMultiple);
        } else {
            // Fallback si Ke <= growth rate
            console.warn('⚠️ Ke <= growth rate, usando valor residual alternativo para FCFE');
            const totalCapex = modelData.investments ? 
                Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
                850000; // CAPEX actualizado
            financialFlow[2030].residualValue = totalCapex * 0.5; // 50% del CAPEX como fallback más conservador
        }
        
        // Guardar FCFE sin valor terminal para el VAN
        financialFlow[2030].fcfeWithoutTerminal = lastFCFE;
        
        // Debug del valor terminal financiero
        console.log('🔍 Valor Terminal Financiero 2030 (Corregido):');
        console.log(`  Último FCFE (sin valor terminal): ${lastFCFE}`);
        console.log(`  Growth Rate: ${growthRate}`);
        console.log(`  Ke (Costo de Equity): ${ke}`);
        console.log(`  Cálculo paso a paso:`);
        console.log(`    FCFE × (1+g) = ${lastFCFE} × ${(1 + growthRate).toFixed(3)} = ${(lastFCFE * (1 + growthRate)).toFixed(0)}`);
        console.log(`    Ke - g = ${ke} - ${growthRate} = ${(ke - growthRate).toFixed(3)}`);
        console.log(`    Valor Terminal = ${(lastFCFE * (1 + growthRate)).toFixed(0)} / ${(ke - growthRate).toFixed(3)} = ${(lastFCFE * (1 + growthRate) / (ke - growthRate)).toFixed(0)}`);
        console.log(`  Valor Terminal FCFE (precisión completa): ${financialFlow[2030].residualValue}`);
        console.log(`  Valor Terminal FCFE (formateado): $${financialFlow[2030].residualValue.toFixed(0)}`);
        console.log(`  Múltiplo del FCFE: ${(financialFlow[2030].residualValue / lastFCFE).toFixed(1)}x`);
        
        // Agregar valor terminal al FCFE final
        financialFlow[2030].fcfe += financialFlow[2030].residualValue;
        
        // Debug del FCFE final
        console.log('🔍 Verificación FCFE Final 2030 (Corregido):');
        console.log(`  FCFE sin valor terminal: ${lastFCFE}`);
        console.log(`  Valor Terminal FCFE: ${financialFlow[2030].residualValue}`);
        console.log(`  FCFE Final (precisión completa): ${financialFlow[2030].fcfe}`);
        console.log(`  FCFE Final (formateado): $${financialFlow[2030].fcfe.toFixed(0)}`);
    }
    
    // Calcular VAN del equity y TIR del proyecto
    // Usar SOLO flujos operativos sin valor terminal para el VAN
    const equityCashFlowsOperational = Object.keys(financialFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => {
            // Usar FCFE sin valor terminal para todos los años
            return financialFlow[year].fcfeWithoutTerminal || financialFlow[year].fcfe;
        });
    
    // Calcular VAN de los flujos operativos SOLO
    const equityNPVOperational = calculateNPV(equityCashFlowsOperational, financialParams.equityCost);
    
    // Calcular valor presente del valor terminal por separado
    const terminalValue = financialFlow[2030] ? financialFlow[2030].residualValue : 0;
    const terminalPV = terminalValue / Math.pow(1 + financialParams.equityCost, 6); // Descontar 6 períodos (2025-2030)
    
    // VAN total = VAN operacional + VP del valor terminal
    const equityNPV = equityNPVOperational + terminalPV;
    
    // Para TIR e IR, usar flujos completos (con valor terminal)
    const equityCashFlows = Object.keys(financialFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => financialFlow[year].fcfe);
    
    const projectIRR = calculateIRR(equityCashFlows);
    const projectIR = calculateIR(equityCashFlows, financialParams.equityCost);
    
    // Debug: verificar flujos financieros
    console.log('🔍 Verificación flujos financieros:');
    console.log('  Flujos operacionales:', equityCashFlowsOperational.map(f => f.toFixed(0)));
    console.log('  Flujos completos:', equityCashFlows.map(f => f.toFixed(0)));
    console.log('  VAN operacional:', equityNPVOperational.toFixed(0));
    console.log('  Valor terminal:', terminalValue.toFixed(0));
    console.log('  VP valor terminal:', terminalPV.toFixed(0));
    console.log('  VAN total:', equityNPV.toFixed(0));
    console.log('  TIR:', (projectIRR * 100).toFixed(1) + '%');
    
    // Calcular inversión inicial para el flujo financiero (equity contribution)
    const totalCapex = modelData.investments ? 
        Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 
        850000; // CAPEX actualizado
    const initialEquityInvestment = totalCapex * (1 - financialParams.debtRatio); // Equity = CAPEX * (1 - debtRatio)
    
    console.log(`🔍 Inversión inicial equity:`);
    console.log(`  CAPEX total: $${totalCapex.toFixed(0)}`);
    console.log(`  Ratio deuda: ${(financialParams.debtRatio * 100).toFixed(1)}%`);
    console.log(`  Ratio equity: ${((1 - financialParams.debtRatio) * 100).toFixed(1)}%`);
    console.log(`  Inversión equity: $${initialEquityInvestment.toFixed(0)}`);
    
    // Calcular Payback Period para el flujo financiero (SIN valor terminal - más conservador)
    const equityCashFlowsWithoutTerminal = Object.keys(financialFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => financialFlow[year].fcfeWithoutTerminal || financialFlow[year].fcfe);
    
    const paybackPeriod = calculatePaybackPeriod(equityCashFlowsWithoutTerminal, -initialEquityInvestment);
    
    // Comparar con método alternativo para VAN financiero
    const equityNPVExcel = calculateNPVExcel(equityCashFlows, financialParams.equityCost);
    
    // Debug del VAN, TIR y Payback financiero
    console.log('🔍 Cálculo VAN, TIR y Payback Financiero (Completamente Corregido):');
    console.log(`  Ke (Costo de Equity): ${(financialParams.equityCost * 100).toFixed(1)}%`);
    console.log(`  Inversión inicial (Equity): $${initialEquityInvestment.toFixed(0)}`);
    console.log(`  Flujos FCFE OPERACIONALES (sin valor terminal):`, equityCashFlowsOperational.map(fcfe => fcfe));
    console.log(`  Flujos FCFE OPERACIONALES (formateados):`, equityCashFlowsOperational.map(fcfe => `$${fcfe.toFixed(0)}`));
    console.log(`  VAN Operacional (solo flujos): ${equityNPVOperational.toFixed(0)}`);
    console.log(`  Valor Terminal: ${terminalValue.toFixed(0)}`);
    console.log(`  VP Valor Terminal: ${terminalPV.toFixed(0)}`);
    console.log(`  VAN Total: ${equityNPV.toFixed(0)}`);
    console.log(`  Flujos FCFE completos (con valor terminal):`, equityCashFlows.map(fcfe => fcfe));
    console.log(`  Flujos FCFE completos (formateados):`, equityCashFlows.map(fcfe => `$${fcfe.toFixed(0)}`));
    console.log(`  VAN Financiero (método Excel): ${equityNPVExcel}`);
    console.log(`  Diferencia: ${equityNPV - equityNPVExcel}`);
    console.log(`  VAN Financiero (formateado): $${equityNPV.toFixed(0)}`);
    console.log(`  TIR Financiero: ${(projectIRR * 100).toFixed(1)}%`);
    console.log(`  Payback Period (SIN valor terminal): ${paybackPeriod.toFixed(1)} años`);
    console.log(`  Flujos FCFE para payback (sin valor terminal):`, equityCashFlowsWithoutTerminal.map(fcfe => `$${fcfe.toFixed(0)}`));
    
    financialFlow.metrics = { 
        equityNPV, 
        projectIRR,
        projectIR,
        equityCost: financialParams.equityCost,
        wacc: financialParams.wacc,
        paybackPeriod,
        initialInvestment: initialEquityInvestment
    };
    
    updateFinancialFlowTable(financialFlow);
    modelData.financialCashFlow = financialFlow;
    

}

function updateEconomicFlowTable(economicFlow) {
    console.log('🔄 Actualizando tabla flujo económico...');
    const tbody = document.getElementById('economicFlowBody');
    if (!tbody) {
        console.warn('⚠️ Tabla flujo económico no encontrada');
        return;
    }
    
    // Limpiar tabla completamente
    tbody.innerHTML = '';
    console.log('🧹 Tabla limpiada');
    
    // Header principal
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'FLUJO DE CAJA ECONÓMICO';
    headerRow.insertCell(1).innerHTML = '2025';
    headerRow.insertCell(2).innerHTML = '2026';
    headerRow.insertCell(3).innerHTML = '2027';
    headerRow.insertCell(4).innerHTML = '2028';
    headerRow.insertCell(5).innerHTML = '2029';
    headerRow.insertCell(6).innerHTML = '2030';
    
    // Subheader para distinguir versiones
    const subHeaderRow = tbody.insertRow();
    subHeaderRow.className = 'sub-header';
    subHeaderRow.insertCell(0).innerHTML = '<strong>CON VALOR TERMINAL</strong>';
    subHeaderRow.insertCell(1).innerHTML = '';
    subHeaderRow.insertCell(2).innerHTML = '';
    subHeaderRow.insertCell(3).innerHTML = '';
    subHeaderRow.insertCell(4).innerHTML = '';
    subHeaderRow.insertCell(5).innerHTML = '';
    subHeaderRow.insertCell(6).innerHTML = '';
    
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
    
    console.log('📊 Agregando métricas CON valor terminal...');
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
    console.log(`✅ Agregadas ${metrics.length} filas CON valor terminal`);
    
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
        
        // Agregar IR Económico
        const irRow = tbody.insertRow();
        irRow.className = 'category-header';
        irRow.insertCell(0).innerHTML = 'IR Económico';
        irRow.insertCell(1).innerHTML = '';
        irRow.insertCell(2).innerHTML = '';
        irRow.insertCell(3).innerHTML = '';
        irRow.insertCell(4).innerHTML = '';
        irRow.insertCell(5).innerHTML = '';
        const irCell = irRow.insertCell(6);
        irCell.innerHTML = `${economicFlow.metrics.ir.toFixed(3)}`;
        irCell.style.fontWeight = 'bold';
        irCell.style.color = economicFlow.metrics.ir > 1 ? '#28a745' : '#dc3545';
        
        // Agregar Payback Period
        const paybackRow = tbody.insertRow();
        paybackRow.className = 'category-header';
        paybackRow.insertCell(0).innerHTML = 'Payback Period';
        paybackRow.insertCell(1).innerHTML = '';
        paybackRow.insertCell(2).innerHTML = '';
        paybackRow.insertCell(3).innerHTML = '';
        paybackRow.insertCell(4).innerHTML = '';
        paybackRow.insertCell(5).innerHTML = '';
        const paybackCell = paybackRow.insertCell(6);
        
        paybackCell.innerHTML = `${economicFlow.metrics.paybackPeriod.toFixed(1)} años`;
        paybackCell.style.color = economicFlow.metrics.paybackPeriod <= 3 ? '#28a745' : 
                                 economicFlow.metrics.paybackPeriod <= 5 ? '#ffc107' : '#dc3545';
        paybackCell.style.fontWeight = 'bold';
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
        // Actualizar Payback Period
        const economicPaybackElement = document.getElementById('economicPayback');
        if (economicPaybackElement && economicFlow.metrics.paybackPeriod) {
            economicPaybackElement.innerHTML = `${economicFlow.metrics.paybackPeriod.toFixed(1)} años`;
        }
        
        // Actualizar IR Económico
        const economicIRElement = document.getElementById('economicIR');
        if (economicIRElement && economicFlow.metrics.ir) {
            economicIRElement.innerHTML = economicFlow.metrics.ir.toFixed(3);
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
    
    // ============================================================================
    // SECCIÓN SIN VALOR TERMINAL
    // ============================================================================
    
    // Separador visual
    const separatorRow = tbody.insertRow();
    separatorRow.className = 'separator-row';
    separatorRow.insertCell(0).innerHTML = '<hr style="border: 1px solid #ddd; margin: 10px 0;">';
    separatorRow.insertCell(1).innerHTML = '';
    separatorRow.insertCell(2).innerHTML = '';
    separatorRow.insertCell(3).innerHTML = '';
    separatorRow.insertCell(4).innerHTML = '';
    separatorRow.insertCell(5).innerHTML = '';
    separatorRow.insertCell(6).innerHTML = '';
    
    // Subheader para versión SIN valor terminal
    const noTerminalHeaderRow = tbody.insertRow();
    noTerminalHeaderRow.className = 'sub-header no-terminal';
    noTerminalHeaderRow.insertCell(0).innerHTML = '<strong>SIN VALOR TERMINAL</strong>';
    noTerminalHeaderRow.insertCell(1).innerHTML = '';
    noTerminalHeaderRow.insertCell(2).innerHTML = '';
    noTerminalHeaderRow.insertCell(3).innerHTML = '';
    noTerminalHeaderRow.insertCell(4).innerHTML = '';
    noTerminalHeaderRow.insertCell(5).innerHTML = '';
    noTerminalHeaderRow.insertCell(6).innerHTML = '';
    
    // Obtener datos SIN valor terminal
    const economicFlowNoTerminal = modelData.economicCashFlowNoTerminal;
    
    if (economicFlowNoTerminal) {
        console.log('📊 Agregando métricas SIN valor terminal...');
        
        // Solo mostrar las métricas más importantes para la comparación
        const comparisonMetrics = [
            { key: 'residualValue', label: 'Valor Residual', format: 'currency', highlight: true },
            { key: 'fcf', label: 'Flujo Libre', format: 'currency', highlight: true }
        ];
        
        comparisonMetrics.forEach(metric => {
            const row = tbody.insertRow();
            if (metric.highlight) row.className = 'total-row no-terminal';
            else row.className = 'subcategory no-terminal';
            
            row.insertCell(0).innerHTML = metric.label;
            
            for (let year = 2025; year <= 2030; year++) {
                const value = economicFlowNoTerminal[year] ? economicFlowNoTerminal[year][metric.key] : 0;
                const cell = row.insertCell(year - 2024);
                
                cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
                if (value < 0) cell.style.color = '#dc3545';
                else if (metric.highlight && value > 0) cell.style.color = '#28a745';
            }
        });
        console.log(`✅ Agregadas ${comparisonMetrics.length} filas de comparación SIN valor terminal`);
        
        // Métricas finales SIN valor terminal
        if (economicFlowNoTerminal.metrics) {
            const npvRow = tbody.insertRow();
            npvRow.className = 'category-header no-terminal';
            npvRow.insertCell(0).innerHTML = 'VAN Económico (Sin Valor Terminal)';
            npvRow.insertCell(1).innerHTML = '';
            npvRow.insertCell(2).innerHTML = '';
            npvRow.insertCell(3).innerHTML = '';
            npvRow.insertCell(4).innerHTML = '';
            npvRow.insertCell(5).innerHTML = '';
            const npvCell = npvRow.insertCell(6);
            npvCell.innerHTML = `$${(economicFlowNoTerminal.metrics.npv/1000).toFixed(0)}K`;
            npvCell.style.fontWeight = 'bold';
            npvCell.style.color = economicFlowNoTerminal.metrics.npv > 0 ? '#28a745' : '#dc3545';
            
            const irrRow = tbody.insertRow();
            irrRow.className = 'category-header no-terminal';
            irrRow.insertCell(0).innerHTML = 'TIR Económica (Sin Valor Terminal)';
            irrRow.insertCell(1).innerHTML = '';
            irrRow.insertCell(2).innerHTML = '';
            irrRow.insertCell(3).innerHTML = '';
            irrRow.insertCell(4).innerHTML = '';
            irrRow.insertCell(5).innerHTML = '';
            const irrCell = irrRow.insertCell(6);
            irrCell.innerHTML = `${(economicFlowNoTerminal.metrics.irr * 100).toFixed(1)}%`;
            irrCell.style.fontWeight = 'bold';
            irrCell.style.color = economicFlowNoTerminal.metrics.irr > economicFlowNoTerminal.metrics.wacc ? '#28a745' : '#dc3545';
            
            // COMPARACIÓN: Mostrar diferencia
            if (economicFlow.metrics) {
                const difference = economicFlow.metrics.npv - economicFlowNoTerminal.metrics.npv;
                const percentage = economicFlowNoTerminal.metrics.npv !== 0 ? 
                    (difference / Math.abs(economicFlowNoTerminal.metrics.npv)) * 100 : 0;
                
                const comparisonRow = tbody.insertRow();
                comparisonRow.className = 'comparison-row';
                comparisonRow.insertCell(0).innerHTML = '<strong>DIFERENCIA (Valor Terminal)</strong>';
                comparisonRow.insertCell(1).innerHTML = '';
                comparisonRow.insertCell(2).innerHTML = '';
                comparisonRow.insertCell(3).innerHTML = '';
                comparisonRow.insertCell(4).innerHTML = '';
                comparisonRow.insertCell(5).innerHTML = '';
                const diffCell = comparisonRow.insertCell(6);
                diffCell.innerHTML = `$${(difference/1000).toFixed(0)}K (${percentage.toFixed(1)}%)`;
                diffCell.style.fontWeight = 'bold';
                diffCell.style.color = '#007bff';
            }
         }
     }
     
     console.log('✅ Tabla flujo económico actualizada con ambas versiones');
    
    // Verificación final
    const finalRowCount = tbody.rows.length;
    console.log(`📊 Verificación final: ${finalRowCount} filas en la tabla`);
    
    // Verificar que la tabla sea visible
    const tableContainerDebug = document.querySelector('#economicFlow .table-container');
    if (tableContainerDebug) {
        console.log('✅ Contenedor de tabla encontrado');
        console.log('📏 Dimensiones del contenedor:', tableContainerDebug.offsetWidth, 'x', tableContainerDebug.offsetHeight);
    } else {
        console.warn('⚠️ Contenedor de tabla no encontrado');
    }
    
    // Debug adicional: verificar estructura HTML
    console.log('🔍 Debug estructura HTML:');
    console.log('  economicFlow existe:', !!document.getElementById('economicFlow'));
    console.log('  economicFlowTable existe:', !!document.getElementById('economicFlowTable'));
    console.log('  economicFlowBody existe:', !!document.getElementById('economicFlowBody'));
    
    // Verificar si la tabla tiene contenido visible
    const table = document.getElementById('economicFlowTable');
    if (table) {
        console.log('  Tabla display:', window.getComputedStyle(table).display);
        console.log('  Tabla visibility:', window.getComputedStyle(table).visibility);
        console.log('  Tabla height:', window.getComputedStyle(table).height);
        console.log('  Tabla width:', window.getComputedStyle(table).width);
    }
    
    // Forzar visibilidad de la tabla
    console.log('🔧 Forzando visibilidad de la tabla...');
    const economicFlowDiv = document.getElementById('economicFlow');
    if (economicFlowDiv) {
        economicFlowDiv.classList.remove('hidden');
        economicFlowDiv.style.display = 'block';
        console.log('✅ Div economicFlow ahora visible');
    }
    
    const tableContainerForce = document.querySelector('#economicFlow .table-container');
    if (tableContainerForce) {
        tableContainerForce.style.display = 'block';
        tableContainerForce.style.visibility = 'visible';
        tableContainerForce.style.opacity = '1';
        console.log('✅ Contenedor de tabla forzado a visible');
    }
    
    if (table) {
        table.style.display = 'table';
        table.style.visibility = 'visible';
        table.style.opacity = '1';
        console.log('✅ Tabla forzada a visible');
    }
    
    // Verificar contenido de la tabla
    const tbodyDebug = document.getElementById('economicFlowBody');
    if (tbodyDebug) {
        console.log('📊 Filas en tbody:', tbodyDebug.rows.length);
        for (let i = 0; i < Math.min(3, tbodyDebug.rows.length); i++) {
            console.log(`  Fila ${i}:`, tbodyDebug.rows[i].textContent.substring(0, 100));
        }
    }
}

// Exportar funciones al scope global
window.calculateEconomicCashFlow = calculateEconomicCashFlow;
window.calculateEconomicCashFlowWithoutTerminal = calculateEconomicCashFlowWithoutTerminal;
window.calculateFinancialCashFlow = calculateFinancialCashFlow;
window.updateEconomicFlowTable = updateEconomicFlowTable;
window.updateFinancialFlowTable = updateFinancialFlowTable;
window.calculatePaybackPeriod = calculatePaybackPeriod;

function updateFinancialFlowTable(financialFlow) {
    const tbody = document.getElementById('financialFlowBody');
    if (!tbody) {
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
        { key: 'economicFCF', label: 'FCF Económico', format: 'currency', highlight: true },
        { key: 'taxShield', label: 'Escudo Fiscal', format: 'currency' },
        { key: 'interestExpense', label: 'Gastos Financieros (Intereses)', format: 'currency' },
        { key: 'debtService', label: 'Amortización Capital', format: 'currency' },
        { key: 'debtProceeds', label: 'Ingresos por Préstamo', format: 'currency' },
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
        
        // Agregar IR Financiero
        const irRow = tbody.insertRow();
        irRow.className = 'category-header';
        irRow.insertCell(0).innerHTML = 'IR Financiero';
        irRow.insertCell(1).innerHTML = '';
        irRow.insertCell(2).innerHTML = '';
        irRow.insertCell(3).innerHTML = '';
        irRow.insertCell(4).innerHTML = '';
        irRow.insertCell(5).innerHTML = '';
        const irCell = irRow.insertCell(6);
        irCell.innerHTML = `${financialFlow.metrics.projectIR.toFixed(3)}`;
        irCell.style.fontWeight = 'bold';
        irCell.style.color = financialFlow.metrics.projectIR > 1 ? '#28a745' : '#dc3545';
        
        // Agregar Payback Period
        const paybackRow = tbody.insertRow();
        paybackRow.className = 'category-header';
        paybackRow.insertCell(0).innerHTML = 'Payback Period';
        paybackRow.insertCell(1).innerHTML = '';
        paybackRow.insertCell(2).innerHTML = '';
        paybackRow.insertCell(3).innerHTML = '';
        paybackRow.insertCell(4).innerHTML = '';
        paybackRow.insertCell(5).innerHTML = '';
        const paybackCell = paybackRow.insertCell(6);
        
        paybackCell.innerHTML = `${financialFlow.metrics.paybackPeriod.toFixed(1)} años`;
        paybackCell.style.color = financialFlow.metrics.paybackPeriod <= 3 ? '#28a745' : 
                                 financialFlow.metrics.paybackPeriod <= 5 ? '#ffc107' : '#dc3545';
        paybackCell.style.fontWeight = 'bold';
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
        
        // Actualizar Payback Period
        const financialPaybackElement = document.getElementById('financialPayback');
        if (financialPaybackElement && financialFlow.metrics.paybackPeriod) {
            financialPaybackElement.innerHTML = `${financialFlow.metrics.paybackPeriod.toFixed(1)} años`;
        }
        
        // Actualizar IR Financiero
        const financialIRElement = document.getElementById('financialIR');
        if (financialIRElement && financialFlow.metrics.projectIR) {
            financialIRElement.innerHTML = financialFlow.metrics.projectIR.toFixed(3);
        }
        
        // Actualizar label de WACC dinámicamente para flujo financiero
        const financialWACCLabel = document.querySelector('#financialFlow .metric-label');
        if (financialWACCLabel && financialFlow.metrics.equityCost) {
            financialWACCLabel.innerHTML = `VAN Financiero (Ke ${(financialFlow.metrics.equityCost * 100).toFixed(1)}%)`;
        }
    }
    
    // Forzar visibilidad de la tabla financiera
    const financialFlowDiv = document.getElementById('financialFlow');
    if (financialFlowDiv) {
        financialFlowDiv.classList.remove('hidden');
        financialFlowDiv.style.display = 'block';
    }
    
    const tableContainer = document.querySelector('#financialFlow .table-container');
    if (tableContainer) {
        tableContainer.style.display = 'block';
        tableContainer.style.visibility = 'visible';
        tableContainer.style.opacity = '1';
    }
    
    const table = document.getElementById('financialFlowTable');
    if (table) {
        table.style.display = 'table';
        table.style.visibility = 'visible';
        table.style.opacity = '1';
    }
    
    // ============================================================================
    // SECCIÓN SIN VALOR TERMINAL (COMPARACIÓN)
    // ============================================================================
    
    // Separador visual
    const separatorRow = tbody.insertRow();
    separatorRow.className = 'separator-row';
    separatorRow.insertCell(0).innerHTML = '<hr style="border: 1px solid #ddd; margin: 10px 0;">';
    separatorRow.insertCell(1).innerHTML = '';
    separatorRow.insertCell(2).innerHTML = '';
    separatorRow.insertCell(3).innerHTML = '';
    separatorRow.insertCell(4).innerHTML = '';
    separatorRow.insertCell(5).innerHTML = '';
    separatorRow.insertCell(6).innerHTML = '';
    
    // Subheader para versión SIN valor terminal
    const noTerminalHeaderRow = tbody.insertRow();
    noTerminalHeaderRow.className = 'sub-header no-terminal';
    noTerminalHeaderRow.insertCell(0).innerHTML = '<strong>COMPARACIÓN: SIN VALOR TERMINAL</strong>';
    noTerminalHeaderRow.insertCell(1).innerHTML = '';
    noTerminalHeaderRow.insertCell(2).innerHTML = '';
    noTerminalHeaderRow.insertCell(3).innerHTML = '';
    noTerminalHeaderRow.insertCell(4).innerHTML = '';
    noTerminalHeaderRow.insertCell(5).innerHTML = '';
    noTerminalHeaderRow.insertCell(6).innerHTML = '';
    
    // Solo mostrar las métricas más importantes para la comparación financiera
    const comparisonMetrics = [
        { key: 'residualValue', label: 'Valor Residual', format: 'currency', highlight: true },
        { key: 'fcfe', label: 'FCFE', format: 'currency', highlight: true }
    ];
    
    comparisonMetrics.forEach(metric => {
        const row = tbody.insertRow();
        if (metric.highlight) row.className = 'total-row no-terminal';
        else row.className = 'subcategory no-terminal';
        
        row.insertCell(0).innerHTML = metric.label;
        
        for (let year = 2025; year <= 2030; year++) {
            // Para la comparación, usar FCFE sin valor terminal
            let value = 0;
            if (financialFlow[year]) {
                if (metric.key === 'residualValue') {
                    value = 0; // Siempre 0 sin valor terminal
                } else if (metric.key === 'fcfe') {
                    value = financialFlow[year].fcfeWithoutTerminal || financialFlow[year].fcfe;
                } else {
                    value = financialFlow[year][metric.key] || 0;
                }
            }
            
            const cell = row.insertCell(year - 2024);
            cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
            if (value < 0) cell.style.color = '#dc3545';
            else if (metric.highlight && value > 0) cell.style.color = '#28a745';
        }
    });
    
    // Métricas finales SIN valor terminal
    if (financialFlow.metrics) {
        // Calcular VAN sin valor terminal
        const equityCashFlowsOperational = Object.keys(financialFlow)
            .filter(year => parseInt(year) >= 2025)
            .map(year => financialFlow[year].fcfeWithoutTerminal || financialFlow[year].fcfe);
        
        const equityNPVOperational = calculateNPV(equityCashFlowsOperational, financialFlow.metrics.equityCost);
        
        const npvRow = tbody.insertRow();
        npvRow.className = 'category-header no-terminal';
        npvRow.insertCell(0).innerHTML = 'VAN del Equity (Sin Valor Terminal)';
        npvRow.insertCell(1).innerHTML = '';
        npvRow.insertCell(2).innerHTML = '';
        npvRow.insertCell(3).innerHTML = '';
        npvRow.insertCell(4).innerHTML = '';
        npvRow.insertCell(5).innerHTML = '';
        const npvCell = npvRow.insertCell(6);
        npvCell.innerHTML = `$${(equityNPVOperational/1000).toFixed(0)}K`;
        npvCell.style.fontWeight = 'bold';
        npvCell.style.color = equityNPVOperational > 0 ? '#28a745' : '#dc3545';
        
        const irrRow = tbody.insertRow();
        irrRow.className = 'category-header no-terminal';
        irrRow.insertCell(0).innerHTML = 'TIR del Proyecto (Sin Valor Terminal)';
        irrRow.insertCell(1).innerHTML = '';
        irrRow.insertCell(2).innerHTML = '';
        irrRow.insertCell(3).innerHTML = '';
        irrRow.insertCell(4).innerHTML = '';
        irrRow.insertCell(5).innerHTML = '';
        const irrCell = irrRow.insertCell(6);
        
        // Debug: verificar flujos para TIR sin valor terminal
        console.log('🔍 Flujos para TIR sin valor terminal:', equityCashFlowsOperational);
        
        const irrWithoutTerminal = calculateIRR(equityCashFlowsOperational);
        console.log('🔍 TIR sin valor terminal calculada:', (irrWithoutTerminal * 100).toFixed(1) + '%');
        
        irrCell.innerHTML = `${(irrWithoutTerminal * 100).toFixed(1)}%`;
        irrCell.style.fontWeight = 'bold';
        irrCell.style.color = irrWithoutTerminal > financialFlow.metrics.equityCost ? '#28a745' : '#dc3545';
        
        // Agregar IR sin valor terminal
        const irWithoutTerminalRow = tbody.insertRow();
        irWithoutTerminalRow.className = 'category-header no-terminal';
        irWithoutTerminalRow.insertCell(0).innerHTML = 'IR del Proyecto (Sin Valor Terminal)';
        irWithoutTerminalRow.insertCell(1).innerHTML = '';
        irWithoutTerminalRow.insertCell(2).innerHTML = '';
        irWithoutTerminalRow.insertCell(3).innerHTML = '';
        irWithoutTerminalRow.insertCell(4).innerHTML = '';
        irWithoutTerminalRow.insertCell(5).innerHTML = '';
        const irWithoutTerminalCell = irWithoutTerminalRow.insertCell(6);
        const irWithoutTerminal = calculateIR(equityCashFlowsOperational, financialFlow.metrics.equityCost);
        irWithoutTerminalCell.innerHTML = `${irWithoutTerminal.toFixed(3)}`;
        irWithoutTerminalCell.style.fontWeight = 'bold';
        irWithoutTerminalCell.style.color = irWithoutTerminal > 1 ? '#28a745' : '#dc3545';
        
        // Agregar fila de diferencia
        const difference = financialFlow.metrics.equityNPV - equityNPVOperational;
        const percentage = equityNPVOperational !== 0 ? 
            (difference / Math.abs(equityNPVOperational)) * 100 : 0;
        
        const differenceRow = tbody.insertRow();
        differenceRow.className = 'comparison-row';
        differenceRow.insertCell(0).innerHTML = 'DIFERENCIA (Valor Terminal)';
        differenceRow.insertCell(1).innerHTML = '';
        differenceRow.insertCell(2).innerHTML = '';
        differenceRow.insertCell(3).innerHTML = '';
        differenceRow.insertCell(4).innerHTML = '';
        differenceRow.insertCell(5).innerHTML = '';
        const differenceCell = differenceRow.insertCell(6);
        differenceCell.innerHTML = `$${(difference/1000).toFixed(0)}K (${percentage.toFixed(1)}%)`;
        differenceCell.style.fontWeight = 'bold';
        differenceCell.style.color = difference > 0 ? '#28a745' : '#dc3545';
    }
    
}

// Funciones auxiliares para cálculos financieros
function calculateNPV(cashFlows, discountRate) {
    // Replicar exactamente el comportamiento de Excel NPV
    // Excel NPV = CF1/(1+r)^1 + CF2/(1+r)^2 + ... + CFn/(1+r)^n
    
    let npv = 0;
    for (let index = 0; index < cashFlows.length; index++) {
        const cf = cashFlows[index];
        const period = index + 1; // Excel usa períodos 1, 2, 3, etc.
        const discountFactor = Math.pow(1 + discountRate, period);
        const presentValue = cf / discountFactor;
        npv += presentValue;
        
        // Debug detallado para cada flujo
        if (index === 0) {
            console.log('🔍 Debug NPV - Cálculo Detallado:');
        }
        console.log(`  Período ${period}: CF=${cf}, Factor=${discountFactor.toFixed(6)}, PV=${presentValue.toFixed(2)}, NPV acumulado=${npv.toFixed(2)}`);
    }
    
    // Redondear a 2 decimales como Excel
    return Math.round(npv * 100) / 100;
}

function calculateNPVExcel(cashFlows, discountRate) {
    // Función alternativa que replica exactamente Excel
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
        const cf = cashFlows[i];
        const period = i + 1;
        const discountFactor = Math.pow(1 + discountRate, period);
        npv += cf / discountFactor;
    }
    return npv;
}

function calculatePaybackPeriod(cashFlows, initialInvestment = 0) {
    // Calcular Payback Period (período de recuperación)
    // Retorna el número de años necesarios para recuperar la inversión inicial
    
    if (cashFlows.length === 0) return 0;
    
    let cumulativeCashFlow = initialInvestment; // Empezar con la inversión inicial (negativa)
    let paybackPeriod = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
        cumulativeCashFlow += cashFlows[i];
        
        if (cumulativeCashFlow >= 0) {
            // Si el flujo acumulado se vuelve positivo, calcular el payback exacto
            if (i === 0) {
                paybackPeriod = 0; // Se recupera en el primer año
            } else {
                // Interpolación lineal para precisión
                const previousCumulative = cumulativeCashFlow - cashFlows[i];
                const yearFraction = Math.abs(previousCumulative) / Math.abs(cashFlows[i]);
                paybackPeriod = i + yearFraction;
            }
            break;
        }
        
        paybackPeriod = i + 1; // Si no se recupera, continuar
    }
    
    // Si nunca se recupera, retornar el número total de años + indicador
    if (cumulativeCashFlow < 0) {
        return cashFlows.length + 0.5; // Indicar que no se recupera en el período analizado
    }
    
    return paybackPeriod;
}

function calculateIRR(cashFlows) {
    // Implementación mejorada de TIR usando método de Newton-Raphson
    // Permite tasas negativas y maneja mejor casos extremos
    if (cashFlows.length === 0) return 0;
    
    // Debug: mostrar flujos de caja
    console.log('🔍 Flujos de caja para TIR:', cashFlows.map(cf => cf.toFixed(0)));
    
    // Validar que hay flujos positivos y negativos
    const hasPositive = cashFlows.some(cf => cf > 0);
    const hasNegative = cashFlows.some(cf => cf < 0);
    
    if (!hasPositive || !hasNegative) {
        console.warn('⚠️ Flujos de caja no válidos para TIR, usando 0%');
        return 0; // 0% por defecto
    }
    
    // Calcular NPV con tasa 0% para verificar si el proyecto es viable
    const npvAtZero = calculateNPV(cashFlows, 0);
    console.log(`🔍 NPV a 0%: $${npvAtZero.toFixed(0)}`);
    
    // Si NPV a 0% es negativo, la TIR debe ser negativa
    if (npvAtZero < 0) {
        console.log('⚠️ NPV negativo a 0%, TIR debe ser negativa');
        
        // Para proyectos con NPV negativo, buscar TIR negativa
        // Intentar tasas negativas más agresivas
        const negativeRates = [-0.8, -0.6, -0.4, -0.2, -0.1, -0.05];
        
        for (const rate of negativeRates) {
            const npv = calculateNPV(cashFlows, rate);
            console.log(`🔍 Probando tasa ${(rate * 100).toFixed(1)}%, NPV: $${npv.toFixed(0)}`);
            
            if (Math.abs(npv) < 1000) { // Tolerancia más amplia para tasas negativas
                console.log(`✅ TIR negativa encontrada: ${(rate * 100).toFixed(2)}%`);
                return rate;
            }
        }
        
        // Si no encontramos convergencia, usar una estimación basada en el NPV
        const estimatedIRR = npvAtZero / Math.abs(cashFlows.reduce((sum, cf) => sum + Math.abs(cf), 0));
        const limitedIRR = Math.max(-0.99, Math.min(-0.01, estimatedIRR));
        console.log(`⚠️ Usando TIR estimada: ${(limitedIRR * 100).toFixed(2)}%`);
        return limitedIRR;
    }
    
    // Para proyectos con NPV positivo, usar método Newton-Raphson
    const initialRates = [-0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5];
    let bestRate = 0;
    let bestNPV = Infinity;
    
    for (const initialRate of initialRates) {
        let rate = initialRate;
        const tolerance = 0.0001;
        const maxIterations = 50;
        
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
                if (rate >= -0.99 && rate <= 1) { // Entre -99% y 100% (más conservador)
                    console.log(`✅ TIR encontrada: ${(rate * 100).toFixed(2)}%`);
                    return rate;
                }
                break;
            }
            
            if (Math.abs(dnpv) < tolerance) break;
            
            const newRate = rate - npv / dnpv;
            
            // Evitar tasas extremas
            if (newRate < -0.99) rate = -0.99;
            else if (newRate > 1) rate = 1; // Límite más conservador
            else rate = newRate;
        }
        
        // Calcular NPV final para esta tasa inicial
        let finalNPV = 0;
        for (let j = 0; j < cashFlows.length; j++) {
            const factor = Math.pow(1 + rate, j);
            finalNPV += cashFlows[j] / factor;
        }
        
        if (Math.abs(finalNPV) < Math.abs(bestNPV)) {
            bestNPV = finalNPV;
            bestRate = rate;
        }
    }
    
    // Validar resultado final
    if (bestRate >= -0.99 && bestRate <= 1) {
        console.log(`🔍 TIR calculada: ${(bestRate * 100).toFixed(2)}%`);
        return bestRate;
    } else {
        console.warn('⚠️ TIR fuera de rango razonable, usando 0%');
        return 0;
    }
}

function calculateIR(cashFlows, discountRate) {
    // Calcular Índice de Rentabilidad (IR)
    // IR = VP de flujos futuros / Inversión inicial
    // IR > 1: Proyecto rentable
    // IR < 1: Proyecto no rentable
    
    if (cashFlows.length === 0) return 0;
    
    // Debug: mostrar flujos de caja
    console.log('🔍 Flujos de caja para IR:', cashFlows.map(cf => cf.toFixed(0)));
    
    // Encontrar la inversión inicial (suma de todos los flujos negativos)
    let initialInvestment = 0;
    let futureCashFlows = [];
    
    // Para proyectos con flujos negativos iniciales, sumar todos los flujos negativos como inversión
    let negativeFlows = 0;
    let positiveFlows = [];
    
    for (let i = 0; i < cashFlows.length; i++) {
        if (cashFlows[i] < 0) {
            negativeFlows += Math.abs(cashFlows[i]);
        } else {
            positiveFlows.push(cashFlows[i]);
        }
    }
    
    if (negativeFlows > 0) {
        initialInvestment = negativeFlows;
        futureCashFlows = positiveFlows;
        console.log(`🔍 Inversión inicial (suma flujos negativos): $${initialInvestment.toFixed(0)}`);
        console.log(`🔍 Flujos futuros (solo positivos): ${futureCashFlows.map(cf => cf.toFixed(0))}`);
    } else {
        // Fallback: usar el primer flujo negativo
        if (cashFlows[0] < 0) {
            initialInvestment = Math.abs(cashFlows[0]);
            futureCashFlows = cashFlows.slice(1);
        }
    }
    
    if (initialInvestment === 0) {
        console.warn('⚠️ No hay inversión inicial clara para calcular IR');
        return 0;
    }
    
    // Calcular VP de flujos futuros
    let presentValue = 0;
    for (let i = 0; i < futureCashFlows.length; i++) {
        // Encontrar el período correspondiente en los flujos originales
        let period = 0;
        for (let j = 0; j < cashFlows.length; j++) {
            if (cashFlows[j] === futureCashFlows[i]) {
                period = j + 1;
                break;
            }
        }
        const factor = Math.pow(1 + discountRate, period);
        presentValue += futureCashFlows[i] / factor;
    }
    
    const ir = presentValue / initialInvestment;
    
    console.log(`🔍 IR calculado: ${ir.toFixed(3)}`);
    console.log(`  VP flujos futuros: $${presentValue.toFixed(0)}`);
    console.log(`  Inversión inicial: $${initialInvestment.toFixed(0)}`);
    console.log(`  IR = ${presentValue.toFixed(0)} / ${initialInvestment.toFixed(0)} = ${ir.toFixed(3)}`);
    
    // Validar que el IR sea razonable
    if (ir < -10 || ir > 10) {
        console.warn('⚠️ IR fuera de rango razonable, verificando cálculo');
        console.log(`  Flujos futuros: ${futureCashFlows.map(cf => cf.toFixed(0))}`);
        console.log(`  Tasa de descuento: ${(discountRate * 100).toFixed(1)}%`);
    }
    
    return ir;
}
