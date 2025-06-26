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
        
        // Tráfico base con crecimiento DECRECIENTE por año
        let yearlyTraffic;
        if (year === 2025) {
            // Tráfico inicial más conservador para el primer año
            yearlyTraffic = params.initialTraffic;
        } else {
            // Usar el patrón de crecimiento decreciente definido en config
            // const trafficGrowthPattern = params.trafficGrowthPattern || [1.00, 0.80, 0.50, 0.30, 0.20];
             const trafficGrowthPattern = params.trafficGrowthPattern || [1.00, 0.90, 0.80, 0.70, 0.60];
            let cumulativeTraffic = params.initialTraffic;
            for (let i = 1; i <= yearIndex; i++) {
                const currentGrowthRate = trafficGrowthPattern[Math.min(i - 1, trafficGrowthPattern.length - 1)];
                cumulativeTraffic *= (1 + currentGrowthRate);
            }
            yearlyTraffic = cumulativeTraffic;
        }
        
        // CONVERSIÓN con mejora DECRECIENTE usando patrón de config
        let conversionRate;
        if (year === 2025) {
            conversionRate = params.initialConversion;
        } else {
            // Usar el patrón de mejora decreciente definido en config
            const conversionGrowthPattern = params.conversionGrowthPattern || [0.40, 0.25, 0.15, 0.10, 0.05];
            
            let cumulativeConversion = params.initialConversion;
            for (let i = 1; i <= yearIndex; i++) {
                const currentGrowthRate = conversionGrowthPattern[Math.min(i - 1, conversionGrowthPattern.length - 1)];
                cumulativeConversion *= (1 + currentGrowthRate);
            }
            conversionRate = Math.min(cumulativeConversion, 0.08); // Máximo 8%
        }
        
        // Ticket size con crecimiento premium
        const ticketSize = params.avgTicket * (1 + Math.max(0, yearIndex - 1) * 0.08); // Sin crecimiento en 2025

        revenues[year] = {};
        
        Object.keys(marketDistribution).forEach(market => {
            const marketData = marketDistribution[market];
            
            // En 2025, solo Chile tiene ingresos (México inicia en 2026)
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
                // En años posteriores, distribución entre Chile (65%) y México (35%)
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
    
    console.log('✅ Ingresos calculados OPTIMIZADOS - Solo Chile (2025) + México (2026+):', {
        '2025 Chile (6 meses)': `$${(revenues[2025].chile.netRevenue/1000).toFixed(0)}K`,
        '2026 Chile + México (+100% tráfico, +40% conversión)': `$${(Object.values(revenues[2026]).reduce((sum, market) => sum + market.netRevenue, 0)/1000).toFixed(0)}K`,
        '2027 Chile + México (+80% tráfico, +25% conversión)': `$${(Object.values(revenues[2027]).reduce((sum, market) => sum + market.netRevenue, 0)/1000).toFixed(0)}K`,
        '2030 Chile + México (+20% tráfico, +5% conversión)': `$${(Object.values(revenues[2030]).reduce((sum, market) => sum + market.netRevenue, 0)/1000).toFixed(0)}K`,
        'Distribución 2030': 'Chile 65% | México 35%'
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
                            cell.style.fontStyle = 'italic';
                        } else {
                            cell.innerHTML = Math.round(value).toLocaleString();
                        }
                        break;
                    case 'percentage':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = '-';
                            cell.style.color = '#6b7280';
                            cell.style.fontStyle = 'italic';
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
                            cell.style.fontStyle = 'italic';
                        } else {
                            cell.innerHTML = `$${Math.round(value)}`;
                        }
                        break;
                    case 'revenue':
                        if (year === 2025 && market !== 'chile') {
                            cell.innerHTML = market === 'mexico' ? 'Inicia 2026' : '-';
                            cell.style.color = '#6b7280';
                            cell.style.fontStyle = 'italic';
                            cell.style.fontSize = '0.85em';
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

    // Total consolidado optimizado
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.insertCell(0).innerHTML = 'TOTAL REVENUE OPTIMIZADO (USD)';
    
    for (let year = 2025; year <= 2030; year++) {
        const yearTotal = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (revenues[year] && revenues[year][market] ? revenues[year][market].netRevenue : 0);
        }, 0);
        const cell = totalRow.insertCell();
        cell.innerHTML = `$${(yearTotal/1000000).toFixed(1)}M`;
        if (year === 2025) {
            cell.innerHTML += ' (Solo Chile)';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#dc2626'; // Color rojo para Chile
        } else if (year === 2026) {
            cell.innerHTML += ' (Chile + México)';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#059669'; // Color verde para expansión
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

    // Calcular CAC promedio (Customer Acquisition Cost)
    // NUEVA LÓGICA: Calcula el CAC basado en el delta de clientes nuevos año a año
    // - 2025: Todos los clientes son nuevos (base inicial)
    // - 2026-2030: Solo se cuentan los clientes incrementales respecto al año anterior
    // Esto es más preciso que sumar todos los clientes de todos los años
    const businessParams = getBusinessParams();
    let totalMarketingSpend = 0;
    let totalNewCustomers = 0;
    let previousYearOrders = 0;
    
    // Calcular gasto de marketing y clientes nuevos año a año (delta)
    for (let year = 2025; year <= 2030; year++) {
        const yearRevenue = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (revenues[year] && revenues[year][market] ? revenues[year][market].netRevenue : 0);
        }, 0);
        
        const yearMarketingSpend = yearRevenue * businessParams.marketingPct;
        totalMarketingSpend += yearMarketingSpend;
        
        const yearOrders = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (revenues[year] && revenues[year][market] ? revenues[year][market].orders : 0);
        }, 0);
        
        // En el primer año (2025), todos son clientes nuevos
        // En años posteriores, solo el delta respecto al año anterior
        if (year === 2025) {
            totalNewCustomers += yearOrders;
        } else {
            const newCustomersDelta = yearOrders - previousYearOrders;
            totalNewCustomers += Math.max(0, newCustomersDelta); // Solo sumar si hay crecimiento
        }
        
        previousYearOrders = yearOrders;
    }
    
    const avgCAC = totalNewCustomers > 0 ? totalMarketingSpend / totalNewCustomers : 0;

    // Calcular LTV (Customer Lifetime Value)
    // Usaremos el ticket promedio de 2030 y asumiremos:
    // - 2.5 compras por año por cliente
    // - 3 años de vida útil del cliente promedio
    // - 20% de margen neto promedio
    const avgTicket2030 = revenues[2030] && revenues[2030].chile ? revenues[2030].chile.avgTicket : 0;
    const purchasesPerYear = 2.5; // Asunción conservadora para vinos premium
    const customerLifetimeYears = 3; // Asunción de retención promedio
    const netMarginPct = 0.11; // 11% margen neto después de costos

    const avgLTV = avgTicket2030 * purchasesPerYear * customerLifetimeYears * netMarginPct;
    const ltvCacRatio = avgCAC > 0 ? avgLTV / avgCAC : 0;

    // Actualizar elementos si existen
    const elements = {
        'totalRevenue2030': `$${(revenue2030/1000000).toFixed(1)}M`,
        'totalOrders2030': Math.round(orders2030).toLocaleString(),
        'avgGrowthRate': `${(cagr * 100).toFixed(1)}%`,  // CAGR desde Chile 2025
        'conversionEvolution': `+${conversionGrowth.toFixed(1)}pp`,  // pp = puntos porcentuales
        'customerCAC': `$${Math.round(avgCAC)}`,  // CAC promedio
        'customerLTV': `$${Math.round(avgLTV)}`,  // LTV promedio
        'ltvCacRatio': `${ltvCacRatio.toFixed(1)}x`,  // Ratio LTV/CAC
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
        'Conversión Chile': `${initialConversion.toFixed(2)}% → ${finalConversion.toFixed(2)}%`,
        'CAC Promedio (optimizado)': elements.customerCAC,
        'LTV Promedio': elements.customerLTV,
        'Ratio LTV/CAC': elements.ltvCacRatio,
        'Marketing Total (2025-2030)': `$${(totalMarketingSpend/1000).toFixed(0)}K`,
        'Clientes Nuevos DELTA (2025-2030)': Math.round(totalNewCustomers).toLocaleString()
    });
    
    // Log detallado del cálculo de CAC para debugging
    console.log('📊 Cálculo detallado de CAC:', {
        'Método': 'Delta año a año (no acumulativo)',
        'Marketing Total': `$${(totalMarketingSpend/1000).toFixed(1)}K`,
        'Clientes Nuevos (Delta)': Math.round(totalNewCustomers).toLocaleString(),
        'CAC Resultado': `$${Math.round(avgCAC)}`
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
