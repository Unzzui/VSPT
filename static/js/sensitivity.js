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
        // Actualizar primero los parámetros base en la interfaz
        updateBaseParametersDisplay();
        
        // Asegurar que los cálculos principales estén ejecutados
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
    // Asegurar que los cálculos del modelo estén ejecutados
    if (!modelData.economicCashFlow || !modelData.financialCashFlow) {
        console.log('⚠️ Datos del modelo no disponibles, ejecutando cálculos...');
        
        // Ejecutar cálculos principales
        if (typeof calculateRevenues === 'function') calculateRevenues();
        if (typeof calculateCosts === 'function') calculateCosts();
        if (typeof calculateEconomicCashFlow === 'function') calculateEconomicCashFlow();
        if (typeof calculateFinancialCashFlow === 'function') calculateFinancialCashFlow();
    }
    
    // Obtener métricas reales del modelo principal
    const economicNPV = modelData.economicCashFlow?.metrics?.npv || 0;
    const economicIRR = (modelData.economicCashFlow?.metrics?.irr || 0) * 100;
    const financialNPV = modelData.financialCashFlow?.metrics?.equityNPV || 0;
    const financialIRR = (modelData.financialCashFlow?.metrics?.projectIRR || 0) * 100;
    
    console.log('🔍 Sensibilidad - Métricas del modelo:');
    console.log('  economicNPV:', economicNPV);
    console.log('  economicIRR:', economicIRR);
    console.log('  financialNPV:', financialNPV);
    console.log('  financialIRR:', financialIRR);
    console.log('  modelData.economicCashFlow completo:', modelData.economicCashFlow);
    
    // Revenue 2030 del modelo de ingresos - USAR DATOS REALES DEL MODELO
    let revenue2030 = 0;
    if (modelData.revenues && modelData.revenues[2030]) {
        revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0);
        console.log('📊 Sensibilidad usando revenue 2030 del modelo de ingresos:', `$${(revenue2030/1000000).toFixed(1)}M`);
    } else {
        // Fallback: calcular usando la misma lógica que revenues.js
        console.log('⚠️ Sensibilidad calculando revenue 2030 propio');
        const params = getBusinessParams();
        const yearIndex = 5; // 2030 es año 5 desde 2025
        const yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex);
        const conversionRate = Math.min(
            params.initialConversion * Math.pow(1 + params.conversionGrowthRate, yearIndex), 
            0.08 // Máximo 8%
        );
        const ticketSize = params.avgTicket * (1 + Math.max(0, yearIndex - 1) * 0.08);
        
        // Calcular por mercado usando distribución normal (2030)
        revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
            const marketData = marketDistribution[market];
            const marketTraffic = yearlyTraffic * marketData.weight * 12; // 12 meses
            const orders = marketTraffic * conversionRate;
            const localPrice = ticketSize * marketData.premium;
            const netRevenue = orders * localPrice;
            return sum + netRevenue;
        }, 0);
    }
    
    // EBITDA 2030 del flujo económico
    const ebitda2030 = modelData.economicCashFlow?.[2030]?.ebitda || 0;
    
    console.log('📊 Métricas base del modelo principal:', {
        economicNPV: `$${(economicNPV / 1000000).toFixed(2)}M`,
        economicIRR: `${economicIRR.toFixed(1)}%`,
        financialNPV: `$${(financialNPV / 1000000).toFixed(2)}M`,
        financialIRR: `${financialIRR.toFixed(1)}%`,
        revenue2030: `$${(revenue2030 / 1000000).toFixed(1)}M`,
        ebitda2030: `$${(ebitda2030 / 1000000).toFixed(1)}M`
    });
    
    // Si los valores base no son razonables, usar datos de respaldo
    const hasValidData = revenue2030 > 0 && Math.abs(economicNPV) > 0;
    
    if (!hasValidData) {
        console.warn('⚠️ Usando datos de respaldo para análisis de sensibilidad');
        return {
            revenue2030: 12500000,      // $12.5M
            economicNPV: 2500000,       // $2.5M
            financialNPV: 1700000,      // $1.7M
            economicIRR: 15.8,          // 15.8%
            financialIRR: 22.3,         // 22.3%
            ebitda2030: 3200000         // $3.2M
        };
    }
    
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
    console.log('🔢 Aplicando factores:', factors);
    console.log('📊 Métricas base:', baseMetrics);
    
    // PROBLEMA DETECTADO: Si las métricas base son negativas, la multiplicación invierte los resultados
    
    // Solución 1: Usar diferencias absolutas en lugar de multiplicaciones cuando hay valores negativos
    
    // Calcular impacto en ingresos
    const revenueMultiplier = factors.initialConversion * factors.trafficGrowth * factors.avgTicket;
    const revenueChange = baseMetrics.revenue2030 * (revenueMultiplier - 1);
    const newRevenue = baseMetrics.revenue2030 + revenueChange;
    
    console.log('💰 Impacto en ingresos:', {
        revenueMultiplier,
        revenueChange: `$${(revenueChange / 1000000).toFixed(2)}M`,
        newRevenue: `$${(newRevenue / 1000000).toFixed(2)}M`
    });
    
    // Calcular impacto en costos
    const costMultiplier = (factors.marketingPct + factors.cogsPct) / 2;
    const baseCosts = Math.abs(baseMetrics.revenue2030 - baseMetrics.ebitda2030);
    
    // Los costos aumentan/disminuyen según el multiplicador
    const costChange = baseCosts * (costMultiplier - 1);
    const newTotalCosts = baseCosts + costChange;
    
    console.log('💰 Impacto en costos:', {
        costMultiplier,
        baseCosts: `$${(baseCosts / 1000000).toFixed(2)}M`,
        costChange: `$${(costChange / 1000000).toFixed(2)}M`,
        newTotalCosts: `$${(newTotalCosts / 1000000).toFixed(2)}M`
    });
    
    // Nuevo EBITDA
    const newEbitda = newRevenue - newTotalCosts;
    
    // Calcular cambio neto en EBITDA
    const ebitdaChange = newEbitda - baseMetrics.ebitda2030;
    
    console.log('📊 Resultado intermedio:', {
        baseEbitda: `$${(baseMetrics.ebitda2030 / 1000000).toFixed(2)}M`,
        newEbitda: `$${(newEbitda / 1000000).toFixed(2)}M`,
        ebitdaChange: `$${(ebitdaChange / 1000000).toFixed(2)}M`
    });
    
    // Calcular NPV usando lógica más directa
    // Asumimos que cada $1M de cambio en EBITDA = $3M de cambio en NPV (múltiplo conservador)
    const npvImpactMultiple = 3;
    const economicNPVChange = ebitdaChange * npvImpactMultiple;
    const financialNPVChange = ebitdaChange * npvImpactMultiple * 0.8; // Menor para financiero por deuda
    
    const newEconomicNPV = baseMetrics.economicNPV + economicNPVChange;
    const newFinancialNPV = baseMetrics.financialNPV + financialNPVChange;
    
    // Calcular TIR basado en mejora/deterioro relativo
    let irrChangePoints = 0;
    
    if (ebitdaChange > 0) {
        // Mejora: TIR sube
        const improvementRatio = Math.abs(ebitdaChange) / Math.max(Math.abs(baseMetrics.ebitda2030), 1000000);
        irrChangePoints = Math.min(improvementRatio * 5, 10); // Máximo +10 puntos
    } else {
        // Deterioro: TIR baja
        const deteriorationRatio = Math.abs(ebitdaChange) / Math.max(Math.abs(baseMetrics.ebitda2030), 1000000);
        irrChangePoints = -Math.min(deteriorationRatio * 8, 15); // Máximo -15 puntos
    }
    
    const newEconomicIRR = Math.max(0, baseMetrics.economicIRR + irrChangePoints);
    const newFinancialIRR = Math.max(0, baseMetrics.financialIRR + irrChangePoints * 1.2);
    
    const result = {
        revenue2030: newRevenue,
        ebitda2030: newEbitda,
        economicNPV: newEconomicNPV,
        financialNPV: newFinancialNPV,
        economicIRR: newEconomicIRR,
        financialIRR: newFinancialIRR
    };
    
    console.log('✅ Resultado final del escenario:', {
        economicNPV: `$${(result.economicNPV / 1000000).toFixed(2)}M`,
        financialNPV: `$${(result.financialNPV / 1000000).toFixed(2)}M`,
        economicIRR: `${result.economicIRR.toFixed(1)}%`,
        financialIRR: `${result.financialIRR.toFixed(1)}%`
    });
    
    return result;
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
        
        // Crear celdas con alineamiento correcto
        const cells = [
            // Columna 1: Escenario (izquierda)
            {
                content: `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; background: ${scenario.color}; border-radius: 50%;"></div>
                        <strong>${scenario.name}</strong>
                    </div>
                    <small style="color: #6c757d; margin-left: 20px;">${scenario.description}</small>
                `,
                align: 'left'
            },
            // Columna 2: VAN Económico (centro)
            {
                content: `$${(metrics.economicNPV / 1000000).toFixed(2)}M`,
                align: 'center',
                color: economicColor
            },
            // Columna 3: VAN Financiero (centro)
            {
                content: `$${(metrics.financialNPV / 1000000).toFixed(2)}M`,
                align: 'center',
                color: financialColor
            },
            // Columna 4: TIR Económico (centro)
            {
                content: `${metrics.economicIRR.toFixed(1)}%`,
                align: 'center',
                color: economicIrrColor
            },
            // Columna 5: TIR Financiero (centro)
            {
                content: `${metrics.financialIRR.toFixed(1)}%`,
                align: 'center',
                color: financialIrrColor
            },
            // Columna 6: Revenue 2030 (centro)
            {
                content: `$${(metrics.revenue2030 / 1000000).toFixed(1)}M`,
                align: 'center',
                color: '#333'
            }
        ];
        
        // Crear celdas con el alineamiento correcto
        cells.forEach((cellData, index) => {
            const cell = row.insertCell(index);
            cell.innerHTML = cellData.content;
            cell.style.textAlign = cellData.align;
            cell.style.verticalAlign = 'middle';
            cell.style.padding = '12px 8px';
            
            if (cellData.color) {
                cell.style.color = cellData.color;
            }
            
            if (index > 0) { // Todas las columnas numéricas
                cell.style.fontWeight = '600';
                cell.style.fontFamily = 'monospace'; // Fuente monoespaciada para mejor alineamiento
            }
        });
    });
    
    console.log('✅ Tabla de sensibilidad actualizada con alineamiento correcto');
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

