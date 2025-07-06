// Funciones para calcular y mostrar CAPEX actualizado
// CAPEX ACTUALIZADO: Aumentado de $565K a $850K (+50.4%)
// Distribución detallada por componentes reales

function calculateOptimizedCapex() {

    
    // CAPEX ACTUALIZADO - Aumentado 50.4% vs optimizado (componentes reales)
    const optimizedCapex = 850000; // CAPEX actualizado total (era 565K)
    
    const progressiveCapex = {
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
            'Contingencia': 30000,
            total: 382500 // 45% del CAPEX actualizado
        },
        2026: {
            'Legal Ongoing - México': 25000,
            'Legal Ongoing - Chile': 15000,
            'Marketing - Expansión Digital': 50000,
            'Marketing - Content Creation': 25000,
            'Operaciones - Optimización Logística': 20000,
            'Tecnología - Upgrades Plataforma': 40000,
            'Personal - Expansión Equipo': 35000,
            'Contingencia': 15000,
            total: 255000 // 30% del CAPEX actualizado
        },
        2027: {
            'Tecnología - Mejoras Avanzadas': 60000,
            'Marketing - Campañas Premium': 45000,
            'Operaciones - Automatización': 30000,
            'Legal - Compliance Avanzado': 20000,
            'Personal - Especialistas': 25000,
            'Contingencia': 10000,
            total: 170000 // 20% del CAPEX actualizado
        },
        2028: {
            'Tecnología - Optimizaciones Finales': 30000,
            'Marketing - Consolidación': 20000,
            'Operaciones - Eficiencia': 15000,
            'Legal - Mantenimiento': 10000,
            'Contingencia': 5000,
            total: 42500 // 5% del CAPEX actualizado
        }
    };

    // Calcular estructura deuda/equity para cada año
    const params = getFinancialParams();
    const capexFinancing = {};
    
    Object.keys(progressiveCapex).forEach(year => {
        const yearCapex = progressiveCapex[year].total;
        capexFinancing[year] = {
            capex: yearCapex,
            debt: yearCapex * params.debtRatio,
            equity: yearCapex * params.equityRatio
        };
    });

    // Actualizar métricas en el UI
    updateOptimizedCapexMetrics(progressiveCapex, capexFinancing);
    updateOptimizedCapexTable(progressiveCapex, capexFinancing);
    
    // Asegurar que modelData existe
    if (typeof modelData === 'undefined') {
        window.modelData = {};
    }
    
    modelData.investments = progressiveCapex;
    modelData.capexFinancing = capexFinancing;
    

}

function updateOptimizedCapexMetrics(capex, financing) {
    const totalCapex = Object.values(capex).reduce((sum, year) => sum + year.total, 0);
    const totalDebt = Object.values(financing).reduce((sum, year) => sum + year.debt, 0);
    const totalEquity = Object.values(financing).reduce((sum, year) => sum + year.equity, 0);
    
    // Actualizar métricas si existen los elementos
    const totalCapexElement = document.getElementById('totalCapex');
    if (totalCapexElement) {
        totalCapexElement.innerHTML = `$${(totalCapex/1000).toFixed(0)}K`;
    }
    
    const totalDebtElement = document.getElementById('totalDebt');
    if (totalDebtElement) {
        totalDebtElement.innerHTML = `$${(totalDebt/1000).toFixed(0)}K`;
    }
    
    const totalEquityElement = document.getElementById('totalEquity');
    if (totalEquityElement) {
        totalEquityElement.innerHTML = `$${(totalEquity/1000).toFixed(0)}K`;
    }
}

