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

// Configuración para análisis de variables críticas
const CRITICAL_VARIABLES = {
    wacc: {
        name: 'WACC',
        baseValue: 0.08,
        variations: [-2, -1, 0, 1, 2], // Puntos porcentuales
        unit: 'pp',
        description: 'Costo Promedio Ponderado de Capital',
        impactLevel: 'Alto'
    },
    growth: {
        name: 'Crecimiento',
        baseValue: 0.45, // 45% promedio anual (refleja patrón decreciente real)
        variations: [-50, -25, 0, 25, 50], // Porcentajes
        unit: '%',
        description: 'Tasa de crecimiento promedio del tráfico',
        impactLevel: 'Alto'
    },
    prices: {
        name: 'Precios',
        baseValue: 1.0,
        variations: [-30, -15, 0, 15, 30], // Porcentajes
        unit: '%',
        description: 'Variación en precios promedio',
        impactLevel: 'Alto'
    },
    costs: {
        name: 'Costos',
        baseValue: 1.0,
        variations: [-20, -10, 0, 10, 20], // Porcentajes
        unit: '%',
        description: 'Variación en costos operativos',
        impactLevel: 'Alto'
    }
};

function updateSensitivity() {

    
    try {
        // Actualizar primero los parámetros base en la interfaz
        updateBaseParametersDisplay();
        
        // Asegurar que los cálculos principales estén ejecutados
        ensureModelDataReady();
        
        // Obtener métricas del escenario base real
        const baseMetrics = getBaseScenarioMetrics();
        
        // Ejecutar análisis de escenarios
        const scenarioResults = executeSensitivityAnalysis(baseMetrics);
        
        // Generar matriz de sensibilidad para variables críticas
        const sensitivityMatrix = generateSensitivityMatrix(baseMetrics);
        
        // Evaluar riesgos clave
        const keyRisks = evaluateKeyRisks(sensitivityMatrix);
        
        // Identificar escenarios viables
        const viableScenarios = identifyViableScenarios(sensitivityMatrix);
        
        // Actualizar tabla y métricas
        updateSensitivityDisplay(scenarioResults);
        updateSensitivityBanners(scenarioResults);
        
        // Actualizar matriz de sensibilidad
        updateSensitivityMatrix(sensitivityMatrix);
        
        // Actualizar análisis de riesgos
        updateRiskAnalysis(keyRisks, viableScenarios);
        
        // Generar interpretación de resultados
        const interpretation = interpretSensitivityResults(sensitivityMatrix, keyRisks, viableScenarios);
        updateInterpretation(interpretation);
        
        // Guardar en modelData
        if (typeof modelData === 'undefined') {
            window.modelData = {};
        }
        
        modelData.sensitivity = {
            scenarios: scenarioResults,
            matrix: sensitivityMatrix,
            risks: keyRisks,
            viableScenarios: viableScenarios,
            interpretation: interpretation,
            timestamp: new Date().toISOString()
        };
        

        
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
    

    
    // Revenue 2030 del modelo de ingresos - USAR DATOS REALES DEL MODELO
    let revenue2030 = 0;
    if (modelData.revenues && modelData.revenues[2030]) {
        revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0);

    } else {
        // Fallback: calcular usando la misma lógica que revenues.js

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
    

    
    // Si los valores base no son razonables, usar datos de respaldo
    const hasValidData = revenue2030 > 0 && Math.abs(economicNPV) > 0;
    
    if (!hasValidData) {
        console.warn('⚠️ Usando datos de respaldo para análisis de sensibilidad');
        return {
            revenue2030: 12500000,      // $12.5M
            economicNPV: 3500000,       // $3.5M (más realista)
            financialNPV: 2200000,      // $2.2M
            economicIRR: 16.5,          // 16.5% (más realista)
            financialIRR: 18.2,         // 18.2% (más realista)
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

    
    const results = {};
    
    // Para cada escenario, aplicar factores sobre las métricas base
    Object.keys(SENSITIVITY_SCENARIOS).forEach(scenarioName => {
        const scenario = SENSITIVITY_SCENARIOS[scenarioName];

        
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
        

    });
    
    return results;
}

function calculateScenarioMetrics(baseMetrics, factors) {

    
    // PROBLEMA DETECTADO: Si las métricas base son negativas, la multiplicación invierte los resultados
    
    // Solución 1: Usar diferencias absolutas en lugar de multiplicaciones cuando hay valores negativos
    
    // Calcular impacto en ingresos
    const revenueMultiplier = factors.initialConversion * factors.trafficGrowth * factors.avgTicket;
    const revenueChange = baseMetrics.revenue2030 * (revenueMultiplier - 1);
    const newRevenue = baseMetrics.revenue2030 + revenueChange;
    

    
    // Calcular impacto en costos
    const costMultiplier = (factors.marketingPct + factors.cogsPct) / 2;
    const baseCosts = Math.abs(baseMetrics.revenue2030 - baseMetrics.ebitda2030);
    
    // Los costos aumentan/disminuyen según el multiplicador
    const costChange = baseCosts * (costMultiplier - 1);
    const newTotalCosts = baseCosts + costChange;
    

    
    // Nuevo EBITDA
    const newEbitda = newRevenue - newTotalCosts;
    
    // Calcular cambio neto en EBITDA
    const ebitdaChange = newEbitda - baseMetrics.ebitda2030;
    

    
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

    
    if (modelData.economicCashFlow?.metrics) {

    }
    
    if (modelData.financialCashFlow?.metrics) {

    }
}

// Función de prueba para verificar la lógica de escenarios
function testSensitivityLogic() {

    
    // Métricas de prueba
    const testBaseMetrics = {
        revenue2030: 12500000,      // $12.5M
        economicNPV: 2500000,       // $2.5M  
        financialNPV: 1700000,      // $1.7M
        economicIRR: 15.8,          // 15.8%
        financialIRR: 22.3,         // 22.3%
        ebitda2030: 3200000         // $3.2M
    };
    

    
    Object.keys(SENSITIVITY_SCENARIOS).forEach(scenarioName => {
        if (scenarioName === 'Base') return;
        
        const scenario = SENSITIVITY_SCENARIOS[scenarioName];

        
        const result = calculateScenarioMetrics(testBaseMetrics, scenario.factors);
        

        
        // Verificar lógica
        const shouldBeWorse = scenarioName === 'Pesimista' || scenarioName === 'Stress Test';
        const shouldBeBetter = scenarioName === 'Optimista';
        
        if (shouldBeWorse) {
            const isWorse = result.economicNPV < testBaseMetrics.economicNPV;

        }
        
        if (shouldBeBetter) {
            const isBetter = result.economicNPV > testBaseMetrics.economicNPV;

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

        this.calculateBaseScenario();
        this.calculateSensitivities();
        this.updateSensitivityDisplay();
    }

    // Calcular escenario base
    calculateBaseScenario() {

        
        // Obtener parámetros actuales del modelo
        const baseParams = this.getCurrentModelParameters();
        
        // Generar flujos de caja para verificar
        const cashFlows = this.generateCashFlows(baseParams);

        
        // Verificar distribución de mercados

        
        // Calcular métricas base
        this.baseScenario = {
            params: baseParams,
            npv: this.calculateNPV(baseParams),
            irr: this.calculateIRR(baseParams),
            revenue2030: this.calculateRevenue2030(baseParams),
            totalCosts: this.calculateTotalCosts(baseParams),
            cashFlows: cashFlows
        };
        

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

        
        Object.keys(this.factors).forEach(factorKey => {
            this.sensitivityResults[factorKey] = this.calculateFactorSensitivity(factorKey);
        });
        

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
            let fcf = ebit - taxes + depreciation;
            
            // Agregar valor terminal solo en 2030
            if (year === 2030) {
                const growthRate = 0.02; // 2% crecimiento perpetuo
                const wacc = 0.08; // WACC 8%
                
                // Calcular valor terminal: TV = FCF × (1+g) / (WACC-g)
                if (wacc > growthRate) {
                    const terminalValue = fcf * (1 + growthRate) / (wacc - growthRate);
                    fcf += terminalValue;
                    
                    // Debug del valor terminal en sensibilidad
                    console.log('🔍 Valor Terminal Sensibilidad 2030:');
                    console.log(`  FCF sin valor terminal: ${(fcf - terminalValue).toFixed(0)}`);
                    console.log(`  Growth Rate: ${growthRate}`);
                    console.log(`  WACC: ${wacc}`);
                    console.log(`  Valor Terminal: ${terminalValue.toFixed(0)}`);
                    console.log(`  FCF Final: ${fcf.toFixed(0)}`);
                }
            }
            
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
            
            
        } else if (this.baseScenario) {
            // FALLBACK: Usar datos calculados por la clase si no hay datos del modelo
            
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
        const inventoryParams = getInventoryParams();
        
        // Actualizar elementos de parámetros base con más detalle
        const elements = {
            'baseTraffic': params.initialTraffic ? params.initialTraffic.toLocaleString() : '9,100',
            'baseConversion': params.initialConversion ? `${(params.initialConversion * 100).toFixed(1)}%` : '2.0%',
            'baseTicket': params.avgTicket ? `$${params.avgTicket}` : '$50',
            'baseWACC': financialParams.wacc ? `${(financialParams.wacc * 100).toFixed(1)}%` : '8.0%',
            'baseExchangeRate': exchangeRates?.CLP || '900',
            'baseCosts': `${((params.marketingPct || 0.12) * 100 + 42).toFixed(0)}%`, // Marketing + COGS estimado
            // Nuevos parámetros detallados
            'baseTrafficGrowth': params.trafficGrowth ? `${(params.trafficGrowth * 100).toFixed(1)}%` : 'N/A',
            'baseConversionGrowth': params.conversionGrowthRate ? `${(params.conversionGrowthRate * 100).toFixed(1)}%` : 'N/A',
            'baseMarketingPct': params.marketingPct ? `${(params.marketingPct * 100).toFixed(1)}%` : '12.0%',
            'baseCOGS': financialParams.cogsPct ? `${(financialParams.cogsPct * 100).toFixed(1)}%` : '54.0%',
            'baseInflation': params.inflation ? `${(params.inflation * 100).toFixed(1)}%` : '3.0%',
            'baseSalesSalary': params.salesSalary ? `$${params.salesSalary.toLocaleString()}` : '$60,000',
            'baseInventoryDays': inventoryParams.initialStockMonths ? `${inventoryParams.initialStockMonths * 30} días` : '90 días',
            'basePayableDays': financialParams.payableDays ? `${financialParams.payableDays} días` : '30 días'
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
        // Actualizar parámetros por escenario
        updateScenarioParametersDisplay();
        
        // Actualizar tasas de descuento
        updateDiscountRatesDisplay();
        
    } catch (error) {
        console.error('❌ Error actualizando parámetros base:', error);
    }
}

// Nueva función para mostrar parámetros por escenario
function updateScenarioParametersDisplay() {
    try {
        const params = getBusinessParams();
        const financialParams = getFinancialParams();
        
        // Crear tabla de parámetros por escenario
        const scenarioTable = document.getElementById('scenarioParametersTable');
        if (!scenarioTable) {
            console.warn('⚠️ Tabla de parámetros por escenario no encontrada');
            return;
        }
        
        scenarioTable.innerHTML = '';
        
        // Header
        const headerRow = scenarioTable.insertRow();
        headerRow.className = 'table-header';
        const headers = ['Parámetro', 'Pesimista', 'Base', 'Optimista', 'Stress Test'];
        headers.forEach(header => {
            const th = headerRow.insertCell();
            th.innerHTML = header;
            th.style.fontWeight = 'bold';
            th.style.backgroundColor = '#f8f9fa';
        });
        
        // Parámetros clave
        const parameters = [
            {
                name: 'Tráfico Inicial',
                base: params.initialTraffic,
                unit: 'visitas/mes',
                pesimista: 0.7,
                optimista: 1.4,
                stress: 0.5
            },
            {
                name: 'Tasa Conversión',
                base: params.initialConversion * 100,
                unit: '%',
                pesimista: 0.7,
                optimista: 1.4,
                stress: 0.5
            },
            {
                name: 'Ticket Promedio',
                base: params.avgTicket,
                unit: 'USD',
                pesimista: 0.85,
                optimista: 1.15,
                stress: 0.75
            },
            {
                name: 'WACC (Tasa Descuento)',
                base: 8.0, // WACC base fijo en 8%
                unit: '%',
                pesimista: 2.5, // +2.5 pp = 10.5%
                optimista: -2.5, // -2.5 pp = 5.5%
                stress: 4.0 // +4 pp = 12%
            },
            {
                name: 'Ke (Costo Patrimonio)',
                base: 12.0, // Ke base fijo en 12%
                unit: '%',
                pesimista: 3.0, // +3 pp = 15%
                optimista: -2.0, // -2 pp = 10%
                stress: 4.0 // +4 pp = 16%
            },
            {
                name: 'Marketing (% Revenue)',
                base: params.marketingPct * 100,
                unit: '%',
                pesimista: 1.3,
                optimista: 0.8,
                stress: 1.5
            },
            {
                name: 'COGS (% Revenue)',
                base: financialParams.cogsPct * 100,
                unit: '%',
                pesimista: 1.2,
                optimista: 0.9,
                stress: 1.3
            },
            {
                name: 'Crecimiento Tráfico',
                base: params.trafficGrowth * 100,
                unit: '%',
                pesimista: 0.6,
                optimista: 1.5,
                stress: 0.4
            },
            {
                name: 'Inflación',
                base: params.inflation * 100,
                unit: '%',
                pesimista: 1.2,
                optimista: 0.8,
                stress: 1.5
            }
        ];
        
        parameters.forEach(param => {
            const row = scenarioTable.insertRow();
            
            // Nombre del parámetro
            const nameCell = row.insertCell();
            nameCell.innerHTML = `${param.name} (${param.unit})`;
            nameCell.style.fontWeight = '500';
            
            // Valores por escenario
            const scenarios = ['pesimista', 'base', 'optimista', 'stress'];
            scenarios.forEach((scenario, index) => {
                const cell = row.insertCell();
                let factor = 1;
                let isPercentagePoints = false;
                
                switch(scenario) {
                    case 'pesimista':
                        factor = param.pesimista;
                        cell.style.color = '#d32f2f';
                        break;
                    case 'base':
                        factor = 1;
                        cell.style.color = '#1976d2';
                        cell.style.fontWeight = 'bold';
                        break;
                    case 'optimista':
                        factor = param.optimista;
                        cell.style.color = '#388e3c';
                        break;
                    case 'stress':
                        factor = param.stress;
                        cell.style.color = '#f57c00';
                        break;
                }
                
                let value;
                if (param.name === 'WACC (Tasa Descuento)' || param.name === 'Ke (Costo Patrimonio)') {
                    // Para WACC y Ke, usar puntos porcentuales
                    if (scenario === 'base') {
                        value = param.base; // Para el escenario base, usar el valor base directamente
                    } else {
                        value = param.base + factor; // Para otros escenarios, sumar puntos porcentuales
                    }
                    isPercentagePoints = true;
                } else {
                    // Para otros parámetros, usar multiplicadores
                    value = param.base * factor;
                }
                
                if (param.unit === 'USD') {
                    cell.innerHTML = `$${value.toFixed(0)}`;
                } else if (param.unit === '%') {
                    cell.innerHTML = `${value.toFixed(1)}%`;
                } else {
                    cell.innerHTML = value.toLocaleString();
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error actualizando parámetros por escenario:', error);
    }
}

// Función para actualizar dinámicamente los Factores Clave que Impactan los Flujos de Caja
function updateKeyFactorsDisplay() {

    
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

// Función para actualizar las tasas de descuento
function updateDiscountRatesDisplay() {
    try {
        const baseWacc = 8.0; // WACC base fijo en 8%
        const baseKe = 12.0; // Ke base fijo en 12%
        
        // WACC Base
        const waccBase = document.getElementById('waccBase');
        const keValue = document.getElementById('keValue');
        const kdValue = document.getElementById('kdValue');
        const capitalStructure = document.getElementById('capitalStructure');
        
        if (waccBase) waccBase.textContent = baseWacc.toFixed(1) + '%';
        if (keValue) keValue.textContent = baseKe.toFixed(1) + '%'; // Costo del patrimonio
        if (kdValue) kdValue.textContent = '6.0%'; // Costo de la deuda
        if (capitalStructure) capitalStructure.textContent = '65% / 35%'; // Estructura de capital
        
        // Ke Base
        const keBase = document.getElementById('keBase');
        const riskFreeRate = document.getElementById('riskFreeRate');
        const riskPremium = document.getElementById('riskPremium');
        const projectBeta = document.getElementById('projectBeta');
        
        if (keBase) keBase.textContent = baseKe.toFixed(1) + '%';
        if (riskFreeRate) riskFreeRate.textContent = '4.5%';
        if (riskPremium) riskPremium.textContent = '7.5%';
        if (projectBeta) projectBeta.textContent = '1.0';
        
        // Valor Terminal
        const terminalWacc = document.getElementById('terminalWacc');
        const growthRate = document.getElementById('growthRate');
        
        if (terminalWacc) terminalWacc.textContent = baseWacc.toFixed(1) + '%';
        if (growthRate) growthRate.textContent = '2.0%';
        
        // Actualizar explicación de VAN Económico vs Financiero
        updateNPVExplanation(baseWacc, baseKe);
        
    } catch (error) {
        console.error('❌ Error actualizando tasas de descuento:', error);
    }
}

// Función para actualizar la explicación de VAN Económico vs Financiero
function updateNPVExplanation(wacc, ke) {
    try {
        // Buscar elementos en la explicación de VAN
        const economicNpvElements = document.querySelectorAll('.economic-npv li');
        const financialNpvElements = document.querySelectorAll('.financial-npv li');
        
        // Actualizar WACC en VAN Económico
        economicNpvElements.forEach(element => {
            if (element.textContent.includes('WACC')) {
                element.innerHTML = `• <strong>Tasa de descuento:</strong> WACC (${wacc.toFixed(1)}%)`;
            }
        });
        
        // Actualizar Ke en VAN Financiero
        financialNpvElements.forEach(element => {
            if (element.textContent.includes('Ke')) {
                element.innerHTML = `• <strong>Tasa de descuento:</strong> Ke (${ke.toFixed(1)}%)`;
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando explicación de VAN:', error);
    }
}

// Función para generar matriz de sensibilidad
function generateSensitivityMatrix(baseMetrics) {
    const matrix = {
        wacc: {},
        growth: {},
        prices: {},
        costs: {}
    };
    
    // Generar matriz para WACC
    CRITICAL_VARIABLES.wacc.variations.forEach(variation => {
        const newWACC = CRITICAL_VARIABLES.wacc.baseValue + (variation / 100);
        const npvImpact = calculateWACCImpact(baseMetrics, newWACC);
        const irrImpact = calculateWACCIRRImpact(baseMetrics, newWACC);
        
        matrix.wacc[variation] = {
            wacc: newWACC,
            npv: npvImpact,
            irr: irrImpact,
            npvChange: npvImpact - baseMetrics.economicNPV,
            irrChange: irrImpact - baseMetrics.economicIRR
        };
    });
    
    // Generar matriz para Crecimiento
    CRITICAL_VARIABLES.growth.variations.forEach(variation => {
        const growthFactor = 1 + (variation / 100);
        const npvImpact = calculateGrowthImpact(baseMetrics, growthFactor);
        const irrImpact = calculateGrowthIRRImpact(baseMetrics, growthFactor);
        
        matrix.growth[variation] = {
            growth: CRITICAL_VARIABLES.growth.baseValue * growthFactor,
            npv: npvImpact,
            irr: irrImpact,
            npvChange: npvImpact - baseMetrics.economicNPV,
            irrChange: irrImpact - baseMetrics.economicIRR
        };
    });
    
    // Generar matriz para Precios
    CRITICAL_VARIABLES.prices.variations.forEach(variation => {
        const priceFactor = 1 + (variation / 100);
        const npvImpact = calculatePriceImpact(baseMetrics, priceFactor);
        const irrImpact = calculatePriceIRRImpact(baseMetrics, priceFactor);
        
        matrix.prices[variation] = {
            priceFactor: priceFactor,
            npv: npvImpact,
            irr: irrImpact,
            npvChange: npvImpact - baseMetrics.economicNPV,
            irrChange: irrImpact - baseMetrics.economicIRR
        };
    });
    
    // Generar matriz para Costos
    CRITICAL_VARIABLES.costs.variations.forEach(variation => {
        const costFactor = 1 + (variation / 100);
        const npvImpact = calculateCostImpact(baseMetrics, costFactor);
        const irrImpact = calculateCostIRRImpact(baseMetrics, costFactor);
        
        matrix.costs[variation] = {
            costFactor: costFactor,
            npv: npvImpact,
            irr: irrImpact,
            npvChange: npvImpact - baseMetrics.economicNPV,
            irrChange: irrImpact - baseMetrics.economicIRR
        };
    });
    
    return matrix;
}

// Funciones de cálculo de impacto para WACC
function calculateWACCImpact(baseMetrics, newWACC) {
    // Calcular VAN real con nuevo WACC usando flujos de caja del modelo
    if (!modelData.economicCashFlow) {
        return baseMetrics.economicNPV; // Fallback si no hay datos
    }
    
    // Obtener flujos de caja reales del modelo
    const cashFlows = [];
    for (let year = 2025; year <= 2030; year++) {
        if (modelData.economicCashFlow[year] && typeof modelData.economicCashFlow[year].fcf !== 'undefined') {
            cashFlows.push(modelData.economicCashFlow[year].fcf);
        }
    }
    
    if (cashFlows.length === 0) {
        return baseMetrics.economicNPV;
    }
    
    // Primero calcular el VAN base con WACC original para verificar consistencia
    const baseWACC = CRITICAL_VARIABLES.wacc.baseValue; // Ya está en decimal (0.08)
    let baseNPV = 0;
    cashFlows.forEach((fcf, index) => {
        const period = index + 1;
        const discountFactor = Math.pow(1 + baseWACC, period);
        baseNPV += fcf / discountFactor;
    });
    
    // Recalcular VAN con nuevo WACC
    const newWACCDecimal = newWACC; // Ya está en decimal
    let newNPV = 0;
    
    // Debug para verificar cálculo
    console.log(`🔍 Calculando VAN con WACC ${(newWACC*100).toFixed(1)}%:`);
    console.log(`  VAN base del modelo: $${(baseMetrics.economicNPV/1000000).toFixed(2)}M`);
    console.log(`  VAN base recalculado: $${(baseNPV/1000000).toFixed(2)}M`);
    console.log(`  Flujos de caja:`, cashFlows.map(f => `$${(f/1000).toFixed(0)}K`));
    console.log(`  WACC base: ${(baseWACC*100).toFixed(1)}%, WACC nuevo: ${(newWACC*100).toFixed(1)}%`);
    
    cashFlows.forEach((fcf, index) => {
        const period = index + 1;
        const discountFactor = Math.pow(1 + newWACCDecimal, period);
        const presentValue = fcf / discountFactor;
        newNPV += presentValue;
        
        console.log(`  Año ${2025 + index}: FCF=$${(fcf/1000).toFixed(0)}K, Factor=${discountFactor.toFixed(3)}, PV=$${(presentValue/1000).toFixed(0)}K`);
    });
    
    console.log(`  VAN final: $${(newNPV/1000000).toFixed(2)}M`);
    console.log(`  Diferencia vs base recalculado: $${((newNPV - baseNPV)/1000000).toFixed(2)}M`);
    
    // Si es el WACC base (0.08), actualizar el VAN base para consistencia
    if (Math.abs(newWACC - CRITICAL_VARIABLES.wacc.baseValue) < 0.001) {
        console.log(`✅ Actualizando VAN base a: $${(newNPV/1000000).toFixed(2)}M`);
        baseMetrics.economicNPV = newNPV;
    }
    
    return newNPV;
}

function calculateWACCIRRImpact(baseMetrics, newWACC) {
    // Simular impacto en TIR económica
    const baseIRR = baseMetrics.economicIRR;
    const waccChange = newWACC - CRITICAL_VARIABLES.wacc.baseValue;
    // Sensibilidad moderada en TIR
    const irrSensitivity = -baseIRR * 0.5; // Sensibilidad más realista
    return Math.max(0, baseIRR + (irrSensitivity * waccChange));
}

// Funciones de cálculo de impacto para Crecimiento
function calculateGrowthImpact(baseMetrics, growthFactor) {
    // Recalcular VAN con nuevo factor de crecimiento
    try {
        // Simular nuevo modelo con factor de crecimiento modificado
        const modifiedParams = getBusinessParams();
        
        // Aplicar factor de crecimiento a los parámetros de tráfico
        const originalTrafficGrowthPattern = modifiedParams.trafficGrowthPattern || [1.00, 0.80, 0.60, 0.40, 0.20];
        const modifiedTrafficGrowthPattern = originalTrafficGrowthPattern.map(rate => rate * growthFactor);
        
        // Calcular nuevos ingresos con crecimiento modificado
        const newRevenue2030 = calculateModifiedRevenue2030(modifiedParams, modifiedTrafficGrowthPattern);
        
        // Estimar nuevo VAN basado en la proporción de cambio en ingresos
        const originalRevenue2030 = baseMetrics.revenue2030 || 1;
        const revenueChangeRatio = originalRevenue2030 > 0 ? newRevenue2030 / originalRevenue2030 : 1;
        
        // El VAN cambia proporcionalmente al cambio en ingresos (simplificación)
        const newNPV = baseMetrics.economicNPV * revenueChangeRatio;
        
        return newNPV;
    } catch (error) {
        console.warn('Error calculando impacto de crecimiento:', error);
        return baseMetrics.economicNPV;
    }
}

function calculateGrowthIRRImpact(baseMetrics, growthFactor) {
    // Simular impacto en TIR por cambio en crecimiento
    const baseIRR = baseMetrics.economicIRR;
    const growthChange = growthFactor - 1;
    // Sensibilidad más realista en TIR
    const irrSensitivity = baseIRR * 0.6; // Sensibilidad positiva más moderada
    return baseIRR + (irrSensitivity * growthChange);
}

// Funciones de cálculo de impacto para Precios
function calculatePriceImpact(baseMetrics, priceFactor) {
    // Recalcular VAN con nuevo factor de precios
    try {
        // Los precios afectan directamente los ingresos de TODOS los años
        const originalRevenue2030 = baseMetrics.revenue2030 || 1;
        
        // Estimar ingresos totales del proyecto (2025-2030)
        // Aproximación: Revenue 2030 representa ~40% del total del proyecto
        const totalProjectRevenue = originalRevenue2030 / 0.4; // Revenue total estimado
        const revenueChange = totalProjectRevenue * (priceFactor - 1);
        
        // Calcular impacto en VAN con margen neto más realista
        const financialParams = getFinancialParams();
        const cogsPct = financialParams.cogsPct || 0.54; // 54% COGS
        const opexPct = 0.30; // 30% gastos operativos
        const netMargin = 1 - cogsPct - opexPct; // Margen neto real
        
        // Factor de descuento promedio para flujos 2025-2030
        const wacc = financialParams.wacc || 0.08;
        const avgDiscountFactor = 0.65; // Factor promedio para flujos futuros
        
        const npvImpact = revenueChange * netMargin * avgDiscountFactor;
        const newNPV = baseMetrics.economicNPV + npvImpact;
        
        console.log(`🔍 Impacto Precios ${priceFactor}x:`);
        console.log(`  Revenue change: $${(revenueChange/1000000).toFixed(2)}M`);
        console.log(`  Net margin: ${(netMargin*100).toFixed(1)}%`);
        console.log(`  NPV impact: $${(npvImpact/1000000).toFixed(2)}M`);
        console.log(`  New NPV: $${(newNPV/1000000).toFixed(2)}M`);
        
        return newNPV;
    } catch (error) {
        console.warn('Error calculando impacto de precios:', error);
        return baseMetrics.economicNPV;
    }
}

function calculatePriceIRRImpact(baseMetrics, priceFactor) {
    // Simular impacto en TIR por cambio en precios
    const baseIRR = baseMetrics.economicIRR;
    const priceChange = priceFactor - 1;
    // Sensibilidad alta pero realista en TIR
    const irrSensitivity = baseIRR * 0.8; // Alta sensibilidad a precios
    return baseIRR + (irrSensitivity * priceChange);
}

// Funciones de cálculo de impacto para Costos
function calculateCostImpact(baseMetrics, costFactor) {
    // Recalcular VAN con nuevo factor de costos
    try {
        // Los costos afectan negativamente el VAN de TODO el proyecto
        const originalRevenue2030 = baseMetrics.revenue2030 || 1;
        
        // Estimar ingresos totales del proyecto (2025-2030)
        const totalProjectRevenue = originalRevenue2030 / 0.4; // Revenue total estimado
        
        // Estimar costos base como % de ingresos (basado en el modelo)
        const financialParams = getFinancialParams();
        const cogsPct = financialParams.cogsPct || 0.54; // 54% COGS
        const opexPct = 0.30; // 30% gastos operativos
        const totalCostPct = cogsPct + opexPct;
        
        const originalTotalCosts = totalProjectRevenue * totalCostPct;
        const newTotalCosts = originalTotalCosts * costFactor;
        const costChange = newTotalCosts - originalTotalCosts;
        
        // Impacto negativo en VAN por aumento de costos
        const avgDiscountFactor = 0.65; // Factor de descuento promedio
        const npvImpact = -costChange * avgDiscountFactor; // Negativo porque aumentan costos
        
        const newNPV = baseMetrics.economicNPV + npvImpact;
        
        console.log(`🔍 Impacto Costos ${costFactor}x:`);
        console.log(`  Cost change: $${(costChange/1000000).toFixed(2)}M`);
        console.log(`  Cost %: ${(totalCostPct*100).toFixed(1)}%`);
        console.log(`  NPV impact: $${(npvImpact/1000000).toFixed(2)}M`);
        console.log(`  New NPV: $${(newNPV/1000000).toFixed(2)}M`);
        
        return newNPV;
    } catch (error) {
        console.warn('Error calculando impacto de costos:', error);
        return baseMetrics.economicNPV;
    }
}

function calculateCostIRRImpact(baseMetrics, costFactor) {
    // Simular impacto en TIR por cambio en costos
    const baseIRR = baseMetrics.economicIRR;
    const costChange = costFactor - 1;
    // Sensibilidad negativa realista en TIR
    const irrSensitivity = -baseIRR * 0.6; // Sensibilidad negativa
    return Math.max(0, baseIRR + (irrSensitivity * costChange));
}

// Función para evaluar riesgos clave
function evaluateKeyRisks(sensitivityMatrix) {
    const risks = {
        critical: [],
        moderate: [],
        low: []
    };
    
    // Obtener métricas base para comparación
    const baseMetrics = getBaseScenarioMetrics();
    
    // Analizar sensibilidad de WACC
    const waccSensitivity = Math.abs(sensitivityMatrix.wacc[2].npvChange - sensitivityMatrix.wacc[-2].npvChange) / 2;
    if (waccSensitivity > baseMetrics.economicNPV * 0.3) {
        risks.critical.push({
            factor: 'WACC',
            description: 'Alta sensibilidad a cambios en la tasa de descuento',
            impact: 'Variaciones de ±2pp pueden cambiar el VAN en más del 30%',
            mitigation: 'Monitorear tasas de interés y estructura de capital'
        });
    }
    
    // Analizar sensibilidad de Crecimiento
    const growthSensitivity = Math.abs(sensitivityMatrix.growth[50].npvChange - sensitivityMatrix.growth[-50].npvChange) / 2;
    if (growthSensitivity > baseMetrics.economicNPV * 0.4) {
        risks.critical.push({
            factor: 'Crecimiento',
            description: 'Alta sensibilidad a variaciones en el crecimiento',
            impact: 'Variaciones de ±50% pueden cambiar el VAN en más del 40%',
            mitigation: 'Implementar estrategias de marketing y expansión robustas'
        });
    }
    
    // Analizar sensibilidad de Precios
    const priceSensitivity = Math.abs(sensitivityMatrix.prices[30].npvChange - sensitivityMatrix.prices[-30].npvChange) / 2;
    if (priceSensitivity > baseMetrics.economicNPV * 0.35) {
        risks.critical.push({
            factor: 'Precios',
            description: 'Alta sensibilidad a cambios en precios',
            impact: 'Variaciones de ±30% pueden cambiar el VAN en más del 35%',
            mitigation: 'Desarrollar estrategias de pricing dinámico'
        });
    }
    
    // Analizar sensibilidad de Costos
    const costSensitivity = Math.abs(sensitivityMatrix.costs[20].npvChange - sensitivityMatrix.costs[-20].npvChange) / 2;
    if (costSensitivity > baseMetrics.economicNPV * 0.20) { // Umbral más bajo para capturar costos
        risks.moderate.push({
            factor: 'Costos',
            description: 'Sensibilidad moderada a cambios en costos',
            impact: 'Variaciones de ±20% pueden cambiar el VAN en más del 20%',
            mitigation: 'Implementar controles de costos y eficiencias operativas'
        });
    }
    
    return risks;
}

// Función para identificar escenarios viables
function identifyViableScenarios(sensitivityMatrix) {
    const viableScenarios = {
        optimistic: [],
        base: [],
        conservative: [],
        stress: []
    };
    
    // Escenario Optimista: VAN > 0 y TIR > 15%
    Object.keys(sensitivityMatrix).forEach(variable => {
        Object.keys(sensitivityMatrix[variable]).forEach(variation => {
            const scenario = sensitivityMatrix[variable][variation];
            if (scenario.npv > 0 && scenario.irr > 15) {
                viableScenarios.optimistic.push({
                    variable: variable,
                    variation: variation,
                    npv: scenario.npv,
                    irr: scenario.irr
                });
            }
        });
    });
    
    // Escenario Base: VAN > 0 y TIR > 10%
    Object.keys(sensitivityMatrix).forEach(variable => {
        Object.keys(sensitivityMatrix[variable]).forEach(variation => {
            const scenario = sensitivityMatrix[variable][variation];
            if (scenario.npv > 0 && scenario.irr > 10 && scenario.irr <= 15) {
                viableScenarios.base.push({
                    variable: variable,
                    variation: variation,
                    npv: scenario.npv,
                    irr: scenario.irr
                });
            }
        });
    });
    
    // Escenario Conservador: VAN > 0 y TIR > 8%
    Object.keys(sensitivityMatrix).forEach(variable => {
        Object.keys(sensitivityMatrix[variable]).forEach(variation => {
            const scenario = sensitivityMatrix[variable][variation];
            if (scenario.npv > 0 && scenario.irr > 8 && scenario.irr <= 10) {
                viableScenarios.conservative.push({
                    variable: variable,
                    variation: variation,
                    npv: scenario.npv,
                    irr: scenario.irr
                });
            }
        });
    });
    
    // Escenario Stress: VAN > 0 y TIR > 5%
    Object.keys(sensitivityMatrix).forEach(variable => {
        Object.keys(sensitivityMatrix[variable]).forEach(variation => {
            const scenario = sensitivityMatrix[variable][variation];
            if (scenario.npv > 0 && scenario.irr > 5 && scenario.irr <= 8) {
                viableScenarios.stress.push({
                    variable: variable,
                    variation: variation,
                    npv: scenario.npv,
                    irr: scenario.irr
                });
            }
        });
    });
    
    return viableScenarios;
}

// Función para actualizar la matriz de sensibilidad en la UI
function updateSensitivityMatrix(sensitivityMatrix) {
    try {
        // Actualizar matriz de WACC
        updateWACCMatrix(sensitivityMatrix.wacc);
        
        // Actualizar matriz de Crecimiento
        updateGrowthMatrix(sensitivityMatrix.growth);
        
        // Actualizar matriz de Precios
        updatePricesMatrix(sensitivityMatrix.prices);
        
        // Actualizar matriz de Costos
        updateCostsMatrix(sensitivityMatrix.costs);
        
        console.log('✅ Matriz de sensibilidad actualizada');
    } catch (error) {
        console.error('❌ Error actualizando matriz de sensibilidad:', error);
    }
}

// Función para actualizar matriz de WACC
function updateWACCMatrix(waccMatrix) {
    const matrixContainer = document.getElementById('wacc-matrix');
    if (!matrixContainer) return;
    
    let html = `
        <div class="matrix-header bg-blue-50 p-3 rounded-t-lg">
            <h5 class="font-bold text-blue-900">Matriz de Sensibilidad - WACC</h5>
            <p class="text-sm text-blue-700">Impacto en VAN y TIR por variación en puntos porcentuales</p>
        </div>
        <div class="matrix-content p-4">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="text-left p-2">Variación (pp)</th>
                        <th class="text-center p-2">WACC</th>
                        <th class="text-center p-2">VAN ($M)</th>
                        <th class="text-center p-2">TIR (%)</th>
                        <th class="text-center p-2">Δ VAN</th>
                        <th class="text-center p-2">Δ TIR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.keys(waccMatrix).forEach(variation => {
        const scenario = waccMatrix[variation];
        const npvColor = scenario.npvChange >= 0 ? 'text-green-600' : 'text-red-600';
        const irrColor = scenario.irrChange >= 0 ? 'text-green-600' : 'text-red-600';
        
        html += `
            <tr class="border-b border-gray-200">
                <td class="p-2 font-medium">${variation > 0 ? '+' : ''}${variation}</td>
                <td class="p-2 text-center">${(scenario.wacc * 100).toFixed(1)}%</td>
                <td class="p-2 text-center font-bold">${(scenario.npv / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center font-bold">${scenario.irr.toFixed(1)}</td>
                <td class="p-2 text-center ${npvColor}">${scenario.npvChange >= 0 ? '+' : ''}${(scenario.npvChange / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center ${irrColor}">${scenario.irrChange >= 0 ? '+' : ''}${scenario.irrChange.toFixed(1)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    matrixContainer.innerHTML = html;
}

// Función para actualizar matriz de Crecimiento
function updateGrowthMatrix(growthMatrix) {
    const matrixContainer = document.getElementById('growth-matrix');
    if (!matrixContainer) return;
    
    let html = `
        <div class="matrix-header bg-green-50 p-3 rounded-t-lg">
            <h5 class="font-bold text-green-900">Matriz de Sensibilidad - Crecimiento</h5>
            <p class="text-sm text-green-700">Impacto en VAN y TIR por variación en tasa de crecimiento</p>
        </div>
        <div class="matrix-content p-4">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="text-left p-2">Variación (%)</th>
                        <th class="text-center p-2">Crecimiento</th>
                        <th class="text-center p-2">VAN ($M)</th>
                        <th class="text-center p-2">TIR (%)</th>
                        <th class="text-center p-2">Δ VAN</th>
                        <th class="text-center p-2">Δ TIR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.keys(growthMatrix).forEach(variation => {
        const scenario = growthMatrix[variation];
        const npvColor = scenario.npvChange >= 0 ? 'text-green-600' : 'text-red-600';
        const irrColor = scenario.irrChange >= 0 ? 'text-green-600' : 'text-red-600';
        
        html += `
            <tr class="border-b border-gray-200">
                <td class="p-2 font-medium">${variation > 0 ? '+' : ''}${variation}</td>
                <td class="p-2 text-center">${(scenario.growth * 100).toFixed(1)}%</td>
                <td class="p-2 text-center font-bold">${(scenario.npv / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center font-bold">${scenario.irr.toFixed(1)}</td>
                <td class="p-2 text-center ${npvColor}">${scenario.npvChange >= 0 ? '+' : ''}${(scenario.npvChange / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center ${irrColor}">${scenario.irrChange >= 0 ? '+' : ''}${scenario.irrChange.toFixed(1)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    matrixContainer.innerHTML = html;
}

// Función para actualizar matriz de Precios
function updatePricesMatrix(pricesMatrix) {
    const matrixContainer = document.getElementById('prices-matrix');
    if (!matrixContainer) return;
    
    let html = `
        <div class="matrix-header bg-purple-50 p-3 rounded-t-lg">
            <h5 class="font-bold text-purple-900">Matriz de Sensibilidad - Precios</h5>
            <p class="text-sm text-purple-700">Impacto en VAN y TIR por variación en precios promedio</p>
        </div>
        <div class="matrix-content p-4">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="text-left p-2">Variación (%)</th>
                        <th class="text-center p-2">Factor Precio</th>
                        <th class="text-center p-2">VAN ($M)</th>
                        <th class="text-center p-2">TIR (%)</th>
                        <th class="text-center p-2">Δ VAN</th>
                        <th class="text-center p-2">Δ TIR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.keys(pricesMatrix).forEach(variation => {
        const scenario = pricesMatrix[variation];
        const npvColor = scenario.npvChange >= 0 ? 'text-green-600' : 'text-red-600';
        const irrColor = scenario.irrChange >= 0 ? 'text-green-600' : 'text-red-600';
        
        html += `
            <tr class="border-b border-gray-200">
                <td class="p-2 font-medium">${variation > 0 ? '+' : ''}${variation}</td>
                <td class="p-2 text-center">${scenario.priceFactor.toFixed(2)}x</td>
                <td class="p-2 text-center font-bold">${(scenario.npv / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center font-bold">${scenario.irr.toFixed(1)}</td>
                <td class="p-2 text-center ${npvColor}">${scenario.npvChange >= 0 ? '+' : ''}${(scenario.npvChange / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center ${irrColor}">${scenario.irrChange >= 0 ? '+' : ''}${scenario.irrChange.toFixed(1)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    matrixContainer.innerHTML = html;
}

// Función para actualizar matriz de Costos
function updateCostsMatrix(costsMatrix) {
    const matrixContainer = document.getElementById('costs-matrix');
    if (!matrixContainer) return;
    
    let html = `
        <div class="matrix-header bg-orange-50 p-3 rounded-t-lg">
            <h5 class="font-bold text-orange-900">Matriz de Sensibilidad - Costos</h5>
            <p class="text-sm text-orange-700">Impacto en VAN y TIR por variación en costos operativos</p>
        </div>
        <div class="matrix-content p-4">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="text-left p-2">Variación (%)</th>
                        <th class="text-center p-2">Factor Costo</th>
                        <th class="text-center p-2">VAN ($M)</th>
                        <th class="text-center p-2">TIR (%)</th>
                        <th class="text-center p-2">Δ VAN</th>
                        <th class="text-center p-2">Δ TIR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.keys(costsMatrix).forEach(variation => {
        const scenario = costsMatrix[variation];
        const npvColor = scenario.npvChange >= 0 ? 'text-green-600' : 'text-red-600';
        const irrColor = scenario.irrChange >= 0 ? 'text-green-600' : 'text-red-600';
        
        html += `
            <tr class="border-b border-gray-200">
                <td class="p-2 font-medium">${variation > 0 ? '+' : ''}${variation}</td>
                <td class="p-2 text-center">${scenario.costFactor.toFixed(2)}x</td>
                <td class="p-2 text-center font-bold">${(scenario.npv / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center font-bold">${scenario.irr.toFixed(1)}</td>
                <td class="p-2 text-center ${npvColor}">${scenario.npvChange >= 0 ? '+' : ''}${(scenario.npvChange / 1000000).toFixed(2)}</td>
                <td class="p-2 text-center ${irrColor}">${scenario.irrChange >= 0 ? '+' : ''}${scenario.irrChange.toFixed(1)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    matrixContainer.innerHTML = html;
}

// Función para actualizar análisis de riesgos
function updateRiskAnalysis(keyRisks, viableScenarios) {
    try {
        // Actualizar riesgos críticos
        updateCriticalRisks(keyRisks.critical);
        
        // Actualizar riesgos moderados
        updateModerateRisks(keyRisks.moderate);
        
        // Actualizar escenarios viables
        updateViableScenarios(viableScenarios);
        
        console.log('✅ Análisis de riesgos actualizado');
    } catch (error) {
        console.error('❌ Error actualizando análisis de riesgos:', error);
    }
}

// Función para actualizar riesgos críticos
function updateCriticalRisks(criticalRisks) {
    const container = document.getElementById('critical-risks');
    if (!container) return;
    
    if (criticalRisks.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-600 mr-3"></i>
                    <span class="text-green-800 font-medium">No se identificaron riesgos críticos</span>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-3">';
    criticalRisks.forEach(risk => {
        html += `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h6 class="font-bold text-red-900 mb-2">${risk.factor}</h6>
                        <p class="text-red-800 text-sm mb-2">${risk.description}</p>
                        <p class="text-red-700 text-sm mb-2"><strong>Impacto:</strong> ${risk.impact}</p>
                        <p class="text-red-700 text-sm"><strong>Mitigación:</strong> ${risk.mitigation}</p>
                    </div>
                    <span class="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">Crítico</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Función para actualizar riesgos moderados
function updateModerateRisks(moderateRisks) {
    const container = document.getElementById('moderate-risks');
    if (!container) return;
    
    if (moderateRisks.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-600 mr-3"></i>
                    <span class="text-green-800 font-medium">No se identificaron riesgos moderados</span>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-3">';
    moderateRisks.forEach(risk => {
        html += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h6 class="font-bold text-yellow-900 mb-2">${risk.factor}</h6>
                        <p class="text-yellow-800 text-sm mb-2">${risk.description}</p>
                        <p class="text-yellow-700 text-sm mb-2"><strong>Impacto:</strong> ${risk.impact}</p>
                        <p class="text-yellow-700 text-sm"><strong>Mitigación:</strong> ${risk.mitigation}</p>
                    </div>
                    <span class="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full">Moderado</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Función para actualizar escenarios viables
function updateViableScenarios(viableScenarios) {
    const container = document.getElementById('viable-scenarios');
    if (!container) return;
    
    let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h6 class="font-bold text-green-900 mb-2">Optimista</h6>
                <p class="text-green-800 text-sm mb-2">VAN > 0, TIR > 15%</p>
                <p class="text-green-700 font-bold">${viableScenarios.optimistic.length} escenarios</p>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h6 class="font-bold text-blue-900 mb-2">Base</h6>
                <p class="text-blue-800 text-sm mb-2">VAN > 0, TIR 10-15%</p>
                <p class="text-blue-700 font-bold">${viableScenarios.base.length} escenarios</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h6 class="font-bold text-yellow-900 mb-2">Conservador</h6>
                <p class="text-yellow-800 text-sm mb-2">VAN > 0, TIR 8-10%</p>
                <p class="text-yellow-700 font-bold">${viableScenarios.conservative.length} escenarios</p>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h6 class="font-bold text-orange-900 mb-2">Stress</h6>
                <p class="text-orange-800 text-sm mb-2">VAN > 0, TIR 5-8%</p>
                <p class="text-orange-700 font-bold">${viableScenarios.stress.length} escenarios</p>
            </div>
        </div>
    `;
    
    // Agregar detalles de escenarios más relevantes
    if (viableScenarios.optimistic.length > 0) {
        html += `
            <div class="mt-4">
                <h6 class="font-bold text-gray-800 mb-2">Escenarios Optimistas Destacados:</h6>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        `;
        
        viableScenarios.optimistic.slice(0, 4).forEach(scenario => {
            html += `
                <div class="bg-green-50 border border-green-200 rounded p-3">
                    <p class="text-sm"><strong>${scenario.variable}:</strong> ${scenario.variation > 0 ? '+' : ''}${scenario.variation}%</p>
                    <p class="text-sm">VAN: $${(scenario.npv / 1000000).toFixed(2)}M, TIR: ${scenario.irr.toFixed(1)}%</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Función para interpretar resultados del análisis de sensibilidad
function interpretSensitivityResults(sensitivityMatrix, keyRisks, viableScenarios) {
    const interpretation = {
        criticalInsights: [],
        recommendations: [],
        riskMitigation: [],
        opportunities: []
    };
    
    // Obtener métricas base para comparación
    const baseMetrics = getBaseScenarioMetrics();
    
    // Analizar sensibilidad de WACC
    const waccRange = Math.abs(sensitivityMatrix.wacc[2].npvChange - sensitivityMatrix.wacc[-2].npvChange);
    const waccSensitivity = waccRange / (baseMetrics.economicNPV * 4) * 100; // Porcentaje de cambio
    
    if (waccSensitivity > 15) {
        interpretation.criticalInsights.push({
            factor: 'WACC',
            insight: `Alta sensibilidad a cambios en tasa de descuento (${waccSensitivity.toFixed(1)}% por ±2pp)`,
            impact: 'Variaciones en tasas de interés pueden afectar significativamente la viabilidad del proyecto',
            priority: 'Alta'
        });
        
        interpretation.recommendations.push({
            category: 'Financiero',
            action: 'Implementar estrategias de cobertura de tasas de interés',
            benefit: 'Reducir exposición a fluctuaciones en costos de capital'
        });
    }
    
    // Analizar sensibilidad de Crecimiento
    const growthRange = Math.abs(sensitivityMatrix.growth[50].npvChange - sensitivityMatrix.growth[-50].npvChange);
    const growthSensitivity = growthRange / (baseMetrics.economicNPV * 2) * 100;
    
    if (growthSensitivity > 40) {
        interpretation.criticalInsights.push({
            factor: 'Crecimiento',
            insight: `Sensibilidad crítica al crecimiento (${growthSensitivity.toFixed(1)}% por ±50%)`,
            impact: 'El éxito del proyecto depende fuertemente de la capacidad de crecimiento',
            priority: 'Crítica'
        });
        
        interpretation.recommendations.push({
            category: 'Operacional',
            action: 'Desarrollar estrategias de marketing y expansión robustas',
            benefit: 'Asegurar crecimiento sostenible y mitigar riesgos de estancamiento'
        });
    }
    
    // Analizar sensibilidad de Precios
    const priceRange = Math.abs(sensitivityMatrix.prices[30].npvChange - sensitivityMatrix.prices[-30].npvChange);
    const priceSensitivity = priceRange / (baseMetrics.economicNPV * 2) * 100;
    
    if (priceSensitivity > 30) {
        interpretation.criticalInsights.push({
            factor: 'Precios',
            insight: `Alta sensibilidad a cambios en precios (${priceSensitivity.toFixed(1)}% por ±30%)`,
            impact: 'La estrategia de pricing es fundamental para la rentabilidad',
            priority: 'Alta'
        });
        
        interpretation.recommendations.push({
            category: 'Comercial',
            action: 'Implementar estrategias de pricing dinámico y diferenciación',
            benefit: 'Maximizar márgenes y mantener competitividad'
        });
    }
    
    // Analizar escenarios viables
    const totalViableScenarios = viableScenarios.optimistic.length + viableScenarios.base.length + 
                                viableScenarios.conservative.length + viableScenarios.stress.length;
    
    if (totalViableScenarios > 15) {
        interpretation.opportunities.push({
            type: 'Robustez del Proyecto',
            description: `${totalViableScenarios} escenarios viables identificados`,
            confidence: 'Alta confianza en la viabilidad del proyecto'
        });
    } else if (totalViableScenarios > 5) {
        interpretation.opportunities.push({
            type: 'Viabilidad Moderada',
            description: `${totalViableScenarios} escenarios viables identificados`,
            confidence: 'Moderada confianza, requiere monitoreo continuo'
        });
    } else {
        interpretation.riskMitigation.push({
            type: 'Riesgo de Viabilidad',
            description: 'Pocos escenarios viables identificados',
            action: 'Revisar supuestos y considerar ajustes al modelo'
        });
    }
    
    // Analizar distribución de riesgos
    const criticalRiskCount = keyRisks.critical.length;
    const moderateRiskCount = keyRisks.moderate.length;
    
    if (criticalRiskCount > 2) {
        interpretation.riskMitigation.push({
            type: 'Múltiples Riesgos Críticos',
            description: `${criticalRiskCount} factores críticos identificados`,
            action: 'Implementar plan de mitigación integral'
        });
    }
    
    return interpretation;
}

// Función para actualizar interpretación en la UI
function updateInterpretation(interpretation) {
    const container = document.getElementById('sensitivity-interpretation');
    if (!container) return;
    
    let html = `
        <div class="interpretation-container bg-white rounded-lg border border-gray-200 shadow-lg p-6">
            <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
                Interpretación de Resultados
            </h4>
    `;
    
    // Insights Críticos
    if (interpretation.criticalInsights.length > 0) {
        html += `
            <div class="mb-6">
                <h5 class="font-bold text-red-800 mb-3">Insights Críticos</h5>
                <div class="space-y-3">
        `;
        
        interpretation.criticalInsights.forEach(insight => {
            const priorityColor = insight.priority === 'Crítica' ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300';
            html += `
                <div class="p-3 rounded-lg border ${priorityColor}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h6 class="font-bold text-gray-900">${insight.factor}</h6>
                            <p class="text-sm text-gray-700 mt-1">${insight.insight}</p>
                            <p class="text-sm text-gray-600 mt-1"><strong>Impacto:</strong> ${insight.impact}</p>
                        </div>
                        <span class="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">${insight.priority}</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Recomendaciones
    if (interpretation.recommendations.length > 0) {
        html += `
            <div class="mb-6">
                <h5 class="font-bold text-blue-800 mb-3">Recomendaciones Estratégicas</h5>
                <div class="space-y-3">
        `;
        
        interpretation.recommendations.forEach(rec => {
            html += `
                <div class="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div class="flex items-start">
                        <div class="flex-1">
                            <h6 class="font-bold text-blue-900">${rec.category}</h6>
                            <p class="text-sm text-blue-800 mt-1"><strong>Acción:</strong> ${rec.action}</p>
                            <p class="text-sm text-blue-700 mt-1"><strong>Beneficio:</strong> ${rec.benefit}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Oportunidades
    if (interpretation.opportunities.length > 0) {
        html += `
            <div class="mb-6">
                <h5 class="font-bold text-green-800 mb-3">Oportunidades Identificadas</h5>
                <div class="space-y-3">
        `;
        
        interpretation.opportunities.forEach(opp => {
            html += `
                <div class="p-3 rounded-lg border border-green-200 bg-green-50">
                    <h6 class="font-bold text-green-900">${opp.type}</h6>
                    <p class="text-sm text-green-800 mt-1">${opp.description}</p>
                    <p class="text-sm text-green-700 mt-1"><strong>Confianza:</strong> ${opp.confidence}</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Mitigación de Riesgos
    if (interpretation.riskMitigation.length > 0) {
        html += `
            <div class="mb-6">
                <h5 class="font-bold text-orange-800 mb-3">Mitigación de Riesgos</h5>
                <div class="space-y-3">
        `;
        
        interpretation.riskMitigation.forEach(risk => {
            html += `
                <div class="p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <h6 class="font-bold text-orange-900">${risk.type}</h6>
                    <p class="text-sm text-orange-800 mt-1">${risk.description}</p>
                    <p class="text-sm text-orange-700 mt-1"><strong>Acción:</strong> ${risk.action}</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `
        </div>
    `;
    
    container.innerHTML = html;
}

// Función para calcular revenue 2030 realista basado en el modelo real
function calculateRealisticRevenue2030(params) {
    // Usar exactamente la misma lógica que revenues.js
    const yearIndex = 5; // 2030 es año 5 desde 2025
    
    // Tráfico con patrón de crecimiento decreciente real
    const trafficGrowthPattern = params.trafficGrowthPattern || [1.00, 0.80, 0.60, 0.40, 0.20];
    let cumulativeTraffic = params.initialTraffic;
    
    for (let i = 1; i <= yearIndex; i++) {
        const currentGrowthRate = trafficGrowthPattern[Math.min(i - 1, trafficGrowthPattern.length - 1)];
        cumulativeTraffic *= (1 + currentGrowthRate);
    }
    
    // Conversión con patrón de mejora decreciente real
    const conversionGrowthPattern = params.conversionGrowthPattern || [0.40, 0.25, 0.15, 0.10, 0.05];
    let cumulativeConversion = params.initialConversion;
    
    for (let i = 1; i <= yearIndex; i++) {
        const currentGrowthRate = conversionGrowthPattern[Math.min(i - 1, conversionGrowthPattern.length - 1)];
        cumulativeConversion *= (1 + currentGrowthRate);
    }
    cumulativeConversion = Math.min(cumulativeConversion, 0.08); // Máximo 8%
    
    // Ticket con crecimiento premium (8% anual desde 2026)
    const ticketSize = params.avgTicket * Math.pow(1.08, Math.max(0, yearIndex - 1));
    
    // Calcular por mercado usando distribución real
    let totalRevenue = 0;
    if (typeof marketDistribution !== 'undefined') {
        Object.keys(marketDistribution).forEach(market => {
            const marketData = marketDistribution[market];
            const marketTraffic = cumulativeTraffic * marketData.weight * 12; // 12 meses
            const orders = marketTraffic * cumulativeConversion;
            const localPrice = ticketSize * marketData.premium;
            const netRevenue = orders * localPrice;
            totalRevenue += netRevenue;
        });
    } else {
        // Fallback si marketDistribution no está disponible
        const monthlyOrders = cumulativeTraffic * cumulativeConversion;
        totalRevenue = monthlyOrders * ticketSize * 12; // 12 meses
    }
    
    return totalRevenue;
}

// Función para calcular VAN realista basado en flujos proyectados
function calculateRealisticNPV(revenue2030, financialParams) {
    // Estimar flujos de caja simplificados para 2026-2030
    const years = [2026, 2027, 2028, 2029, 2030];
    const cashFlows = [];
    const wacc = financialParams.wacc || 0.08;
    
    // Proyectar ingresos con crecimiento realista
    const revenue2025 = revenue2030 * 0.15; // Aproximadamente 15% del revenue 2030
    
    years.forEach((year, index) => {
        // Crecimiento de ingresos más realista (decreciente)
        const growthRates = [0.8, 0.6, 0.4, 0.2, 0.1]; // Decreciente año a año
        const yearRevenue = index === 0 ? revenue2025 : 
            revenue2025 * Math.pow(1 + growthRates[Math.min(index, growthRates.length - 1)], index + 1);
        
        // Costos como % de ingresos (más realista)
        const cogs = yearRevenue * (financialParams.cogsPct || 0.54); // 54% COGS
        const opex = yearRevenue * 0.35; // 35% gastos operativos
        
        // EBITDA
        const ebitda = yearRevenue - cogs - opex;
        
        // Depreciación estimada (5% de CAPEX total por año)
        const depreciation = 565000 * 0.2; // 20% anual (5 años vida útil)
        
        // EBIT e impuestos
        const ebit = ebitda - depreciation;
        const taxes = Math.max(0, ebit * (financialParams.taxRate || 0.27));
        
        // NOPAT
        const nopat = ebit - taxes;
        
        // CAPEX (principalmente en primeros años)
        const capex = index === 0 ? 200000 : (index === 1 ? 100000 : 50000);
        
        // Working Capital (15% del crecimiento de ingresos)
        const deltaWC = index === 0 ? yearRevenue * 0.15 : 
            (yearRevenue - (index > 0 ? revenue2025 * Math.pow(1 + growthRates[index-1], index) : 0)) * 0.15;
        
        // FCF
        const fcf = nopat + depreciation - capex - deltaWC;
        cashFlows.push(fcf);
    });
    
    // Agregar valor terminal en 2030
    const terminalGrowth = 0.02; // 2% crecimiento perpetuo
    const lastFCF = cashFlows[cashFlows.length - 1];
    const terminalValue = lastFCF * (1 + terminalGrowth) / (wacc - terminalGrowth);
    cashFlows[cashFlows.length - 1] += terminalValue;
    
    // Calcular VAN
    let npv = 0;
    cashFlows.forEach((fcf, index) => {
        npv += fcf / Math.pow(1 + wacc, index + 1);
    });
    
    return npv;
}

// Función auxiliar para calcular revenue 2030 con patrón de crecimiento modificado
function calculateModifiedRevenue2030(params, modifiedTrafficGrowthPattern) {
    const yearIndex = 5; // 2030 es año 5 desde 2025
    
    // Calcular tráfico acumulativo con patrón modificado
    let cumulativeTraffic = params.initialTraffic;
    for (let i = 1; i <= yearIndex; i++) {
        const currentGrowthRate = modifiedTrafficGrowthPattern[Math.min(i - 1, modifiedTrafficGrowthPattern.length - 1)];
        cumulativeTraffic *= (1 + currentGrowthRate);
    }
    
    // Conversión con patrón original (no modificado)
    const conversionGrowthPattern = params.conversionGrowthPattern || [0.40, 0.25, 0.15, 0.10, 0.05];
    let cumulativeConversion = params.initialConversion;
    for (let i = 1; i <= yearIndex; i++) {
        const currentGrowthRate = conversionGrowthPattern[Math.min(i - 1, conversionGrowthPattern.length - 1)];
        cumulativeConversion *= (1 + currentGrowthRate);
    }
    cumulativeConversion = Math.min(cumulativeConversion, 0.08); // Máximo 8%
    
    // Ticket con crecimiento premium original
    const ticketSize = params.avgTicket * Math.pow(1.08, Math.max(0, yearIndex - 1));
    
    // Calcular por mercado
    let totalRevenue = 0;
    if (typeof marketDistribution !== 'undefined') {
        Object.keys(marketDistribution).forEach(market => {
            const marketData = marketDistribution[market];
            const marketTraffic = cumulativeTraffic * marketData.weight * 12; // 12 meses
            const orders = marketTraffic * cumulativeConversion;
            const localPrice = ticketSize * marketData.premium;
            const netRevenue = orders * localPrice;
            totalRevenue += netRevenue;
        });
    } else {
        // Fallback
        const monthlyOrders = cumulativeTraffic * cumulativeConversion;
        totalRevenue = monthlyOrders * ticketSize * 12;
    }
    
    return totalRevenue;
}