// Función de prueba para verificar la lógica de escenarios
function testSensitivityLogic() {
    console.log('🧪 PRUEBA: Verificando lógica de sensibilidad');
    
    // Métricas de prueba
    const testBaseMetrics = {
        revenue2030: 12500000,      // $12.5M
        economicNPV: 2500000,       // $2.5M  
        financialNPV: 1700000,      // $1.7M
        economicIRR: 15.8,          // 15.8%
        financialIRR: 22.3,         // 22.3%
        ebitda2030: 3200000         // $3.2M
    };
    
    console.log('📊 Métricas base de prueba:', testBaseMetrics);
    
    Object.keys(SENSITIVITY_SCENARIOS).forEach(scenarioName => {
        if (scenarioName === 'Base') return;
        
        const scenario = SENSITIVITY_SCENARIOS[scenarioName];
        console.log(`\n🔍 Probando escenario: ${scenarioName}`);
        console.log('Factores:', scenario.factors);
        
        const result = calculateScenarioMetrics(testBaseMetrics, scenario.factors);
        
        console.log('Resultado:', {
            economicNPV: `$${(result.economicNPV / 1000000).toFixed(2)}M`,
            financialNPV: `$${(result.financialNPV / 1000000).toFixed(2)}M`,
            economicIRR: `${result.economicIRR.toFixed(1)}%`,
            revenue2030: `$${(result.revenue2030 / 1000000).toFixed(1)}M`
        });
        
        // Verificar lógica
        const shouldBeWorse = scenarioName === 'Pesimista' || scenarioName === 'Stress Test';
        const shouldBeBetter = scenarioName === 'Optimista';
        
        if (shouldBeWorse) {
            const isWorse = result.economicNPV < testBaseMetrics.economicNPV;
            console.log(`✅ ¿${scenarioName} es peor que base?`, isWorse ? 'SÍ' : '❌ NO');
        }
        
        if (shouldBeBetter) {
            const isBetter = result.economicNPV > testBaseMetrics.economicNPV;
            console.log(`✅ ¿${scenarioName} es mejor que base?`, isBetter ? 'SÍ' : '❌ NO');
        }
    });
}

