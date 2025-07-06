// ============================================================================
// VSPT DIGITAL EXPANSION - MÓDULO DE DEPRECIACIONES DETALLADAS
// ============================================================================
// Este módulo calcula y maneja las depreciaciones de activos según:
// - CAPEX progresivo por año y componente
// - Diferentes vidas útiles por tipo de activo
// - Métodos de depreciación (línea recta, acelerada)
// - Valor residual configurable
// ============================================================================

// Configuración de vidas útiles por tipo de activo (en años)
const ASSET_LIVES = {
    'Tecnología - Shopify Plus': 3,
    'Tecnología - Desarrollo Custom': 4,
    'Tecnología - Integraciones API': 5,
    'Tecnología - Infraestructura IT': 5,
    'Tecnología - Upgrades Plataforma': 3,
    'Tecnología - Mejoras Avanzadas': 3,
    'Tecnología - Optimizaciones Finales': 2,
    'Legal - México COFEPRIS': 5,
    'Legal - México Permisos Importación': 5,
    'Legal - México Estructura Legal': 5,
    'Legal - México Compliance Tributario': 5,
    'Legal - Chile SAG': 5,
    'Legal - Chile E-commerce': 5,
    'Legal - Chile SII': 5,
    'Legal Ongoing - México': 5,
    'Legal Ongoing - Chile': 5,
    'Legal - Compliance Avanzado': 5,
    'Legal - Mantenimiento': 5,
    'Personal - Gerente E-commerce': 0, // No se deprecia
    'Personal - Marketing Specialist': 0, // No se deprecia
    'Personal - Operations Support': 0, // No se deprecia
    'Personal - Expansión Equipo': 0, // No se deprecia
    'Personal - Especialistas': 0, // No se deprecia
    'Marketing - Google Ads México': 2,
    'Marketing - Facebook/Instagram': 2,
    'Marketing - Content/SEO': 3,
    'Marketing - Influencer Partnerships': 2,
    'Marketing - Expansión Digital': 2,
    'Marketing - Content Creation': 3,
    'Marketing - Campañas Premium': 2,
    'Marketing - Consolidación': 2,
    'Operaciones - 3PL Setup': 7,
    'Operaciones - Sistemas Tracking': 5,
    'Operaciones - Inventory Management': 5,
    'Operaciones - Optimización Logística': 5,
    'Operaciones - Automatización': 5,
    'Operaciones - Eficiencia': 5,
    'Contingencia': 5, // Promedio
    'Desarrollo Web': 3,
    'Infraestructura IT': 5,
    'Plataforma E-commerce': 4,
    'Marketing Digital': 2,
    'Sistemas ERP': 7,
    'Logística': 10,
    'Certificaciones': 3,
    'Tecnología': 5,
    'Legal y Regulatorio': 5,
    'Capital de Trabajo': 0 // No se deprecia
};

