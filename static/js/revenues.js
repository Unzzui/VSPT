// ============================================================================
// REVENUES.JS - PROYECCIÓN DE INGRESOS POR PAÍS
// ============================================================================

function calculateRevenues() {
    console.log('📊 Calculando proyección de ingresos por país...');
    
    const params = getBusinessParams();
    const revenues = {};
    
    // Incluir 2025 desde Q3 (6 meses de operación) - SOLO CHILE
    for (let year = 2025; year <= 2030; year++) {
        const yearIndex = year - 2025; // Cambiar base a 2025
        
        // Para 2025, solo 6 meses de operación (Q3-Q4)
        const monthsOfOperation = year === 2025 ? 6 : 12;
        
        // Tráfico base ajustado por año
        let yearlyTraffic;
        if (year === 2025) {
            // Tráfico inicial más conservador para el primer año
            yearlyTraffic = params.initialTraffic; // 50% del tráfico inicial para Q3-Q4
        } else {
            yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex);
        }
        
        // CONVERSIÓN CRECIENTE: Mejora gradual año a año
        let conversionRate;
        // if (year === 2025) {
        //     // Conversión inicial más baja para el primer año
        //     conversionRate = params.initialConversion * 1; // 70% de la conversión inicial
        // } else {
        conversionRate = Math.min(
            params.initialConversion * Math.pow(1 + params.conversionGrowthRate, yearIndex), 
            0.08 // Máximo 8%
        );
        // }
        
        // Ticket size con crecimiento premium
        const ticketSize = params.avgTicket * (1 + Math.max(0, yearIndex - 1) * 0.08); // Sin crecimiento en 2025

        revenues[year] = {};
        
        Object.keys(marketDistribution).forEach(market => {
            const marketData = marketDistribution[market];
            
            // En 2025, solo Chile tiene ingresos
            if (year === 2025 && market !== 'chile') {
                revenues[year][market] = {
                    traffic: 0,
                    conversionRate: 0,
                    orders: 0,
                    avgTicket: 0,
                    grossRevenue: 0,
                    netRevenue: 0
                };
                return;
            }
            
            // Calcular tráfico por mercado
            let marketTraffic;
            if (year === 2025) {
                // En 2025, Chile recibe TODO el tráfico (100%)
                marketTraffic = market === 'chile' ? yearlyTraffic * monthsOfOperation : 0;
            } else {
                // En años posteriores, distribución normal por peso de mercado
                marketTraffic = yearlyTraffic * marketData.weight * monthsOfOperation;
            }
            
            const orders = marketTraffic * conversionRate;
            const localPrice = ticketSize * marketData.premium;
            const grossRevenue = orders * localPrice;
            const netRevenue = grossRevenue; // Fees de procesamiento
            
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
    
    console.log('✅ Ingresos calculados - Solo Chile en 2025:', {
        '2025 Chile (6 meses)': `$${(revenues[2025].chile.netRevenue/1000).toFixed(0)}K`,
        '2026 Total': `$${(Object.values(revenues[2026]).reduce((sum, market) => sum + market.netRevenue, 0)/1000).toFixed(0)}K`,
        '2030 Total': `$${(Object.values(revenues[2030]).reduce((sum, market) => sum + market.netRevenue, 0)/1000).toFixed(0)}K`
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
        headerRow.insertCell(1).innerHTML = '2025';
        headerRow.insertCell(2).innerHTML = '2026';
        headerRow.insertCell(3).innerHTML = '2027';
        headerRow.insertCell(4).innerHTML = '2028';
        headerRow.insertCell(5).innerHTML = '2029';
        headerRow.insertCell(6).innerHTML = '2030';

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
            
            for (let year = 2025; year <= 2030; year++) {
                const value = revenues[year] && revenues[year][market] ? revenues[year][market][metric.key] : 0;
                const cell = row.insertCell(year - 2024);
                
                switch (metric.format) {
                    case 'number':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = '-';
                            cell.style.color = '#6b7280';
                        } else {
                            cell.innerHTML = Math.round(value).toLocaleString();
                        }
                        break;
                    case 'percentage':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = '-';
                            cell.style.color = '#6b7280';
                        } else {
                            cell.innerHTML = `${value.toFixed(2)}%`;
                            if (year > 2025) {
                                cell.style.color = '#28a745';
                                cell.style.fontWeight = 'bold';
                            }
                        }
                        break;
                    case 'currency':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = '-';
                            cell.style.color = '#6b7280';
                        } else {
                            cell.innerHTML = `$${Math.round(value)}`;
                        }
                        break;
                    case 'revenue':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = '-';
                            cell.style.color = '#6b7280';
                            cell.style.fontStyle = 'italic';
                        } else {
                            cell.innerHTML = `$${(value/1000).toFixed(0)}K`;
                            if (year === 2025) {
                                cell.style.fontStyle = 'italic';
                                cell.innerHTML += ' (6m)';
                            }
                        }
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
    
    for (let year = 2025; year <= 2030; year++) {
        const yearTotal = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (revenues[year] && revenues[year][market] ? revenues[year][market].netRevenue : 0);
        }, 0);
        const cell = totalRow.insertCell();
        cell.innerHTML = `$${(yearTotal/1000000).toFixed(1)}M`;
        if (year === 2025) {
            cell.innerHTML += ' (Chile)';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#dc2626'; // Color rojo para Chile
        }
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

    // Para CAGR, usar Chile 2025 vs Total 2030 para mostrar el crecimiento real
    const revenue2025Chile = revenues[2025].chile ? revenues[2025].chile.netRevenue : 0;
    const cagr = revenue2025Chile > 0 ? Math.pow(revenue2030 / revenue2025Chile, 1/5) - 1 : 0;

    // Calcular mejora en conversión usando Chile como base
    const initialConversion = revenues[2025].chile?.conversionRate || 0; // Ya en %
    const finalConversion = revenues[2030].chile?.conversionRate || 0; // Ya en %
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
        'avgGrowthRate': `${(cagr * 100).toFixed(1)}%`,  // CAGR desde Chile 2025
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
    
    console.log('✅ Métricas de ingresos actualizadas:', {
        'Revenue 2030': elements.totalRevenue2030,
        'CAGR (Chile 2025 → Total 2030)': elements.avgGrowthRate,
        'Conversión Chile': `${initialConversion.toFixed(2)}% → ${finalConversion.toFixed(2)}%`
    });
}

// Función para exportar datos de ingresos a Excel
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