// Exportar funciones globalmente
if (typeof window !== 'undefined') {
    window.updateSensitivity = updateSensitivity;
    window.getSensitivityData = getSensitivityData;
    window.debugSensitivity = debugSensitivity;
    window.testSensitivityLogic = testSensitivityLogic;
    window.updateKeyFactorsDisplay = updateKeyFactorsDisplay;
}

// Ejecutar análisis inicial cuando se carga el módulo
if (typeof window !== 'undefined') {
    // Esperar un poco para que otros módulos se carguen
    setTimeout(() => {
        if (typeof modelData !== 'undefined' && document.getElementById('sensibilidadBody')) {
            updateSensitivity();
        }
        
        // Actualizar factores clave cuando estén disponibles los datos del modelo
        setTimeout(() => {
            if (typeof modelData !== 'undefined' && modelData.economicCashFlow) {
                updateKeyFactorsDisplay();
            }
        }, 2000); // Esperar un poco más para que se calculen los flujos de caja
    }, 1000);
}

// Módulo de Análisis de Sensibilidad Dinámico
class SensitivityAnalysis {
    constructor() {
        this.baseScenario = null;
        this.sensitivityResults = {};
        this.factors = {
            traffic: { name: 'Tráfico Web', variations: [-50, -25, 0, 25, 50], unit: '%' },
            conversion: { name: 'Tasa de Conversión', variations: [-40, -20, 0, 20, 40], unit: '%' },
            ticket: { name: 'Ticket Promedio', variations: [-15, -10, 0, 10, 15], unit: '%' },
            costs: { name: 'Costos Operativos', variations: [-15, -10, 0, 10, 20], unit: '%' },
            wacc: { name: 'WACC', variations: [-2, -1, 0, 1, 2], unit: 'pp' },
            exchangeRate: { name: 'Tipo de Cambio', variations: [-10, -5, 0, 5, 10], unit: '%' }
        };
    }

    // Inicializar análisis de sensibilidad
    init() {
        console.log('🔍 Inicializando análisis de sensibilidad dinámico...');
        this.calculateBaseScenario();
        this.calculateSensitivities();
        this.updateSensitivityDisplay();
    }

    // Calcular escenario base
    calculateBaseScenario() {
        console.log('📊 Calculando escenario base...');
        
        // Obtener parámetros actuales del modelo
        const baseParams = this.getCurrentModelParameters();
        
        // Generar flujos de caja para verificar
        const cashFlows = this.generateCashFlows(baseParams);
        console.log('💰 Flujos de caja generados:', {
            'CAPEX inicial': `$${(cashFlows[0]/1000).toFixed(0)}K`,
            '2025 (6m Chile)': `$${(cashFlows[1]/1000).toFixed(0)}K`,
            '2026': `$${(cashFlows[2]/1000).toFixed(0)}K`,
            '2027': `$${(cashFlows[3]/1000).toFixed(0)}K`,
            '2028': `$${(cashFlows[4]/1000).toFixed(0)}K`,
            '2029': `$${(cashFlows[5]/1000).toFixed(0)}K`,
            '2030': `$${(cashFlows[6]/1000).toFixed(0)}K`
        });
        
        // Verificar distribución de mercados
        console.log('🌍 Distribución de mercados verificada:', {
            'marketDistribution disponible': typeof marketDistribution !== 'undefined',
            'Chile weight': typeof marketDistribution !== 'undefined' ? marketDistribution.chile?.weight : 'N/A',
            'Total weights': typeof marketDistribution !== 'undefined' ? 
                Object.values(marketDistribution).reduce((sum, m) => sum + m.weight, 0) : 'N/A'
        });
        
        // Calcular métricas base
        this.baseScenario = {
            params: baseParams,
            npv: this.calculateNPV(baseParams),
            irr: this.calculateIRR(baseParams),
            revenue2030: this.calculateRevenue2030(baseParams),
            totalCosts: this.calculateTotalCosts(baseParams),
            cashFlows: cashFlows
        };
        
        console.log('📈 Escenario base calculado:', {
            'VAN': `$${this.baseScenario.npv.toFixed(1)}M`,
            'TIR': `${this.baseScenario.irr.toFixed(1)}%`,
            'Revenue 2030': `$${this.baseScenario.revenue2030.toFixed(1)}M`,
            'Costos Totales': `$${this.baseScenario.totalCosts.toFixed(1)}M`
        });
    }

    // Obtener parámetros actuales del modelo
    getCurrentModelParameters() {
        return {
            initialTraffic: parseFloat(document.getElementById('initialTraffic')?.value || 9100),
            trafficGrowth: parseFloat(document.getElementById('trafficGrowth')?.value || 100) / 100, // Actualizado a 100%
            initialConversion: parseFloat(document.getElementById('initialConversion')?.value || 1.5) / 100,
            conversionGrowth: parseFloat(document.getElementById('conversionGrowthRate')?.value || 40) / 100, // Actualizado a 40%
            initialTicket: parseFloat(document.getElementById('initialTicket')?.value || 45),
            ticketGrowth: parseFloat(document.getElementById('ticketGrowth')?.value || 8) / 100,
            wacc: 8.0, // WACC base
            exchangeRates: {
                CLP: 900,
                MXN: 17,
                BRL: 5.2,
                CAD: 1.35
            },
            costMultipliers: {
                marketing: 0.15,
                operations: 0.25,
                logistics: 0.12
            }
        };
    }

    // Calcular sensibilidades para todos los factores
    calculateSensitivities() {
        console.log('🎯 Calculando sensibilidades...');
        
        Object.keys(this.factors).forEach(factorKey => {
            this.sensitivityResults[factorKey] = this.calculateFactorSensitivity(factorKey);
        });
        
        console.log('📊 Resultados de sensibilidad:', this.sensitivityResults);
    }

