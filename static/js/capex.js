// Funciones para calcular y mostrar CAPEX optimizado
// CAPEX OPTIMIZADO: Reducido de $800K a $565K (-29.4%)
// Eliminaciones: Brasil ($45K), Canadá ($50K), USA ($60K), Países Adicionales ($35K)
// Reducciones: Warehouses ($25K), Expansión Internacional ($40K)

function calculateOptimizedCapex() {
    console.log('🏗️ Calculando CAPEX optimizado...');
    
    // CAPEX OPTIMIZADO - Reducido 29.4% vs original (eliminando Brasil, Canadá, USA)
    const optimizedCapex = 565000; // CAPEX optimizado total (era 800K)
    
    const progressiveCapex = {
        2025: {
            'Plataforma Digital Core': 120000,
            'Desarrollo Web Base': 80000,
            'Configuración SEO/SEM': 35000,
            'Setup México y Certificaciones': 60000,
            'Base Legal y Compliance': 20000,
            total: 315000 // 56% del CAPEX optimizado
        },
        2026: {
            'Expansión Internacional': 40000, // Reducido de 80K
            'Expansión Mercado México': 55000,
            'Desarrollo Almacenes (Reducido)': 25000, // Reducido de 50K
            'Mejoras de Plataforma': 15000,
            total: 135000 // 24% del CAPEX optimizado
        },
        2027: {
            'Upgrades Tecnológicos': 60000,
            'Optimización de Plataforma': 40000,
            total: 100000 // 18% del CAPEX optimizado
        },
        2028: {
            'Optimizaciones Finales': 15000,
            'Contingencia y Ajustes': 5000,
            total: 20000 // 2% del CAPEX optimizado
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
    
    // Calcular total CAPEX para el log
    const totalCapex = Object.values(progressiveCapex).reduce((sum, year) => sum + year.total, 0);
    console.log('✅ CAPEX optimizado calculado:', {
        total: `$${(totalCapex/1000).toFixed(0)}K`,
        ahorro: `$${((800000 - totalCapex)/1000).toFixed(0)}K`,
        reduccion: `${((800000 - totalCapex)/800000*100).toFixed(1)}%`
    });
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

    // Encabezados para mostrar la distribución anual optimizada
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'CAPEX';
    headerRow.insertCell(1).innerHTML = '2025 (56%)';
    headerRow.insertCell(2).innerHTML = '2026 (24%)';
    headerRow.insertCell(3).innerHTML = '2027 (18%)';
    headerRow.insertCell(4).innerHTML = '2028 (2%)';
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

    // Agregar fila de comparación vs CAPEX original
    const comparisonRow = tbody.insertRow();
    comparisonRow.className = 'total-row';
    comparisonRow.style.backgroundColor = '#d4edda';
    comparisonRow.style.color = '#155724';
    comparisonRow.insertCell(0).innerHTML = 'AHORRO vs Original (800K)';
    comparisonRow.insertCell(1).innerHTML = '';
    comparisonRow.insertCell(2).innerHTML = '';
    comparisonRow.insertCell(3).innerHTML = '';
    comparisonRow.insertCell(4).innerHTML = '';
    const savings = 800000 - grandTotal;
    const savingsPercent = (savings / 800000 * 100).toFixed(1);
    comparisonRow.insertCell(5).innerHTML = `-$${(savings/1000).toFixed(0)}K (-${savingsPercent}%)`;

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