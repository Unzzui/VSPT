// ============================================================================
// INVESTMENTS.JS - CAPEX PROGRESIVO Y FINANCIAMIENTO
// ============================================================================

function calculateProgressiveCapex() {
    try {
        const params = getFinancialParams();
        const totalCapex = 850000; // $850K actualizado total
        
        const investments = {
            totalCapex: totalCapex,
            distribution: {},
            financing: {
                debt: totalCapex * params.debtRatio,
                equity: totalCapex * params.equityRatio,
                debtRatio: params.debtRatio,
                equityRatio: params.equityRatio
            },
            cumulative: {}
        };
        
        let cumulativeCapex = 0;
        
        // Distribución por años según configuración
        Object.keys(capexDistribution).forEach(year => {
            const yearData = capexDistribution[year];
            const yearlyCapex = totalCapex * yearData.pct;
            cumulativeCapex += yearlyCapex;
            
            investments.distribution[year] = {
                amount: yearlyCapex,
                percentage: yearData.pct,
                label: yearData.label,
                debt: yearlyCapex * params.debtRatio,
                equity: yearlyCapex * params.equityRatio
            };
            
            investments.cumulative[year] = {
                capex: cumulativeCapex,
                debt: cumulativeCapex * params.debtRatio,
                equity: cumulativeCapex * params.equityRatio
            };
        });
        
        updateCapexTable(investments);
        updateFinancingMetrics(investments);
        modelData.investments = investments;
        
    } catch (error) {
        console.error('❌ Error en calculateProgressiveCapex:', error);
    }
}