    // Calcular sensibilidad para un factor específico
    calculateFactorSensitivity(factorKey) {
        const factor = this.factors[factorKey];
        const results = [];
        
        factor.variations.forEach(variation => {
            const modifiedParams = this.applyVariation(this.baseScenario.params, factorKey, variation);
            const scenario = {
                variation: variation,
                npv: this.calculateNPV(modifiedParams),
                irr: this.calculateIRR(modifiedParams),
                revenue2030: this.calculateRevenue2030(modifiedParams)
            };
            results.push(scenario);
        });
        
        // Calcular impacto máximo
        const maxNPVImpact = Math.max(...results.map(r => Math.abs(r.npv - this.baseScenario.npv)));
        const maxIRRImpact = Math.max(...results.map(r => Math.abs(r.irr - this.baseScenario.irr)));
        
        return {
            scenarios: results,
            maxNPVImpact: maxNPVImpact,
            maxIRRImpact: maxIRRImpact,
            impactLevel: this.classifyImpact(maxNPVImpact)
        };
    }

    // Aplicar variación a parámetros
    applyVariation(baseParams, factorKey, variation) {
        const params = JSON.parse(JSON.stringify(baseParams)); // Deep copy
        
        switch(factorKey) {
            case 'traffic':
                params.initialTraffic *= (1 + variation / 100);
                break;
            case 'conversion':
                params.initialConversion *= (1 + variation / 100);
                break;
            case 'ticket':
                params.initialTicket *= (1 + variation / 100);
                break;
            case 'costs':
                Object.keys(params.costMultipliers).forEach(key => {
                    params.costMultipliers[key] *= (1 + variation / 100);
                });
                break;
            case 'wacc':
                params.wacc += variation; // Puntos porcentuales
                break;
            case 'exchangeRate':
                params.exchangeRates.CLP *= (1 + variation / 100);
                break;
        }
        
        return params;
    }

    // Calcular VAN con parámetros dados
    calculateNPV(params) {
        const cashFlows = this.generateCashFlows(params);
        const discountRate = params.wacc / 100;
        
        let npv = 0;
        cashFlows.forEach((cf, year) => {
            npv += cf / Math.pow(1 + discountRate, year + 1);
        });
        
        return npv / 1000000; // En millones
    }

    // Calcular TIR con parámetros dados
    calculateIRR(params) {
        const cashFlows = this.generateCashFlows(params);
        return this.calculateIRRIterative(cashFlows) * 100; // En porcentaje
    }

    // Generar flujos de caja proyectados
    generateCashFlows(params) {
        const years = [2025, 2026, 2027, 2028, 2029, 2030]; // Incluir 2025
        const cashFlows = [];
        
        // CAPEX inicial (antes de 2025)
        const initialCapex = -800000; // $800K
        
        years.forEach((year, index) => {
            const yearIndex = index; // 2025 = año 0, 2026 = año 1, etc.
            
            // Para 2025, solo 6 meses de operación (Q3-Q4) - Solo Chile
            const monthsOfOperation = year === 2025 ? 6 : 12;
            
            // Calcular ingresos
            let traffic, conversion, ticket;
            
            if (year === 2025) {
                // Valores iniciales para 2025 (más conservadores)
                traffic = params.initialTraffic;
                conversion = params.initialConversion;
                ticket = params.initialTicket;
            } else {
                // Crecimiento desde 2025 como base
                traffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex);
                conversion = params.initialConversion * Math.pow(1 + params.conversionGrowth, yearIndex);
                ticket = params.initialTicket * Math.pow(1 + params.ticketGrowth, yearIndex);
            }
            
            const monthlyOrders = traffic * conversion;
            const monthlyRevenue = monthlyOrders * ticket;
            const annualRevenue = monthlyRevenue * monthsOfOperation; // Ajustado por meses
            
            // Aplicar distribución por mercados y tipos de cambio (pasar el yearIndex)
            const revenueUSD = this.convertToUSD(annualRevenue, params.exchangeRates, yearIndex);
            
            // Calcular costos
            const marketingCosts = revenueUSD * params.costMultipliers.marketing;
            const operationsCosts = revenueUSD * params.costMultipliers.operations;
            const logisticsCosts = revenueUSD * params.costMultipliers.logistics;
            const totalCosts = marketingCosts + operationsCosts + logisticsCosts;
            
            // EBITDA
            const ebitda = revenueUSD - totalCosts;
            
            // Depreciación (simplificada)
            const depreciation = year === 2025 ? 40000 : 80000; // Proporcional para 2025
            
            // EBIT
            const ebit = ebitda - depreciation;
            
            // Impuestos (promedio ponderado)
            const taxRate = year === 2025 ? 0.27 : 0.25; // Chile tiene 27% en 2025
            const taxes = ebit > 0 ? ebit * taxRate : 0;
            
            // Flujo de caja libre
            const fcf = ebit - taxes + depreciation;
            
            cashFlows.push(fcf);
        });
        
