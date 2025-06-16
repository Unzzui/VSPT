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
        // Primero asegurar que los cálculos principales estén ejecutados
        ensureModelDataReady();
        
        // Obtener métricas del escenario base real
        const baseMetrics = getBaseScenarioMetrics();
        
        // Ejecutar análisis de escenarios
        const scenarioResults = executeSensitivityAnalysis(baseMetrics);
        
        // Actualizar tabla y métricas
        updateSensitivityDisplay(scenarioResults);
        updateSensitivityBanners(scenarioResults);
        
        // Guardar en modelData
        if (typeof modelData === 'undefined') {
            window.modelData = {};
        }
        
        modelData.sensitivity = {
            scenarios: scenarioResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Análisis de sensibilidad completado');
        
    } catch (error) {
        console.error('❌ Error en análisis de sensibilidad:', error);
        displayErrorMessage(error.message);
    }
}

function ensureModelDataReady() {
    // Verificar si modelData existe y tiene los datos necesarios
    if (typeof modelData === 'undefined') {
        window.modelData = {};
    }
    
    // Si no hay datos del flujo económico, ejecutar cálculos
    if (!modelData.economicCashFlow || !modelData.financialCashFlow) {
        console.log('🔄 Ejecutando cálculos principales...');
        
        // Ejecutar todos los cálculos en orden
        if (typeof calculateInvestments === 'function') calculateInvestments();
        if (typeof calculateRevenues === 'function') calculateRevenues();
        if (typeof calculateCosts === 'function') calculateCosts();
        if (typeof calculateWorkingCapital === 'function') calculateWorkingCapital();
        if (typeof calculateDebt === 'function') calculateDebt();
        if (typeof calculateDepreciations === 'function') calculateDepreciations();
        if (typeof calculateEconomicCashFlow === 'function') calculateEconomicCashFlow();
        if (typeof calculateFinancialCashFlow === 'function') calculateFinancialCashFlow();
    }
}