// Cálculo de depreciaciones detalladas
function calculateDepreciations() {
    try {

        
        // Obtener datos de CAPEX desde el módulo optimizado
        const investments = modelData.investments || {};
        
        if (Object.keys(investments).length === 0) {

            return;
        }
        
        // Obtener parámetros de depreciación
        const depreciationMethod = document.getElementById('depreciationMethod')?.value || 'linear';
        const residualValuePct = parseFloat(document.getElementById('residualValue')?.value || 10) / 100;
        
        // Crear estructura de depreciaciones
        const depreciationSchedule = [];
        const years = [2025, 2026, 2027, 2028, 2029, 2030];
        let totalDepreciation = 0;
        let totalDepreciableAmount = 0;
        
        // Convertir estructura de CAPEX optimizado a formato para depreciaciones
        const capexItems = [];
        
        // Recopilar todos los componentes únicos del CAPEX
        const allComponents = new Set();
        Object.keys(investments).forEach(year => {
            if (investments[year] && typeof investments[year] === 'object') {
                Object.keys(investments[year]).forEach(component => {
                    if (component !== 'total') {
                        allComponents.add(component);
                    }
                });
            }
        });
        
        // Crear estructura de datos para cada componente
        allComponents.forEach(component => {
            const item = { concepto: component };
            let hasValue = false;
            
            Object.keys(investments).forEach(year => {
                const value = investments[year] && investments[year][component] ? investments[year][component] : 0;
                item[year] = value;
                if (value > 0) hasValue = true;
            });
            
            if (hasValue) {
                capexItems.push(item);
            }
        });
        
        // Procesar cada componente del CAPEX
        capexItems.forEach(item => {
            // Determinar vida útil basada en el tipo de componente
            let assetLife = 5; // Por defecto
            const component = item.concepto.toLowerCase();
            
            if (component.includes('web') || component.includes('digital') || component.includes('platform')) {
                assetLife = 4;
            } else if (component.includes('technology') || component.includes('upgrade')) {
                assetLife = 5;
            } else if (component.includes('legal') || component.includes('setup') || component.includes('certification')) {
                assetLife = 3;
            } else if (component.includes('inventory') || component.includes('warehouse')) {
                assetLife = 10; // Activos físicos
            } else if (component.includes('marketing') || component.includes('seo')) {
                assetLife = 2;
            }
            
            // Calcular valor total del activo
            const totalAssetValue = (item['2025'] || 0) + (item['2026'] || 0) + 
                                  (item['2027'] || 0) + (item['2028'] || 0);
            
            if (totalAssetValue === 0) return;
            
            const depreciableValue = totalAssetValue * (1 - residualValuePct);
            totalDepreciableAmount += depreciableValue;
            
            // Crear fila de depreciación para este activo
            const depRow = {
                concepto: item.concepto,
                vidaUtil: `${assetLife} años`,
                totalValue: totalAssetValue,
                depreciableValue: depreciableValue,
                residualValue: totalAssetValue * residualValuePct
            };
            
            // Calcular depreciación anual según método
            years.forEach(year => {
                depRow[year] = calculateAnnualDepreciation(
                    item, year, assetLife, depreciableValue, depreciationMethod
                );
            });
            
            // Total de depreciación para este activo
            depRow.total = years.reduce((sum, year) => sum + (depRow[year] || 0), 0);
            totalDepreciation += depRow.total;
            
            depreciationSchedule.push(depRow);
        });
        
        // Agregar fila de totales
        const totalRow = {
            concepto: 'TOTAL DEPRECIACIONES',
            vidaUtil: '-',
            totalValue: depreciationSchedule.reduce((sum, item) => sum + item.totalValue, 0),
            depreciableValue: totalDepreciableAmount,
            residualValue: depreciationSchedule.reduce((sum, item) => sum + item.residualValue, 0)
        };
        
        years.forEach(year => {
            totalRow[year] = depreciationSchedule.reduce((sum, item) => sum + (item[year] || 0), 0);
        });
        totalRow.total = totalDepreciation;
        
        depreciationSchedule.push(totalRow);
        
        // Guardar en modelData
        modelData.depreciation = {
            schedule: depreciationSchedule,
            totalDepreciation: totalDepreciation,
            totalDepreciableAmount: totalDepreciableAmount,
            avgAnnualDepreciation: totalDepreciation / years.length,
            method: depreciationMethod,
            residualValuePct: residualValuePct
        };
        
        // Actualizar tabla y métricas
        updateDepreciationTable();
        updateDepreciationMetrics();
        

        
    } catch (error) {

    }
}

// Calcular depreciación anual específica
function calculateAnnualDepreciation(assetData, year, assetLife, depreciableValue, method) {
    try {
        // Determinar cuándo se adquirió el activo
        const assetInvestment = assetData[year] || 0;
        if (assetInvestment === 0) return 0;
        
        // Calcular años transcurridos desde adquisición
        const acquisitionYear = Object.keys(assetData)
            .filter(y => !isNaN(y) && assetData[y] > 0)
            .map(y => parseInt(y))
            .sort()[0];
        
        if (!acquisitionYear || year < acquisitionYear) return 0;
        
        const yearsElapsed = year - acquisitionYear + 1;
        if (yearsElapsed > assetLife) return 0;
        
        // Calcular proporción del valor depreciable correspondiente a esta inversión
        const totalAssetValue = Object.keys(assetData)
            .filter(y => !isNaN(y))
            .reduce((sum, y) => sum + (assetData[y] || 0), 0);
        
        const proportionalDepreciableValue = (assetInvestment / totalAssetValue) * depreciableValue;
        
        if (method === 'linear') {
            // Depreciación lineal
            return proportionalDepreciableValue / assetLife;
        } else if (method === 'accelerated') {
            // Doble saldo decreciente
            const rate = 2 / assetLife;
            const bookValue = proportionalDepreciableValue * Math.pow(1 - rate, yearsElapsed - 1);
            return Math.min(bookValue * rate, proportionalDepreciableValue / assetLife);
        }
        
        return 0;
        
    } catch (error) {

        return 0;
    }
}

