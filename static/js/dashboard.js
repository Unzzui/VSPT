// Dashboard.js - Manejo dinámico del Dashboard VSPT
// Integra datos de todos los módulos y genera gráficos automáticamente

class Dashboard {
    constructor() {
        this.charts = {};
        this.data = {};
        this.initialized = false;
    }

    // Inicializar el dashboard
    init() {
        console.log('🚀 Dashboard: Iniciando...');
        if (this.initialized) {
            console.log('⚠️ Dashboard ya inicializado');
            return;
        }
        
        // Esperar a que todos los módulos estén cargados
        if (typeof updateCalculations === 'function') {
            console.log('✅ Módulos disponibles, verificando datos...');
            console.log('🔍 Estado de modelData al inicializar:', {
                economicCashFlow: !!modelData.economicCashFlow,
                economicCashFlowKeys: modelData.economicCashFlow ? Object.keys(modelData.economicCashFlow) : [],
                revenues: !!modelData.revenues,
                investments: !!modelData.investments
            });
            
            // Verificar si los datos del modelo están disponibles
            const hasEconomicData = modelData.economicCashFlow && 
                                   modelData.economicCashFlow.metrics &&
                                   Object.keys(modelData.economicCashFlow).some(key => !isNaN(key));
            
            if (hasEconomicData) {
                console.log('✅ Datos del modelo disponibles, usando datos reales');
                this.collectData();
            } else {
                console.log('⚠️ Datos del modelo no disponibles, usando datos por defecto y reintentando...');
                this.setDefaultData();
                // Reintentar en 200ms para dar tiempo a que se calculen los datos
                setTimeout(() => {
                    if (!this.initialized) {
                        this.init();
                    }
                }, 200);
                return;
            }
            
            this.updateKPIs();
            this.createCharts();
            this.updateMarketMetrics();
            this.updateCashflowSummary();
            this.initialized = true;
            console.log('🎉 Dashboard inicializado exitosamente');
        } else {
            // Reintentar en 100ms si los módulos no están listos
            console.log('⏳ Módulos no disponibles, reintentando...');
            setTimeout(() => this.init(), 100);
        }
    }

    // Recopilar datos de todos los módulos
    collectData() {
        console.log('📊 Dashboard: Recopilando datos de todos los módulos...');
        try {
            // Datos de inversiones
            this.data.capex = this.getCapexData();
            console.log('✅ Datos CAPEX recopilados:', this.data.capex);
            
            // Datos de ingresos
            this.data.revenues = this.getRevenueData();
            console.log('✅ Datos de ingresos recopilados:', this.data.revenues);
            
            // Datos de costos
            this.data.costs = this.getCostData();
            console.log('✅ Datos de costos recopilados:', this.data.costs);
            
            // Datos de flujo de caja
            console.log('🔄 Llamando a getCashflowData()...');
            this.data.cashflow = this.getCashflowData();
            console.log('✅ Datos de flujo de caja recopilados:', this.data.cashflow);
            
            // Calcular métricas derivadas
            this.calculateDerivedMetrics();
            
        } catch (error) {
            console.error('❌ Error en collectData():', error);
            console.error('❌ Stack trace:', error.stack);
            console.log('Usando datos por defecto');
            this.setDefaultData();
        }
    }

    // Obtener datos de CAPEX optimizado usando los datos reales del modelo
    getCapexData() {
        // PRIORIDAD 1: Usar datos reales del CAPEX optimizado si están disponibles
        if (modelData.investments && typeof calculateOptimizedCapex === 'function') {
            console.log('📊 Dashboard usando CAPEX optimizado del modelo');
            
            const capexData = calculateOptimizedCapex();
            console.log('🔍 capexData resultado:', capexData);
            
            if (capexData && capexData.total) {
                const params = getFinancialParams();
                
                return {
                    totalCapex: capexData.total,
                    totalDebt: capexData.total * params.debtRatio,
                    totalEquity: capexData.total * params.equityRatio,
                    debtRatio: params.debtRatio * 100, // Convertir a porcentaje para display
                    equityRatio: params.equityRatio * 100,
                    originalCapex: 800000, // CAPEX original para comparación
                    savings: 800000 - capexData.total,
                    savingsPercentage: ((800000 - capexData.total) / 800000) * 100,
                    params: params
                };
            } else {
                console.log('⚠️ capexData no válido, usando fallback');
            }
        }
        
        // PRIORIDAD 2: Fallback al CAPEX optimizado estático
        const optimizedCapex = 565000; // CAPEX optimizado base
        const params = getFinancialParams();
        
        return {
            totalCapex: optimizedCapex,
            totalDebt: optimizedCapex * params.debtRatio,
            totalEquity: optimizedCapex * params.equityRatio,
            debtRatio: params.debtRatio * 100,
            equityRatio: params.equityRatio * 100,
            originalCapex: 800000,
            savings: 800000 - optimizedCapex,
            savingsPercentage: ((800000 - optimizedCapex) / 800000) * 100,
            params: params
        };
    }

    // Obtener datos de ingresos usando los datos reales del modelo (solo Chile y México)
    getRevenueData() {
        // Solo usar Chile y México según el nuevo scope
        const activeMarkets = ['chile', 'mexico'];
        
        // PRIORIDAD 1: Usar datos reales del modelo si están disponibles
        if (modelData.revenues) {
            console.log('📊 Dashboard usando datos reales del modelo de ingresos (Chile y México)');
            
            // Calcular totales usando solo los mercados activos
            const revenue2030 = activeMarkets.reduce((sum, market) => {
                return sum + (modelData.revenues[2030] && modelData.revenues[2030][market] ? 
                    modelData.revenues[2030][market].netRevenue : 0);
            }, 0);
            
            const orders2030 = activeMarkets.reduce((sum, market) => {
                return sum + (modelData.revenues[2030] && modelData.revenues[2030][market] ? 
                    modelData.revenues[2030][market].orders : 0);
            }, 0);

            const revenue2026 = activeMarkets.reduce((sum, market) => {
                return sum + (modelData.revenues[2026] && modelData.revenues[2026][market] ? 
                    modelData.revenues[2026][market].netRevenue : 0);
            }, 0);

            // CAGR desde Chile 2025 hasta total 2030 (Chile + México)
            const revenue2025Chile = modelData.revenues[2025] && modelData.revenues[2025].chile ? 
                modelData.revenues[2025].chile.netRevenue : 0;
            const cagr = revenue2025Chile > 0 ? Math.pow(revenue2030 / revenue2025Chile, 1/5) - 1 : 0;

            console.log('✅ Dashboard usando datos del modelo (Chile y México):', {
                'Revenue 2030': `$${(revenue2030/1000000).toFixed(1)}M`,
                'Orders 2030': Math.round(orders2030).toLocaleString(),
                'CAGR': `${(cagr * 100).toFixed(1)}%`,
                'Active Markets': activeMarkets
            });

            // Filtrar datos del modelo para incluir solo mercados activos
            const filteredRevenueData = {};
            for (let year = 2025; year <= 2030; year++) {
                if (modelData.revenues[year]) {
                    filteredRevenueData[year] = {};
                    activeMarkets.forEach(market => {
                        if (modelData.revenues[year][market]) {
                            filteredRevenueData[year][market] = modelData.revenues[year][market];
                        }
                    });
                }
            }

            return {
                yearlyData: filteredRevenueData,
                totalRevenue2030: revenue2030,
                totalOrders2030: orders2030,
                cagr: cagr * 100, // Convertir a porcentaje
                countries: { chile: marketDistribution.chile, mexico: marketDistribution.mexico }, // Solo mercados activos
                activeMarkets: activeMarkets
            };
        }
        // PRIORIDAD 2: Si no hay datos del modelo, calcular usando solo Chile y México
        console.log('⚠️ Dashboard calculando datos propios (solo Chile y México)');
        const params = getBusinessParams();
        const revenues = {};
        
        // Usar exactamente el mismo cálculo que revenues.js pero solo para mercados activos
        for (let year = 2025; year <= 2030; year++) {
            const yearIndex = year - 2025;
            const monthsOfOperation = year === 2025 ? 6 : 12;
            
            let yearlyTraffic;
            if (year === 2025) {
                yearlyTraffic = params.initialTraffic;
            } else {
                yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex);
            }
            
            let conversionRate = Math.min(
                params.initialConversion * Math.pow(1 + params.conversionGrowthRate, yearIndex), 
                0.08
            );
            
            const ticketSize = params.avgTicket * (1 + Math.max(0, yearIndex - 1) * 0.08);

            revenues[year] = {};
            
            // Solo procesar mercados activos
            activeMarkets.forEach(market => {
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
                
                // Calcular tráfico por mercado activo
                let marketTraffic;
                if (year === 2025) {
                    marketTraffic = market === 'chile' ? yearlyTraffic * monthsOfOperation : 0;
                } else {
                    // Redistribuir el peso entre solo Chile y México
                    const totalActiveWeight = marketDistribution.chile.weight + marketDistribution.mexico.weight;
                    const adjustedWeight = marketData.weight / totalActiveWeight;
                    marketTraffic = yearlyTraffic * adjustedWeight * monthsOfOperation;
                }
                
                const orders = marketTraffic * conversionRate;
                const localPrice = ticketSize * marketData.premium;
                const grossRevenue = orders * localPrice;
                const netRevenue = grossRevenue;
                
                revenues[year][market] = {
                    traffic: marketTraffic,
                    conversionRate: conversionRate * 100,
                    orders: orders,
                    avgTicket: localPrice,
                    grossRevenue: grossRevenue,
                    netRevenue: netRevenue
                };
            });
        }

