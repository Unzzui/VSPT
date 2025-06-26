// ============================================================================
// COSTS.JS - COSTOS OPERATIVOS Y ESTRUCTURALES
// ============================================================================

function calculateCosts() {
    
    const params = getFinancialParams();
    const businessParams = getBusinessParams();
    const costs = {};
    
    for (let year = 2025; year <= 2030; year++) {
        costs[year] = {
            cogs: 0,
            operatingExpenses: {
                salesSalary: 0,
                marketing: 0,
                administrative: 0,
                logistics: 0,
                technology: 0,
                total: 0
            },
            fixedCosts: {
                personnel: 0,
                infrastructure: 0,
                compliance: 0,
                insurance: 0,
                total: 0
            },
            totalCosts: 0
        };
        
        // Solo calcular costos operativos desde 2025 cuando empiecen las ventas (Chile únicamente en 2025)
        if (year >= 2025 && modelData.revenues && modelData.revenues[year]) {
            // Calcular revenue total del año (en 2025 solo Chile contribuye)
            const yearRevenue = Object.keys(marketDistribution).reduce((sum, market) => {
                return sum + (modelData.revenues[year][market] ? modelData.revenues[year][market].netRevenue : 0);
            }, 0);
            
            // CORRECCIÓN: Ajustar para 6 meses de operación en 2025
            let operatingMonths = 12;
            if (year === 2025) {
                operatingMonths = 6; // Solo 6 meses de operación en 2025
            }
            
            // COGS (Cost of Goods Sold) - 54% del revenue
            costs[year].cogs = yearRevenue * params.cogsPct;
            
            // Gastos operativos variables (proporcionales a los meses de operación)
            const operatingFactor = operatingMonths / 12;
            costs[year].operatingExpenses.marketing = yearRevenue * businessParams.marketingPct * operatingFactor;
            costs[year].operatingExpenses.logistics = yearRevenue * 0.08 * operatingFactor; // 8% logística
            costs[year].operatingExpenses.technology = yearRevenue * 0.05 * operatingFactor; // 5% tecnología
            costs[year].operatingExpenses.administrative = yearRevenue * 0.08 * operatingFactor; // 8% administrativos
            
            // Gastos operativos fijos (ajustados por año base 2025 y meses de operación)
            costs[year].operatingExpenses.salesSalary = businessParams.salesSalary * (1 + businessParams.inflation) ** (year - 2025) * operatingFactor;
            
            costs[year].operatingExpenses.total = 
                costs[year].operatingExpenses.salesSalary +
                costs[year].operatingExpenses.marketing +
                costs[year].operatingExpenses.administrative +
                costs[year].operatingExpenses.logistics +
                costs[year].operatingExpenses.technology;
        }
        
        // Costos fijos (existen desde 2025) - Ajustados para operación en 4 países
        const yearsSince2025 = year - 2025;
        // CORRECCIÓN: Ajustar costos fijos para 6 meses en 2025
        let fixedCostFactor = 1;
        if (year === 2025) {
            fixedCostFactor = 6 / 12; // Solo 6 meses
        }
        
        costs[year].fixedCosts.personnel = 80000 * Math.pow(1 + businessParams.inflation, yearsSince2025) * fixedCostFactor;
        costs[year].fixedCosts.infrastructure = 45000 * Math.pow(1 + businessParams.inflation, yearsSince2025) * fixedCostFactor;
        costs[year].fixedCosts.compliance = 25000 * Math.pow(1 + businessParams.inflation, yearsSince2025) * fixedCostFactor;
        costs[year].fixedCosts.insurance = 18000 * Math.pow(1 + businessParams.inflation, yearsSince2025) * fixedCostFactor;
        
        costs[year].fixedCosts.total = 
            costs[year].fixedCosts.personnel +
            costs[year].fixedCosts.infrastructure +
            costs[year].fixedCosts.compliance +
            costs[year].fixedCosts.insurance;
        
        // Total de costos
        costs[year].totalCosts = costs[year].cogs + costs[year].operatingExpenses.total + costs[year].fixedCosts.total;
    }
    
    updateCostsTable(costs);
    updateCostMetrics(costs);
    modelData.costs = costs;
    

}

