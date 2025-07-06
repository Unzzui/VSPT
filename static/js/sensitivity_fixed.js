// ============================================================================
// SENSITIVITY.JS - ANÁLISIS DE SENSIBILIDAD PROFESIONAL
// ============================================================================

// Configuración de escenarios predefinidos
const SENSITIVITY_SCENARIOS = {
    'Pesimista': {
        name: 'Pesimista',
        description: 'Escenario conservador con factores adversos',
        color: '#d32f2f',
        factors: {
            initialConversion: 0.7,    // 70% del valor base
            trafficGrowth: 0.6,        // 60% del valor base
            avgTicket: 0.85,           // 85% del valor base
            marketingPct: 1.3,         // 130% del valor base (más costos)
            cogsPct: 1.2               // 120% del valor base (más costos)
        }
    },
    'Base': {
        name: 'Base',
        description: 'Escenario más probable según parámetros actuales',
        color: '#1976d2',
        factors: {
            initialConversion: 1.0,
            trafficGrowth: 1.0,
            avgTicket: 1.0,
            marketingPct: 1.0,
            cogsPct: 1.0
        }
    },
    'Optimista': {
        name: 'Optimista',
        description: 'Escenario favorable con mejores condiciones',
        color: '#388e3c',
        factors: {
            initialConversion: 1.4,    // 140% del valor base
            trafficGrowth: 1.5,        // 150% del valor base
            avgTicket: 1.15,           // 115% del valor base
            marketingPct: 0.8,         // 80% del valor base (menos costos)
            cogsPct: 0.9               // 90% del valor base (menos costos)
        }
    },
    'Stress Test': {
        name: 'Stress Test',
        description: 'Escenario extremo para prueba de resistencia',
        color: '#f57c00',
        factors: {
            initialConversion: 0.5,    // 50% del valor base
            trafficGrowth: 0.4,        // 40% del valor base
            avgTicket: 0.75,           // 75% del valor base
            marketingPct: 1.5,         // 150% del valor base (mucho más costos)
            cogsPct: 1.3               // 130% del valor base (mucho más costos)
        }
    }
};

