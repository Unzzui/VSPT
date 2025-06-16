// ============================================================================
// UTILS.JS - FUNCIONES UTILITARIAS Y HELPERS
// ============================================================================

// Variables para tracking de cambios
let previousValues = {};
let changeHistory = [];

// ============================================================================
// FUNCIONES DE TRACKING Y MONITOREO
// ============================================================================

function updateImpactMetrics() {
    console.log('📊 Actualizando métricas de impacto...');
    
    // Calcular métricas de impacto del proyecto
    const metrics = {
        totalInvestment: 800000,
        peakRevenue: 0,
        totalRevenue5Years: 0,
        peakOrders: 0,
        totalOrders5Years: 0,
        employmentGenerated: 0,
        marketPenetration: {},
        cumulativeInvestment: 0
    };
    
    // Revenue y órdenes
    if (modelData.revenues) {
        Object.keys(modelData.revenues).forEach(year => {
            let yearRevenue = 0;
            let yearOrders = 0;
            
            Object.keys(marketDistribution).forEach(market => {
                const marketData = modelData.revenues[year][market];
                if (marketData) {
                    yearRevenue += marketData.netRevenue;
                    yearOrders += marketData.orders;
                }
            });
            
            if (yearRevenue > metrics.peakRevenue) metrics.peakRevenue = yearRevenue;
            if (yearOrders > metrics.peakOrders) metrics.peakOrders = yearOrders;
            
            metrics.totalRevenue5Years += yearRevenue;
            metrics.totalOrders5Years += yearOrders;
        });
    }
    
    // Inversión acumulada
    if (modelData.investments) {
        metrics.cumulativeInvestment = modelData.investments.totalCapex || 800000;
    }
    
    // Empleo generado (estimación basada en revenue)
    metrics.employmentGenerated = Math.ceil(metrics.peakRevenue / 500000); // 1 empleado por cada $500K de revenue
    
    // Penetración por mercado en 2030
    if (modelData.revenues && modelData.revenues[2030]) {
        Object.keys(marketDistribution).forEach(market => {
            const marketRevenue = modelData.revenues[2030][market]?.netRevenue || 0;
            const marketOrders = modelData.revenues[2030][market]?.orders || 0;
            
            // Estimación de market share basada en mercado total estimado
            const estimatedMarketSize = 50000000; // $50M mercado total estimado por país
            
            metrics.marketPenetration[market] = {
                revenue: marketRevenue,
                orders: marketOrders,
                marketShare: (marketRevenue / estimatedMarketSize) * 100
            };
        });
    }
    
    // Actualizar elementos en el DOM
    updateImpactDisplay(metrics);
    modelData.impactMetrics = metrics;
    
    console.log('✅ Métricas de impacto calculadas:', {
        'Peak Revenue': `$${(metrics.peakRevenue/1000000).toFixed(1)}M`,
        'Total Orders': Math.round(metrics.totalOrders5Years).toLocaleString(),
        'Employment': metrics.employmentGenerated
    });
}

