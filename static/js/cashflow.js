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
    
    // Calcular VAN y TIR
    const cashFlows = Object.keys(economicFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => economicFlow[year].fcf);
    
    const npv = calculateNPV(cashFlows, params.wacc);
    const irr = calculateIRR(cashFlows);
    
    // Comparar con método alternativo
    const npvExcel = calculateNPVExcel(cashFlows, params.wacc);
    
    // Debug del VAN y TIR
    console.log('🔍 Cálculo VAN y TIR Económico:');
    console.log(`  WACC: ${(params.wacc * 100).toFixed(1)}%`);
    console.log(`  Flujos de caja (precisión completa):`, cashFlows.map(fcf => fcf));
    console.log(`  Flujos de caja (formateados):`, cashFlows.map(fcf => `$${fcf.toFixed(0)}`));
    console.log(`  VAN (método principal): ${npv}`);
    console.log(`  VAN (método Excel): ${npvExcel}`);
    console.log(`  Diferencia: ${npv - npvExcel}`);
    console.log(`  VAN (formateado): $${npv.toFixed(0)}`);
    console.log(`  TIR: ${(irr * 100).toFixed(1)}%`);
    
    economicFlow.metrics = { npv, irr, wacc: params.wacc };
    
    // VALIDACIÓN: Verificar consistencia con costs.js
    console.log('🔍 VALIDACIÓN CASHFLOW - Consistencia con Costs.js');
    if (modelData.costs && modelData.costs[2025]) {
        const costs2025 = modelData.costs[2025];
        const flow2025 = economicFlow[2025];
        console.log(`📊 2025 Consistencia:`);
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
    

}

function calculateFinancialCashFlow() {
    console.log('🔍 Iniciando cálculo flujo financiero...');
    
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
    
    const params = getFinancialParams();
    const financialFlow = {};
    
    for (let year = 2025; year <= 2030; year++) {
        console.log(`🔍 Procesando año ${year} - Verificación deuda:`);
        console.log(`  modelData.debt existe:`, !!modelData.debt);
        console.log(`  modelData.debt.schedule existe:`, !!modelData.debt?.schedule);
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
        financialFlow[year].taxShield = financialFlow[year].interestExpense * params.taxRate;
        
        // Debug del escudo fiscal
        console.log(`🔍 Escudo Fiscal ${year}:`);
        console.log(`  Intereses: $${financialFlow[year].interestExpense.toFixed(0)}`);
        console.log(`  Tasa de impuestos: ${(params.taxRate * 100).toFixed(1)}%`);
        console.log(`  Escudo fiscal: $${financialFlow[year].taxShield.toFixed(0)}`);
        console.log(`  Verificación: $${financialFlow[year].interestExpense.toFixed(0)} × ${params.taxRate} = $${financialFlow[year].taxShield.toFixed(0)}`);
        
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
        const ke = params.equityCost; // Costo de equity
        
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
                565000;
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
    const equityNPVOperational = calculateNPV(equityCashFlowsOperational, params.equityCost);
    
    // Calcular valor presente del valor terminal por separado
    const terminalValue = financialFlow[2030] ? financialFlow[2030].residualValue : 0;
    const terminalPV = terminalValue / Math.pow(1 + params.equityCost, 6); // Descontar 6 períodos (2025-2030)
    
    // VAN total = VAN operacional + VP del valor terminal
    const equityNPV = equityNPVOperational + terminalPV;
    
    // Para TIR, usar flujos completos (con valor terminal)
    const equityCashFlows = Object.keys(financialFlow)
        .filter(year => parseInt(year) >= 2025)
        .map(year => financialFlow[year].fcfe);
    
    const projectIRR = calculateIRR(equityCashFlows);
    
    // Comparar con método alternativo para VAN financiero
    const equityNPVExcel = calculateNPVExcel(equityCashFlows, params.equityCost);
    
    // Debug del VAN financiero
    console.log('🔍 Cálculo VAN y TIR Financiero (Completamente Corregido):');
    console.log(`  Ke (Costo de Equity): ${(params.equityCost * 100).toFixed(1)}%`);
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
