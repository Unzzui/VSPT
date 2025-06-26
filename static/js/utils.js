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
    try {
        const metrics = {
            economicNPV: 0,
            financialNPV: 0,
            economicIRR: 0,
            financialIRR: 0,
            revenue2030: 0,
            totalCapex: 565000
        };
        
        // Obtener métricas económicas
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            metrics.economicNPV = modelData.economicCashFlow.metrics.npv || 0;
            metrics.economicIRR = (modelData.economicCashFlow.metrics.irr || 0) * 100;
        }
        
        // Obtener métricas financieras
        if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
            metrics.financialNPV = modelData.financialCashFlow.metrics.equityNPV || 0;
            metrics.financialIRR = (modelData.financialCashFlow.metrics.projectIRR || 0) * 100;
        }
        
        // Obtener revenue 2030
        if (modelData.revenues && modelData.revenues[2030]) {
            metrics.revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
                return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
            }, 0);
        }
        
        // Obtener CAPEX total
        if (modelData.investments) {
            metrics.cumulativeInvestment = modelData.investments.totalCapex || 565000;
        }
        
        // Actualizar elementos en la interfaz
        updateImpactDisplay(metrics);
        
    } catch (error) {
        console.error('❌ Error actualizando métricas de impacto:', error);
    }
}

function updatePerformanceIndicators() {
    try {
        const indicators = {
            roi: 0,
            paybackPeriod: 0,
            breakEvenYear: 0,
            cashFlowProfile: {},
            riskMetrics: {}
        };
        
        // Calcular ROI
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            const totalInvestment = 565000;
            const npv = modelData.economicCashFlow.metrics.npv || 0;
            indicators.roi = totalInvestment > 0 ? (npv / totalInvestment) * 100 : 0;
        }
        
        // Calcular Payback Period
        if (modelData.economicCashFlow) {
            let cumulativeCashFlow = 0;
            let paybackYear = 0;
            
            for (let year = 2025; year <= 2030; year++) {
                if (modelData.economicCashFlow[year]) {
                    cumulativeCashFlow += modelData.economicCashFlow[year].fcf || 0;
                    if (cumulativeCashFlow >= 0 && paybackYear === 0) {
                        paybackYear = year;
                    }
                }
            }
            
            indicators.paybackPeriod = paybackYear;
        }
        
        // Calcular Break-even Year
        if (modelData.economicCashFlow) {
            let cumulativeProfit = 0;
            let breakEvenYear = 0;
            
            for (let year = 2025; year <= 2030; year++) {
                if (modelData.economicCashFlow[year]) {
                    cumulativeProfit += modelData.economicCashFlow[year].ebitda || 0;
                    if (cumulativeProfit >= 0 && breakEvenYear === 0) {
                        breakEvenYear = year;
                    }
                }
            }
            
            indicators.breakEvenYear = breakEvenYear;
        }
        
        // Perfil de flujo de caja
        if (modelData.economicCashFlow) {
            for (let year = 2025; year <= 2030; year++) {
                if (modelData.economicCashFlow[year]) {
                    indicators.cashFlowProfile[year] = {
                        fcf: modelData.economicCashFlow[year].fcf || 0,
                        ebitda: modelData.economicCashFlow[year].ebitda || 0
                    };
                }
            }
        }
        
        // Métricas de riesgo
        indicators.riskMetrics = {
            revenueVolatility: 0.15, // Estimación
            costVolatility: 0.10,    // Estimación
            marketRisk: 0.20         // Estimación
        };
        
        // Actualizar elementos en la interfaz
        updatePerformanceDisplay(indicators);
        modelData.performanceIndicators = indicators;
        
    } catch (error) {
        console.error('❌ Error actualizando indicadores de performance:', error);
    }
}