function updateSensitivity() {
    console.log('📊 Iniciando análisis de sensibilidad...');
    
    try {
        // Ejecutar análisis de escenarios
        const scenarioResults = executeSensitivityAnalysis();
        
        // Actualizar tabla y métricas
        updateSensitivityDisplay(scenarioResults);
        updateSensitivityBanners(scenarioResults);
        
        // Guardar en modelData
        modelData.sensitivity = {
            scenarios: scenarioResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Análisis de sensibilidad completado:', scenarioResults);
        
    } catch (error) {
        console.error('❌ Error en análisis de sensibilidad:', error);
        
        // Mostrar error en la tabla
        const tbody = document.getElementById('sensibilidadBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #d32f2f; padding: 20px;">
                        Error ejecutando análisis: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

function executeSensitivityAnalysis() {
    console.log('🎯 Ejecutando análisis de escenarios...');
    
    // Obtener parámetros base
    const baseParams = getBusinessParams();
    const baseFinancial = getFinancialParams();
    
    console.log('📋 Parámetros base:', {
        initialConversion: baseParams.initialConversion,
        trafficGrowth: baseParams.trafficGrowth,
        avgTicket: baseParams.avgTicket,
        debtRatio: baseFinancial.debtRatio
    });
    
    const results = {};
    
    // Ejecutar cada escenario
    Object.keys(SENSITIVITY_SCENARIOS).forEach(scenarioName => {
        console.log(`📈 Calculando escenario: ${scenarioName}`);
        
        const scenario = SENSITIVITY_SCENARIOS[scenarioName];
        
        // Aplicar factores del escenario
        const modifiedParams = {
            ...baseParams,
            initialConversion: baseParams.initialConversion * scenario.factors.initialConversion,
            trafficGrowth: baseParams.trafficGrowth * scenario.factors.trafficGrowth,
            avgTicket: baseParams.avgTicket * scenario.factors.avgTicket,
            marketingPct: (baseParams.marketingPct || 8) * scenario.factors.marketingPct
        };
        
        const modifiedFinancial = {
            ...baseFinancial,
            cogsPct: (baseFinancial.cogsPct || 0.45) * scenario.factors.cogsPct
        };
        
        // Ejecutar simulación
        const metrics = simulateScenarioMetrics(modifiedParams, modifiedFinancial);
        
        results[scenarioName] = {
            ...scenario,
            metrics: metrics,
            parameters: {
                conversion: modifiedParams.initialConversion,
                trafficGrowth: modifiedParams.trafficGrowth,
                avgTicket: modifiedParams.avgTicket,
                marketingPct: modifiedParams.marketingPct,
                cogsPct: modifiedFinancial.cogsPct
            }
        };
        
        console.log(`✅ Escenario ${scenarioName} completado:`, {
            revenue2030: metrics.revenue2030,
            economicNPV: metrics.economicNPV,
            financialNPV: metrics.financialNPV
        });
    });
    
    return results;
}

function simulateScenarioMetrics(params, financial) {
    try {
        console.log('🔢 Simulando métricas con parámetros:', {
            conversion: params.initialConversion,
            traffic: params.trafficGrowth,
            ticket: params.avgTicket
        });
        
        // === 1. SIMULAR INGRESOS ===
        const revenues = {};
        
        for (let year = 2026; year <= 2030; year++) {
            const yearIndex = year - 2026;
            
            // Calcular tráfico anual con crecimiento
            const yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth / 100, yearIndex + 1);
            
            // Calcular conversión creciente
            const conversionRate = Math.min(
                params.initialConversion / 100 * Math.pow(1 + (params.conversionGrowthRate || 30) / 100, yearIndex), 
                0.035 // Máximo 3.5%
            );
            
            // Calcular ticket con crecimiento premium
            const ticketSize = params.avgTicket * (1 + yearIndex * 0.08);
            
            revenues[year] = {};
            
            // Calcular por cada mercado
            Object.keys(marketDistribution).forEach(market => {
                const marketData = marketDistribution[market];
                const marketTraffic = yearlyTraffic * marketData.weight * 12; // Anual
                const orders = marketTraffic * conversionRate;
                const localPrice = ticketSize * marketData.premium;
                const grossRevenue = orders * localPrice;
                const netRevenue = grossRevenue * 0.99; // Fees de procesamiento
                
                revenues[year][market] = {
                    traffic: marketTraffic,
                    conversionRate: conversionRate * 100,
                    orders: orders,
                    avgTicket: localPrice,
                    grossRevenue: grossRevenue,
                    netRevenue: netRevenue
                };
            });
        }
        
        // === 2. SIMULAR COSTOS ===
        const costs = {};
        
        for (let year = 2025; year <= 2030; year++) {
            const yearIndex = year - 2025;
            const inflationFactor = Math.pow(1 + (params.inflation || 3) / 100, yearIndex);
            
            // Revenue del año (0 para 2025)
            const yearRevenue = revenues[year] ? 
                Object.values(revenues[year]).reduce((sum, market) => sum + market.netRevenue, 0) : 0;
            
            costs[year] = {
                salesTeam: (params.salesSalary || 35000) * 4 * inflationFactor, // 4 personas
                marketing: yearRevenue * (params.marketingPct || 8) / 100,
                technology: 45000 * inflationFactor,
                logistics: yearRevenue * 0.08, // 8% del revenue
                administrative: 120000 * inflationFactor,
                totalCosts: 0
            };
            
            costs[year].totalCosts = costs[year].salesTeam + costs[year].marketing + 
                                   costs[year].technology + costs[year].logistics + costs[year].administrative;
        }
        
        // === 3. CALCULAR FLUJOS DE CAJA ===
        const years = [2025, 2026, 2027, 2028, 2029, 2030];
        const economicCashFlows = [];
        const financialCashFlows = [];
        
        years.forEach(year => {
            const yearRevenue = revenues[year] ? 
                Object.values(revenues[year]).reduce((sum, market) => sum + market.netRevenue, 0) : 0;
            const yearCosts = costs[year] ? costs[year].totalCosts : 0;
            const capex = getCapexForYear(year);
            const depreciation = getDepreciationForYear(year, financial);
            
            // EBITDA
            const ebitda = yearRevenue - yearCosts;
            
            // EBIT (con depreciación)
            const ebit = ebitda - depreciation;
            
            // Impuestos
            const taxes = Math.max(0, ebit * (financial.taxRate || 0.27));
            
            // Flujo económico (sin considerar estructura de financiamiento)
            const economicCF = ebit - taxes + depreciation - capex;
            
            // Flujo financiero (considerando deuda)
            const interestExpense = getInterestExpenseForYear(year, financial);
            const principalPayment = getPrincipalPaymentForYear(year, financial);
            const financialCF = ebit - interestExpense - taxes + depreciation - capex - principalPayment;
            
            economicCashFlows.push(economicCF);
            financialCashFlows.push(financialCF);
        });
        
        // === 4. CALCULAR MÉTRICAS ===
        const wacc = financial.wacc || 0.08;
        const initialInvestment = 800000; // CAPEX total
        
        // VAN Económico
        let economicNPV = -initialInvestment;
        economicCashFlows.forEach((cf, index) => {
            if (index > 0) { // Excluir año 0 (2025)
                economicNPV += cf / Math.pow(1 + wacc, index);
            }
        });
        
        // VAN Financiero
        let financialNPV = -initialInvestment * (1 - financial.debtRatio); // Solo equity
        financialCashFlows.forEach((cf, index) => {
            if (index > 0) { // Excluir año 0 (2025)
                financialNPV += cf / Math.pow(1 + wacc, index);
            }
        });
        
        // TIR simplificada
        const avgEconomicCF = economicCashFlows.slice(1).reduce((sum, cf) => sum + cf, 0) / 5;
        const economicIRR = avgEconomicCF > 0 ? 
            (Math.pow(Math.abs(avgEconomicCF * 5) / initialInvestment, 1/5) - 1) * 100 : 0;
        
        const avgFinancialCF = financialCashFlows.slice(1).reduce((sum, cf) => sum + cf, 0) / 5;
        const equityInvestment = initialInvestment * (1 - financial.debtRatio);
        const financialIRR = avgFinancialCF > 0 ? 
            (Math.pow(Math.abs(avgFinancialCF * 5) / equityInvestment, 1/5) - 1) * 100 : 0;
        
        // Revenue 2030
        const revenue2030 = revenues[2030] ? 
            Object.values(revenues[2030]).reduce((sum, market) => sum + market.netRevenue, 0) : 0;
        
        return {
            revenue2030: revenue2030,
            economicNPV: economicNPV,
            financialNPV: financialNPV,
            economicIRR: Math.min(100, Math.max(0, economicIRR)),
            financialIRR: Math.min(100, Math.max(0, financialIRR)),
            ebitda2030: revenue2030 - (costs[2030] ? costs[2030].totalCosts : 0)
        };
        
    } catch (error) {
        console.error('❌ Error simulando escenario:', error);
        return {
            revenue2030: 0,
            economicNPV: 0,
            financialNPV: 0,
            economicIRR: 0,
            financialIRR: 0,
            ebitda2030: 0
        };
    }
}

// Funciones auxiliares
function getCapexForYear(year) {
    const capexDistribution = {
        2025: 0.45,
        2026: 0.30,
        2027: 0.20,
        2028: 0.05
    };
    const totalCapex = 850000;
    return (capexDistribution[year] || 0) * totalCapex;
}

function getDepreciationForYear(year, financial) {
    // Depreciación lineal a 5 años
    const totalCapex = 800000;
    const depreciationYears = financial.depreciationYears || 5;
    return year >= 2026 ? totalCapex / depreciationYears : 0;
}

function getInterestExpenseForYear(year, financial) {
    // Interés sobre deuda decreciente
    const totalDebt = 850000 * (financial.debtRatio || 0.5);
    const interestRate = financial.interestRate || 0.06;
    const termYears = financial.debtTermYears || 5;
    
    if (year < 2026 || year > 2025 + termYears) return 0;
    
    const yearIndex = year - 2026;
    const remainingDebt = totalDebt * (1 - yearIndex / termYears);
    return remainingDebt * interestRate;
}

function getPrincipalPaymentForYear(year, financial) {
    // Amortización lineal
    const totalDebt = 850000 * (financial.debtRatio || 0.5);
    const termYears = financial.debtTermYears || 5;
    
    if (year < 2026 || year > 2025 + termYears) return 0;
    
    return totalDebt / termYears;
}

function updateSensitivityDisplay(scenarios) {
    const tbody = document.getElementById('sensibilidadBody');
    if (!tbody) {
        console.warn('⚠️ Tabla de sensibilidad no encontrada');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Ordenar escenarios
    const orderedScenarios = ['Pesimista', 'Base', 'Optimista', 'Stress Test'];
    
    orderedScenarios.forEach(scenarioName => {
        if (!scenarios[scenarioName]) return;
        
        const scenario = scenarios[scenarioName];
        const metrics = scenario.metrics;
        
        const row = tbody.insertRow();
        row.style.borderLeft = `4px solid ${scenario.color}`;
        
        // Clase especial para escenario base
        if (scenarioName === 'Base') {
            row.style.backgroundColor = '#f8f9fa';
            row.style.fontWeight = '600';
        }
        
        // Colores dinámicos según performance
        const economicColor = metrics.economicNPV > 0 ? '#388e3c' : '#d32f2f';
        const financialColor = metrics.financialNPV > 0 ? '#388e3c' : '#d32f2f';
        const economicIrrColor = metrics.economicIRR > 12 ? '#388e3c' : metrics.economicIRR > 8 ? '#f57c00' : '#d32f2f';
        const financialIrrColor = metrics.financialIRR > 15 ? '#388e3c' : metrics.financialIRR > 10 ? '#f57c00' : '#d32f2f';
        
        row.innerHTML = `
            <td style="text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background: ${scenario.color}; border-radius: 50%;"></div>
                    <strong>${scenario.name}</strong>
                </div>
                <small style="color: #6c757d; margin-left: 20px;">${scenario.description}</small>
            </td>
            <td style="text-align: right; color: ${economicColor}; font-weight: 600;">
                $${(metrics.economicNPV / 1000000).toFixed(2)}M
            </td>
            <td style="text-align: right; color: ${financialColor}; font-weight: 600;">
                $${(metrics.financialNPV / 1000000).toFixed(2)}M
            </td>
            <td style="text-align: right; color: ${economicIrrColor}; font-weight: 600;">
                ${metrics.economicIRR.toFixed(1)}%
            </td>
            <td style="text-align: right; color: ${financialIrrColor}; font-weight: 600;">
                ${metrics.financialIRR.toFixed(1)}%
            </td>
            <td style="text-align: right; font-weight: 600;">
                $${(metrics.revenue2030 / 1000000).toFixed(1)}M
            </td>
        `;
    });
    
    console.log('✅ Tabla de sensibilidad actualizada');
}

function updateSensitivityBanners(scenarios) {
    try {
        const baseScenario = scenarios['Base'];
        
        if (!baseScenario) {
            console.warn('⚠️ Escenario base no encontrado para banners');
            return;
        }
        
        const metrics = baseScenario.metrics;
        
        // Actualizar banners
        const banners = {
            'sensitivityVAN': `$${(metrics.economicNPV / 1000000).toFixed(2)}M`,
            'sensitivityTIR': `${metrics.economicIRR.toFixed(1)}%`,
            'sensitivityRevenue': `$${(metrics.revenue2030 / 1000000).toFixed(1)}M`,
            'sensitivityRisk': calculateRiskLevel(scenarios)
        };
        
        Object.keys(banners).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = banners[id];
                
                // Aplicar colores
                if (id === 'sensitivityVAN') {
                    element.style.color = metrics.economicNPV > 0 ? '#388e3c' : '#d32f2f';
                } else if (id === 'sensitivityTIR') {
                    element.style.color = metrics.economicIRR > 12 ? '#388e3c' : 
                                        metrics.economicIRR > 8 ? '#f57c00' : '#d32f2f';
                } else if (id === 'sensitivityRisk') {
                    const riskColors = {
                        'Bajo': '#388e3c',
                        'Medio': '#f57c00',
                        'Alto': '#ff9800',
                        'Muy Alto': '#d32f2f'
                    };
                    element.style.color = riskColors[banners[id]] || '#6c757d';
                }
            }
        });
        
        console.log('✅ Banners de sensibilidad actualizados:', banners);
        
    } catch (error) {
        console.error('❌ Error actualizando banners de sensibilidad:', error);
    }
}

function calculateRiskLevel(scenarios) {
    try {
        const base = scenarios['Base']?.metrics.economicNPV || 0;
        const pessimist = scenarios['Pesimista']?.metrics.economicNPV || 0;
        const optimist = scenarios['Optimista']?.metrics.economicNPV || 0;
        
        if (Math.abs(base) < 1000) return 'Muy Alto'; // Base muy bajo
        
        const range = Math.abs(optimist - pessimist);
        const volatility = (range / Math.abs(base)) * 100;
        
        if (volatility < 30) return 'Bajo';
        if (volatility < 75) return 'Medio';
        if (volatility < 150) return 'Alto';
        return 'Muy Alto';
        
    } catch (error) {
        console.error('❌ Error calculando nivel de riesgo:', error);
        return 'Indeterminado';
    }
}

// Función para exportar datos de sensibilidad
function getSensitivityData() {
    try {
        const data = modelData.sensitivity || {};
        
        return {
            scenarios: data.scenarios || {},
            summary: {
                'Análisis ejecutado': data.timestamp || 'No disponible',
                'Escenarios evaluados': Object.keys(data.scenarios || {}).length,
                'Nivel de riesgo': calculateRiskLevel(data.scenarios || {})
            }
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo datos de sensibilidad:', error);
        return { scenarios: {}, summary: {} };
    }
}

// Exportar funciones globalmente
if (typeof window !== 'undefined') {
    window.updateSensitivity = updateSensitivity;
    window.getSensitivityData = getSensitivityData;
}