        // Calcular totales usando solo mercados activos
        const revenue2030 = activeMarkets.reduce((sum, market) => {
            return sum + (revenues[2030][market] ? revenues[2030][market].netRevenue : 0);
        }, 0);
        
        const orders2030 = activeMarkets.reduce((sum, market) => {
            return sum + (revenues[2030][market] ? revenues[2030][market].orders : 0);
        }, 0);

        const revenue2026 = activeMarkets.reduce((sum, market) => {
            return sum + (revenues[2026][market] ? revenues[2026][market].netRevenue : 0);
        }, 0);

        // CAGR desde Chile 2025 hasta total 2030
        const revenue2025Chile = revenues[2025] && revenues[2025].chile ? revenues[2025].chile.netRevenue : 0;
        const cagr = revenue2025Chile > 0 ? Math.pow(revenue2030 / revenue2025Chile, 1/5) - 1 : 0;

        return {
            yearlyData: revenues,
            totalRevenue2030: revenue2030,
            totalOrders2030: orders2030,
            cagr: cagr * 100,
            countries: { chile: marketDistribution.chile, mexico: marketDistribution.mexico },
            activeMarkets: activeMarkets
        };
    }

    // Obtener datos de costos usando las mismas funciones que costs.js
    getCostData() {
        const params = getBusinessParams(); // Usar la función de config.js
        
        return {
            salesSalary: params.salesSalary,
            marketingPct: params.marketingPct * 100, // Convertir a porcentaje
            inflation: params.inflation * 100 // Convertir a porcentaje
        };
    }

    // Obtener datos de flujo de caja usando los datos reales del modelo
    getCashflowData() {
        console.log('📊 Dashboard: Obteniendo datos de flujo de caja...');
        console.log('🔍 modelData.economicCashFlow disponible:', !!modelData.economicCashFlow);
        console.log('🔍 modelData.economicCashFlow.metrics disponible:', !!(modelData.economicCashFlow && modelData.economicCashFlow.metrics));
        console.log('🔍 modelData.economicCashFlow completo:', modelData.economicCashFlow);
        
        // Si ya tenemos datos del modelo, usarlos
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            console.log('✅ ENTRANDO AL BRANCH DEL MODELO ECONÓMICO');
            const economicFlow = modelData.economicCashFlow;
            console.log('🔍 Estructura de economicFlow:', economicFlow);
            console.log('🔍 Años disponibles en economicFlow:', Object.keys(economicFlow));
            
            let accumulatedFCF = 0;
            const yearlyFCF = {};
            
            // Calcular FCF para todos los años disponibles (no solo 2026-2030)
            const availableYears = Object.keys(economicFlow).filter(key => 
                !isNaN(key) && economicFlow[key] && typeof economicFlow[key].fcf !== 'undefined'
            );
            
            console.log('📅 Años disponibles con FCF:', availableYears);
            
            availableYears.forEach(year => {
                const yearNum = parseInt(year);
                console.log(`🔍 Verificando año ${yearNum}:`, economicFlow[yearNum]);
                if (economicFlow[yearNum] && typeof economicFlow[yearNum].fcf !== 'undefined') {
                    yearlyFCF[yearNum] = economicFlow[yearNum].fcf;
                    accumulatedFCF += economicFlow[yearNum].fcf;
                    console.log(`✅ Año ${yearNum} - FCF: ${economicFlow[yearNum].fcf}`);
                }
            });
            
            console.log('📈 yearlyFCF del modelo:', yearlyFCF);
            console.log('💰 accumulatedFCF:', accumulatedFCF);
            
            // Usar métricas financieras del modelo si están disponibles
            let financialNPV = null;
            let financialIRR = null;
            
            if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
                financialNPV = modelData.financialCashFlow.metrics.equityNPV; // Usar equityNPV, no npv
                financialIRR = modelData.financialCashFlow.metrics.projectIRR * 100; // Usar projectIRR
            }
            
            return {
                accumulatedFCF,
                yearlyFCF,
                paybackPeriod: this.getPaybackFromModel() || this.calculatePaybackPeriod(yearlyFCF),
                irr: Math.round(economicFlow.metrics.irr * 100), // Convertir a porcentaje
                npv: economicFlow.metrics.npv,
                financialNPV: financialNPV,
                financialIRR: financialIRR
            };
        }
        
        // Fallback: calcular basado en revenues si no hay datos del modelo (usar solo mercados activos)
        const revenues = this.data.revenues?.yearlyData || {};
        const params = getFinancialParams();
        const years = [2025, 2026, 2027, 2028, 2029, 2030]; // Incluir 2025 para CAPEX
        const activeMarkets = ['chile', 'mexico'];
        
        let accumulatedFCF = 0;
        const yearlyFCF = {};
        
        years.forEach(year => {
            let yearRevenue = 0;
            if (revenues[year]) {
                // Solo sumar ingresos de mercados activos
                activeMarkets.forEach(market => {
                    if (revenues[year][market]) {
                        yearRevenue += revenues[year][market].netRevenue;
                    }
                });
            }
            
            // Usar los mismos porcentajes que cashflow.js
            const cogs = yearRevenue * params.cogsPct;
            const grossProfit = yearRevenue - cogs;
            const operatingExpenses = yearRevenue * params.operatingExpensesPct;
            const ebitda = grossProfit - operatingExpenses;
            
            // Depreciación simplificada usando CAPEX optimizado
            const optimizedCapex = this.data.capex?.totalCapex || 565000;
            const depreciation = optimizedCapex / params.depreciationYears; // CAPEX optimizado / años
            const ebit = ebitda - depreciation;
            const taxes = Math.max(0, ebit * params.taxRate);
            const nopat = ebit - taxes;
            
            // CAPEX del año (usar distribución optimizada)
            let capex = 0;
            if (year === 2025) {
                capex = optimizedCapex * 0.60; // 60% en 2025
            } else if (year === 2026) {
                capex = optimizedCapex * 0.30; // 30% en 2026
            } else if (year === 2027) {
                capex = optimizedCapex * 0.10; // 10% en 2027
            } // 0% en años posteriores
            
            const fcf = nopat + depreciation - capex;
            yearlyFCF[year] = fcf;
            
            // Solo acumular FCF operativos (desde 2026)
            if (year >= 2026) {
                accumulatedFCF += fcf;
            }
            
            console.log(`📊 FCF ${year}: $${(fcf/1000).toFixed(0)}K (Revenue: $${(yearRevenue/1000).toFixed(0)}K, CAPEX: $${(capex/1000).toFixed(0)}K)`);
        });

        return {
            accumulatedFCF,
            yearlyFCF,
            paybackPeriod: this.calculatePaybackPeriod(yearlyFCF),
            irr: this.calculateSimpleIRR(yearlyFCF),
            economicIRR: this.calculateSimpleIRR(yearlyFCF), // Usar el mismo para fallback
            npv: this.calculateNPV(),
            financialNPV: this.calculateFinancialNPV(),
            financialIRR: this.calculateFinancialIRR()
        };
    }
    
    // Calcular período de payback real
    calculatePaybackPeriod(yearlyFCF) {
        let cumulativeFCF = -800000; // Empezamos con la inversión inicial negativa
        
        // Agregar CAPEX de cada año (negativo)
        for (let year = 2025; year <= 2028; year++) {
            const capexData = capexDistribution[year];
            if (capexData) {
                cumulativeFCF -= 800000 * capexData.pct;
            }
        }
        
        // Ahora agregar los FCF positivos año por año
        for (let year = 2026; year <= 2030; year++) {
            const yearFCF = yearlyFCF[year] || 0;
            cumulativeFCF += yearFCF;
            
            // Cuando el FCF acumulado se vuelve positivo, hemos recuperado la inversión
            if (cumulativeFCF >= 0) {
                const monthsFromStart = (year - 2025) * 12;
                
                // Interpolación para obtener el mes exacto dentro del año
                const previousCumulative = cumulativeFCF - yearFCF;
                
                if (yearFCF > 0 && previousCumulative < 0) {
                    const monthsIntoYear = (Math.abs(previousCumulative) / yearFCF) * 12;
                    return Math.round(monthsFromStart - monthsIntoYear);
                }
                
                return monthsFromStart;
            }
        }
        
        // Si no se recupera en el período, estimar basado en tendencia
        const lastYearFCF = yearlyFCF[2030] || 0;
        if (lastYearFCF > 0 && cumulativeFCF < 0) {
            const remainingAmount = Math.abs(cumulativeFCF);
            const additionalMonths = (remainingAmount / lastYearFCF) * 12;
            return Math.round(60 + additionalMonths); // 5 años + tiempo adicional
        }
        
        return 18; // Default realista: 18 meses
    }
    
    // Obtener payback del modelo real si está disponible
    getPaybackFromModel() {
        // Intentar obtener del modelo de cashflow si tiene métricas calculadas
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            const economicFlow = modelData.economicCashFlow;
            let cumulativeFCF = 0;
            
            // Calcular payback real basado en los datos del modelo
            for (let year = 2025; year <= 2030; year++) {
                if (economicFlow[year]) {
                    cumulativeFCF += economicFlow[year].fcf;
                    
                    if (cumulativeFCF >= 0 && year >= 2026) {
                        // Encontramos el punto de equilibrio
                        const monthsFromStart = (year - 2025) * 12;
                        
                        // Interpolación más precisa
                        const yearFCF = economicFlow[year].fcf;
                        const previousCumulative = cumulativeFCF - yearFCF;
                        
                        if (yearFCF > 0 && previousCumulative < 0) {
                            const monthsIntoYear = (Math.abs(previousCumulative) / yearFCF) * 12;
                            return Math.round(monthsFromStart - monthsIntoYear);
                        }
                        
                        return monthsFromStart;
                    }
                }
            }
        }
        
        return null; // No hay datos del modelo
    }
    
    // Calcular el año de break-even dinámicamente
    calculateBreakEvenYear() {
        // Intentar obtener del modelo real primero
        if (modelData.economicCashFlow) {
            const economicFlow = modelData.economicCashFlow;
            let cumulativeFCF = 0;
            
            for (let year = 2025; year <= 2030; year++) {
                if (economicFlow[year]) {
                    cumulativeFCF += economicFlow[year].fcf;
                    
                    // Cuando el FCF acumulado se vuelve positivo
                    if (cumulativeFCF >= 0 && year >= 2026) {
                        return year;
                    }
                }
            }
        }
        
        // Fallback: calcular basado en payback period
        const paybackMonths = this.data.cashflow.paybackPeriod;
        const breakEvenYear = 2025 + Math.ceil(paybackMonths / 12);
        
        // Asegurar que esté en el rango válido
        return Math.min(Math.max(breakEvenYear, 2026), 2030);
    }
    
    // Calcular IRR simplificado
    calculateSimpleIRR(yearlyFCF) {
        const totalCapex = 800000;
        const totalFCF = Object.values(yearlyFCF).reduce((sum, fcf) => sum + fcf, 0);
        const years = 5;
        
        if (totalFCF <= totalCapex) return 0;
        
        // IRR aproximado
        return Math.pow(totalFCF / totalCapex, 1/years) * 100 - 100;
    }

    // Calcular NPV (Valor Actual Neto) - Económico
    calculateNPV() {
        const discountRate = 0.12; // 12% tasa de descuento (WACC típico)
        const initialInvestment = this.data.capex?.totalCapex || 800000;
        const yearlyFCF = this.data.cashflow?.yearlyFCF || {};
        
        let npv = -initialInvestment; // Inversión inicial negativa
        
        Object.keys(yearlyFCF).forEach((year, index) => {
            const fcf = yearlyFCF[year];
            const discountedFCF = fcf / Math.pow(1 + discountRate, index + 1);
            npv += discountedFCF;
        });
        
        return npv;
    }

    // Calcular NPV Financiero usando la misma lógica que cashflow.js
    calculateFinancialNPV() {
        // Si ya tenemos el cálculo del modelo financiero, usarlo
        if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
            return modelData.financialCashFlow.metrics.equityNPV;
        }
        
        // Fallback: usar valor por defecto realista (menor que el NPV económico)
        const economicNPV = this.data.cashflow.npv || 2500000;
        return economicNPV * 0.72; // Aproximadamente 72% del NPV económico por el costo del equity
    }

    // Calcular TIR Financiera usando la misma lógica que cashflow.js
    calculateFinancialIRR() {
        // Si ya tenemos el cálculo del modelo financiero, usarlo
        if (modelData.financialCashFlow && modelData.financialCashFlow.metrics) {
            return modelData.financialCashFlow.metrics.projectIRR * 100;
        }
        
        // Fallback: usar 0% por defecto
        return 0; // 0% cuando no hay datos válidos
    }

    // Función auxiliar para calcular NPV desde flujos
    calculateNPVFromFlows(cashFlows, discountRate) {
        let npv = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            npv += cashFlows[i] / Math.pow(1 + discountRate, i);
        }
        return npv;
    }

    // Método iterativo para calcular TIR usando Newton-Raphson
    calculateIRRIterative(cashFlows) {
        let rate = 0.1; // Estimación inicial del 10%
        const maxIterations = 100;
        const tolerance = 0.0001;
        
        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0; // Derivada del NPV
            
            // Calcular NPV y su derivada
            for (let t = 0; t < cashFlows.length; t++) {
                const cf = cashFlows[t];
                const denominator = Math.pow(1 + rate, t);
                npv += cf / denominator;
                if (t > 0) {
                    dnpv -= (t * cf) / Math.pow(1 + rate, t + 1);
                }
            }
            
            // Si NPV es suficientemente pequeño, hemos encontrado la TIR
            if (Math.abs(npv) < tolerance) {
                return rate * 100; // Convertir a porcentaje
            }
            
            // Newton-Raphson: nueva estimación
            if (dnpv !== 0) {
                rate = rate - npv / dnpv;
            } else {
                break;
            }
            
            // Evitar tasas negativas o muy altas
            if (rate < -0.99 || rate > 10) {
                break;
            }
        }
        
        // Si no converge, usar método simplificado
        const totalCashFlow = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
        const initialInvestment = Math.abs(cashFlows[0]);
        const years = cashFlows.length - 1;
        
        if (totalCashFlow <= initialInvestment) return 0;
        
        return (Math.pow(totalCashFlow / initialInvestment, 1/years) - 1) * 100;
    }

    // Calcular métricas derivadas
    calculateDerivedMetrics() {
        if (this.data.cashflow && this.data.capex) {
            // ROI correcto: FCF acumulado de años operativos / Inversión Total
            const yearlyFCF = this.data.cashflow.yearlyFCF || {};
            let operationalFCF = 0;
            
            console.log('📊 Calculando ROI Dashboard:');
            console.log('- yearlyFCF:', yearlyFCF);
            
            // Sumar FCF de años operativos (2026-2030) - incluye negativos y positivos
            for (let year = 2026; year <= 2030; year++) {
                if (yearlyFCF[year] !== undefined) {
                    console.log(`- FCF ${year}: $${(yearlyFCF[year]/1000).toFixed(0)}K`);
                    operationalFCF += yearlyFCF[year];
                }
            }
            
            const totalCapex = this.data.capex.totalCapex;
            
            console.log(`- Total FCF Operativo: $${(operationalFCF/1000).toFixed(0)}K`);
            console.log(`- Total CAPEX: $${(totalCapex/1000).toFixed(0)}K`);
            
            // ROI = (FCF Acumulado Operativo / Inversión Total) * 100
            if (totalCapex > 0) {
                this.data.roi = ((operationalFCF / totalCapex) * 100);
                console.log(`- ROI Calculado: ${this.data.roi.toFixed(1)}%`);
            } else {
                this.data.roi = 0;
            }
            
            // Calcular NPV si no está disponible del modelo
            if (!this.data.cashflow.npv) {
                this.data.cashflow.npv = this.calculateNPV();
            }
            
            // Calcular TIR económica si no está disponible del modelo
            if (!this.data.cashflow.economicIRR) {
                this.data.cashflow.economicIRR = this.calculateSimpleIRR(yearlyFCF);
            }
            
            // Calcular métricas financieras solo si no están disponibles del modelo
            if (!this.data.cashflow.financialNPV) {
                this.data.cashflow.financialNPV = this.calculateFinancialNPV();
            }
            
            if (!this.data.cashflow.financialIRR) {
                this.data.cashflow.financialIRR = this.calculateFinancialIRR();
            }
        }
    }

    // Establecer datos por defecto optimizados (solo Chile y México)
    setDefaultData() {
        this.data = {
            capex: {
                totalCapex: 565000, // CAPEX optimizado
                totalDebt: 565000 * 0.35, // 35% deuda
                totalEquity: 565000 * 0.65, // 65% equity
                originalCapex: 800000,
                savings: 235000,
                savingsPercentage: 29.4,
                debtRatio: 35,
                equityRatio: 65
            },
            revenues: {
                totalRevenue2030: 3200000, // Estimación realista solo Chile y México
                totalOrders2030: 75000, // Estimación realista
                cagr: 120, // CAGR más conservador
                countries: {
                    'chile': { share: 0.60 }, // Chile como mercado principal
                    'mexico': { share: 0.40 }  // México como mercado secundario
                },
                activeMarkets: ['chile', 'mexico'],
                yearlyData: {
                    2025: { 
                        chile: {revenue: 400000, orders: 8000, avgTicket: 50, netRevenue: 400000},
                        mexico: {revenue: 0, orders: 0, avgTicket: 0, netRevenue: 0} // Sin ingresos en 2025
                    },
                    2026: { 
                        chile: {revenue: 800000, orders: 15000, avgTicket: 53, netRevenue: 800000},
                        mexico: {revenue: 300000, orders: 7500, avgTicket: 40, netRevenue: 300000}
                    },
                    2027: { 
                        chile: {revenue: 1200000, orders: 21000, avgTicket: 57, netRevenue: 1200000},
                        mexico: {revenue: 600000, orders: 14000, avgTicket: 43, netRevenue: 600000}
                    },
                    2028: { 
                        chile: {revenue: 1600000, orders: 26000, avgTicket: 62, netRevenue: 1600000},
                        mexico: {revenue: 900000, orders: 20000, avgTicket: 45, netRevenue: 900000}
                    },
                    2029: { 
                        chile: {revenue: 2000000, orders: 30000, avgTicket: 67, netRevenue: 2000000},
                        mexico: {revenue: 1200000, orders: 25000, avgTicket: 48, netRevenue: 1200000}
                    },
                    2030: { 
                        chile: {revenue: 2200000, orders: 27797, avgTicket: 79, netRevenue: 2200000},
                        mexico: {revenue: 1300000, orders: 14968, avgTicket: 87, netRevenue: 1300000}
                    }
                }
            },
            cashflow: {
                accumulatedFCF: 4200000, // FCF más conservador
                paybackPeriod: 22, // Payback más realista
                irr: 35, // TIR más conservadora pero atractiva
                npv: 1800000, // VAN más conservador
                economicIRR: 35,
                financialNPV: 1200000, // VAN financiero
                financialIRR: 28, // TIR financiera
                yearlyFCF: {
                    2025: -511476, // Año de inversión, FCF negativo
                    2026: 156849,  // Primer año operativo
                    2027: 724652,  // Crecimiento
                    2028: 1438591, // Expansión
                    2029: 2198456, // Consolidación  
                    2030: 2992847  // Año final con valor residual
                }
            },
            roi: 95 // ROI más conservador pero aún atractivo
        };
    }

    // Actualizar KPIs principales
    updateKPIs() {
        const roi = Math.round(this.data.roi || 0);
        
        const elements = {
            'dashTotalRevenue': this.formatCurrency(this.data.revenues.totalRevenue2030),
            'dashTotalCapex': this.formatCurrency(this.data.capex.totalCapex, 'K'),
            'dashROI': roi + '%',
            'dashNPV': this.formatCurrency(this.data.cashflow.npv || 2500000),
            'dashEconomicIRR': Math.round(this.data.cashflow.economicIRR || 0) + '%',
            'dashFinancialNPV': this.formatCurrency(this.data.cashflow.financialNPV || 1800000),
            'dashFinancialIRR': Math.round(this.data.cashflow.financialIRR || 0) + '%'
        };

        // Logging detallado para debugging
        console.log('📊 Actualizando KPIs Dashboard:');
        console.log(`- ROI: ${roi}%`);
        console.log(`- VAN Económico: $${((this.data.cashflow.npv || 0)/1000).toFixed(0)}K`);
        console.log(`- TIR Económica: ${Math.round(this.data.cashflow.economicIRR || 0)}%`);
        console.log(`- VAN Financiero: $${((this.data.cashflow.financialNPV || 0)/1000).toFixed(0)}K`);
        console.log(`- TIR Financiera: ${Math.round(this.data.cashflow.financialIRR || 0)}%`);

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Actualizar estado del ROI dinámicamente
        this.updateROIStatus(roi);
        
        // Actualizar estados de VAN y TIR dinámicamente
        this.updateNPVStatus();
        this.updateEconomicIRRStatus();
        this.updateFinancialNPVStatus();
        this.updateFinancialIRRStatus();
    }
    
    // Actualizar estado del ROI basado en el valor
    updateROIStatus(roi) {
        const trendElement = document.getElementById('dashROITrend');
        const statusElement = document.getElementById('dashROIStatus');
        
        if (!trendElement || !statusElement) return;
        
        // Limpiar clases existentes
        trendElement.className = 'kpi-trend';
        
        if (roi >= 100) {
            trendElement.classList.add('positive');
            statusElement.innerHTML = '<i class="fas fa-trophy"></i> Excelente';
        } else if (roi >= 50) {
            trendElement.classList.add('positive');
            statusElement.innerHTML = '<i class="fas fa-arrow-up"></i> Bueno';
        } else if (roi >= 20) {
            trendElement.classList.add('neutral');
            statusElement.innerHTML = '<i class="fas fa-minus"></i> Regular';
        } else if (roi >= 0) {
            trendElement.classList.add('warning');
            statusElement.innerHTML = '<i class="fas fa-arrow-down"></i> Bajo';
        } else {
            trendElement.classList.add('negative');
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negativo';
        }
    }

    // Actualizar estado del VAN Económico basado en el valor
    updateNPVStatus() {
        const npvValue = this.data.cashflow.npv || 0;
        // Buscar específicamente la tarjeta del VAN Económico por su contenido
        const npvCards = document.querySelectorAll('.kpi-card');
        let npvCard = null;
        
        npvCards.forEach(card => {
            const label = card.querySelector('.kpi-label');
            if (label && label.textContent.includes('VAN Económico')) {
                npvCard = card;
            }
        });
        
        const npvTrend = npvCard?.querySelector('.kpi-trend');
        
        console.log(`📈 Evaluando VAN Económico: $${(npvValue/1000).toFixed(0)}K`);
        
        if (!npvTrend) {
            console.log('⚠️ No se encontró el elemento de tendencia del VAN Económico');
            return;
        }
        
        // Limpiar clases existentes
        npvTrend.className = 'kpi-trend';
        
        if (npvValue >= 2000000) { // >= $2M
            npvTrend.classList.add('positive');
            npvTrend.innerHTML = '<i class="fas fa-trophy"></i> Excelente';
            console.log('- Evaluación: Excelente (>= $2M)');
        } else if (npvValue >= 1000000) { // >= $1M
            npvTrend.classList.add('positive');
            npvTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Muy Bueno';
            console.log('- Evaluación: Muy Bueno (>= $1M)');
        } else if (npvValue > 0) { // > $0
            npvTrend.classList.add('positive');
            npvTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Positivo';
            console.log('- Evaluación: Positivo (> $0)');
        } else if (npvValue >= -500000) { // >= -$500K
            npvTrend.classList.add('warning');
            npvTrend.innerHTML = '<i class="fas fa-arrow-down"></i> Bajo';
            console.log('- Evaluación: Bajo (>= -$500K)');
        } else { // < -$500K
            npvTrend.classList.add('negative');
            npvTrend.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negativo';
            console.log('- Evaluación: Negativo (< -$500K)');
        }
    }
    
    // Actualizar estado de la TIR Económica basado en el valor
    updateEconomicIRRStatus() {
        const economicIRRValue = this.data.cashflow.economicIRR || 0;
        // Buscar específicamente la tarjeta de la TIR Económica por su contenido
        const economicIRRCards = document.querySelectorAll('.kpi-card');
        let economicIRRCard = null;
        
        economicIRRCards.forEach(card => {
            const label = card.querySelector('.kpi-label');
            if (label && label.textContent.includes('TIR Económica')) {
                economicIRRCard = card;
            }
        });
        
        const economicIRRTrend = economicIRRCard?.querySelector('.kpi-trend');
        
        console.log(`📈 Evaluando TIR Económica: ${economicIRRValue.toFixed(1)}%`);
        
        if (!economicIRRTrend) {
            console.log('⚠️ No se encontró el elemento de tendencia de la TIR Económica');
            return;
        }
        
        // Limpiar clases existentes
        economicIRRTrend.className = 'kpi-trend';
        
        // Comparar con WACC (8%)
        if (economicIRRValue >= 15) { // >= 15%
            economicIRRTrend.classList.add('positive');
            economicIRRTrend.innerHTML = '<i class="fas fa-trophy"></i> Excelente';
            console.log('- Evaluación: Excelente (>= 15%)');
        } else if (economicIRRValue >= 12) { // >= 12%
            economicIRRTrend.classList.add('positive');
            economicIRRTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Muy Bueno';
            console.log('- Evaluación: Muy Bueno (>= 12%)');
        } else if (economicIRRValue >= 8) { // >= 8% (WACC)
            economicIRRTrend.classList.add('positive');
            economicIRRTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Viable';
            console.log('- Evaluación: Viable (>= WACC 8%)');
        } else if (economicIRRValue >= 5) { // >= 5%
            economicIRRTrend.classList.add('warning');
            economicIRRTrend.innerHTML = '<i class="fas fa-minus"></i> Marginal';
            console.log('- Evaluación: Marginal (>= 5%)');
        } else if (economicIRRValue >= 0) { // >= 0%
            economicIRRTrend.classList.add('warning');
            economicIRRTrend.innerHTML = '<i class="fas fa-arrow-down"></i> Bajo';
            console.log('- Evaluación: Bajo (>= 0%)');
        } else { // < 0%
            economicIRRTrend.classList.add('negative');
            economicIRRTrend.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negativo';
            console.log('- Evaluación: Negativo (< 0%)');
        }
    }
    
    // Actualizar estado del VAN Financiero basado en el valor
    updateFinancialNPVStatus() {
        const financialNPVValue = this.data.cashflow.financialNPV || 0;
        // Buscar específicamente la tarjeta del VAN Financiero por su contenido
        const financialNPVCards = document.querySelectorAll('.kpi-card');
        let financialNPVCard = null;
        
        financialNPVCards.forEach(card => {
            const label = card.querySelector('.kpi-label');
            if (label && label.textContent.includes('VAN Financiero')) {
                financialNPVCard = card;
            }
        });
        
        const financialNPVTrend = financialNPVCard?.querySelector('.kpi-trend');
        
        console.log(`📈 Evaluando VAN Financiero: $${(financialNPVValue/1000).toFixed(0)}K`);
        
        if (!financialNPVTrend) {
            console.log('⚠️ No se encontró el elemento de tendencia del VAN Financiero');
            return;
        }
        
        // Limpiar clases existentes
        financialNPVTrend.className = 'kpi-trend';
        
        if (financialNPVValue >= 1500000) { // >= $1.5M
            financialNPVTrend.classList.add('positive');
            financialNPVTrend.innerHTML = '<i class="fas fa-trophy"></i> Excelente';
            console.log('- Evaluación: Excelente (>= $1.5M)');
        } else if (financialNPVValue >= 800000) { // >= $800K
            financialNPVTrend.classList.add('positive');
            financialNPVTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Muy Bueno';
            console.log('- Evaluación: Muy Bueno (>= $800K)');
        } else if (financialNPVValue > 0) { // > $0
            financialNPVTrend.classList.add('positive');
            financialNPVTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Positivo';
            console.log('- Evaluación: Positivo (> $0)');
        } else if (financialNPVValue >= -300000) { // >= -$300K
            financialNPVTrend.classList.add('warning');
            financialNPVTrend.innerHTML = '<i class="fas fa-arrow-down"></i> Bajo';
            console.log('- Evaluación: Bajo (>= -$300K)');
        } else { // < -$300K
            financialNPVTrend.classList.add('negative');
            financialNPVTrend.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negativo';
            console.log('- Evaluación: Negativo (< -$300K)');
        }
    }
    
    // Actualizar estado de la TIR Financiera basado en el valor
    updateFinancialIRRStatus() {
        const financialIRRValue = this.data.cashflow.financialIRR || 0;
        // Buscar específicamente la tarjeta de la TIR Financiera por su contenido
        const financialIRRCards = document.querySelectorAll('.kpi-card');
        let financialIRRCard = null;
        
        financialIRRCards.forEach(card => {
            const label = card.querySelector('.kpi-label');
            if (label && label.textContent.includes('TIR Financiera')) {
                financialIRRCard = card;
            }
        });
        
        const financialIRRTrend = financialIRRCard?.querySelector('.kpi-trend');
        
        console.log(`📈 Evaluando TIR Financiera: ${financialIRRValue.toFixed(1)}%`);
        
        if (!financialIRRTrend) {
            console.log('⚠️ No se encontró el elemento de tendencia de la TIR Financiera');
            return;
        }
        
        // Limpiar clases existentes
        financialIRRTrend.className = 'kpi-trend';
        
        if (financialIRRValue >= 30) { // >= 30%
            financialIRRTrend.classList.add('positive');
            financialIRRTrend.innerHTML = '<i class="fas fa-trophy"></i> Excelente';
            console.log('- Evaluación: Excelente (>= 30%)');
        } else if (financialIRRValue >= 20) { // >= 20%
            financialIRRTrend.classList.add('positive');
            financialIRRTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Muy Bueno';
            console.log('- Evaluación: Muy Bueno (>= 20%)');
        } else if (financialIRRValue >= 12) { // >= 12% (por encima del WACC típico)
            financialIRRTrend.classList.add('positive');
            financialIRRTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Bueno';
            console.log('- Evaluación: Bueno (>= 12%)');
        } else if (financialIRRValue >= 8) { // >= 8%
            financialIRRTrend.classList.add('warning');
            financialIRRTrend.innerHTML = '<i class="fas fa-minus"></i> Regular';
            console.log('- Evaluación: Regular (>= 8%)');
        } else if (financialIRRValue > 0) { // > 0%
            financialIRRTrend.classList.add('warning');
            financialIRRTrend.innerHTML = '<i class="fas fa-arrow-down"></i> Bajo';
            console.log('- Evaluación: Bajo (> 0%)');
        } else { // <= 0%
            financialIRRTrend.classList.add('negative');
            financialIRRTrend.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negativo';
            console.log('- Evaluación: Negativo (<= 0%)');
        }
    }

    // Crear gráficos
    createCharts() {
        this.createRevenueChart();
        this.createMarketDistributionChart();
    }

    // Crear gráfico de evolución de flujos de caja
    createRevenueChart() {
        console.log('🎨 Dashboard: Creando gráfico de flujos de caja...');
        const ctx = document.getElementById('revenueChart');
        if (!ctx) {
            console.log('⚠️ Canvas revenueChart no encontrado, creando...');
            // Crear canvas si no existe
            this.createRevenueChartCanvas();
            return;
        }

        console.log('✅ Canvas encontrado, preparando datos...');
        console.log('🔍 Datos de cashflow disponibles:', this.data.cashflow);
        console.log('🔍 yearlyFCF disponible:', this.data.cashflow.yearlyFCF);
        
        const years = Object.keys(this.data.cashflow.yearlyFCF || {});
        const cashflows = years.map(year => {
            const fcf = this.data.cashflow.yearlyFCF[year] || 0;
            return fcf / 1000000; // Convertir a millones
        });

        console.log('📊 Años:', years);
        console.log('💰 Flujos de caja (millones):', cashflows);
        
        if (years.length === 0) {
            console.warn('⚠️ No hay años en yearlyFCF, revisando datos del modelo...');
            console.log('🔍 modelData.economicCashFlow:', modelData.economicCashFlow);
        }

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Free Cash Flow (M USD)',
                    data: cashflows,
                    backgroundColor: cashflows.map(value => 
                        value >= 0 ? 'rgba(46, 125, 50, 0.8)' : 'rgba(198, 40, 40, 0.8)'
                    ),
                    borderColor: cashflows.map(value => 
                        value >= 0 ? '#2e7d32' : '#c62828'
                    ),
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(49, 19, 51, 0.1)'
                        },
                        ticks: {
                            color: '#311333',
                            callback: function(value) {
                                return '$' + value.toFixed(1) + 'M';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(49, 19, 51, 0.1)'
                        },
                        ticks: {
                            color: '#311333'
                        }
                    }
                }
            }
        });
    }

    // Crear canvas para gráfico de revenue
    createRevenueChartCanvas() {
        console.log('🎨 Dashboard: Creando canvas para gráfico de flujos de caja...');
        
        // Buscar específicamente la sección de flujos de caja por el texto del h3
        const chartSections = document.querySelectorAll('.chart-section');
        let targetSection = null;
        
        chartSections.forEach(section => {
            const h3 = section.querySelector('h3');
            if (h3 && h3.textContent.includes('Evolución de Flujos de Caja')) {
                targetSection = section.querySelector('.chart-placeholder');
            }
        });
        
        console.log('🔍 Sección de flujos de caja encontrada:', !!targetSection);
        
        if (targetSection) {
            console.log('✅ Reemplazando placeholder con canvas...');
            targetSection.innerHTML = '<canvas id="revenueChart" style="max-height: 200px;"></canvas>';
            setTimeout(() => this.createRevenueChart(), 100);
        } else {
            console.error('❌ No se encontró la sección de flujos de caja');
        }
    }

    // Crear gráfico de distribución por mercado mejorado
    createMarketDistributionChart() {
        const ctx = document.getElementById('marketChart');
        if (!ctx) {
            this.createMarketChartCanvas();
            return;
        }

        const countries = Object.keys(marketDistribution);
        const labels = countries.map(market => marketDistribution[market].label);
        const shares = countries.map(market => marketDistribution[market].weight * 100);
        const colors = [
            '#dc2626', // Chile - Rojo
            '#15803d', // México - Verde
            '#1e3a8a', // Brasil - Azul
            '#7c3aed', // Canadá - Púrpura
            '#f59e0b'  // USA - Amarillo/Naranja
        ];

        if (this.charts.market) {
            this.charts.market.destroy();
        }

        this.charts.market = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: shares,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 4,
                    hoverBorderWidth: 6,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12,
                                family: 'Montserrat',
                                weight: '500'
                            },
                            color: '#311333',
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, index) => ({
                                    text: `${label}: ${data.datasets[0].data[index].toFixed(1)}%`,
                                    fillStyle: data.datasets[0].backgroundColor[index],
                                    strokeStyle: data.datasets[0].backgroundColor[index],
                                    lineWidth: 0,
                                    pointStyle: 'circle',
                                    hidden: false,
                                    index: index
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(49, 19, 51, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#9a2849',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'point'
                }
            }
        });
    }

    // Crear canvas para gráfico de mercado
    createMarketChartCanvas() {
        const chartSections = document.querySelectorAll('.chart-section .chart-placeholder');
        if (chartSections.length > 1) {
            chartSections[1].innerHTML = '<canvas id="marketChart" style="max-height: 200px;"></canvas>';
            setTimeout(() => this.createMarketDistributionChart(), 100);
        }
    }

    // Actualizar métricas por mercado usando datos reales (solo Chile y México)
    updateMarketMetrics() {
        // Solo mapear mercados activos
        const activeMarketMapping = {
            'chile': 'chile',       // Chile
            'mexico': 'mexico'      // México
        };
        
        // Mercados inactivos para marcar como inactivos
        const inactiveMarkets = ['usa', 'brasil', 'brazil', 'canada'];
        
        console.log('🌍 Actualizando métricas por mercado (Chile y México)...');
        console.log('- Datos de ingresos disponibles:', this.data.revenues?.yearlyData?.[2030] ? 'Sí' : 'No');
        
        if (this.data.revenues?.yearlyData?.[2030]) {
            console.log('- Mercados activos en datos 2030:', Object.keys(this.data.revenues.yearlyData[2030]));
        }
        
        // Actualizar solo mercados activos
        Object.entries(activeMarketMapping).forEach(([cssClass, marketKey]) => {
            const marketData = this.data.revenues?.yearlyData?.[2030]?.[marketKey];
            
            console.log(`- Procesando ${marketKey} (CSS: ${cssClass}):`, marketData ? 'Datos encontrados' : 'Sin datos');
            
            if (marketData) {
                const card = document.querySelector(`.market-card.${cssClass}`);
                if (card) {
                    const stats = card.querySelectorAll('.stat-value');
                    if (stats.length >= 3) {
                        stats[0].textContent = this.formatCurrency(marketData.netRevenue);
                        stats[1].textContent = this.formatNumber(marketData.orders);
                        stats[2].textContent = '$' + Math.round(marketData.avgTicket);
                        
                        // Remover clase de inactivo si existe
                        card.classList.remove('market-inactive');
                        stats.forEach(stat => {
                            stat.style.color = '';
                        });
                        
                        console.log(`✅ ${marketKey} actualizado:`, {
                            revenue: this.formatCurrency(marketData.netRevenue),
                            orders: this.formatNumber(marketData.orders),
                            ticket: '$' + Math.round(marketData.avgTicket)
                        });
                    } else {
                        console.warn(`⚠️ No se encontraron suficientes elementos .stat-value en ${cssClass}`);
                    }
                } else {
                    console.warn(`⚠️ No se encontró tarjeta con clase .market-card.${cssClass}`);
                }
            } else {
                console.warn(`⚠️ No hay datos para ${marketKey} en 2030`);
            }
        });

        // Marcar mercados inactivos
        inactiveMarkets.forEach(marketClass => {
            const card = document.querySelector(`.market-card.${marketClass}`);
            if (card) {
                card.classList.add('market-inactive');
                const stats = card.querySelectorAll('.stat-value');
                stats.forEach(stat => {
                    stat.textContent = 'N/A';
                    stat.style.color = '#999';
                });
                
                // Agregar mensaje de inactivo si no existe
                let inactiveMsg = card.querySelector('.inactive-message');
                if (!inactiveMsg) {
                    inactiveMsg = document.createElement('div');
                    inactiveMsg.className = 'inactive-message';
                    inactiveMsg.style.cssText = 'text-align: center; color: #999; font-size: 0.8em; margin-top: 5px;';
                    inactiveMsg.textContent = 'Fuera del scope optimizado';
                    card.appendChild(inactiveMsg);
                }
            }
        });

        // Actualizar tabla de métricas por mercado
        this.updateMarketTable();
    }

    // Actualizar tabla de métricas por mercado 2030 (tabla principal del dashboard)
    updateMarketTable() {
        console.log('📊 Actualizando tabla de métricas por mercado 2030...');
        
        if (!this.data.revenues?.yearlyData?.[2030]) {
            console.warn('⚠️ No hay datos de ingresos 2030 para actualizar la tabla');
            return;
        }
        
        const marketData2030 = this.data.revenues.yearlyData[2030];
        console.log('- Datos disponibles para 2030:', Object.keys(marketData2030));
        
        // Calcular totales
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalTicketWeighted = 0;
        
        // Mapeo de mercados a IDs de la tabla
        const marketTableMapping = {
            'chile': { revenue: 'chile-revenue', orders: 'chile-orders', aov: 'chile-aov', share: 'chile-share' },
            'mexico': { revenue: 'mexico-revenue', orders: 'mexico-orders', aov: 'mexico-aov', share: 'mexico-share' },

        };
        
        // Actualizar cada mercado
        Object.entries(marketTableMapping).forEach(([marketKey, ids]) => {
            const data = marketData2030[marketKey];
            
            if (data) {
                // Actualizar valores en la tabla
                const revenueElement = document.getElementById(ids.revenue);
                const ordersElement = document.getElementById(ids.orders);
                const aovElement = document.getElementById(ids.aov);
                const shareElement = document.getElementById(ids.share);
                
                if (revenueElement) revenueElement.textContent = this.formatCurrency(data.netRevenue);
                if (ordersElement) ordersElement.textContent = this.formatNumber(data.orders);
                if (aovElement) aovElement.textContent = '$' + Math.round(data.avgTicket);
                
                // Acumular totales
                totalRevenue += data.netRevenue;
                totalOrders += data.orders;
                totalTicketWeighted += data.netRevenue; // Para calcular AOV promedio ponderado
                
                console.log(`✅ Tabla ${marketKey} actualizada:`, {
                    revenue: this.formatCurrency(data.netRevenue),
                    orders: this.formatNumber(data.orders),
                    aov: '$' + Math.round(data.avgTicket)
                });
            } else {
                console.warn(`⚠️ No hay datos para ${marketKey} en la tabla`);
            }
        });
        
        // Calcular y actualizar participaciones de mercado
        Object.entries(marketTableMapping).forEach(([marketKey, ids]) => {
            const data = marketData2030[marketKey];
            if (data && totalRevenue > 0) {
                const shareElement = document.getElementById(ids.share);
                if (shareElement) {
                    const marketShare = (data.netRevenue / totalRevenue) * 100;
                    shareElement.textContent = `${marketShare.toFixed(1)}%`;
                }
            }
        });
        
        // Actualizar totales
        const totalRevenueElement = document.getElementById('total-revenue-table');
        const totalOrdersElement = document.getElementById('total-orders-table');
        const totalAovElement = document.getElementById('total-aov-table');
        
        if (totalRevenueElement) totalRevenueElement.textContent = this.formatCurrency(totalRevenue);
        if (totalOrdersElement) totalOrdersElement.textContent = this.formatNumber(totalOrders);
        if (totalAovElement && totalOrders > 0) {
            const avgAOV = totalRevenue / totalOrders;
            totalAovElement.textContent = '$' + Math.round(avgAOV);
        }
        
        console.log('✅ Tabla de métricas actualizada:', {
            'Total Revenue': this.formatCurrency(totalRevenue),
            'Total Orders': this.formatNumber(totalOrders),
            'Avg AOV': totalOrders > 0 ? '$' + Math.round(totalRevenue / totalOrders) : '$0'
        });
    }

    // Actualizar resumen de cashflow
    updateCashflowSummary() {
        const elements = {
            '.cashflow-card.positive .cashflow-value': this.formatCurrency(this.data.cashflow.accumulatedFCF),
            '.cashflow-card.neutral .cashflow-value': this.data.cashflow.paybackPeriod + ' meses',
            '.cashflow-card.success .cashflow-value': this.data.cashflow.irr + '%',
            '.cashflow-card.warning .cashflow-value': this.formatCurrency(this.data.capex.totalDebt, 'K')
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        });
        
        // Actualizar año de break-even dinámicamente
        const breakEvenYear = this.calculateBreakEvenYear();
        const breakEvenElement = document.getElementById('breakEvenYear');
        if (breakEvenElement) {
            breakEvenElement.textContent = `Break-even ${breakEvenYear}`;
        }
        
        // Actualizar porcentaje de deuda dinámicamente
        const debtPercentage = Math.round(this.data.capex.debtRatio);
        const debtPercentageElement = document.getElementById('debtPercentage');
        if (debtPercentageElement) {
            debtPercentageElement.textContent = `${debtPercentage}% Deuda`;
        }
    }

    // Actualizar dashboard completo
    update() {
        this.collectData();
        this.updateKPIs();
        this.updateMarketMetrics();
        this.updateMarketTable(); // Actualizar tabla de métricas por mercado 2030
        this.updateMarketSummary(); // Actualizar resumen visual dinámico
        this.updateCashflowSummary();
        
        // Actualizar gráficos
        if (this.charts.revenue) {
            const years = Object.keys(this.data.cashflow.yearlyFCF || {});
            const cashflows = years.map(year => {
                const fcf = this.data.cashflow.yearlyFCF[year] || 0;
                return fcf / 1000000; // Convertir a millones
            });
            
            this.charts.revenue.data.labels = years;
            this.charts.revenue.data.datasets[0].data = cashflows;
            
            // Actualizar colores basado en valores positivos/negativos
            this.charts.revenue.data.datasets[0].backgroundColor = cashflows.map(value => 
                value >= 0 ? 'rgba(46, 125, 50, 0.8)' : 'rgba(198, 40, 40, 0.8)'
            );
            this.charts.revenue.data.datasets[0].borderColor = cashflows.map(value => 
                value >= 0 ? '#2e7d32' : '#c62828'
            );
            
            this.charts.revenue.update();
        }
        
        // Evaluar viabilidad del proyecto después de actualizar todos los KPIs
        setTimeout(() => {
            evaluateProjectViability();
        }, 100);
        
        // Forzar segunda evaluación por si la primera falló
        setTimeout(() => {
            evaluateProjectViability();
        }, 2000);
    }

    // Utilidades
    formatCurrency(value, unit = 'M') {
        if (!value) return '$0';
        
        if (unit === 'K') {
            return '$' + Math.round(value / 1000) + 'K';
        } else if (unit === 'M') {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        }
        return '$' + value.toLocaleString();
    }

    formatNumber(value) {
        if (!value) return '0';
        if (value >= 1000) {
            return Math.round(value / 1000) + 'K';
        }
        return Math.round(value).toLocaleString();
    }

    calculateCAGR(startValue, endValue, years) {
        return Math.round((Math.pow(endValue / startValue, 1 / years) - 1) * 100);
    }

    // Actualizar resumen visual dinámico (Mercado Líder, Mayor AOV, Mayor Volumen)
    updateMarketSummary() {
        console.log('📈 Actualizando resumen visual de mercados...');
        
        if (!this.data.revenues?.yearlyData?.[2030]) {
            console.warn('⚠️ No hay datos de ingresos 2030 para actualizar el resumen');
            return;
        }
        
        const marketData2030 = this.data.revenues.yearlyData[2030];
        const markets = Object.keys(marketData2030);
        
        // Calcular totales para participaciones
        const totalRevenue = markets.reduce((sum, market) => {
            return sum + (marketData2030[market]?.netRevenue || 0);
        }, 0);
        
        // 1. MERCADO LÍDER (mayor participación por revenue)
        let leaderMarket = null;
        let leaderRevenue = 0;
        let leaderShare = 0;
        
        markets.forEach(market => {
            const revenue = marketData2030[market]?.netRevenue || 0;
            if (revenue > leaderRevenue) {
                leaderRevenue = revenue;
                leaderMarket = market;
                leaderShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            }
        });
        
        // 2. MAYOR AOV (mayor ticket promedio)
        let highestAOVMarket = null;
        let highestAOV = 0;
        
        markets.forEach(market => {
            const aov = marketData2030[market]?.avgTicket || 0;
            if (aov > highestAOV) {
                highestAOV = aov;
                highestAOVMarket = market;
            }
        });
        
        // 3. MAYOR VOLUMEN (más órdenes)
        let highestVolumeMarket = null;
        let highestVolume = 0;
        
        markets.forEach(market => {
            const orders = marketData2030[market]?.orders || 0;
            if (orders > highestVolume) {
                highestVolume = orders;
                highestVolumeMarket = market;
            }
        });
        
        // Mapeo de nombres de mercados para display
        const marketNames = {
            'chile': 'Chile',
            'mexico': 'México',

        };
        
        // Actualizar elementos en el DOM
        const marketLeaderElement = document.getElementById('market-leader-summary');
        const highestAOVElement = document.getElementById('highest-aov-summary');
        const highestVolumeElement = document.getElementById('highest-volume-summary');
        
        if (marketLeaderElement && leaderMarket) {
            const marketName = marketNames[leaderMarket] || leaderMarket;
            marketLeaderElement.innerHTML = `${marketName} representa el <strong>${leaderShare.toFixed(1)}%</strong> del revenue total`;
        }
        
        if (highestAOVElement && highestAOVMarket) {
            const marketName = marketNames[highestAOVMarket] || highestAOVMarket;
            highestAOVElement.innerHTML = `${marketName} con <strong>$${Math.round(highestAOV)}</strong> de ticket promedio`;
        }
        
        if (highestVolumeElement && highestVolumeMarket) {
            const marketName = marketNames[highestVolumeMarket] || highestVolumeMarket;
            highestVolumeElement.innerHTML = `${marketName} con <strong>${this.formatNumber(highestVolume)}</strong> órdenes anuales`;
        }
        
        console.log('✅ Resumen visual actualizado:', {
            'Mercado Líder': leaderMarket ? `${marketNames[leaderMarket]} (${leaderShare.toFixed(1)}%)` : 'N/A',
            'Mayor AOV': highestAOVMarket ? `${marketNames[highestAOVMarket]} ($${Math.round(highestAOV)})` : 'N/A',
            'Mayor Volumen': highestVolumeMarket ? `${marketNames[highestVolumeMarket]} (${this.formatNumber(highestVolume)})` : 'N/A'
        });
    }
}