function updateCapexTable(investments) {
    const tbody = document.getElementById('inversionesBody');
    if (!tbody) {
        console.warn('⚠️ Tabla CAPEX no encontrada (ID: inversionesBody)');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Header row
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'CONCEPTO DE INVERSIÓN';
    headerRow.insertCell(1).innerHTML = '2025 (45%)';
    headerRow.insertCell(2).innerHTML = '2026 (30%)';
    headerRow.insertCell(3).innerHTML = '2027 (20%)';
    headerRow.insertCell(4).innerHTML = '2028 (5%)';
    headerRow.insertCell(5).innerHTML = 'TOTAL';
    
    // Desglose detallado del CAPEX por componentes actualizado
    const capexComponents = {
        2025: {
            'Tecnología - Shopify Plus': 30000,
            'Tecnología - Desarrollo Custom': 100000,
            'Tecnología - Integraciones API': 125000,
            'Tecnología - Infraestructura IT': 45000,
            'Legal - México COFEPRIS': 20000,
            'Legal - México Permisos Importación': 12500,
            'Legal - México Estructura Legal': 25000,
            'Legal - México Compliance Tributario': 20000,
            'Legal - Chile SAG': 7500,
            'Legal - Chile E-commerce': 12500,
            'Legal - Chile SII': 10000,
            'Personal - Gerente E-commerce': 50000,
            'Personal - Marketing Specialist': 40000,
            'Personal - Operations Support': 30000,
            'Marketing - Google Ads México': 60000,
            'Marketing - Facebook/Instagram': 40000,
            'Marketing - Content/SEO': 30000,
            'Marketing - Influencer Partnerships': 20000,
            'Operaciones - 3PL Setup': 30000,
            'Operaciones - Sistemas Tracking': 20000,
            'Operaciones - Inventory Management': 15000,
            'Contingencia': 30000
        },
        2026: {
            'Legal Ongoing - México': 25000,
            'Legal Ongoing - Chile': 15000,
            'Marketing - Expansión Digital': 50000,
            'Marketing - Content Creation': 25000,
            'Operaciones - Optimización Logística': 20000,
            'Tecnología - Upgrades Plataforma': 40000,
            'Personal - Expansión Equipo': 35000,
            'Contingencia': 15000
        },
        2027: {
            'Tecnología - Mejoras Avanzadas': 60000,
            'Marketing - Campañas Premium': 45000,
            'Operaciones - Automatización': 30000,
            'Legal - Compliance Avanzado': 20000,
            'Personal - Especialistas': 25000,
            'Contingencia': 10000
        },
        2028: {
            'Tecnología - Optimizaciones Finales': 30000,
            'Marketing - Consolidación': 20000,
            'Operaciones - Eficiencia': 15000,
            'Legal - Mantenimiento': 10000,
            'Contingencia': 5000
        }
    };
    
    // Mostrar cada componente por año
    const allComponents = new Set();
    Object.keys(capexComponents).forEach(year => {
        Object.keys(capexComponents[year]).forEach(component => {
            allComponents.add(component);
        });
    });
    
    // Agregar cada componente como fila
    allComponents.forEach(component => {
        const row = tbody.insertRow();
        row.className = 'subcategory';
        
        // Celda 0: Concepto
        row.insertCell(0).innerHTML = component;
        
        let totalComponent = 0;
        // Celdas 1-4: Años 2025-2028
        for (let i = 1; i <= 4; i++) {
            const year = 2024 + i;
            const amount = capexComponents[year] && capexComponents[year][component] ? 
                          capexComponents[year][component] : 0;
            totalComponent += amount;
            
            const cell = row.insertCell(i);
            cell.innerHTML = amount > 0 ? `$${(amount/1000).toFixed(0)}K` : '-';
            if (amount > 0) {
                cell.style.fontWeight = 'bold';
                if (component.includes('Legal') || component.includes('Compliance')) {
                    cell.style.color = '#007bff';
                } else if (component.includes('Tecnología') || component.includes('Desarrollo')) {
                    cell.style.color = '#28a745';
                } else if (component.includes('Marketing') || component.includes('Content')) {
                    cell.style.color = '#ffc107';
                } else if (component.includes('Personal') || component.includes('Gerente')) {
                    cell.style.color = '#dc3545';
                } else if (component.includes('Operaciones') || component.includes('3PL')) {
                    cell.style.color = '#6f42c1';
                }
            }
        }
        // Celda 5: Total
        row.insertCell(5).innerHTML = `$${(totalComponent/1000).toFixed(0)}K`;
    });
    
    // Guardar desglose detallado para depreciaciones
    const capexBreakdown = [];
    allComponents.forEach(component => {
        const componentData = { concepto: component };
        let totalComponent = 0;
        
        for (let year = 2025; year <= 2028; year++) {
            const amount = capexComponents[year] && capexComponents[year][component] ? 
                          capexComponents[year][component] : 0;
            componentData[year] = amount;
            totalComponent += amount;
        }
        componentData.total = totalComponent;
        capexBreakdown.push(componentData);
    });
    
    // Agregar desglose a los datos del modelo
    investments.capexBreakdown = capexBreakdown;
    
    // Separador
    const separatorRow = tbody.insertRow();
    separatorRow.insertCell(0).innerHTML = '';
    separatorRow.insertCell(1).innerHTML = '';
    separatorRow.insertCell(2).innerHTML = '';
    separatorRow.insertCell(3).innerHTML = '';
    separatorRow.insertCell(4).innerHTML = '';
    separatorRow.insertCell(5).innerHTML = '';
    separatorRow.style.borderTop = '2px solid #dee2e6';
    
    // CAPEX Total row
    const capexRow = tbody.insertRow();
    capexRow.className = 'total-row';
    capexRow.insertCell(0).innerHTML = 'TOTAL CAPEX';
    
    let totalShown = 0;
    let cellIndex = 1;
    for (let year = 2025; year <= 2028; year++) {
        const yearData = investments.distribution[year];
        const amount = yearData ? yearData.amount : 0;
        totalShown += amount;
        
        const cell = capexRow.insertCell(cellIndex);
        cell.innerHTML = `$${(amount/1000).toFixed(0)}K`;
        cellIndex++;
    }
    const totalCell = capexRow.insertCell(cellIndex);
    totalCell.innerHTML = `$${(totalShown/1000).toFixed(0)}K`;
    
    // Estructura de financiamiento
    const financingHeaderRow = tbody.insertRow();
    financingHeaderRow.className = 'category-header';
    financingHeaderRow.insertCell(0).innerHTML = 'ESTRUCTURA DE FINANCIAMIENTO';
    financingHeaderRow.insertCell(1).innerHTML = '';
    financingHeaderRow.insertCell(2).innerHTML = '';
    financingHeaderRow.insertCell(3).innerHTML = '';
    financingHeaderRow.insertCell(4).innerHTML = '';
    financingHeaderRow.insertCell(5).innerHTML = '';
    
    // Financing breakdown - Deuda
    const debtRow = tbody.insertRow();
    debtRow.className = 'subcategory';
    debtRow.insertCell(0).innerHTML = `├─ Financiado con Deuda (${(investments.financing.debtRatio * 100).toFixed(0)}%)`;
    
    totalShown = 0;
    cellIndex = 1;
    for (let year = 2025; year <= 2028; year++) {
        const yearData = investments.distribution[year];
        const amount = yearData ? yearData.debt : 0;
        totalShown += amount;
        
        const cell = debtRow.insertCell(cellIndex);
        cell.innerHTML = amount > 0 ? `$${(amount/1000).toFixed(0)}K` : '-';
        cell.style.color = '#dc3545';
        cellIndex++;
    }
    debtRow.insertCell(cellIndex).innerHTML = `$${(totalShown/1000).toFixed(0)}K`;
    
    // Financing breakdown - Equity
    const equityRow = tbody.insertRow();
    equityRow.className = 'subcategory';
    equityRow.insertCell(0).innerHTML = `└─ Aporte Capital (${(investments.financing.equityRatio * 100).toFixed(0)}%)`;
    
    totalShown = 0;
    cellIndex = 1;
    for (let year = 2025; year <= 2028; year++) {
        const yearData = investments.distribution[year];
        const amount = yearData ? yearData.equity : 0;
        totalShown += amount;
        
        const cell = equityRow.insertCell(cellIndex);
        cell.innerHTML = amount > 0 ? `$${(amount/1000).toFixed(0)}K` : '-';
        cell.style.color = '#28a745';
        cellIndex++;
    }
    equityRow.insertCell(cellIndex).innerHTML = `$${(totalShown/1000).toFixed(0)}K`;
    
    // CAPEX Acumulado header
    const cumulativeHeaderRow = tbody.insertRow();
    cumulativeHeaderRow.className = 'category-header';
    cumulativeHeaderRow.insertCell(0).innerHTML = 'INVERSIÓN ACUMULADA';
    cumulativeHeaderRow.insertCell(1).innerHTML = '';
    cumulativeHeaderRow.insertCell(2).innerHTML = '';
    cumulativeHeaderRow.insertCell(3).innerHTML = '';
    cumulativeHeaderRow.insertCell(4).innerHTML = '';
    cumulativeHeaderRow.insertCell(5).innerHTML = '';
    
    // CAPEX Acumulado row
    const cumulativeRow = tbody.insertRow();
    cumulativeRow.className = 'total-row';
    cumulativeRow.insertCell(0).innerHTML = 'CAPEX Acumulado';
    
    cellIndex = 1;
    for (let year = 2025; year <= 2028; year++) {
        const yearData = investments.cumulative[year];
        const amount = yearData ? yearData.capex : 0;
        const cell = cumulativeRow.insertCell(cellIndex);
        cell.innerHTML = `$${(amount/1000).toFixed(0)}K`;
        cellIndex++;
    }
    cumulativeRow.insertCell(cellIndex).innerHTML = `$${(investments.totalCapex/1000).toFixed(0)}K`;
}

function updateFinancingMetrics(investments) {
    // Actualizar métricas en el dashboard
    const elements = {
        'totalCapex': `$${(investments.totalCapex/1000).toFixed(0)}K`,
        'totalDebt': `$${(investments.financing.debt/1000).toFixed(0)}K`,
        'totalEquity': `$${(investments.financing.equity/1000).toFixed(0)}K`,
        'debtRatioDisplay': `${(investments.financing.debtRatio * 100).toFixed(0)}%`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
        }
    });
    
    // Guardar métricas en modelData para uso posterior
    modelData.financingMetrics = {
        totalCapex: elements.totalCapex,
        totalDebt: elements.totalDebt,
        totalEquity: elements.totalEquity,
        debtRatio: elements.debtRatioDisplay
    };
}

// Función auxiliar para obtener CAPEX acumulado hasta un año
function getAccumulatedCapex(currentYear) {
    let accumulated = 0;
    for (let year = 2025; year <= currentYear; year++) {
        const capexData = capexDistribution[year];
        if (capexData) {
            accumulated += 850000 * capexData.pct;
        }
    }
    return accumulated;
}

// Función para exportar datos de inversiones a Excel
// REMOVIDO: Esta función está implementada en utils.js para evitar duplicados

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN AUTOMÁTICA
// ============================================================================

// Función para inicializar automáticamente cuando el DOM esté listo
function initializeInvestments() {
    // Verificar que capexDistribution esté disponible
    if (typeof capexDistribution === 'undefined') {
        return;
    }
    
    // Calcular CAPEX progresivo
    calculateProgressiveCapex();
    
    // Verificar que se haya asignado correctamente
    if (!modelData.investments) {
        console.error('❌ modelData.investments no se inicializó');
    }
}

// Ejecutar inicialización cuando el DOM esté listo
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeInvestments);
    } else {
        // Si el DOM ya está listo, ejecutar inmediatamente
        setTimeout(initializeInvestments, 100);
    }
}

// También ejecutar cuando se carga el módulo
setTimeout(initializeInvestments, 500);