function updatePerformanceIndicators() {
    console.log('📈 Actualizando indicadores de rendimiento...');
    
    const indicators = {
        roi: 0,
        paybackPeriod: 0,
        conversionImprovement: 0,
        averageTicketGrowth: 0,
        marketDiversification: 0,
        cashFlowStability: 0,
        debtServiceCoverage: 0,
        liquidityRatio: 0
    };
    
    // ROI basado en flujo financiero
    if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
        const totalInvestment = 800000 * getFinancialParams().equityRatio;
        const totalCashFlow = Object.keys(modelData.financialCashFlow)
            .filter(key => parseInt(key) >= 2026)
            .reduce((sum, year) => sum + (modelData.financialCashFlow[year].fcfe || 0), 0);
        
        indicators.roi = totalInvestment > 0 ? (totalCashFlow / totalInvestment) * 100 : 0;
    }
    
    // Payback Period
    let cumulativeCF = 0;
    let paybackFound = false;
    if (modelData.financialCashFlow) {
        Object.keys(modelData.financialCashFlow)
            .filter(key => parseInt(key) >= 2026)
            .sort()
            .forEach((year, index) => {
                cumulativeCF += modelData.financialCashFlow[year].fcfe || 0;
                if (cumulativeCF > 0 && !paybackFound) {
                    indicators.paybackPeriod = index + 1;
                    paybackFound = true;
                }
            });
    }
    
    // Mejora en conversión
    if (modelData.revenues && modelData.revenues[2026] && modelData.revenues[2030]) {
        const initialConversion = modelData.revenues[2026].mexico?.conversionRate || 0;
        const finalConversion = modelData.revenues[2030].mexico?.conversionRate || 0;
        indicators.conversionImprovement = initialConversion > 0 ? 
            ((finalConversion - initialConversion) / initialConversion) * 100 : 0;
    }
    
    // Crecimiento ticket promedio
    indicators.averageTicketGrowth = 8 * 4; // 8% anual por 4 años
    
    // Diversificación geográfica (índice Herfindahl inverso)
    const weights = Object.values(marketDistribution).map(m => m.weight);
    indicators.marketDiversification = (1 - weights.reduce((sum, w) => sum + w * w, 0)) * 100;
    
    // Estabilidad de flujo de caja (coeficiente de variación inverso)
    if (modelData.financialCashFlow) {
        const cashFlows = Object.keys(modelData.financialCashFlow)
            .filter(key => parseInt(key) >= 2026)
            .map(year => modelData.financialCashFlow[year].fcfe || 0);
        
        if (cashFlows.length > 0) {
            const mean = cashFlows.reduce((sum, cf) => sum + cf, 0) / cashFlows.length;
            const variance = cashFlows.reduce((sum, cf) => sum + Math.pow(cf - mean, 2), 0) / cashFlows.length;
            const cv = Math.sqrt(variance) / Math.abs(mean);
            indicators.cashFlowStability = Math.max(0, (1 - cv) * 100);
        }
    }
    
    // Cobertura del servicio de deuda
    if (modelData.debt && modelData.economicCashFlow) {
        let avgEbitda = 0;
        let avgDebtService = 0;
        let count = 0;
        
        for (let year = 2026; year <= 2030; year++) {
            if (modelData.economicCashFlow[year] && modelData.debt.schedule[year]) {
                avgEbitda += modelData.economicCashFlow[year].ebitda || 0;
                avgDebtService += modelData.debt.schedule[year].totalPayment || 0;
                count++;
            }
        }
        
        if (count > 0) {
            avgEbitda /= count;
            avgDebtService /= count;
            indicators.debtServiceCoverage = avgDebtService > 0 ? avgEbitda / avgDebtService : 0;
        }
    }
    
    updatePerformanceDisplay(indicators);
    modelData.performanceIndicators = indicators;
    
    console.log('✅ Indicadores de performance calculados:', {
        'ROI': `${indicators.roi.toFixed(1)}%`,
        'Payback': `${indicators.paybackPeriod} años`,
        'DSCR': indicators.debtServiceCoverage.toFixed(1)
    });
}

function trackChanges() {
    console.log('🔍 Tracking cambios en el modelo...');
    
    // Obtener valores actuales de inputs principales
    const currentValues = {
        debtRatio: document.getElementById('debtRatio')?.value,
        interestRate: document.getElementById('interestRate')?.value,
        initialConversion: document.getElementById('initialConversion')?.value,
        conversionGrowthRate: document.getElementById('conversionGrowthRate')?.value,
        trafficGrowth: document.getElementById('trafficGrowth')?.value,
        avgTicket: document.getElementById('avgTicket')?.value,
        initialTraffic: document.getElementById('initialTraffic')?.value,
        marketingPct: document.getElementById('marketingPct')?.value,
        timestamp: new Date().toISOString()
    };
    
    // Comparar con valores anteriores
    const changes = {};
    Object.keys(currentValues).forEach(key => {
        if (key !== 'timestamp' && previousValues[key] !== currentValues[key]) {
            changes[key] = {
                from: previousValues[key],
                to: currentValues[key],
                impact: calculateChangeImpact(key, previousValues[key], currentValues[key])
            };
        }
    });
    
    // Si hay cambios, agregarlos al historial
    if (Object.keys(changes).length > 0) {
        changeHistory.push({
            timestamp: currentValues.timestamp,
            changes: changes,
            modelState: captureModelState()
        });
        
        // Mantener solo los últimos 20 cambios
        if (changeHistory.length > 20) {
            changeHistory.shift();
        }
        
        console.log('📋 Cambios detectados:', Object.keys(changes));
        
        // Notificar cambios significativos
        notifySignificantChanges(changes);
    }
    
    // Actualizar valores anteriores
    previousValues = { ...currentValues };
}