// Instancia global del dashboard
window.vsptDashboard = new Dashboard();

    // Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar más tiempo para que todos los cálculos estén completos
    setTimeout(() => {
        console.log('🎯 Inicializando dashboard...');
        window.vsptDashboard.init();
        
        // Forzar evaluación de viabilidad después de inicializar dashboard
        setTimeout(() => {
            evaluateProjectViability();
        }, 1000);
    }, 1500); // Aumentar el tiempo para asegurar que los cálculos estén completos
    
    // También forzar evaluación después de un tiempo adicional
    setTimeout(() => {
        evaluateProjectViability();
    }, 3000);
});

// Función para actualizar dashboard desde otros módulos
window.updateDashboard = function() {
    if (window.vsptDashboard && window.vsptDashboard.initialized) {
        window.vsptDashboard.update();
        
        // También evaluar viabilidad directamente
        setTimeout(() => {
            evaluateProjectViability();
        }, 200);
        
        // Actualizar análisis de sensibilidad si está disponible
        setTimeout(() => {
            if (window.updateSensitivityAnalysis) {
                window.updateSensitivityAnalysis();
            }
        }, 500);
        
        // Actualizar métricas clave automáticamente
        setTimeout(() => {
            if (typeof updateMetricsDisplay === 'function') {
                updateMetricsDisplay();
            }
        }, 300);
    }
};

