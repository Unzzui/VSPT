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
        totalInvestment: 565000,
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
        metrics.cumulativeInvestment = modelData.investments.totalCapex || 565000;
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
        
        // Validar datos antes de exportar
        const validation = validateExcelData();
        if (!validation.isValid) {
            console.error('❌ Datos inválidos para exportación:', validation.errors);
            if (typeof showAlert === 'function') {
                showAlert('Error: Datos inconsistentes detectados. Verifique el modelo.', 'error');
            }
            return;
        }
        
        if (validation.warnings.length > 0) {
            console.warn('⚠️ Advertencias en datos:', validation.warnings);
        }
        
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
        // Desglose detallado del CAPEX por componentes
        const capexComponents = {
            2025: {
                'Plataforma Digital Core': 120000,
                'Desarrollo Web Base': 80000,
                'Configuración SEO/SEM': 35000,
                'Setup México y Certificaciones': 60000,
                'Base Legal y Compliance': 20000
            },
            2026: {
                'Expansión Internacional': 40000,
                'Expansión Mercado México': 55000,
                'Desarrollo Almacenes (Reducido)': 25000,
                'Mejoras de Plataforma': 15000
            },
            2027: {
                'Upgrades Tecnológicos': 60000,
                'Optimización de Plataforma': 40000
            },
            2028: {
                'Optimizaciones Finales': 10000,
                'Contingencia y Ajustes': 5000
            }
        };
        
        // Agregar cada componente
        const allComponents = new Set();
        Object.keys(capexComponents).forEach(year => {
            Object.keys(capexComponents[year]).forEach(component => {
                allComponents.add(component);
            });
        });
        
        allComponents.forEach(component => {
            const row = [component];
            let totalComponent = 0;
            for (let year = 2025; year <= 2028; year++) {
                const amount = capexComponents[year] && capexComponents[year][component] ? 
                              capexComponents[year][component] : 0;
                row.push(amount);
                totalComponent += amount;
            }
            row.push(totalComponent);
            data.push(row);
        });
        
        // Separador
        data.push(['', '', '', '', '', '']);
        
        // Totales del modelo
        const inv = modelData.investments;
        const params = getFinancialParams();
        
        // CAPEX Total - usar datos dinámicos del modelo
        const capexRow = ['TOTAL CAPEX'];
        let total = 0;
        for (let year = 2025; year <= 2028; year++) {
            const amount = inv.distribution && inv.distribution[year] ? inv.distribution[year].amount : 0;
            capexRow.push(amount);
            total += amount;
        }
        capexRow.push(total);
        data.push(capexRow);
        
        // Verificar que el total coincida con el modelo
        const modelTotal = inv.total || 565000;
        if (Math.abs(total - modelTotal) > 1000) {
            console.warn(`⚠️ Discrepancia en CAPEX: Calculado ${total}, Modelo ${modelTotal}`);
        }
        
        // Separador financiamiento
        data.push(['', '', '', '', '', '']);
        data.push(['ESTRUCTURA DE FINANCIAMIENTO', '', '', '', '', '']);
        
        // Deuda
        const debtRow = [`Financiado con Deuda (${(params.debtRatio * 100).toFixed(0)}%)`];
        total = 0;
        for (let year = 2025; year <= 2028; year++) {
            const amount = inv.distribution && inv.distribution[year] ? inv.distribution[year].debt : 0;
            debtRow.push(amount);
            total += amount;
        }
        debtRow.push(total);
        data.push(debtRow);
        
        // Equity
        const equityRow = [`Aporte Capital (${(params.equityRatio * 100).toFixed(0)}%)`];
        total = 0;
        for (let year = 2025; year <= 2028; year++) {
            const amount = inv.distribution && inv.distribution[year] ? inv.distribution[year].equity : 0;
            equityRow.push(amount);
            total += amount;
        }
        equityRow.push(total);
        data.push(equityRow);
        
        // Separador acumulado
        data.push(['', '', '', '', '', '']);
        data.push(['INVERSIÓN ACUMULADA', '', '', '', '', '']);
        
        // CAPEX acumulado
        const cumulativeRow = ['CAPEX Acumulado'];
        let cumulativeTotal = 0;
        for (let year = 2025; year <= 2028; year++) {
            const amount = inv.cumulative && inv.cumulative[year] ? inv.cumulative[year].capex : 0;
            cumulativeTotal += amount;
            cumulativeRow.push(cumulativeTotal);
        }
        cumulativeRow.push(cumulativeTotal);
        data.push(cumulativeRow);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createRevenuesSheet() {
    const data = [
        ['PROYECCIÓN DE INGRESOS POR PAÍS', '', '', '', '', '', ''],
        ['País/Métrica', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.revenues) {
        Object.keys(marketDistribution).forEach(market => {
            const marketLabel = marketDistribution[market].label;
            
            // Header del mercado
            data.push([marketLabel.toUpperCase(), '', '', '', '', '', '']);
            
            // Métricas
            const metrics = [
                { key: 'traffic', label: 'Tráfico Anual' },
                { key: 'conversionRate', label: 'Tasa Conversión (%)' },
                { key: 'orders', label: 'Órdenes' },
                { key: 'avgTicket', label: 'Ticket Promedio' },
                { key: 'netRevenue', label: 'Revenue Neto' }
            ];
            
            metrics.forEach(metric => {
                const row = [metric.label];
                for (let year = 2025; year <= 2030; year++) {
                    const value = modelData.revenues[year] && modelData.revenues[year][market] ? 
                        modelData.revenues[year][market][metric.key] : 0;
                    row.push(value);
                }
                data.push(row);
            });
            
            data.push([]); // Separador
        });
        
        // Total
        data.push(['TOTAL REVENUE (USD)', '', '', '', '', '', '']);
        const totalRow = ['Total'];
        for (let year = 2025; year <= 2030; year++) {
            const yearTotal = Object.keys(marketDistribution).reduce((sum, market) => {
                return sum + (modelData.revenues[year] && modelData.revenues[year][market] ? 
                    modelData.revenues[year][market].netRevenue : 0);
            }, 0);
            totalRow.push(yearTotal);
        }
        data.push(totalRow);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createCostsSheet() {
    const data = [
        ['ESTRUCTURA DE COSTOS', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.costs) {
        // COGS
        const cogsRow = ['Costo de Ventas (COGS)'];
        for (let year = 2025; year <= 2030; year++) {
            cogsRow.push(modelData.costs[year].cogs);
        }
        data.push(cogsRow);
        data.push([]);
        
        // Gastos Operativos
        data.push(['GASTOS OPERATIVOS', '', '', '', '', '', '']);
        
        const opexItems = [
            { key: 'salesSalary', label: 'Salarios Ventas' },
            { key: 'marketing', label: 'Marketing & Publicidad' },
            { key: 'administrative', label: 'Administrativos' },
            { key: 'logistics', label: 'Logística' },
            { key: 'technology', label: 'Tecnología' }
        ];
        
        opexItems.forEach(item => {
            const row = [item.label];
            for (let year = 2025; year <= 2030; year++) {
                row.push(modelData.costs[year].operatingExpenses[item.key]);
            }
            data.push(row);
        });
        
        // Total Opex
        const opexTotalRow = ['Total Gastos Operativos'];
        for (let year = 2025; year <= 2030; year++) {
            opexTotalRow.push(modelData.costs[year].operatingExpenses.total);
        }
        data.push(opexTotalRow);
        data.push([]);
        
        // Costos Fijos
        data.push(['COSTOS FIJOS', '', '', '', '', '', '']);
        
        const fixedItems = [
            { key: 'personnel', label: 'Personal Base' },
            { key: 'infrastructure', label: 'Infraestructura' },
            { key: 'compliance', label: 'Cumplimiento' },
            { key: 'insurance', label: 'Seguros' }
        ];
        
        fixedItems.forEach(item => {
            const row = [item.label];
            for (let year = 2025; year <= 2030; year++) {
                row.push(modelData.costs[year].fixedCosts[item.key]);
            }
            data.push(row);
        });
        
        // Total Fixed
        const fixedTotalRow = ['Total Costos Fijos'];
        for (let year = 2025; year <= 2030; year++) {
            fixedTotalRow.push(modelData.costs[year].fixedCosts.total);
        }
        data.push(fixedTotalRow);
        data.push([]);
        
        // Total General
        const totalRow = ['TOTAL COSTOS'];
        for (let year = 2025; year <= 2030; year++) {
            totalRow.push(modelData.costs[year].totalCosts);
        }
        data.push(totalRow);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createWorkingCapitalSheet() {
    const data = [
        ['WORKING CAPITAL POR PAÍS', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.workingCapital) {
        // Por país
        Object.keys(marketDistribution).forEach(market => {
            const marketLabel = marketDistribution[market].label;
            
            // WC total del país
            const countryRow = [`${marketLabel} WC Total`];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.workingCapital[year].byCountry[market] ? 
                    modelData.workingCapital[year].byCountry[market].total : 0;
                countryRow.push(value);
            }
            data.push(countryRow);
            
            // Componentes
            if (market === 'mexico') {
                const components = [
                    { key: 'accountsReceivable', label: 'Cuentas por Cobrar' },
                    { key: 'inventory', label: 'Inventario' },
                    { key: 'accountsPayable', label: 'Cuentas por Pagar' }
                ];
                
                components.forEach(comp => {
                    const row = [`  ${comp.label}`];
                    for (let year = 2025; year <= 2030; year++) {
                        const value = modelData.workingCapital[year].byCountry[market] ? 
                            modelData.workingCapital[year].byCountry[market][comp.key] : 0;
                        row.push(value);
                    }
                    data.push(row);
                });
            }
            
            data.push([]); // Separador
        });
        
        // Consolidado
        data.push(['CONSOLIDADO', '', '', '', '', '', '']);
        
        const totalRow = ['Working Capital Total'];
        for (let year = 2025; year <= 2030; year++) {
            totalRow.push(modelData.workingCapital[year].consolidated.total);
        }
        data.push(totalRow);
        
        const deltaRow = ['Δ Working Capital'];
        for (let year = 2025; year <= 2030; year++) {
            deltaRow.push(modelData.workingCapital[year].deltaWC || 0);
        }
        data.push(deltaRow);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createDebtSheet() {
    const data = [
        ['CRONOGRAMA DE DEUDA', '', '', '', '', ''],
        ['Año', 'Saldo Inicial', 'Intereses', 'Principal', 'Cuota Anual', 'Saldo Final'],
        []
    ];
    
    if (modelData.debt && modelData.debt.schedule) {
        const debt = modelData.debt;
        const endYear = 2025 + debt.termYears;
        
        // Información del préstamo optimizado
        data.push([
            `CAPEX Optimizado: $${(565000/1000).toFixed(0)}K (era $800K, -29.4%)`,
            `Monto Deuda: $${(debt.debtAmount/1000).toFixed(0)}K`,
            `Tasa: ${(debt.interestRate*100).toFixed(1)}%`,
            `Plazo: ${debt.termYears} años`,
            `Cuota Mensual: $${debt.schedule[2025]?.monthlyPayment?.toFixed(0) || 0}`,
            `Ahorro en Deuda: $${((800000 - 565000) * (debt.debtAmount/debt.totalCapex) / 1000).toFixed(0)}K`
        ]);
        data.push([]);
        
        // Cronograma
        for (let year = 2025; year <= endYear; year++) {
            const schedule = debt.schedule[year];
            if (schedule && (schedule.beginningBalance > 0 || year === 2025)) {
                data.push([
                    year,
                    schedule.beginningBalance,
                    schedule.interestPayment,
                    schedule.principalPayment,
                    schedule.totalPayment,
                    schedule.endingBalance
                ]);
            }
        }
        
        // Totales
        data.push([]);
        data.push([
            'TOTALES',
            '',
            debt.metrics.totalInterestPaid,
            debt.debtAmount,
            debt.metrics.totalPayments,
            0
        ]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createEconomicFlowSheet() {
    const data = [
        ['FLUJO DE CAJA ECONÓMICO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.economicCashFlow) {
        const metrics = [
            { key: 'revenues', label: 'Ingresos' },
            { key: 'cogs', label: 'COGS' },
            { key: 'grossProfit', label: 'Margen Bruto' },
            { key: 'operatingExpenses', label: 'Gastos Operativos' },
            { key: 'ebitda', label: 'EBITDA' },
            { key: 'depreciation', label: 'Depreciación' },
            { key: 'ebit', label: 'EBIT' },
            { key: 'taxes', label: 'Impuestos' },
            { key: 'nopat', label: 'NOPAT' },
            { key: 'capex', label: 'CAPEX' },
            { key: 'deltaWC', label: 'Δ Working Capital' },
            { key: 'fcf', label: 'Flujo Libre' }
        ];
        
        metrics.forEach(metric => {
            const row = [metric.label];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.economicCashFlow[year] ? 
                    modelData.economicCashFlow[year][metric.key] : 0;
                row.push(value);
            }
            data.push(row);
        });
        
        // Métricas
        data.push([]);
        data.push(['VAN Económico', '', '', '', '', '', modelData.economicCashFlow.metrics?.npv || 0]);
        data.push(['TIR Económica', '', '', '', '', '', (modelData.economicCashFlow.metrics?.irr || 0) * 100]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createFinancialFlowSheet() {
    const data = [
        ['FLUJO DE CAJA FINANCIERO', '', '', '', '', '', ''],
        ['Concepto', '2025', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.financialCashFlow) {
        const metrics = [
            { key: 'nopat', label: 'NOPAT' },
            { key: 'depreciation', label: 'Depreciación' },
            { key: 'taxShield', label: 'Escudo Fiscal' },
            { key: 'capex', label: 'CAPEX' },
            { key: 'deltaWC', label: 'Δ Working Capital' },
            { key: 'interestExpense', label: 'Gastos Financieros (Intereses)' },
            { key: 'debtService', label: 'Amortización Capital' },
            { key: 'equityContribution', label: 'Aporte Capital' },
            { key: 'fcfe', label: 'Flujo al Accionista' }
        ];
        
        metrics.forEach(metric => {
            const row = [metric.label];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.financialCashFlow[year] ? 
                    modelData.financialCashFlow[year][metric.key] : 0;
                row.push(value);
            }
            data.push(row);
        });
        
        // Métricas
        data.push([]);
        data.push(['VAN del Equity', '', '', '', '', '', modelData.financialCashFlow.metrics?.equityNPV || 0]);
        data.push(['TIR del Proyecto', '', '', '', '', '', (modelData.financialCashFlow.metrics?.projectIRR || 0) * 100]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
}

function createMetricsSheet() {
    const data = [
        ['MÉTRICAS CLAVE DEL PROYECTO', ''],
        ['', ''],
        ['INVERSIÓN', ''],
    ];
    
    // Crear los datos de métricas usando la misma lógica que createMetricsSheet
    const capexTotal = modelData.investments?.total || 565000;
    const debtRatio = getFinancialParams()?.debtRatio || 0.5;
    const debtAmount = Math.round(capexTotal * debtRatio);
    const equityAmount = capexTotal - debtAmount;
    
    const metricsData = {
        investment: {
            capexTotal: capexTotal,
            debt: debtAmount,
            equity: equityAmount
        },
        economic: {},
        financial: {},
        revenues: {}
    };
    
    data.push(['CAPEX Total', capexTotal]);
    data.push(['Financiamiento Deuda', debtAmount]);
    data.push(['Financiamiento Equity', equityAmount]);
    data.push(['', '']);
    data.push(['RESULTADOS PROYECTADOS', '']);
    
    // Agregar métricas económicas del modelo si están disponibles
    if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
        const economicMetrics = modelData.economicCashFlow.metrics;
        data.push(['VAN Económico', economicMetrics.npv || 0]);
        data.push(['TIR Económica (%)', economicMetrics.irr ? 
                   (economicMetrics.irr * 100).toFixed(1) : 0]);
    } else {
        data.push(['VAN Económico', 'No calculado']);
        data.push(['TIR Económica (%)', 'No calculado']);
    }
    
    // Agregar métricas financieras del modelo si están disponibles
    if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
        const financialMetrics = modelData.financialCashFlow.metrics;
        data.push(['VAN Equity', financialMetrics.equityNPV || 0]);
        data.push(['TIR Proyecto (%)', financialMetrics.projectIRR ? 
                   (financialMetrics.projectIRR * 100).toFixed(1) : 0]);
    } else {
        data.push(['VAN Equity', 'No calculado']);
        data.push(['TIR Proyecto (%)', 'No calculado']);
    }
    
    // Agregar métricas de ingresos si están disponibles
    if (modelData.revenues) {
        data.push(['', '']);
        data.push(['INGRESOS PROYECTADOS', '']);
        
        // Revenue 2025 (solo Chile, 6 meses)
        const revenue2025 = modelData.revenues[2025] ? 
            Object.values(modelData.revenues[2025]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
        
        // Revenue 2030 (todos los mercados)
        const revenue2030 = modelData.revenues[2030] ? 
            Object.values(modelData.revenues[2030]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
        
        data.push(['Revenue 2025 (Chile 6m)', revenue2025]);
        data.push(['Revenue 2030 (Total)', revenue2030]);
        
        // CAGR desde 2025 a 2030
        if (revenue2025 > 0 && revenue2030 > 0) {
            const cagr = (Math.pow(revenue2030 / revenue2025, 1/5) - 1) * 100;
            data.push(['CAGR 2025-2030 (%)', cagr.toFixed(1)]);
        }
        
        // Órdenes 2030
        if (modelData.revenues[2030]) {
            const orders2030 = Object.values(modelData.revenues[2030]).reduce((sum, market) => sum + (market.orders || 0), 0);
            data.push(['Órdenes Totales 2030', Math.round(orders2030)]);
        }
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

// ============================================================================
// FUNCIÓN DE ACTUALIZACIÓN AUTOMÁTICA DE MÉTRICAS
// ============================================================================

// Función para actualizar métricas automáticamente en la interfaz
function updateMetricsDisplay() {
    console.log('📊 Actualizando métricas clave en tiempo real...');
    
    try {
        // Crear los datos de métricas usando la misma lógica que createMetricsSheet
        const capexTotal = modelData.investments?.total || 565000;
        const debtRatio = getFinancialParams()?.debtRatio || 0.5;
        const debtAmount = Math.round(capexTotal * debtRatio);
        const equityAmount = capexTotal - debtAmount;
        
        const metricsData = {
            investment: {
                capexTotal: capexTotal,
                debt: debtAmount,
                equity: equityAmount
            },
            economic: {},
            financial: {},
            revenues: {}
        };
        
        // Métricas económicas
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            const economicMetrics = modelData.economicCashFlow.metrics;
            metricsData.economic = {
                npv: economicMetrics.npv || 0,
                irr: economicMetrics.irr ? (economicMetrics.irr * 100).toFixed(1) : 0,
                available: true
            };
        } else {
            metricsData.economic = {
                npv: 'No calculado',
                irr: 'No calculado',
                available: false
            };
        }
        
        // Métricas financieras
        if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
            const financialMetrics = modelData.financialCashFlow.metrics;
            metricsData.financial = {
                equityNPV: financialMetrics.equityNPV || 0,
                projectIRR: financialMetrics.projectIRR ? (financialMetrics.projectIRR * 100).toFixed(1) : 0,
                available: true
            };
        } else {
            metricsData.financial = {
                equityNPV: 'No calculado',
                projectIRR: 'No calculado',
                available: false
            };
        }
        
        // Métricas de ingresos
        if (modelData.revenues) {
            const revenue2025 = modelData.revenues[2025] ? 
                Object.values(modelData.revenues[2025]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
            
            const revenue2030 = modelData.revenues[2030] ? 
                Object.values(modelData.revenues[2030]).reduce((sum, market) => sum + (market.netRevenue || 0), 0) : 0;
            
            const cagr = revenue2025 > 0 && revenue2030 > 0 ? 
                (Math.pow(revenue2030 / revenue2025, 1/5) - 1) * 100 : 0;
            
            const orders2030 = modelData.revenues[2030] ? 
                Object.values(modelData.revenues[2030]).reduce((sum, market) => sum + (market.orders || 0), 0) : 0;
            
            metricsData.revenues = {
                revenue2025,
                revenue2030,
                cagr: cagr.toFixed(1),
                orders2030: Math.round(orders2030),
                available: true
            };
        } else {
            metricsData.revenues = {
                revenue2025: 'No calculado',
                revenue2030: 'No calculado',
                cagr: 'No calculado',
                orders2030: 'No calculado',
                available: false
            };
        }
        
        // Actualizar elementos en la interfaz si existen
        updateMetricsElements(metricsData);
        
        // Guardar métricas en modelData para uso posterior
        modelData.keyMetrics = metricsData;
        
        console.log('✅ Métricas clave actualizadas:', metricsData);
        
    } catch (error) {
        console.error('❌ Error actualizando métricas:', error);
    }
}

// Función auxiliar para actualizar elementos específicos en la interfaz
function updateMetricsElements(metricsData) {
    // Elementos de métricas económicas
    const elements = {
        // Métricas económicas
        'keyMetricEconomicNPV': metricsData.economic.available ? 
            `$${(metricsData.economic.npv/1000000).toFixed(1)}M` : metricsData.economic.npv,
        'keyMetricEconomicIRR': metricsData.economic.available ? 
            `${metricsData.economic.irr}%` : metricsData.economic.irr,
        
        // Métricas financieras
        'keyMetricFinancialNPV': metricsData.financial.available ? 
            `$${(metricsData.financial.equityNPV/1000000).toFixed(1)}M` : metricsData.financial.equityNPV,
        'keyMetricFinancialIRR': metricsData.financial.available ? 
            `${metricsData.financial.projectIRR}%` : metricsData.financial.projectIRR,
        
        // Métricas de ingresos
        'keyMetricRevenue2025': metricsData.revenues.available ? 
            `$${(metricsData.revenues.revenue2025/1000).toFixed(0)}K` : metricsData.revenues.revenue2025,
        'keyMetricRevenue2030': metricsData.revenues.available ? 
            `$${(metricsData.revenues.revenue2030/1000000).toFixed(1)}M` : metricsData.revenues.revenue2030,
        'keyMetricCAGR': metricsData.revenues.available ? 
            `${metricsData.revenues.cagr}%` : metricsData.revenues.cagr,
        'keyMetricOrders2030': metricsData.revenues.available ? 
            metricsData.revenues.orders2030.toLocaleString() : metricsData.revenues.orders2030,
        
        // Métricas de inversión
        'keyMetricCapexTotal': `$${(metricsData.investment.capexTotal/1000).toFixed(0)}K`,
        'keyMetricDebt': `$${(metricsData.investment.debt/1000).toFixed(0)}K`,
        'keyMetricEquity': `$${(metricsData.investment.equity/1000).toFixed(0)}K`
    };
    
    // Actualizar elementos si existen en el DOM
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
            
            // Agregar clases de estado
            if (id.includes('Economic') || id.includes('Financial')) {
                const isAvailable = id.includes('Economic') ? 
                    metricsData.economic.available : metricsData.financial.available;
                element.className = isAvailable ? 'metric-value available' : 'metric-value unavailable';
            }
        }
    });
}

// ============================================================================
// FUNCIÓN DE VALIDACIÓN DE DATOS PARA EXCEL
// ============================================================================

function validateExcelData() {
    const errors = [];
    const warnings = [];
    
    try {
        // Validar CAPEX
        if (modelData.investments) {
            const total = modelData.investments.total || 565000;
            const calculatedTotal = Object.values(modelData.investments.distribution || {}).reduce((sum, year) => sum + (year.amount || 0), 0);
            
            if (Math.abs(total - calculatedTotal) > 1000) {
                errors.push(`CAPEX total (${total}) no coincide con distribución (${calculatedTotal})`);
            }
            
            // Validar financiamiento
            const debtRatio = getFinancialParams()?.debtRatio || 0.5;
            const expectedDebt = Math.round(total * debtRatio);
            const actualDebt = Object.values(modelData.investments.distribution || {}).reduce((sum, year) => sum + (year.debt || 0), 0);
            
            if (Math.abs(expectedDebt - actualDebt) > 1000) {
                warnings.push(`Deuda esperada (${expectedDebt}) vs actual (${actualDebt})`);
            }
        }
        
        // Validar ingresos
        if (modelData.revenues) {
            for (let year = 2025; year <= 2030; year++) {
                if (modelData.revenues[year]) {
                    Object.keys(marketDistribution).forEach(market => {
                        const revenue = modelData.revenues[year][market];
                        if (revenue) {
                            const calculatedRevenue = (revenue.orders || 0) * (revenue.avgTicket || 0);
                            if (Math.abs(calculatedRevenue - (revenue.netRevenue || 0)) > 100) {
                                warnings.push(`Revenue ${year} ${market}: calculado ${calculatedRevenue} vs ${revenue.netRevenue}`);
                            }
                        }
                    });
                }
            }
        }
        
        // Validar flujos de caja
        if (modelData.economicCashFlow && modelData.financialCashFlow) {
            for (let year = 2025; year <= 2030; year++) {
                const economic = modelData.economicCashFlow[year];
                const financial = modelData.financialCashFlow[year];
                
                if (economic && financial) {
                    // Verificar que NOPAT sea consistente
                    if (Math.abs((economic.nopat || 0) - (financial.nopat || 0)) > 100) {
                        warnings.push(`NOPAT ${year}: económico ${economic.nopat} vs financiero ${financial.nopat}`);
                    }
                }
            }
        }
        
        if (errors.length > 0) {
            console.error('❌ Errores de validación:', errors);
        }
        if (warnings.length > 0) {
            console.warn('⚠️ Advertencias de validación:', warnings);
        }
        
        return { errors, warnings, isValid: errors.length === 0 };
        
    } catch (error) {
        console.error('❌ Error en validación:', error);
        return { errors: ['Error en validación'], warnings: [], isValid: false };
    }
}