function calculateChangeImpact(parameter, oldValue, newValue) {
    if (!oldValue || !newValue) return 'low';
    
    const oldNum = parseFloat(oldValue);
    const newNum = parseFloat(newValue);
    
    if (isNaN(oldNum) || isNaN(newNum)) return 'low';
    
    const percentChange = Math.abs((newNum - oldNum) / oldNum) * 100;
    
    // Definir impacto basado en el parámetro y el cambio porcentual
    const highImpactParams = ['debtRatio', 'interestRate', 'conversionGrowthRate'];
    const mediumImpactParams = ['trafficGrowth', 'avgTicket', 'initialConversion'];
    
    if (highImpactParams.includes(parameter) && percentChange > 10) return 'high';
    if (mediumImpactParams.includes(parameter) && percentChange > 15) return 'medium';
    if (percentChange > 25) return 'high';
    if (percentChange > 10) return 'medium';
    
    return 'low';
}

function captureModelState() {
    return {
        hasRevenues: !!modelData.revenues,
        hasInvestments: !!modelData.investments,
        hasDebt: !!modelData.debt,
        hasCashFlow: !!modelData.financialCashFlow,
        npv: modelData.financialCashFlow?.metrics?.equityNPV || 0,
        irr: modelData.financialCashFlow?.metrics?.projectIRR || 0
    };
}

function notifySignificantChanges(changes) {
    const highImpactChanges = Object.keys(changes).filter(key => 
        changes[key].impact === 'high'
    );
    
    if (highImpactChanges.length > 0 && typeof showAlert === 'function') {
        showAlert(
            `Cambios significativos detectados en: ${highImpactChanges.join(', ')}. 
            Se recomienda revisar los resultados.`, 
            'warning'
        );
    }
}

// ============================================================================
// FUNCIONES DE DISPLAY Y ACTUALIZACIÓN DE UI
// ============================================================================

function updateImpactDisplay(metrics) {
    // Actualizar elementos de impacto si existen en el DOM
    const elements = {
        'peakRevenue': `$${(metrics.peakRevenue/1000000).toFixed(1)}M`,
        'totalOrders': Math.round(metrics.totalOrders5Years).toLocaleString(),
        'employmentGenerated': metrics.employmentGenerated.toString(),
        'totalInvestment': `$${(metrics.totalInvestment/1000).toFixed(0)}K`,
        'marketPenetrationMexico': metrics.marketPenetration.mexico ? 
            `${metrics.marketPenetration.mexico.marketShare.toFixed(3)}%` : '0%'
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = elements[id];
    });
}

function updatePerformanceDisplay(indicators) {
    // Actualizar elementos de performance si existen en el DOM
    const elements = {
        'projectROI': `${indicators.roi.toFixed(1)}%`,
        'paybackPeriod': `${indicators.paybackPeriod} años`,
        'conversionImprovement': `${indicators.conversionImprovement.toFixed(1)}%`,
        'marketDiversification': `${indicators.marketDiversification.toFixed(1)}%`,
        'cashFlowStability': `${indicators.cashFlowStability.toFixed(1)}%`,
        'debtServiceCoverage': `${indicators.debtServiceCoverage.toFixed(1)}x`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
            
            // Agregar colores basados en performance
            if (id === 'projectROI') {
                element.style.color = indicators.roi > 15 ? '#28a745' : 
                                     indicators.roi > 0 ? '#ffc107' : '#dc3545';
            } else if (id === 'debtServiceCoverage') {
                element.style.color = indicators.debtServiceCoverage > 1.5 ? '#28a745' : 
                                     indicators.debtServiceCoverage > 1.2 ? '#ffc107' : '#dc3545';
            }
        }
    });
}

// ============================================================================
// FUNCIONES DE FORMATEO Y HELPERS
// ============================================================================

function formatCurrency(value, showCents = false) {
    if (typeof value !== 'number') return '$0';
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0
    });
    
    return formatter.format(value);
}

function formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number') return '0%';
    return `${value.toFixed(decimals)}%`;
}

function formatNumber(value, decimals = 0) {
    if (typeof value !== 'number') return '0';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCompact(value, prefix = '$', suffix = '') {
    if (typeof value !== 'number') return prefix + '0' + suffix;
    
    if (Math.abs(value) >= 1000000) {
        return prefix + (value / 1000000).toFixed(1) + 'M' + suffix;
    } else if (Math.abs(value) >= 1000) {
        return prefix + (value / 1000).toFixed(0) + 'K' + suffix;
    } else {
        return prefix + value.toFixed(0) + suffix;
    }
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

function validateInputs() {
    const errors = [];
    
    // Validar parámetros financieros
    const debtRatio = parseFloat(document.getElementById('debtRatio')?.value || 0) / 100;
    const interestRate = parseFloat(document.getElementById('interestRate')?.value || 0) / 100;
    
    if (debtRatio < 0 || debtRatio > 0.8) {
        errors.push('Ratio de deuda debe estar entre 0% y 80%');
    }
    
    if (interestRate < 0 || interestRate > 0.25) {
        errors.push('Tasa de interés debe estar entre 0% y 25%');
    }
    
    // Validar parámetros de negocio
    const initialConversion = parseFloat(document.getElementById('initialConversion')?.value || 0) / 100;
    const conversionGrowth = parseFloat(document.getElementById('conversionGrowthRate')?.value || 0) / 100;
    
    if (initialConversion < 0 || initialConversion > 0.1) {
        errors.push('Conversión inicial debe estar entre 0% y 10%');
    }
    
    if (conversionGrowth < 0 || conversionGrowth > 1) {
        errors.push('Crecimiento de conversión debe estar entre 0% y 100%');
    }
    
    return errors;
}

function showValidationErrors(errors) {
    if (errors.length > 0 && typeof showAlert === 'function') {
        showAlert('Errores de validación:\n' + errors.join('\n'), 'error');
        return false;
    }
    return true;
}

// ============================================================================
// FUNCIONES DE ALERT Y NOTIFICACIONES
// ============================================================================

function showAlert(message, type = 'info') {
    // Función simple de alertas
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Si existe una función de alert personalizada, usarla
    if (typeof customAlert === 'function') {
        customAlert(message, type);
    } else {
        // Fallback a alert nativo para errores críticos
        if (type === 'error') {
            alert(message);
        }
    }
}

// ============================================================================
// FUNCIONES DE ESTADO Y PERSISTENCIA
// ============================================================================

function saveModelState() {
    const state = {
        modelData: modelData,
        parameters: {
            financial: getFinancialParams(),
            business: getBusinessParams(),
            inventory: getInventoryParams()
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    try {
        localStorage.setItem('vspt_model_state', JSON.stringify(state));
        console.log('✅ Estado del modelo guardado');
        return true;
    } catch (error) {
        console.error('❌ Error guardando estado:', error);
        return false;
    }
}

function loadModelState() {
    try {
        const saved = localStorage.getItem('vspt_model_state');
        if (saved) {
            const state = JSON.parse(saved);
            modelData = state.modelData || {};
            console.log('✅ Estado del modelo restaurado');
            return true;
        }
    } catch (error) {
        console.error('❌ Error cargando estado:', error);
    }
    return false;
}

function clearModelState() {
    localStorage.removeItem('vspt_model_state');
    modelData = {
        investments: {},
        revenues: {},
        costs: {},
        workingCapital: {},
        debt: {},
        economicCashFlow: {},
        financialCashFlow: {},
        sensitivity: {}
    };
    console.log('🗑️ Estado del modelo limpiado');
}

// ============================================================================
// FUNCIÓN DE EXPORTACIÓN A EXCEL
// ============================================================================

function exportToExcel() {
    try {
        console.log('📥 Generando archivo Excel completo...');
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // 1. Hoja de CAPEX & Financiamiento
        if (modelData.investments) {
            const wsInvestments = createInvestmentsSheet();
            XLSX.utils.book_append_sheet(wb, wsInvestments, "CAPEX & Financiamiento");
        }
        
        // 2. Hoja de Ingresos por País
        if (modelData.revenues) {
            const wsRevenues = createRevenuesSheet();
            XLSX.utils.book_append_sheet(wb, wsRevenues, "Ingresos por País");
        }
        
        // 3. Hoja de Costos Operativos
        if (modelData.costs) {
            const wsCosts = createCostsSheet();
            XLSX.utils.book_append_sheet(wb, wsCosts, "Costos Operativos");
        }
        
        // 4. Hoja de Working Capital
        if (modelData.workingCapital) {
            const wsWC = createWorkingCapitalSheet();
            XLSX.utils.book_append_sheet(wb, wsWC, "Working Capital");
        }
        
        // 5. Hoja de Cronograma de Deuda
        if (modelData.debt) {
            const wsDebt = createDebtSheet();
            XLSX.utils.book_append_sheet(wb, wsDebt, "Cronograma Deuda");
        }
        
        // 6. Hoja de Depreciaciones
        if (modelData.depreciation && typeof getDepreciationData === 'function') {
            const wsDepreciation = createDepreciationSheet();
            XLSX.utils.book_append_sheet(wb, wsDepreciation, "Depreciaciones");
        }
        
        // 7. Hoja de Flujo Económico
        if (modelData.economicCashFlow) {
            const wsEconomic = createEconomicFlowSheet();
            XLSX.utils.book_append_sheet(wb, wsEconomic, "Flujo Económico");
        }
        
        // 8. Hoja de Flujo Financiero
        if (modelData.financialCashFlow) {
            const wsFinancial = createFinancialFlowSheet();
            XLSX.utils.book_append_sheet(wb, wsFinancial, "Flujo Financiero");
        }
        
        // 9. Hoja de Análisis de Sensibilidad
        if (modelData.sensitivity && typeof getSensitivityData === 'function') {
            const wsSensitivity = createSensitivitySheet();
            XLSX.utils.book_append_sheet(wb, wsSensitivity, "Análisis Sensibilidad");
        }
        
        // 10. Hoja de Resumen de Métricas
        const wsMetrics = createMetricsSheet();
        XLSX.utils.book_append_sheet(wb, wsMetrics, "Métricas Clave");
        
        // Descargar archivo
        const fileName = `VSPT_Modelo_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('✅ Archivo Excel generado exitosamente');
        if (typeof showAlert === 'function') {
            showAlert('Archivo Excel descargado exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error al generar archivo Excel', 'error');
        }
    }
}

// Funciones auxiliares para crear hojas de Excel
function createInvestmentsSheet() {
    const data = [
        ['CAPEX PROGRESIVO VSPT DIGITAL EXPANSION', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', 'Total']
    ];
    
    if (modelData.investments) {
        const years = Object.keys(modelData.investments).sort();
        let totalInvestment = 0;
        
        years.forEach(year => {
            const yearData = modelData.investments[year];
            totalInvestment += yearData.total || 0;
        });
        
        data.push(['Total CAPEX', '', '', '', '', totalInvestment]);
        data.push(['Financiamiento - Deuda (35%)', '', '', '', '', totalInvestment * 0.35]);
        data.push(['Financiamiento - Equity (65%)', '', '', '', '', totalInvestment * 0.65]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createRevenuesSheet() {
    const data = [
        ['INGRESOS POR PAÍS - VSPT DIGITAL', '', '', '', '', ''],
        ['País/Métrica', '2026', '2027', '2028', '2029', '2030']
    ];
    
    if (modelData.revenues) {
        Object.keys(marketDistribution).forEach(market => {
            const row = [market];
            for (let year = 2026; year <= 2030; year++) {
                const yearData = modelData.revenues[year];
                const revenue = yearData && yearData[market] ? yearData[market].netRevenue : 0;
                row.push(revenue);
            }
            data.push(row);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createCostsSheet() {
    const data = [
        ['COSTOS OPERATIVOS - VSPT DIGITAL', '', '', '', '', ''],
        ['Concepto', '2026', '2027', '2028', '2029', '2030']
    ];
    
    if (modelData.costs) {
        Object.keys(modelData.costs).forEach(year => {
            const yearData = modelData.costs[year];
            if (yearData) {
                data.push(['Personal', yearData.personal || 0]);
                data.push(['Marketing Digital', yearData.marketing || 0]);
                data.push(['Logística', yearData.logistics || 0]);
                data.push(['Total Costos', yearData.total || 0]);
            }
        });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createWorkingCapitalSheet() {
    const data = [
        ['WORKING CAPITAL POR PAÍS', '', '', '', '', ''],
        ['País', '2026', '2027', '2028', '2029', '2030']
    ];
    
    if (modelData.workingCapital) {
        Object.keys(marketDistribution).forEach(market => {
            const row = [market];
            for (let year = 2026; year <= 2030; year++) {
                const wc = modelData.workingCapital[year] && modelData.workingCapital[year][market] 
                    ? modelData.workingCapital[year][market].total : 0;
                row.push(wc);
            }
            data.push(row);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createDebtSheet() {
    const data = [
        ['CRONOGRAMA DE DEUDA - AMORTIZACIÓN FRANCESA', '', '', '', '', ''],
        ['Año', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Saldo Final']
    ];
    
    if (modelData.debt && modelData.debt.schedule) {
        Object.keys(modelData.debt.schedule).forEach(year => {
            const payment = modelData.debt.schedule[year];
            data.push([
                year,
                payment.initialBalance || 0,
                payment.interest || 0,
                payment.principal || 0,
                payment.totalPayment || 0,
                payment.finalBalance || 0
            ]);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createEconomicFlowSheet() {
    const data = [
        ['FLUJO DE CAJA ECONÓMICO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']
    ];
    
    if (modelData.economicCashFlow) {
        const flow = modelData.economicCashFlow;
        data.push(['EBITDA', flow[2025]?.ebitda || 0, flow[2026]?.ebitda || 0, 
                  flow[2027]?.ebitda || 0, flow[2028]?.ebitda || 0, 
                  flow[2029]?.ebitda || 0, flow[2030]?.ebitda || 0]);
        data.push(['CAPEX', flow[2025]?.capex || 0, flow[2026]?.capex || 0,
                  flow[2027]?.capex || 0, flow[2028]?.capex || 0,
                  flow[2029]?.capex || 0, flow[2030]?.capex || 0]);
        data.push(['Flujo Libre', flow[2025]?.freeCashFlow || 0, flow[2026]?.freeCashFlow || 0,
                  flow[2027]?.freeCashFlow || 0, flow[2028]?.freeCashFlow || 0,
                  flow[2029]?.freeCashFlow || 0, flow[2030]?.freeCashFlow || 0]);
        
        if (flow.metrics) {
            data.push(['', '', '', '', '', '', '']);
            data.push(['VAN Proyecto', '', '', '', '', '', flow.metrics.projectNPV || 0]);
            data.push(['TIR Proyecto', '', '', '', '', '', flow.metrics.projectIRR ? (flow.metrics.projectIRR * 100).toFixed(1) + '%' : '0%']);
        }
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createFinancialFlowSheet() {
    const data = [
        ['FLUJO DE CAJA FINANCIERO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']
    ];
    
    if (modelData.financialCashFlow) {
        const flow = modelData.financialCashFlow;
        data.push(['NOPAT', flow[2025]?.nopat || 0, flow[2026]?.nopat || 0,
                  flow[2027]?.nopat || 0, flow[2028]?.nopat || 0,
                  flow[2029]?.nopat || 0, flow[2030]?.nopat || 0]);
        data.push(['Servicio Deuda', flow[2025]?.debtService || 0, flow[2026]?.debtService || 0,
                  flow[2027]?.debtService || 0, flow[2028]?.debtService || 0,
                  flow[2029]?.debtService || 0, flow[2030]?.debtService || 0]);
        data.push(['Flujo al Accionista', flow[2025]?.fcfe || 0, flow[2026]?.fcfe || 0,
                  flow[2027]?.fcfe || 0, flow[2028]?.fcfe || 0,
                  flow[2029]?.fcfe || 0, flow[2030]?.fcfe || 0]);
        
        if (flow.metrics) {
            data.push(['', '', '', '', '', '', '']);
            data.push(['VAN Equity', '', '', '', '', '', flow.metrics.equityNPV || 0]);
            data.push(['TIR Proyecto', '', '', '', '', '', flow.metrics.projectIRR ? (flow.metrics.projectIRR * 100).toFixed(1) + '%' : '0%']);
        }
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createMetricsSheet() {
    const data = [
        ['MÉTRICAS CLAVE DEL PROYECTO', ''],
        ['', ''],
        ['INVERSIÓN', ''],
        ['CAPEX Total', 800000],
        ['Financiamiento Deuda', 280000],
        ['Financiamiento Equity', 520000],
        ['', ''],
        ['RESULTADOS PROYECTADOS', ''],
    ];
    
    // Agregar métricas del modelo si están disponibles
    if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
        data.push(['VAN Proyecto', modelData.economicCashFlow.metrics.projectNPV || 0]);
        data.push(['TIR Proyecto (%)', modelData.economicCashFlow.metrics.projectIRR ? 
                   (modelData.economicCashFlow.metrics.projectIRR * 100).toFixed(1) : 0]);
    }
    
    if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
        data.push(['VAN Equity', modelData.financialCashFlow.metrics.equityNPV || 0]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

// Función para crear hoja de depreciaciones para Excel
function createDepreciationSheet() {
    const data = [
        ['CRONOGRAMA DE DEPRECIACIONES DETALLADO', '', '', '', '', '', '', '', ''],
        ['Activo / Concepto', 'Vida Útil', '2025', '2026', '2027', '2028', '2029', '2030', 'Total'],
        []
    ];
    
    if (modelData.depreciation && modelData.depreciation.schedule) {
        const schedule = modelData.depreciation.schedule;
        
        schedule.forEach(item => {
            const isTotal = item.concepto.includes('TOTAL');
            data.push([
                item.concepto,
                item.vidaUtil || '',
                item['2025'] || 0,
                item['2026'] || 0,
                item['2027'] || 0,
                item['2028'] || 0,
                item['2029'] || 0,
                item['2030'] || 0,
                item.total || 0
            ]);
        });
        
        // Agregar métricas resumen
        data.push([]);
        data.push(['MÉTRICAS DE DEPRECIACIÓN', '', '', '', '', '', '', '', '']);
        data.push(['Total Depreciación', '', '', '', '', '', '', '', modelData.depreciation.totalDepreciation || 0]);
        data.push(['Depreciación Anual Promedio', '', '', '', '', '', '', '', modelData.depreciation.avgAnnualDepreciation || 0]);
        data.push(['Total Depreciable', '', '', '', '', '', '', '', modelData.depreciation.totalDepreciableAmount || 0]);
        data.push(['Método de Depreciación', '', '', '', '', '', '', '', modelData.depreciation.method === 'linear' ? 'Línea Recta' : 'Acelerada']);
        data.push(['Valor Residual %', '', '', '', '', '', '', '', (modelData.depreciation.residualValuePct || 0) * 100]);
    } else {
        data.push(['No hay datos de depreciación disponibles', '', '', '', '', '', '', '', '']);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createSensitivitySheet() {
    const sensitivityData = typeof getSensitivityData === 'function' ? getSensitivityData() : { scenarios: {}, summary: {} };
    
    const data = [
        ['ANÁLISIS DE SENSIBILIDAD', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['RESUMEN EJECUTIVO', '', '', '', '', ''],
    ];
    
    // Agregar resumen
    Object.entries(sensitivityData.summary).forEach(([key, value]) => {
        data.push([key, value, '', '', '', '']);
    });
    
    data.push(['', '', '', '', '', '']);
    data.push(['ESCENARIOS ANALIZADOS', '', '', '', '', '']);
    data.push(['Escenario', 'VAN Económico (USD)', 'VAN Financiero (USD)', 'TIR Económico (%)', 'TIR Financiero (%)', 'Revenue 2030 (USD)']);
    
    // Agregar escenarios
    Object.entries(sensitivityData.scenarios).forEach(([scenarioName, scenario]) => {
        if (scenario.metrics) {
            data.push([
                scenarioName,
                scenario.metrics.economicNPV || 0,
                scenario.metrics.financialNPV || 0,
                scenario.metrics.economicIRR || 0,
                scenario.metrics.financialIRR || 0,
                scenario.metrics.revenue2030 || 0
            ]);
        }
    });
    
    return XLSX.utils.aoa_to_sheet(data);
}