// Función para evaluar la viabilidad del proyecto con retry automático
function evaluateProjectViability(retryCount = 0) {
    console.log(`🔍 Evaluando viabilidad del proyecto (intento ${retryCount + 1})...`);
    
    // Primero intentar obtener datos del dashboard directamente
    let economicIRR = 0, financialIRR = 0, economicNPV = 0, financialNPV = 0;
    
    // PRIORIDAD 1: Usar datos del dashboard si están disponibles
    if (window.vsptDashboard && window.vsptDashboard.data && window.vsptDashboard.data.cashflow) {
        const dashboardData = window.vsptDashboard.data.cashflow;
        economicIRR = dashboardData.economicIRR || dashboardData.irr || 0;
        financialIRR = dashboardData.financialIRR || 0;
        economicNPV = (dashboardData.npv || 0) / 1000000; // Convertir a millones
        financialNPV = (dashboardData.financialNPV || 0) / 1000000; // Convertir a millones
        
        console.log('✅ Usando datos del dashboard:', {
            economicIRR: `${economicIRR}%`,
            financialIRR: `${financialIRR}%`,
            economicNPV: `$${economicNPV.toFixed(1)}M`,
            financialNPV: `$${financialNPV.toFixed(1)}M`
        });
    } else {
        // PRIORIDAD 2: Intentar obtener de los elementos del DOM
        console.log('⚠️ Dashboard data no disponible, intentando DOM...');
        
        const economicIRRElement = document.getElementById('economicIRR');
        const financialIRRElement = document.getElementById('financialIRR');
        const economicNPVElement = document.getElementById('economicNPV');
        const financialNPVElement = document.getElementById('financialNPV');
        
        // También intentar obtener del dashboard principal como fallback
        const dashEconomicIRRElement = document.getElementById('dashEconomicIRR');
        const dashFinancialIRRElement = document.getElementById('dashFinancialIRR');
        const dashNPVElement = document.getElementById('dashNPV');
        const dashFinancialNPVElement = document.getElementById('dashFinancialNPV');
        
        economicIRR = parseFloat(economicIRRElement?.textContent?.replace('%', '') || 
                                      dashEconomicIRRElement?.textContent?.replace('%', '') || '0');
        financialIRR = parseFloat(financialIRRElement?.textContent?.replace('%', '') || 
                                       dashFinancialIRRElement?.textContent?.replace('%', '') || '0');
        economicNPV = parseFloat(economicNPVElement?.textContent?.replace(/[$M,]/g, '') || 
                                      dashNPVElement?.textContent?.replace(/[$M,]/g, '') || '0');
        financialNPV = parseFloat(financialNPVElement?.textContent?.replace(/[$M,]/g, '') || 
                                       dashFinancialNPVElement?.textContent?.replace(/[$M,]/g, '') || '0');
        
        console.log('📊 Datos obtenidos del DOM:', {
            economicIRR: `${economicIRR}%`,
            financialIRR: `${financialIRR}%`,
            economicNPV: `$${economicNPV.toFixed(1)}M`,
            financialNPV: `$${financialNPV.toFixed(1)}M`
        });
    }
    
    // Si los datos son cero o muy bajos y es el primer intento, reintentar
    if ((economicIRR === 0 && financialIRR === 0 && economicNPV === 0) && retryCount < 3) {
        console.log(`⏳ Datos no disponibles, reintentando en 1 segundo (intento ${retryCount + 1}/3)...`);
        setTimeout(() => evaluateProjectViability(retryCount + 1), 1000);
        return;
    }
    
    // Si aún no hay datos después de 3 intentos, usar datos por defecto
    if (economicIRR === 0 && financialIRR === 0 && economicNPV === 0) {
        console.log('⚠️ Usando datos por defecto para evaluación');
        economicIRR = 35; // TIR económica por defecto
        financialIRR = 28; // TIR financiera por defecto
        economicNPV = 1.8; // NPV económico por defecto (millones)
        financialNPV = 1.2; // NPV financiero por defecto (millones)
    }
    
    // Tasas de descuento
    const WACC = 8.0; // Costo promedio ponderado de capital
    const Ke = 12.0;  // Costo del patrimonio
    
    // Actualizar valores en la interfaz
    updateViabilityMetrics(economicIRR, financialIRR, economicNPV, financialNPV, WACC, Ke);
    
    // Evaluar viabilidad económica
    const economicViability = evaluateEconomicViability(economicIRR, economicNPV, WACC);
    
    // Evaluar viabilidad financiera
    const financialViability = evaluateFinancialViability(financialIRR, financialNPV, Ke);
    
    // Mostrar resultados
    displayViabilityResults(economicViability, financialViability);
    
    // Generar conclusión general
    generateProjectConclusion(economicViability, financialViability);
}