function updateOptimizedCapexTable(capex, financing) {
    const tbody = document.getElementById('inversionesBody');
    if (!tbody) {
        console.warn('⚠️ Elemento inversionesBody no encontrado');
        return;
    }
    
    tbody.innerHTML = '';

    // Encabezados para mostrar la distribución anual actualizada
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'CAPEX';
    headerRow.insertCell(1).innerHTML = '2025 (45%)';
    headerRow.insertCell(2).innerHTML = '2026 (30%)';
    headerRow.insertCell(3).innerHTML = '2027 (20%)';
    headerRow.insertCell(4).innerHTML = '2028 (5%)';
    headerRow.insertCell(5).innerHTML = 'TOTAL';

    // Items por año
    const allItems = new Set();
    Object.keys(capex).forEach(year => {
        Object.keys(capex[year]).forEach(item => {
            if (item !== 'total') allItems.add(item);
        });
    });

    allItems.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = item;
        
        let itemTotal = 0;
        for (let year = 2025; year <= 2028; year++) {
            const value = capex[year] && capex[year][item] ? capex[year][item] : 0;
            itemTotal += value;
            row.insertCell(year - 2024).innerHTML = value ? `$${(value/1000).toFixed(0)}K` : '-';
        }
        row.insertCell(5).innerHTML = `$${(itemTotal/1000).toFixed(0)}K`;
    });

    // Totales por año
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.insertCell(0).innerHTML = 'TOTAL CAPEX';
    
    let grandTotal = 0;
    for (let year = 2025; year <= 2028; year++) {
        const yearTotal = capex[year] ? capex[year].total : 0;
        grandTotal += yearTotal;
        totalRow.insertCell(year - 2024).innerHTML = `$${(yearTotal/1000).toFixed(0)}K`;
    }
    totalRow.insertCell(5).innerHTML = `$${(grandTotal/1000).toFixed(0)}K`;

    // Agregar fila de comparación vs CAPEX anterior
    const comparisonRow = tbody.insertRow();
    comparisonRow.className = 'total-row';
    comparisonRow.style.backgroundColor = '#fff3cd';
    comparisonRow.style.color = '#856404';
    comparisonRow.insertCell(0).innerHTML = 'INCREMENTO vs Anterior (565K)';
    comparisonRow.insertCell(1).innerHTML = '';
    comparisonRow.insertCell(2).innerHTML = '';
    comparisonRow.insertCell(3).innerHTML = '';
    comparisonRow.insertCell(4).innerHTML = '';
    const increase = grandTotal - 565000;
    const increasePercent = (increase / 565000 * 100).toFixed(1);
    comparisonRow.insertCell(5).innerHTML = `+$${(increase/1000).toFixed(0)}K (+${increasePercent}%)`;

    // Estructura de financiamiento
    const financeHeaderRow = tbody.insertRow();
    financeHeaderRow.className = 'category-header';
    financeHeaderRow.style.backgroundColor = '#e8f5e8';
    financeHeaderRow.insertCell(0).innerHTML = 'ESTRUCTURA FINANCIAMIENTO';
    financeHeaderRow.insertCell(1).innerHTML = '2025';
    financeHeaderRow.insertCell(2).innerHTML = '2026';
    financeHeaderRow.insertCell(3).innerHTML = '2027';
    financeHeaderRow.insertCell(4).innerHTML = '2028';
    financeHeaderRow.insertCell(5).innerHTML = 'TOTAL';

    // Obtener parámetros actuales
    const params = getFinancialParams();
    
    // Fila de deuda
    const debtRow = tbody.insertRow();
    debtRow.insertCell(0).innerHTML = `Financiamiento Deuda (${(params.debtRatio * 100).toFixed(0)}%)`;
    let totalDebt = 0;
    for (let year = 2025; year <= 2028; year++) {
        const debt = financing[year] ? financing[year].debt : 0;
        totalDebt += debt;
        debtRow.insertCell(year - 2024).innerHTML = debt ? `$${(debt/1000).toFixed(0)}K` : '-';
    }
    debtRow.insertCell(5).innerHTML = `$${(totalDebt/1000).toFixed(0)}K`;

    // Fila de equity
    const equityRow = tbody.insertRow();
    equityRow.insertCell(0).innerHTML = `Aporte Equity (${(params.equityRatio * 100).toFixed(0)}%)`;
    let totalEquity = 0;
    for (let year = 2025; year <= 2028; year++) {
        const equity = financing[year] ? financing[year].equity : 0;
        totalEquity += equity;
        equityRow.insertCell(year - 2024).innerHTML = equity ? `$${(equity/1000).toFixed(0)}K` : '-';
    }
    equityRow.insertCell(5).innerHTML = `$${(totalEquity/1000).toFixed(0)}K`;
}