function getBaseScenarioMetrics() {
    // Obtener métricas reales del modelo principal
    const economicNPV = modelData.economicCashFlow?.metrics?.npv || 0;
    const economicIRR = (modelData.economicCashFlow?.metrics?.irr || 0) * 100;
    const financialNPV = modelData.financialCashFlow?.metrics?.equityNPV || 0;
    const financialIRR = (modelData.financialCashFlow?.metrics?.projectIRR || 0) * 100;
    
    // Revenue 2030 del modelo de ingresos
    const revenue2030 = modelData.revenues?.[2030] ? 
        Object.values(modelData.revenues[2030]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
    
    // EBITDA 2030 del flujo económico
    const ebitda2030 = modelData.economicCashFlow?.[2030]?.ebitda || 0;
    
    console.log('📊 Métricas base del modelo principal:', {
        economicNPV: `$${(economicNPV / 1000000).toFixed(2)}M`,
        economicIRR: `${economicIRR.toFixed(1)}%`,
        financialNPV: `$${(financialNPV / 1000000).toFixed(2)}M`,
        financialIRR: `${financialIRR.toFixed(1)}%`,
        revenue2030: `$${(revenue2030 / 1000000).toFixed(1)}M`
    });
    
    return {
        revenue2030: revenue2030,
        economicNPV: economicNPV,
        financialNPV: financialNPV,
        economicIRR: economicIRR,
        financialIRR: financialIRR,
        ebitda2030: ebitda2030
    };
}

function executeSensitivityAnalysis(baseMetrics) {
    console.log('🎯 Ejecutando análisis de escenarios...');
    
    const results = {};
    
    // Para cada escenario, aplicar factores sobre las métricas base
    Object.keys(SENSITIVITY_SCENARIOS).forEach(scenarioName => {
        const scenario = SENSITIVITY_SCENARIOS[scenarioName];
        console.log(`📈 Calculando escenario: ${scenarioName}`);
        
        let metrics;
        
        if (scenarioName === 'Base') {
            // Para el escenario base, usar las métricas reales del modelo
            metrics = baseMetrics;
        } else {
            // Para otros escenarios, aplicar factores de ajuste
            metrics = calculateScenarioMetrics(baseMetrics, scenario.factors);
        }
        
        results[scenarioName] = {
            ...scenario,
            metrics: metrics
        };
        
        console.log(`✅ Escenario ${scenarioName} completado:`, {
            economicNPV: `$${(metrics.economicNPV / 1000000).toFixed(2)}M`,
            economicIRR: `${metrics.economicIRR.toFixed(1)}%`
        });
    });
    
    return results;
}

function calculateScenarioMetrics(baseMetrics, factors) {
    // Aplicar factores de manera realista
    const revenueMultiplier = (factors.initialConversion * factors.trafficGrowth * factors.avgTicket);
    const costMultiplier = (factors.marketingPct + factors.cogsPct) / 2;
    
    // Ajustar revenue
    const newRevenue = baseMetrics.revenue2030 * revenueMultiplier;
    
    // Ajustar EBITDA considerando costos
    const revenueChange = newRevenue - baseMetrics.revenue2030;
    const costIncrease = baseMetrics.revenue2030 * (costMultiplier - 1) * 0.5; // 50% de los costos son variables
    const newEbitda = baseMetrics.ebitda2030 + revenueChange - costIncrease;
    
    // Ajustar NPV proporcionalmente al cambio en EBITDA
    const ebitdaRatio = baseMetrics.ebitda2030 !== 0 ? newEbitda / baseMetrics.ebitda2030 : 1;
    const newEconomicNPV = baseMetrics.economicNPV * ebitdaRatio;
    const newFinancialNPV = baseMetrics.financialNPV * ebitdaRatio;
    
    // Ajustar TIR basado en la performance
    let irrAdjustment = 1;
    if (ebitdaRatio > 1.2) irrAdjustment = 1.3;
    else if (ebitdaRatio > 1.1) irrAdjustment = 1.15;
    else if (ebitdaRatio < 0.8) irrAdjustment = 0.7;
    else if (ebitdaRatio < 0.9) irrAdjustment = 0.85;
    
    const newEconomicIRR = Math.max(0, Math.min(100, baseMetrics.economicIRR * irrAdjustment));
    const newFinancialIRR = Math.max(0, Math.min(100, baseMetrics.financialIRR * irrAdjustment));
    
    return {
        revenue2030: newRevenue,
        economicNPV: newEconomicNPV,
        financialNPV: newFinancialNPV,
        economicIRR: newEconomicIRR,
        financialIRR: newFinancialIRR,
        ebitda2030: newEbitda
    };
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
        
        // Actualizar banners con métricas del escenario base real
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

function displayErrorMessage(message) {
    const tbody = document.getElementById('sensibilidadBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #d32f2f; padding: 20px;">
                    Error ejecutando análisis: ${message}
                </td>
            </tr>
        `;
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

// Función de debug
function debugSensitivity() {
    console.log('🔍 Debug Análisis de Sensibilidad');
    console.log('modelData:', modelData);
    console.log('economicCashFlow:', modelData.economicCashFlow);
    console.log('financialCashFlow:', modelData.financialCashFlow);
    
    if (modelData.economicCashFlow?.metrics) {
        console.log('Métricas económicas:', modelData.economicCashFlow.metrics);
    }
    
    if (modelData.financialCashFlow?.metrics) {
        console.log('Métricas financieras:', modelData.financialCashFlow.metrics);
    }
}

// Exportar funciones globalmente
if (typeof window !== 'undefined') {
    window.updateSensitivity = updateSensitivity;
    window.getSensitivityData = getSensitivityData;
    window.debugSensitivity = debugSensitivity;
}

// Ejecutar análisis inicial cuando se carga el módulo
if (typeof window !== 'undefined') {
    // Esperar un poco para que otros módulos se carguen
    setTimeout(() => {
        if (typeof modelData !== 'undefined' && document.getElementById('sensibilidadBody')) {
            updateSensitivity();
        }
    }, 1000);
}