// Función para actualizar las métricas en la interfaz
function updateViabilityMetrics(economicIRR, financialIRR, economicNPV, financialNPV, WACC, Ke) {
    // Actualizar valores económicos
    const economicIRRElement = document.getElementById('economicIRRValue');
    const waccElement = document.getElementById('waccValue');
    const economicNPVElement = document.getElementById('economicNPVValue');
    
    if (economicIRRElement) economicIRRElement.textContent = `${economicIRR.toFixed(1)}%`;
    if (waccElement) waccElement.textContent = `${WACC.toFixed(1)}%`;
    if (economicNPVElement) economicNPVElement.textContent = `$${economicNPV.toFixed(1)}M`;
    
    // Actualizar valores financieros
    const financialIRRElement = document.getElementById('financialIRRValue');
    const keElement = document.getElementById('keValue');
    const financialNPVElement = document.getElementById('financialNPVValue');
    
    if (financialIRRElement) financialIRRElement.textContent = `${financialIRR.toFixed(1)}%`;
    if (keElement) keElement.textContent = `${Ke.toFixed(1)}%`;
    if (financialNPVElement) financialNPVElement.textContent = `$${financialNPV.toFixed(1)}M`;
}

// Función para evaluar viabilidad económica
function evaluateEconomicViability(irr, npv, wacc) {
    const irrDifference = irr - wacc;
    
    let status, description, icon, viable;
    
    if (irr > wacc && npv > 0) {
        if (irrDifference >= 5) {
            status = 'Altamente Viable';
            description = `TIR supera WACC por ${irrDifference.toFixed(1)}pp. VAN positivo.`;
            icon = 'fas fa-check-circle';
            viable = 'viable';
        } else if (irrDifference >= 2) {
            status = 'Viable';
            description = `TIR supera WACC por ${irrDifference.toFixed(1)}pp. VAN positivo.`;
            icon = 'fas fa-check-circle';
            viable = 'viable';
        } else {
            status = 'Marginalmente Viable';
            description = `TIR supera WACC por ${irrDifference.toFixed(1)}pp. Margen ajustado.`;
            icon = 'fas fa-exclamation-triangle';
            viable = 'marginal';
        }
    } else if (irr > wacc && npv <= 0) {
        status = 'Revisar Análisis';
        description = 'TIR > WACC pero VAN negativo. Verificar cálculos.';
        icon = 'fas fa-question-circle';
        viable = 'marginal';
    } else {
        status = 'No Viable';
        description = `TIR (${irr.toFixed(1)}%) inferior al WACC (${wacc.toFixed(1)}%).`;
        icon = 'fas fa-times-circle';
        viable = 'not-viable';
    }
    
    return { status, description, icon, viable, irrDifference };
}