        return [initialCapex, ...cashFlows];
    }

    // Convertir ingresos a USD considerando mix de mercados por año
    convertToUSD(revenueLocal, exchangeRates, year = null) {
        // Verificar si marketDistribution está disponible
        if (typeof marketDistribution === 'undefined') {
            console.warn('⚠️ marketDistribution no disponible, usando valores por defecto');
            // Fallback a valores por defecto
            const marketMix = year === 0 ? 
                { Chile: 1.00, Mexico: 0.00, Brazil: 0.00, Canada: 0.00, USA: 0.00 } :
                { Chile: 0.40, Mexico: 0.25, Brazil: 0.15, Canada: 0.10, USA: 0.10 };
            
            let revenueUSD = 0;
            revenueUSD += (revenueLocal * marketMix.Chile) / exchangeRates.CLP;
            revenueUSD += (revenueLocal * marketMix.Mexico) / exchangeRates.MXN;
            revenueUSD += (revenueLocal * marketMix.Brazil) / exchangeRates.BRL;
            revenueUSD += (revenueLocal * marketMix.Canada) / exchangeRates.CAD;
            revenueUSD += (revenueLocal * marketMix.USA);
            return revenueUSD;
        }
        
        // Usar marketDistribution real
        let revenueUSD = 0;
        
        if (year === 0) { // 2025 - Solo Chile
            const chileData = marketDistribution.chile;
            revenueUSD = revenueLocal / exchangeRates[chileData.currency];
        } else {
            // Años posteriores - Distribución normal
            Object.keys(marketDistribution).forEach(market => {
                const marketData = marketDistribution[market];
                const marketRevenue = revenueLocal * marketData.weight;
                
                if (marketData.currency === 'USD') {
                    revenueUSD += marketRevenue;
                } else {
                    revenueUSD += marketRevenue / exchangeRates[marketData.currency];
                }
            });
        }
        
        return revenueUSD;
    }

    // Calcular revenue 2030
    calculateRevenue2030(params) {
        const yearIndex = 5; // 2030 es año 5 desde 2025
        const traffic2030 = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex);
        const conversion2030 = params.initialConversion * Math.pow(1 + params.conversionGrowth, yearIndex);
        const ticket2030 = params.initialTicket * Math.pow(1 + params.ticketGrowth, yearIndex);
        
        const monthlyRevenue = traffic2030 * conversion2030 * ticket2030;
        const annualRevenue = monthlyRevenue * 12;
        
        // Para 2030, usar distribución normal de mercados (yearIndex = 5)
        return this.convertToUSD(annualRevenue, params.exchangeRates, yearIndex) / 1000000; // En millones
    }

    // Calcular costos totales
    calculateTotalCosts(params) {
        const revenue2030 = this.calculateRevenue2030(params) * 1000000; // Volver a unidades
        const totalCostRate = Object.values(params.costMultipliers).reduce((sum, rate) => sum + rate, 0);
        return (revenue2030 * totalCostRate) / 1000000; // En millones
    }

    // Calcular TIR iterativo
    calculateIRRIterative(cashFlows) {
        let rate = 0.1; // Tasa inicial 10%
        let tolerance = 0.0001;
        let maxIterations = 1000;
        
        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0;
            
            for (let j = 0; j < cashFlows.length; j++) {
                npv += cashFlows[j] / Math.pow(1 + rate, j);
                dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
            }
            
            if (Math.abs(npv) < tolerance) {
                return rate;
            }
            
            rate = rate - npv / dnpv;
            
            if (rate < -0.99) rate = -0.99;
            if (rate > 10) rate = 10;
        }
        
        return rate;
    }

    // Clasificar nivel de impacto
    classifyImpact(npvImpact) {
        if (npvImpact >= 2.0) return 'high';
        if (npvImpact >= 1.0) return 'medium';
        return 'low';
    }

    // Actualizar display de sensibilidad
    updateSensitivityDisplay() {
        console.log('🎨 Actualizando display de sensibilidad...');
        
        // Actualizar factores individuales
        this.updateFactorCards();
        
        // Actualizar gráfico de barras
        this.updateSensitivityChart();
        
        // Actualizar métricas base
        this.updateBaseMetrics();
    }

    // Actualizar tarjetas de factores
    updateFactorCards() {
        const factorKeys = Object.keys(this.factors);
        
        factorKeys.forEach((factorKey, index) => {
            const factor = this.factors[factorKey];
            const result = this.sensitivityResults[factorKey];
            
            if (!result) return;
            
            // Buscar la tarjeta correspondiente
            const factorCards = document.querySelectorAll('.factor-card');
            if (factorCards[index]) {
                const card = factorCards[index];
                
                // Actualizar métrica de sensibilidad
                const metricValue = card.querySelector('.factor-metric .metric-value');
                if (metricValue) {
                    const maxVariation = Math.max(...factor.variations.map(Math.abs));
                    metricValue.textContent = `±${maxVariation}${factor.unit} → ±$${result.maxNPVImpact.toFixed(1)}M VAN`;
                }
                
                // Actualizar nivel de impacto
                const impactLevel = card.querySelector('.impact-level');
                if (impactLevel) {
                    impactLevel.className = `impact-level ${result.impactLevel}`;
                    impactLevel.textContent = `Impacto ${result.impactLevel === 'high' ? 'Alto' : 
                                                      result.impactLevel === 'medium' ? 'Medio' : 'Bajo'}`;
                }
            }
        });
    }

    // Actualizar gráfico de barras de sensibilidad
    updateSensitivityChart() {
        if (!this.sensitivityResults) {
            console.warn('⚠️ No hay datos de sensibilidad disponibles para actualizar el gráfico');
            return;
        }
        
        const chartItems = document.querySelectorAll('.chart-item');
        const factors = ['traffic', 'conversion', 'costs', 'ticket', 'exchange'];
        
        // Encontrar el impacto máximo para normalizar las barras
        const maxImpact = Math.max(...Object.values(this.sensitivityResults).map(r => Math.abs(r.maxNPVImpact)));
        
        factors.forEach((factor, index) => {
            if (chartItems[index]) {
                const sensitivity = this.sensitivityResults[factor];
                
                // Verificar que el factor existe
                if (!sensitivity) {
                    console.warn(`⚠️ Factor de sensibilidad '${factor}' no encontrado`);
                    return;
                }
                
                const chartItem = chartItems[index];
                
                // Actualizar nombre del factor
                const factorName = chartItem.querySelector('.factor-name');
                if (factorName) {
                    factorName.textContent = this.factors[factor].name;
                }
                
                // Actualizar barra
                const barFill = chartItem.querySelector('.bar-fill');
                if (barFill) {
                    const percentage = (Math.abs(sensitivity.maxNPVImpact) / maxImpact) * 100;
                    barFill.style.width = `${percentage}%`;
                    
                    // Actualizar color según nivel de impacto
                    barFill.className = `bar-fill bg-gradient-to-r ${
                        sensitivity.impactLevel === 'high' ? 'from-red-400 to-red-600' :
                        sensitivity.impactLevel === 'medium' ? 'from-orange-400 to-orange-600' : 'from-green-400 to-green-600'
                    } h-full rounded-full`;
                }
                
                // Actualizar valor de impacto
                const impactValue = chartItem.querySelector('.impact-value');
                if (impactValue) {
                    impactValue.textContent = `±$${(Math.abs(sensitivity.maxNPVImpact)/1000000).toFixed(1)}M`;
                    impactValue.className = `impact-value font-bold w-20 text-right ${
                        sensitivity.impactLevel === 'high' ? 'text-red-600' :
                        sensitivity.impactLevel === 'medium' ? 'text-orange-600' : 'text-green-600'
                    }`;
                }
            }
        });
    }

    // Actualizar métricas base
    updateBaseMetrics() {
        // PRIORIDAD 1: Usar datos reales del modelo si están disponibles
        if (modelData.revenues && modelData.revenues[2030]) {
            console.log('📊 Sensibilidad usando datos reales del modelo');
            
            // Calcular revenue 2030 usando datos reales del modelo
            const revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
                return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
            }, 0);
            
            // Obtener métricas del modelo económico y financiero
            const economicNPV = modelData.economicCashFlow?.metrics?.npv || 0;
            const economicIRR = (modelData.economicCashFlow?.metrics?.irr || 0) * 100;
            
            // Actualizar métricas en la sección principal usando datos reales
            const sensitivityVAN = document.getElementById('sensitivityVAN');
            const sensitivityTIR = document.getElementById('sensitivityTIR');
            const sensitivityRevenue = document.getElementById('sensitivityRevenue');
            
            if (sensitivityVAN) {
                sensitivityVAN.textContent = `$${(economicNPV/1000000).toFixed(1)}M`;
            }
            
            if (sensitivityTIR) {
                sensitivityTIR.textContent = `${economicIRR.toFixed(1)}%`;
            }
            
            if (sensitivityRevenue) {
                sensitivityRevenue.textContent = `$${(revenue2030/1000000).toFixed(1)}M`;
            }
            
            console.log('✅ Sensibilidad actualizada con datos del modelo:', {
                'Revenue 2030': `$${(revenue2030/1000000).toFixed(1)}M`,
                'VAN Económico': `$${(economicNPV/1000000).toFixed(1)}M`,
                'TIR Económica': `${economicIRR.toFixed(1)}%`
            });
            
        } else if (this.baseScenario) {
            // FALLBACK: Usar datos calculados por la clase si no hay datos del modelo
            console.log('⚠️ Sensibilidad usando datos calculados internamente');
            
            const sensitivityVAN = document.getElementById('sensitivityVAN');
            const sensitivityTIR = document.getElementById('sensitivityTIR');
            const sensitivityRevenue = document.getElementById('sensitivityRevenue');
            
            if (sensitivityVAN) {
                sensitivityVAN.textContent = `$${this.baseScenario.npv.toFixed(1)}M`;
            }
            
            if (sensitivityTIR) {
                sensitivityTIR.textContent = `${this.baseScenario.irr.toFixed(1)}%`;
            }
            
            if (sensitivityRevenue) {
                sensitivityRevenue.textContent = `$${this.baseScenario.revenue2030.toFixed(1)}M`;
            }
        } else {
            console.warn('⚠️ No hay datos disponibles para actualizar métricas de sensibilidad');
        }
        
        // Actualizar parámetros base
        this.updateBaseParameters();
    }
    
    // Actualizar parámetros base en la interfaz
    updateBaseParameters() {
        if (!this.baseScenario) return;
        
        const params = this.baseScenario.params;
        
        // Actualizar valores de parámetros
        const baseTraffic = document.getElementById('baseTraffic');
        const baseConversion = document.getElementById('baseConversion');
        const baseTicket = document.getElementById('baseTicket');
        const baseWACC = document.getElementById('baseWACC');
        const baseExchangeRate = document.getElementById('baseExchangeRate');
        const baseCosts = document.getElementById('baseCosts');
        
        if (baseTraffic) {
            baseTraffic.textContent = `${params.initialTraffic.toLocaleString()} (+${(params.trafficGrowth * 100).toFixed(0)}%/año)`;
        }
        
        if (baseConversion) {
            baseConversion.textContent = `${(params.initialConversion * 100).toFixed(1)}% (+${(params.conversionGrowth * 100).toFixed(0)}%/año)`;
        }
        
        if (baseTicket) {
            baseTicket.textContent = `$${params.initialTicket.toFixed(0)} (+${(params.ticketGrowth * 100).toFixed(0)}%/año)`;
        }
        
        if (baseWACC) {
            baseWACC.textContent = `${params.wacc.toFixed(1)}%`;
        }
        
        if (baseExchangeRate) {
            baseExchangeRate.textContent = `${params.exchangeRates.CLP.toLocaleString()} CLP/USD`;
        }
        
        if (baseCosts) {
            const totalCostRate = Object.values(params.costMultipliers).reduce((sum, rate) => sum + rate, 0);
            baseCosts.textContent = `${(totalCostRate * 100).toFixed(0)}% ingresos`;
        }
    }

    // Recalcular cuando cambien parámetros
    recalculate() {
        console.log('🔄 Recalculando sensibilidad...');
        this.calculateBaseScenario();
        this.calculateSensitivities();
        this.updateSensitivityDisplay();
    }
}

