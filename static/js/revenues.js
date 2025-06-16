// ============================================================================
// REVENUES.JS - PROYECCIÓN DE INGRESOS POR PAÍS
// ============================================================================

function calculateRevenues() {
    console.log('📊 Calculando proyección de ingresos por país...');
    
    const params = getBusinessParams();
    const revenues = {};
    
    for (let year = 2026; year <= 2030; year++) {
        const yearIndex = year - 2026;
        const yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex + 1);
        
        // CONVERSIÓN CRECIENTE: Mejora gradual año a año
        // Fórmula: conversión_año = conversión_inicial * (1 + tasa_mejora) ^ años
        const conversionRate = Math.min(
            params.initialConversion * Math.pow(1 + params.conversionGrowthRate, yearIndex), 
            0.08 // Máximo 8%
        );
        
        const ticketSize = params.avgTicket * (1 + yearIndex * 0.08); // Crecimiento premium 8% anual

        revenues[year] = {};
        
        Object.keys(marketDistribution).forEach(market => {
            const marketData = marketDistribution[market];
            const marketTraffic = yearlyTraffic * marketData.weight * 12; // Mensual * 12
            const orders = marketTraffic * conversionRate;
            const localPrice = ticketSize * marketData.premium;
            const grossRevenue = orders * localPrice;
            const netRevenue = grossRevenue * 0.99; // Fees de procesamiento
            
            revenues[year][market] = {
                traffic: marketTraffic,
                conversionRate: conversionRate * 100, // Guardar como porcentaje
                orders: orders,
                avgTicket: localPrice,
                grossRevenue: grossRevenue,
                netRevenue: netRevenue
            };
        });
    }

    updateRevenuesTable(revenues);
    updateRevenueMetrics(revenues);
    modelData.revenues = revenues;
    
    console.log('✅ Revenues calculados con conversión creciente:', {
        '2026': `${(revenues[2026].mexico.conversionRate).toFixed(2)}%`,
        '2030': `${(revenues[2030].mexico.conversionRate).toFixed(2)}%`,
        'Growth': `${(((revenues[2030].mexico.conversionRate / revenues[2026].mexico.conversionRate) - 1) * 100).toFixed(1)}%`
    });
}

function updateRevenuesTable(revenues) {
    const tbody = document.getElementById('ingresosBody');
    if (!tbody) {
        console.warn('⚠️ Tabla ingresos no encontrada');
        return;
    }
    
    tbody.innerHTML = '';

    // Por cada mercado
    Object.keys(marketDistribution).forEach(market => {
        // Header del mercado
        const headerRow = tbody.insertRow();
        headerRow.className = 'category-header';
        headerRow.insertCell(0).innerHTML = marketDistribution[market].label.toUpperCase();
        headerRow.insertCell(1).innerHTML = '2026';
        headerRow.insertCell(2).innerHTML = '2027';
        headerRow.insertCell(3).innerHTML = '2028';
        headerRow.insertCell(4).innerHTML = '2029';
        headerRow.insertCell(5).innerHTML = '2030';

        // Métricas del mercado
        const metrics = [
            { key: 'traffic', label: 'Tráfico Anual', format: 'number' },
            { key: 'conversionRate', label: 'Tasa Conversión (%)', format: 'percentage' },
            { key: 'orders', label: 'Órdenes', format: 'number' },
            { key: 'avgTicket', label: 'Ticket Promedio', format: 'currency' },
            { key: 'netRevenue', label: 'Revenue Neto', format: 'revenue' }
        ];
        
        metrics.forEach(metric => {
            const row = tbody.insertRow();
            row.className = 'subcategory';
            row.insertCell(0).innerHTML = `├─ ${metric.label}`;
            
            for (let year = 2026; year <= 2030; year++) {
                const value = revenues[year] && revenues[year][market] ? revenues[year][market][metric.key] : 0;
                const cell = row.insertCell(year - 2025);
                
                switch (metric.format) {
                    case 'number':
                        cell.innerHTML = Math.round(value).toLocaleString();
                        break;
                    case 'percentage':
                        cell.innerHTML = `${value.toFixed(2)}%`;
                        if (year > 2026) {
                            cell.style.color = '#28a745';
                            cell.style.fontWeight = 'bold';
                        }
                        break;
                    case 'currency':
                        cell.innerHTML = `$${Math.round(value)}`;
                        break;
                    case 'revenue':
                        cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
                        break;
                }
            }
        });
        
        // Separador
        const separator = tbody.insertRow();
        separator.style.height = '10px';
    });

    // Total consolidado
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.insertCell(0).innerHTML = 'TOTAL REVENUE (USD)';
    
    for (let year = 2026; year <= 2030; year++) {
        const yearTotal = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (revenues[year] && revenues[year][market] ? revenues[year][market].netRevenue : 0);
        }, 0);
        totalRow.insertCell().innerHTML = `$${(yearTotal/1000000).toFixed(1)}M`;
    }
}