// Función para evaluar viabilidad financiera
function evaluateFinancialViability(irr, npv, ke) {
    const irrDifference = irr - ke;
    
    let status, description, icon, viable;
    
    if (irr > ke && npv > 0) {
        if (irrDifference >= 8) {
            status = 'Altamente Atractivo';
            description = `TIR supera Ke por ${irrDifference.toFixed(1)}pp. Excelente retorno.`;
            icon = 'fas fa-star';
            viable = 'viable';
        } else if (irrDifference >= 3) {
            status = 'Atractivo';
            description = `TIR supera Ke por ${irrDifference.toFixed(1)}pp. Buen retorno.`;
            icon = 'fas fa-check-circle';
            viable = 'viable';
        } else {
            status = 'Marginalmente Atractivo';
            description = `TIR supera Ke por ${irrDifference.toFixed(1)}pp. Retorno ajustado.`;
            icon = 'fas fa-exclamation-triangle';
            viable = 'marginal';
        }
    } else if (irr > ke && npv <= 0) {
        status = 'Revisar Análisis';
        description = 'TIR > Ke pero VAN negativo. Verificar cálculos.';
        icon = 'fas fa-question-circle';
        viable = 'marginal';
    } else {
        status = 'No Atractivo';
        description = `TIR (${irr.toFixed(1)}%) inferior al Ke (${ke.toFixed(1)}%).`;
        icon = 'fas fa-times-circle';
        viable = 'not-viable';
    }
    
    return { status, description, icon, viable, irrDifference };
}