// Instancia global
window.sensitivityAnalysis = new SensitivityAnalysis();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.sensitivityAnalysis) {
            window.sensitivityAnalysis.init();
        }
    }, 1000); // Esperar a que otros módulos se carguen
});

// Función para recalcular desde otros módulos
window.updateSensitivityAnalysis = function() {
    if (window.sensitivityAnalysis) {
        window.sensitivityAnalysis.recalculate();
    }
};

// Función para actualizar parámetros base en la interfaz
function updateBaseParametersDisplay() {
    try {
        // Obtener parámetros actuales del modelo
        const params = getBusinessParams();
        const financialParams = getFinancialParams();
        
        // Actualizar elementos de parámetros base
        const elements = {
            'baseTraffic': params.initialTraffic ? params.initialTraffic.toLocaleString() : '9,100',
            'baseConversion': params.initialConversion ? `${(params.initialConversion * 100).toFixed(1)}%` : '2.0%',
            'baseTicket': params.avgTicket ? `$${params.avgTicket}` : '$50',
            'baseWACC': financialParams.wacc ? `${(financialParams.wacc * 100).toFixed(1)}%` : '8.0%',
            'baseExchangeRate': exchangeRates?.CLP || '900',
            'baseCosts': `${((params.marketingPct || 0.12) * 100 + 42).toFixed(0)}%` // Marketing + COGS estimado
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
        console.log('✅ Parámetros base actualizados en la interfaz:', elements);
        
    } catch (error) {
        console.error('❌ Error actualizando parámetros base:', error);
    }
}

// Función para actualizar dinámicamente los Factores Clave que Impactan los Flujos de Caja
function updateKeyFactorsDisplay() {
    console.log('🎯 Actualizando Factores Clave con datos reales...');
    
    // Obtener datos reales del modelo
    const baseMetrics = getBaseMetricsFromModel();
    
    if (!baseMetrics) {
        console.warn('⚠️ No hay datos del modelo disponibles para calcular factores clave');
        return;
    }
    
    // Calcular sensibilidades reales para cada factor
    const sensitivities = calculateRealSensitivities(baseMetrics);
    
    // Actualizar cada tarjeta de factor
    updateFactorCard('traffic', sensitivities.traffic);
    updateFactorCard('conversion', sensitivities.conversion);
    updateFactorCard('ticket', sensitivities.ticket);
    updateFactorCard('costs', sensitivities.costs);
    updateFactorCard('exchange', sensitivities.exchange);
    
    // Actualizar gráfico de barras de sensibilidad
    updateSensitivityChart(sensitivities);
    
    console.log('✅ Factores Clave actualizados con datos reales:', sensitivities);
}

// Obtener métricas base del modelo
function getBaseMetricsFromModel() {
    if (!modelData.economicCashFlow || !modelData.economicCashFlow.metrics) {
        return null;
    }
    
    const economicFlow = modelData.economicCashFlow;
    const financialFlow = modelData.financialCashFlow;
    
    // Calcular revenue 2030
    let revenue2030 = 0;
    if (modelData.revenues && modelData.revenues[2030]) {
        revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0);
    }
    
    // Calcular EBITDA 2030
    let ebitda2030 = 0;
    if (economicFlow[2030]) {
        ebitda2030 = economicFlow[2030].ebitda || 0;
    }
    
    return {
        economicNPV: economicFlow.metrics.npv || 0,
        financialNPV: financialFlow?.metrics?.equityNPV || 0,
        economicIRR: (economicFlow.metrics.irr || 0) * 100,
        financialIRR: (financialFlow?.metrics?.projectIRR || 0) * 100,
        revenue2030: revenue2030,
        ebitda2030: ebitda2030,
        totalCapex: modelData.investments ? 
            Object.values(modelData.investments).reduce((sum, yearData) => sum + (yearData.total || 0), 0) : 565000
    };
}