function trackChanges() {
    const currentState = captureModelState();
    const previousState = modelData.previousState;
    
    if (previousState) {
        const changes = {};
        let hasSignificantChanges = false;
        
        // Comparar estados
        Object.keys(currentState).forEach(key => {
            if (currentState[key] !== previousState[key]) {
                changes[key] = {
                    from: previousState[key],
                    to: currentState[key]
                };
                
                // Detectar cambios significativos
                if (key.includes('revenue') || key.includes('npv') || key.includes('irr')) {
                    hasSignificantChanges = true;
                }
            }
        });
        
        if (Object.keys(changes).length > 0) {
            modelData.changeHistory = modelData.changeHistory || [];
            modelData.changeHistory.push({
                timestamp: new Date().toISOString(),
                changes: changes
            });
            
            if (hasSignificantChanges) {
                notifySignificantChanges(changes);
            }
        }
    }
    
    modelData.previousState = currentState;
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
        'economicNPV': `$${(metrics.economicNPV/1000000).toFixed(1)}M`,
        'financialNPV': `$${(metrics.financialNPV/1000000).toFixed(1)}M`,
        'economicIRR': `${metrics.economicIRR.toFixed(1)}%`,
        'financialIRR': `${metrics.financialIRR.toFixed(1)}%`,
        'revenue2030': `$${(metrics.revenue2030/1000000).toFixed(1)}M`,
        'totalCapex': `$${(metrics.totalCapex/1000).toFixed(0)}K`
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
        'breakEvenYear': `${indicators.breakEvenYear} años`,
        'cashFlowStability': `${indicators.riskMetrics.revenueVolatility * 100}%`,
        'marketRisk': `${indicators.riskMetrics.marketRisk * 100}%`,
        'costVolatility': `${indicators.riskMetrics.costVolatility * 100}%`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
            
            // Agregar colores basados en performance
            if (id === 'projectROI') {
                element.style.color = indicators.roi > 15 ? '#28a745' : 
                                     indicators.roi > 0 ? '#ffc107' : '#dc3545';
            } else if (id === 'paybackPeriod') {
                element.style.color = indicators.paybackPeriod <= 3 ? '#28a745' : 
                                     indicators.paybackPeriod <= 5 ? '#ffc107' : '#dc3545';
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
    try {
        const state = {
            timestamp: new Date().toISOString(),
            modelData: modelData,
            inputs: captureModelState()
        };
        
        localStorage.setItem('vsptModelState', JSON.stringify(state));
        
    } catch (error) {
        console.error('❌ Error guardando estado del modelo:', error);
    }
}

function loadModelState() {
    try {
        const savedState = localStorage.getItem('vsptModelState');
        
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Restaurar datos del modelo
            if (state.modelData) {
                Object.assign(modelData, state.modelData);
            }
            
            // Restaurar inputs si es necesario
            if (state.inputs) {
                Object.keys(state.inputs).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && state.inputs[key] !== undefined) {
                        element.value = state.inputs[key];
                    }
                });
            }
            
        }
        
    } catch (error) {
        console.error('❌ Error cargando estado del modelo:', error);
    }
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
        
        // Generar y descargar archivo
        XLSX.writeFile(wb, 'VSPT_Digital_360_Modelo_Financiero.xlsx');
        
    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        alert('Error generando archivo Excel. Verifique la consola para más detalles.');
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
            
            // Componentes detallados para TODOS los países
            const components = [
                { key: 'accountsReceivable', label: 'Cuentas por Cobrar' },
                { key: 'inventory', label: 'Inventario' },
                { key: 'accountsPayable', label: 'Cuentas por Pagar' }
            ];
            
            components.forEach(comp => {
                const row = [`  ${marketLabel} ${comp.label}`];
                for (let year = 2025; year <= 2030; year++) {
                    const value = modelData.workingCapital[year].byCountry[market] ? 
                        modelData.workingCapital[year].byCountry[market][comp.key] : 0;
                    row.push(value);
                }
                data.push(row);
            });
            
            data.push([]); // Separador
        });
        
        // Consolidado
        data.push(['CONSOLIDADO', '', '', '', '', '', '']);
        
        // Componentes consolidados
        const consolidatedComponents = [
            { key: 'accountsReceivable', label: 'Total Cuentas por Cobrar' },
            { key: 'inventory', label: 'Total Inventario' },
            { key: 'accountsPayable', label: 'Total Cuentas por Pagar' }
        ];
        
        consolidatedComponents.forEach(comp => {
            const row = [`  ${comp.label}`];
            for (let year = 2025; year <= 2030; year++) {
                const value = modelData.workingCapital[year].consolidated[comp.key] || 0;
                row.push(value);
            }
            data.push(row);
        });
        
        data.push([]); // Separador
        
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
        
        // Información adicional
        data.push([]);
        data.push(['INFORMACIÓN ADICIONAL', '', '', '', '', '', '']);
        data.push(['Nota 2025', 'Solo 6 meses de operación (Chile únicamente)', '', '', '', '', '']);
        data.push(['Nota 2026+', 'Operación completa (Chile + México)', '', '', '', '', '']);
        data.push(['Fórmula WC', 'Cuentas por Cobrar + Inventario - Cuentas por Pagar', '', '', '', '', '']);
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
    const capexTotal = modelData.investments?.totalCapex || 565000;
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
    try {
        // Crear los datos de métricas usando la misma lógica que createMetricsSheet
        const capexTotal = modelData.investments?.totalCapex || 565000;
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
        // Asegurar que los datos de inversión estén calculados
        if (typeof calculateProgressiveCapex === 'function' && !modelData.investments) {
            calculateProgressiveCapex();
        }
        
        // Verificar si calculateProgressiveCapex existe y ejecutarlo si es necesario
        if (typeof calculateProgressiveCapex === 'function') {
            calculateProgressiveCapex();
        }
        
        // Fallback: crear datos de inversión manualmente si no existen
        if (!modelData.investments || !modelData.investments.distribution) {
            const totalCapex = 565000;
            const debtRatio = getFinancialParams()?.debtRatio || 0.5;
            
            modelData.investments = {
                totalCapex: totalCapex,
                distribution: {
                    2025: { amount: totalCapex * 0.45, debt: totalCapex * 0.45 * debtRatio, equity: totalCapex * 0.45 * (1 - debtRatio) },
                    2026: { amount: totalCapex * 0.30, debt: totalCapex * 0.30 * debtRatio, equity: totalCapex * 0.30 * (1 - debtRatio) },
                    2027: { amount: totalCapex * 0.20, debt: totalCapex * 0.20 * debtRatio, equity: totalCapex * 0.20 * (1 - debtRatio) },
                    2028: { amount: totalCapex * 0.05, debt: totalCapex * 0.05 * debtRatio, equity: totalCapex * 0.05 * (1 - debtRatio) }
                },
                financing: {
                    debt: totalCapex * debtRatio,
                    equity: totalCapex * (1 - debtRatio),
                    debtRatio: debtRatio,
                    equityRatio: 1 - debtRatio
                }
            };
        }
        
        // Validar CAPEX
        if (modelData.investments) {
            const total = modelData.investments.totalCapex || 565000;
            const calculatedTotal = Object.values(modelData.investments.distribution || {}).reduce((sum, yearData) => sum + (yearData.amount || 0), 0);
            
            if (Math.abs(total - calculatedTotal) > 1000) {
                errors.push(`CAPEX total (${total}) no coincide con distribución (${calculatedTotal})`);
            }
            
            // Validar financiamiento
            const debtRatio = getFinancialParams()?.debtRatio || 0.5;
            const expectedDebt = Math.round(total * debtRatio);
            const actualDebt = Object.values(modelData.investments.distribution || {}).reduce((sum, yearData) => sum + (yearData.debt || 0), 0);
            
            if (Math.abs(expectedDebt - actualDebt) > 1000) {
                warnings.push(`Deuda esperada (${expectedDebt}) vs actual (${actualDebt})`);
            }
        } else {
            errors.push('No hay datos de inversión disponibles');
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