// Actualizar tabla de depreciaciones
function updateDepreciationTable() {
    try {
        const tbody = document.getElementById('depreciacionesBody');
        if (!tbody) return;
        
        const schedule = modelData.depreciation?.schedule || [];
        
        tbody.innerHTML = schedule.map(item => {
            const isTotal = item.concepto.includes('TOTAL');
            const rowClass = isTotal ? 'total-row' : '';
            
            return `
                <tr class="${rowClass}">
                    <td style="text-align: left; font-weight: ${isTotal ? 'bold' : 'normal'};">
                        ${item.concepto}
                    </td>
                    <td style="text-align: center;">${item.vidaUtil}</td>
                    <td style="text-align: right;">$${formatNumber((item['2025'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right;">$${formatNumber((item['2026'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right;">$${formatNumber((item['2027'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right;">$${formatNumber((item['2028'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right;">$${formatNumber((item['2029'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right;">$${formatNumber((item['2030'] || 0)/1000, 1)}K</td>
                    <td style="text-align: right; font-weight: ${isTotal ? 'bold' : 'normal'};">
                        $${formatNumber((item.total || 0)/1000, 1)}K
                    </td>
                </tr>
            `;
        }).join('');
        

        
    } catch (error) {

    }
}

// Actualizar métricas de depreciaciones
function updateDepreciationMetrics() {
    try {
        const data = modelData.depreciation || {};
        const investments = modelData.investments || {};
        
        // Calcular CAPEX total desde la nueva estructura
        let totalCapex = 0;
        Object.keys(investments).forEach(year => {
            if (investments[year] && investments[year].total) {
                totalCapex += investments[year].total;
            }
        });
        
        // Total Depreciable Amount
        const totalDepreciableElement = document.getElementById('totalDepreciableAmount');
        if (totalDepreciableElement) {
            totalDepreciableElement.textContent = `$${formatNumber((data.totalDepreciableAmount || 0)/1000, 1)}K`;
        }
        
        // Total Depreciation
        const totalDepreciationElement = document.getElementById('totalDepreciation');
        if (totalDepreciationElement) {
            totalDepreciationElement.textContent = `$${formatNumber((data.totalDepreciation || 0)/1000, 1)}K`;
        }
        
        // Average Annual Depreciation
        const avgAnnualElement = document.getElementById('avgAnnualDepreciation');
        if (avgAnnualElement) {
            avgAnnualElement.textContent = `$${formatNumber((data.avgAnnualDepreciation || 0)/1000, 1)}K`;
        }
        
        // Depreciation Percentage of CAPEX
        const depreciationPercentElement = document.getElementById('depreciationPercent');
        if (depreciationPercentElement) {
            const percentage = totalCapex > 0 ? ((data.totalDepreciation || 0) / totalCapex) * 100 : 0;
            depreciationPercentElement.textContent = `${percentage.toFixed(1)}%`;
        }
        
        // Residual Value Amount
        const residualValueElement = document.getElementById('residualValueAmount');
        if (residualValueElement) {
            const schedule = data.schedule || [];
            const totalResidual = schedule.reduce((sum, item) => sum + (item.residualValue || 0), 0);
            residualValueElement.textContent = `$${formatNumber(totalResidual/1000, 1)}K`;
        }
        

        
    } catch (error) {

    }
}

// Obtener datos de depreciación para exportación
function getDepreciationData() {
    try {
        const data = modelData.depreciation || {};
        const schedule = data.schedule || [];
        
        return {
            summary: {
                'Total Depreciación': data.totalDepreciation || 0,
                'Depreciación Anual Promedio': data.avgAnnualDepreciation || 0,
                'Total Depreciable': data.totalDepreciableAmount || 0,
                'Método': data.method === 'linear' ? 'Línea Recta' : 'Acelerada',
                'Valor Residual %': (data.residualValuePct || 0) * 100
            },
            schedule: schedule
        };
        
    } catch (error) {

        return { summary: {}, schedule: [] };
    }
}

// Debug helper para depreciaciones
function debugDepreciation() {

    
    const capexData = modelData.investments?.capexBreakdown || [];

    
    return modelData.depreciation;
}

// Exportar funciones globalmente
if (typeof window !== 'undefined') {
    window.calculateDepreciations = calculateDepreciations;
    window.getDepreciationData = getDepreciationData;
    window.debugDepreciation = debugDepreciation;
}