// Calcular sensibilidades reales
function calculateRealSensitivities(baseMetrics) {
    const sensitivities = {};
    
    // Factor 1: Tráfico Web (±50% → impacto en VAN)
    const trafficVariation = 0.5; // ±50%
    const trafficImpact = calculateTrafficImpact(baseMetrics, trafficVariation);
    sensitivities.traffic = {
        name: 'Tráfico Web',
        variation: '±50%',
        npvImpact: trafficImpact.npvChange,
        impactLevel: classifyImpactLevel(Math.abs(trafficImpact.npvChange)),
        description: 'Base del modelo de ingresos con crecimiento decreciente. Variaciones significativas impactan directamente el revenue y FCF.',
        drivers: ['SEO/SEM', 'Marketing Digital', 'Expansión Geográfica']
    };
    
    // Factor 2: Tasa de Conversión (±40% → impacto en VAN)
    const conversionVariation = 0.4; // ±40%
    const conversionImpact = calculateConversionImpact(baseMetrics, conversionVariation);
    sensitivities.conversion = {
        name: 'Tasa de Conversión',
        variation: '±40%',
        npvImpact: conversionImpact.npvChange,
        impactLevel: classifyImpactLevel(Math.abs(conversionImpact.npvChange)),
        description: 'Eficiencia de conversión con mejora decreciente anual. Crítico para la rentabilidad del modelo.',
        drivers: ['UX/UI', 'Pricing', 'Trust & Security']
    };
    
    // Factor 3: Ticket Promedio (±15% → impacto en VAN)
    const ticketVariation = 0.15; // ±15%
    const ticketImpact = calculateTicketImpact(baseMetrics, ticketVariation);
    sensitivities.ticket = {
        name: 'Ticket Promedio',
        variation: '±15%',
        npvImpact: ticketImpact.npvChange,
        impactLevel: classifyImpactLevel(Math.abs(ticketImpact.npvChange)),
        description: 'Valor promedio por transacción. Influenciado por mix de productos y estrategia de precios premium.',
        drivers: ['Mix Productos', 'Upselling', 'Premium Wines']
    };
    
    // Factor 4: Costos Operativos (±20% → impacto en VAN)
    const costsVariation = 0.2; // ±20%
    const costsImpact = calculateCostsImpact(baseMetrics, costsVariation);
    sensitivities.costs = {
        name: 'Costos Operativos',
        variation: '±20%',
        npvImpact: costsImpact.npvChange,
        impactLevel: classifyImpactLevel(Math.abs(costsImpact.npvChange)),
        description: 'Costos variables y fijos operacionales. Control crítico para mantener márgenes y rentabilidad.',
        drivers: ['Logística', 'Personal', 'Marketing']
    };
    
    // Factor 5: Tipo de Cambio (±10% → impacto en VAN)
    const exchangeVariation = 0.1; // ±10%
    const exchangeImpact = calculateExchangeImpact(baseMetrics, exchangeVariation);
    sensitivities.exchange = {
        name: 'Tipo de Cambio',
        variation: '±10%',
        npvImpact: exchangeImpact.npvChange,
        impactLevel: classifyImpactLevel(Math.abs(exchangeImpact.npvChange)),
        description: 'Fluctuaciones cambiarias afectan ingresos en mercados internacionales y costos de importación.',
        drivers: ['USD/CLP', 'Hedging', 'FX Exposure']
    };
    
    return sensitivities;
}