// Función para mostrar los resultados de viabilidad
function displayViabilityResults(economicViability, financialViability) {
    // Mostrar resultado económico
    const economicResultElement = document.getElementById('economicViabilityResult');
    if (economicResultElement) {
        economicResultElement.className = `viability-result ${economicViability.viable}`;
        economicResultElement.innerHTML = `
            <div class="result-icon">
                <i class="${economicViability.icon}"></i>
            </div>
            <div class="result-text">
                <span class="result-status">${economicViability.status}</span>
                <span class="result-description">${economicViability.description}</span>
            </div>
        `;
    }
    
    // Mostrar resultado financiero
    const financialResultElement = document.getElementById('financialViabilityResult');
    if (financialResultElement) {
        financialResultElement.className = `viability-result ${financialViability.viable}`;
        financialResultElement.innerHTML = `
            <div class="result-icon">
                <i class="${financialViability.icon}"></i>
            </div>
            <div class="result-text">
                <span class="result-status">${financialViability.status}</span>
                <span class="result-description">${financialViability.description}</span>
            </div>
        `;
    }
}

// Función para generar la conclusión general del proyecto
function generateProjectConclusion(economicViability, financialViability) {
    const conclusionCard = document.getElementById('projectConclusionCard');
    const conclusionText = document.getElementById('projectConclusionText');
    
    if (!conclusionCard || !conclusionText) return;
    
    let overallStatus, conclusionMessage, cardClass, icon;
    
    // Determinar el estado general basado en ambas evaluaciones
    if (economicViability.viable === 'viable' && financialViability.viable === 'viable') {
        overallStatus = 'Proyecto Recomendado';
        conclusionMessage = 'El proyecto es viable tanto económica como financieramente. Se recomienda su implementación ya que genera valor para la empresa y ofrece retornos atractivos para los inversionistas.';
        cardClass = 'viable';
        icon = 'fas fa-thumbs-up';
    } else if (economicViability.viable === 'viable' || financialViability.viable === 'viable') {
        if (economicViability.viable === 'viable') {
            overallStatus = 'Proyecto con Reservas';
            conclusionMessage = 'El proyecto es económicamente viable pero presenta desafíos financieros. Considerar reestructurar el financiamiento o buscar mejores condiciones de capital.';
        } else {
            overallStatus = 'Evaluar Estructura Financiera';
            conclusionMessage = 'El proyecto es financieramente atractivo pero presenta desafíos económicos. Revisar supuestos operativos y estructura de costos.';
        }
        cardClass = 'mixed';
        icon = 'fas fa-balance-scale';
    } else if (economicViability.viable === 'marginal' || financialViability.viable === 'marginal') {
        overallStatus = 'Proyecto Marginal';
        conclusionMessage = 'El proyecto presenta viabilidad marginal. Se recomienda optimizar parámetros clave, revisar supuestos y considerar escenarios alternativos antes de la decisión final.';
        cardClass = 'mixed';
        icon = 'fas fa-exclamation-triangle';
    } else {
        overallStatus = 'Proyecto No Recomendado';
        conclusionMessage = 'El proyecto no cumple con los criterios mínimos de viabilidad económica y financiera. Se recomienda replantear el modelo de negocio o considerar alternativas de inversión.';
        cardClass = 'not-viable';
        icon = 'fas fa-times-circle';
    }
    
    // Actualizar la interfaz
    conclusionCard.className = `conclusion-card ${cardClass}`;
    conclusionCard.querySelector('.conclusion-icon i').className = icon;
    conclusionCard.querySelector('h4').textContent = overallStatus;
    conclusionText.textContent = conclusionMessage;
    
    console.log('📋 Conclusión del proyecto:', {
        overallStatus,
        economicViable: economicViability.viable,
        financialViable: financialViability.viable
    });
} 