function updateRevenueMetrics(revenues) {
    if (!revenues[2030] || !revenues[2026]) return;

    const revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
        return sum + (revenues[2030][market] ? revenues[2030][market].netRevenue : 0);
    }, 0);
    
    const orders2030 = Object.keys(marketDistribution).reduce((sum, market) => {
        return sum + (revenues[2030][market] ? revenues[2030][market].orders : 0);
    }, 0);

    const revenue2026 = Object.keys(marketDistribution).reduce((sum, market) => {
        return sum + (revenues[2026][market] ? revenues[2026][market].netRevenue : 0);
    }, 0);

    const cagr = revenue2026 > 0 ? Math.pow(revenue2030 / revenue2026, 1/4) - 1 : 0;

    // Calcular mejora en conversión (los datos ya están en %)
    const initialConversion = revenues[2026].mexico?.conversionRate || 0; // Ya en %
    const finalConversion = revenues[2030].mexico?.conversionRate || 0; // Ya en %
    const conversionGrowth = finalConversion - initialConversion; // Diferencia en puntos porcentuales

    // Calcular inversión en inventario
    const inventoryParams = getInventoryParams();
    const totalBottlesNeeded = (inventoryParams.initialStockMonths || 3) * 1000; // meses * 1000 botellas
    const containersNeeded = Math.ceil(totalBottlesNeeded / (inventoryParams.bottlesPerContainer || 1200));
    const inventoryInvestment = containersNeeded * (inventoryParams.containerCost || 8500);

    // Actualizar elementos si existen
    const elements = {
        'totalRevenue2030': `$${(revenue2030/1000000).toFixed(1)}M`,
        'totalOrders2030': Math.round(orders2030).toLocaleString(),
        'avgGrowthRate': `${(cagr * 100).toFixed(1)}%`,  // Corregido el ID
        'conversionEvolution': `+${conversionGrowth.toFixed(1)}pp`,  // pp = puntos porcentuales
        'inventoryInvestment': `$${(inventoryInvestment/1000).toFixed(0)}K`,  // Pestaña 1
        'inventoryInvestment2': `$${(inventoryInvestment/1000).toFixed(0)}K`  // Pestaña 2
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = elements[id];
        }
    });
    
    console.log('📈 Métricas de revenue actualizadas:', {
        'Revenue 2030': elements.totalRevenue2030,
        'CAGR': elements.avgGrowthRate,
        'Conversion Growth': elements.conversionEvolution,
        'Inventario': elements.inventoryInvestment
    });
}

// Función para exportar datos de ingresos a Excel
function createRevenuesSheet() {
    const data = [
        ['PROYECCIÓN DE INGRESOS POR PAÍS', '', '', '', '', ''],
        ['País/Métrica', '2026', '2027', '2028', '2029', '2030'],
        []
    ];
    
    if (modelData.revenues) {
        Object.keys(marketDistribution).forEach(market => {
            const marketLabel = marketDistribution[market].label;
            
            // Header del mercado
            data.push([marketLabel.toUpperCase(), '', '', '', '', '']);
            
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
                for (let year = 2026; year <= 2030; year++) {
                    const value = modelData.revenues[year] && modelData.revenues[year][market] ? 
                        modelData.revenues[year][market][metric.key] : 0;
                    row.push(value);
                }
                data.push(row);
            });
            
            data.push([]); // Separador
        });
        
        // Total
        data.push(['TOTAL REVENUE (USD)', '', '', '', '', '']);
        const totalRow = ['Total'];
        for (let year = 2026; year <= 2030; year++) {
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