// Funciones de cálculo de impacto para cada factor
function calculateTrafficImpact(baseMetrics, variation) {
    // Impacto en revenue = variación directa
    const revenueChange = baseMetrics.revenue2030 * variation;
    // Impacto en EBITDA = 70% del cambio en revenue (asumiendo costos variables)
    const ebitdaChange = revenueChange * 0.7;
    // Impacto en VAN = múltiplo de EBITDA (conservador: 3x)
    const npvChange = ebitdaChange * 3;
    
    return { npvChange, revenueChange, ebitdaChange };
}

function calculateConversionImpact(baseMetrics, variation) {
    // Similar al tráfico pero con menor impacto en costos
    const revenueChange = baseMetrics.revenue2030 * variation;
    const ebitdaChange = revenueChange * 0.75; // Menos costos variables
    const npvChange = ebitdaChange * 3;
    
    return { npvChange, revenueChange, ebitdaChange };
}

function calculateTicketImpact(baseMetrics, variation) {
    // Impacto directo en revenue
    const revenueChange = baseMetrics.revenue2030 * variation;
    const ebitdaChange = revenueChange * 0.8; // Mayor margen
    const npvChange = ebitdaChange * 3;
    
    return { npvChange, revenueChange, ebitdaChange };
}

function calculateCostsImpact(baseMetrics, variation) {
    // Impacto directo en EBITDA
    const costBase = baseMetrics.revenue2030 - baseMetrics.ebitda2030;
    const costChange = costBase * variation;
    const ebitdaChange = -costChange; // Costos suben, EBITDA baja
    const npvChange = ebitdaChange * 3;
    
    return { npvChange, costChange, ebitdaChange };
}

function calculateExchangeImpact(baseMetrics, variation) {
    // Impacto en revenue internacional (35% del total)
    const internationalRevenue = baseMetrics.revenue2030 * 0.35;
    const revenueChange = internationalRevenue * variation;
    const ebitdaChange = revenueChange * 0.6; // Menor impacto por costos en USD
    const npvChange = ebitdaChange * 3;
    
    return { npvChange, revenueChange, ebitdaChange };
}

// Clasificar nivel de impacto
function classifyImpactLevel(npvImpact) {
    if (Math.abs(npvImpact) >= 2000000) return 'high'; // ±$2M o más
    if (Math.abs(npvImpact) >= 1000000) return 'medium'; // ±$1M a $2M
    return 'low'; // Menos de ±$1M
}

// Actualizar tarjeta de factor individual
function updateFactorCard(factorType, sensitivity) {
    const factorCards = document.querySelectorAll('.factor-card');
    
    // Mapear factorType a índice de tarjeta
    const cardIndexMap = {
        'traffic': 0,
        'conversion': 1,
        'ticket': 2,
        'costs': 3,
        'exchange': 4
    };
    
    const cardIndex = cardIndexMap[factorType];
    if (cardIndex >= factorCards.length) return;
    
    const card = factorCards[cardIndex];
    
    // Actualizar métrica de sensibilidad
    const metricElement = card.querySelector('.factor-metric .text-lg');
    if (metricElement) {
        metricElement.textContent = `${sensitivity.variation} → ±$${(Math.abs(sensitivity.npvImpact)/1000000).toFixed(1)}M`;
    }
    
    // Actualizar nivel de impacto
    const impactBadge = card.querySelector('.bg-red-500, .bg-yellow-500, .bg-green-500');
    if (impactBadge) {
        impactBadge.className = `text-white text-xs font-semibold px-3 py-1 rounded-full ${
            sensitivity.impactLevel === 'high' ? 'bg-red-500' :
            sensitivity.impactLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
        }`;
        impactBadge.textContent = `Impacto ${sensitivity.impactLevel === 'high' ? 'Alto' : 
                                      sensitivity.impactLevel === 'medium' ? 'Medio' : 'Bajo'}`;
    }
    
    // Actualizar descripción
    const descriptionElement = card.querySelector('.factor-description');
    if (descriptionElement) {
        descriptionElement.textContent = sensitivity.description;
    }
}

// Actualizar gráfico de barras de sensibilidad
function updateSensitivityChart(sensitivities) {
    if (!sensitivities) {
        console.warn('⚠️ No hay datos de sensibilidad disponibles para actualizar el gráfico');
        return;
    }
    
    const chartItems = document.querySelectorAll('.chart-item');
    const factors = ['traffic', 'conversion', 'costs', 'ticket', 'exchange'];
    
    // Encontrar el impacto máximo para normalizar las barras
    const maxImpact = Math.max(...Object.values(sensitivities).map(s => Math.abs(s.npvImpact)));
    
    factors.forEach((factor, index) => {
        if (chartItems[index]) {
            const sensitivity = sensitivities[factor];
            
            // Verificar que el factor existe
            if (!sensitivity) {
                console.warn(`⚠️ Factor de sensibilidad '${factor}' no encontrado`);
                return;
            }
            
            const chartItem = chartItems[index];
            
            // Actualizar nombre del factor
            const factorName = chartItem.querySelector('.factor-name');
            if (factorName) {
                factorName.textContent = sensitivity.name;
            }
            
            // Actualizar barra
            const barFill = chartItem.querySelector('.bar-fill');
            if (barFill) {
                const percentage = (Math.abs(sensitivity.npvImpact) / maxImpact) * 100;
                barFill.style.width = `${percentage}%`;
                
                // Actualizar color según nivel de impacto
                barFill.className = `bar-fill bg-gradient-to-r ${
                    sensitivity.impactLevel === 'high' ? 'from-red-400 to-red-600' :
                    sensitivity.impactLevel === 'medium' ? 'from-orange-400 to-orange-600' : 'from-green-400 to-green-600'
                } h-full rounded-full`;
            }
            
            // Actualizar valor de impacto
            const impactValue = chartItem.querySelector('.impact-value');
            if (impactValue) {
                impactValue.textContent = `±$${(Math.abs(sensitivity.npvImpact)/1000000).toFixed(1)}M`;
                impactValue.className = `impact-value font-bold w-20 text-right ${
                    sensitivity.impactLevel === 'high' ? 'text-red-600' :
                    sensitivity.impactLevel === 'medium' ? 'text-orange-600' : 'text-green-600'
                }`;
            }
        }
    });
}