function updateCostsTable(costs) {
    const tbody = document.getElementById('costosBody');
    if (!tbody) {
        console.warn('⚠️ Tabla costos no encontrada');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Header
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'ESTRUCTURA DE COSTOS';
    headerRow.insertCell(1).innerHTML = '2025';
    headerRow.insertCell(2).innerHTML = '2026';
    headerRow.insertCell(3).innerHTML = '2027';
    headerRow.insertCell(4).innerHTML = '2028';
    headerRow.insertCell(5).innerHTML = '2029';
    headerRow.insertCell(6).innerHTML = '2030';
    
    // COGS
    const cogsRow = tbody.insertRow();
    cogsRow.insertCell(0).innerHTML = 'Costo de Ventas (COGS)';
    for (let year = 2025; year <= 2030; year++) {
        const value = costs[year].cogs;
        cogsRow.insertCell(year - 2024).innerHTML = value > 0 ? `$${(value/1000).toFixed(0)}K` : '-';
    }
    
    // Gastos Operativos
    const opexHeader = tbody.insertRow();
    opexHeader.className = 'subcategory-header';
    opexHeader.insertCell(0).innerHTML = 'GASTOS OPERATIVOS';
    for (let i = 1; i <= 6; i++) opexHeader.insertCell(i).innerHTML = '';
    
    const opexItems = [
        { key: 'salesSalary', label: 'Salarios Ventas' },
        { key: 'marketing', label: 'Marketing & Publicidad' },
        { key: 'administrative', label: 'Administrativos' },
        { key: 'logistics', label: 'Logística' },
        { key: 'technology', label: 'Tecnología' }
    ];
    
    opexItems.forEach(item => {
        const row = tbody.insertRow();
        row.className = 'subcategory';
        row.insertCell(0).innerHTML = `├─ ${item.label}`;
        
        for (let year = 2025; year <= 2030; year++) {
            const value = costs[year].operatingExpenses[item.key];
            row.insertCell(year - 2024).innerHTML = value > 0 ? `$${(value/1000).toFixed(0)}K` : '-';
        }
    });
    
    // Total Gastos Operativos
    const opexTotalRow = tbody.insertRow();
    opexTotalRow.className = 'subtotal-row';
    opexTotalRow.insertCell(0).innerHTML = 'Total Gastos Operativos';
    for (let year = 2025; year <= 2030; year++) {
        const value = costs[year].operatingExpenses.total;
        opexTotalRow.insertCell(year - 2024).innerHTML = value > 0 ? `$${(value/1000).toFixed(0)}K` : '-';
    }
    
    // Costos Fijos
    const fixedHeader = tbody.insertRow();
    fixedHeader.className = 'subcategory-header';
    fixedHeader.insertCell(0).innerHTML = 'COSTOS FIJOS';
    for (let i = 1; i <= 6; i++) fixedHeader.insertCell(i).innerHTML = '';
    
    const fixedItems = [
        { key: 'personnel', label: 'Personal Base' },
        { key: 'infrastructure', label: 'Infraestructura' },
        { key: 'compliance', label: 'Cumplimiento' },
        { key: 'insurance', label: 'Seguros' }
    ];
    
    fixedItems.forEach(item => {
        const row = tbody.insertRow();
        row.className = 'subcategory';
        row.insertCell(0).innerHTML = `├─ ${item.label}`;
        
        for (let year = 2025; year <= 2030; year++) {
            const value = costs[year].fixedCosts[item.key];
            row.insertCell(year - 2024).innerHTML = `$${(value/1000).toFixed(0)}K`;
        }
    });
    
    // Total Costos Fijos
    const fixedTotalRow = tbody.insertRow();
    fixedTotalRow.className = 'subtotal-row';
    fixedTotalRow.insertCell(0).innerHTML = 'Total Costos Fijos';
    for (let year = 2025; year <= 2030; year++) {
        const value = costs[year].fixedCosts.total;
        fixedTotalRow.insertCell(year - 2024).innerHTML = `$${(value/1000).toFixed(0)}K`;
    }
    
    // TOTAL GENERAL
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.insertCell(0).innerHTML = 'TOTAL COSTOS';
    for (let year = 2025; year <= 2030; year++) {
        const value = costs[year].totalCosts;
        totalRow.insertCell(year - 2024).innerHTML = `$${(value/1000).toFixed(0)}K`;
    }
}

function updateCostMetrics(costs) {
    // Calcular métricas de eficiencia
    const revenue2030 = modelData.revenues && modelData.revenues[2030] ? 
        Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0) : 0;
    
    const costMargin2030 = revenue2030 > 0 ? (costs[2030].totalCosts / revenue2030) * 100 : 0;
    const cogsMargin2030 = revenue2030 > 0 ? (costs[2030].cogs / revenue2030) * 100 : 0;
    
    // Actualizar elementos del dashboard
    const elements = {
        'totalCosts2030': `$${(costs[2030].totalCosts/1000).toFixed(0)}K`,
        'costMargin': `${costMargin2030.toFixed(1)}%`,
        'cogsMargin': `${cogsMargin2030.toFixed(1)}%`,
        'fixedCosts2030': `$${(costs[2030].fixedCosts.total/1000).toFixed(0)}K`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
        }
    });
    

}

// Función para exportar datos de costos a Excel
// REMOVIDO: Esta función está implementada en utils.js para evitar duplicados
