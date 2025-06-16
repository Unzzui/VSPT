// Funciones para calcular y mostrar CAPEX progresivo e inventario inicial

function calculateProgressiveCapex() {
    // Obtener parámetros de inventario
    const bottlesPerContainer = parseInt(document.getElementById('bottlesPerContainer')?.value || 1200);
    const containerCost = parseInt(document.getElementById('containerCost')?.value || 8500);
    const initialStock = parseInt(document.getElementById('initialStock')?.value || 3);
    
    // Calcular inventario inicial basado en stock requerido
    const totalBottlesNeeded = initialStock * 1000; // Stock en miles de botellas
    const containersNeeded = Math.ceil(totalBottlesNeeded / bottlesPerContainer);
    const inventoryInvestment = containersNeeded * containerCost;
    
    // CAPEX progresivo según especificaciones (total US$800K distribuido + inventario)
    const baseCapex = 800000; // CAPEX base fijo
    
    const progressiveCapex = {
        2025: {
            'Digital Platform Core': 120000,
            'Web Development Base': 80000,
            'SEO/SEM Setup': 35000,
            'Mexico Setup & Certifications': 60000,
            'Brazil Initial Setup': 45000,
            'Legal & Compliance Base': 20000,
            'Initial Inventory Mexico': inventoryInvestment * 0.35,
            'Initial Inventory Brazil': inventoryInvestment * 0.25,
            total: 360000 + inventoryInvestment * 0.6 // 45% del CAPEX base + 60% del inventario
        },
        2026: {
            'International Expansion': 80000,
            'Canada Market Setup': 50000,
            'USA Market Setup': 60000,
            'Warehouses Development': 50000,
            'Canada Inventory': inventoryInvestment * 0.20,
            'USA Inventory': inventoryInvestment * 0.20,
            total: 240000 + inventoryInvestment * 0.4 // 30% del CAPEX base + 40% del inventario
        },
        2027: {
            'Technology Upgrades': 60000,
            'Platform Optimization': 40000,
            'Additional Countries Prep': 35000,
            'Scaling Infrastructure': 25000,
            total: 160000 // 20% del CAPEX base
        },
        2028: {
            'Final Optimizations': 25000,
            'Contingency & Adjustments': 15000,
            total: 40000 // 5% del CAPEX base
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
    updateCapexMetrics(progressiveCapex, capexFinancing, inventoryInvestment);
    updateCapexTable(progressiveCapex, capexFinancing);
    
    modelData.investments = progressiveCapex;
    modelData.capexFinancing = capexFinancing;
}

function updateCapexMetrics(capex, financing, inventoryInvestment) {
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
    
    const inventoryElement = document.getElementById('inventoryInvestment');
    if (inventoryElement) {
        inventoryElement.innerHTML = `$${(inventoryInvestment/1000).toFixed(0)}K`;
    }
}

function updateCapexTable(capex, financing) {
    const tbody = document.getElementById('inversionesBody');
    tbody.innerHTML = '';

    // Encabezados para mostrar la distribución anual
    const headerRow = tbody.insertRow();
    headerRow.className = 'category-header';
    headerRow.insertCell(0).innerHTML = 'CAPEX PROGRESIVO';
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
