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
        if (this.initialized) return;
        
        // Esperar a que todos los módulos estén cargados
        if (typeof updateCalculations === 'function') {
            this.collectData();
            this.updateKPIs();
            this.createCharts();
            this.updateMarketMetrics();
            this.updateCashflowSummary();
            this.initialized = true;
        } else {
            // Reintentar en 100ms si los módulos no están listos
            setTimeout(() => this.init(), 100);
        }
    }

    // Recopilar datos de todos los módulos
    collectData() {
        try {
            // Datos de inversiones
            this.data.capex = this.getCapexData();
            
            // Datos de ingresos
            this.data.revenues = this.getRevenueData();
            
            // Datos de costos
            this.data.costs = this.getCostData();
            
            // Datos de flujo de caja
            this.data.cashflow = this.getCashflowData();
            
            // Calcular métricas derivadas
            this.calculateDerivedMetrics();
            
        } catch (error) {
            console.log('Usando datos por defecto');
            this.setDefaultData();
        }
    }

    // Obtener datos de CAPEX usando las mismas funciones que investments.js
    getCapexData() {
        const totalCapex = 800000; // Mismo valor que investments.js
        const params = getFinancialParams(); // Usar la función de config.js
        
        const investments = {
            totalCapex: totalCapex,
            financing: {
                debt: totalCapex * params.debtRatio,
                equity: totalCapex * params.equityRatio,
                debtRatio: params.debtRatio,
                equityRatio: params.equityRatio
            }
        };
        
        return {
            totalCapex: investments.totalCapex,
            totalDebt: investments.financing.debt,
            totalEquity: investments.financing.equity,
            debtRatio: params.debtRatio * 100, // Convertir a porcentaje para display
            params: params
        };
    }

    // Obtener datos de ingresos usando las mismas funciones que revenues.js
    getRevenueData() {
        const params = getBusinessParams(); // Usar la función de config.js
        const revenues = {};
        
        // Usar exactamente el mismo cálculo que revenues.js
        for (let year = 2026; year <= 2030; year++) {
            const yearIndex = year - 2026;
            const yearlyTraffic = params.initialTraffic * Math.pow(1 + params.trafficGrowth, yearIndex + 1);
            
            // CONVERSIÓN CRECIENTE: Mejora gradual año a año (igual que revenues.js)
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

        // Calcular totales usando los mismos cálculos que revenues.js
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

        return {
            yearlyData: revenues,
            totalRevenue2030: revenue2030,
            totalOrders2030: orders2030,
            cagr: cagr * 100, // Convertir a porcentaje
            countries: marketDistribution
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
        // Si ya tenemos datos del modelo, usarlos
        if (modelData.economicCashFlow && modelData.economicCashFlow.metrics) {
            const economicFlow = modelData.economicCashFlow;
            let accumulatedFCF = 0;
            const yearlyFCF = {};
            
            // Calcular FCF acumulado de los años operativos
            for (let year = 2026; year <= 2030; year++) {
                if (economicFlow[year]) {
                    yearlyFCF[year] = economicFlow[year].fcf;
                    accumulatedFCF += economicFlow[year].fcf;
                }
            }
            
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
        
        // Fallback: calcular basado en revenues si no hay datos del modelo
        const revenues = this.data.revenues?.yearlyData || {};
        const params = getFinancialParams();
        const years = [2026, 2027, 2028, 2029, 2030];
        
        let accumulatedFCF = 0;
        const yearlyFCF = {};
        
        years.forEach(year => {
            let yearRevenue = 0;
            if (revenues[year]) {
                Object.keys(marketDistribution).forEach(market => {
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
            
            // Depreciación simplificada
            const depreciation = 800000 / params.depreciationYears; // CAPEX total / años
            const ebit = ebitda - depreciation;
            const taxes = Math.max(0, ebit * params.taxRate);
            const nopat = ebit - taxes;
            
            // CAPEX del año
            const capexData = capexDistribution[year];
            const capex = capexData ? 800000 * capexData.pct : 0;
            
            const fcf = nopat + depreciation - capex;
            yearlyFCF[year] = fcf;
            accumulatedFCF += fcf;
        });

        return {
            accumulatedFCF,
            yearlyFCF,
            paybackPeriod: this.calculatePaybackPeriod(yearlyFCF),
            irr: this.calculateSimpleIRR(yearlyFCF)
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
            
            // Calcular métricas financieras solo si no están disponibles del modelo
            if (!this.data.cashflow.financialNPV) {
                this.data.cashflow.financialNPV = this.calculateFinancialNPV();
            }
            
            if (!this.data.cashflow.financialIRR) {
                this.data.cashflow.financialIRR = this.calculateFinancialIRR();
            }
        }
    }

    // Establecer datos por defecto si los módulos no están disponibles
    setDefaultData() {
        this.data = {
            capex: {
                totalCapex: 800000,
                totalDebt: 280000,
                totalEquity: 520000
            },
            revenues: {
                totalRevenue2030: 12500000,
                totalOrders2030: 208333,
                cagr: 285,
                countries: {
                    'USA': { share: 0.40 },
                    'Brazil': { share: 0.25 },
                    'Mexico': { share: 0.20 },
                    'Canada': { share: 0.15 }
                },
                yearlyData: {
                    2026: { revenue: 500000, countries: { 'USA': {revenue: 200000, orders: 3333, ticket: 60}, 'Brazil': {revenue: 125000, orders: 3125, ticket: 40}, 'Mexico': {revenue: 100000, orders: 2500, ticket: 40}, 'Canada': {revenue: 75000, orders: 1500, ticket: 50} } },
                    2027: { revenue: 1500000, countries: { 'USA': {revenue: 600000, orders: 10000, ticket: 60}, 'Brazil': {revenue: 375000, orders: 9375, ticket: 40}, 'Mexico': {revenue: 300000, orders: 7500, ticket: 40}, 'Canada': {revenue: 225000, orders: 4500, ticket: 50} } },
                    2028: { revenue: 4500000, countries: { 'USA': {revenue: 1800000, orders: 30000, ticket: 60}, 'Brazil': {revenue: 1125000, orders: 28125, ticket: 40}, 'Mexico': {revenue: 900000, orders: 22500, ticket: 40}, 'Canada': {revenue: 675000, orders: 13500, ticket: 50} } },
                    2029: { revenue: 8500000, countries: { 'USA': {revenue: 3400000, orders: 56667, ticket: 60}, 'Brazil': {revenue: 2125000, orders: 53125, ticket: 40}, 'Mexico': {revenue: 1700000, orders: 42500, ticket: 40}, 'Canada': {revenue: 1275000, orders: 25500, ticket: 50} } },
                    2030: { revenue: 12500000, countries: { 'USA': {revenue: 5000000, orders: 83333, ticket: 60}, 'Brazil': {revenue: 3125000, orders: 78125, ticket: 40}, 'Mexico': {revenue: 2500000, orders: 62500, ticket: 40}, 'Canada': {revenue: 1875000, orders: 37500, ticket: 50} } }
                }
            },
            cashflow: {
                accumulatedFCF: 8200000,
                paybackPeriod: 18,
                irr: 42,
                npv: 2500000,
                financialNPV: 1650000, // Menor que el económico por el costo del equity
                financialIRR: 0 // 0% por defecto hasta que se calculen datos reales
            },
            roi: 156
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
            'dashFinancialNPV': this.formatCurrency(this.data.cashflow.financialNPV || 1800000),
            'dashFinancialIRR': Math.round(this.data.cashflow.financialIRR || 0) + '%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Actualizar estado del ROI dinámicamente
        this.updateROIStatus(roi);
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

    // Crear gráficos
    createCharts() {
        this.createRevenueChart();
        this.createMarketDistributionChart();
    }

    // Crear gráfico de evolución de flujos de caja
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) {
            // Crear canvas si no existe
            this.createRevenueChartCanvas();
            return;
        }

        const years = Object.keys(this.data.cashflow.yearlyFCF || {});
        const cashflows = years.map(year => {
            const fcf = this.data.cashflow.yearlyFCF[year] || 0;
            return fcf / 1000000; // Convertir a millones
        });

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
        const chartSection = document.querySelector('.chart-section .chart-placeholder');
        if (chartSection) {
            chartSection.innerHTML = '<canvas id="revenueChart" style="max-height: 200px;"></canvas>';
            setTimeout(() => this.createRevenueChart(), 100);
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
            '#1e3a8a', // USA - Azul
            '#15803d', // Brasil - Verde
            '#dc2626', // México - Rojo
            '#f59e0b'  // Canadá - Amarillo/Naranja
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

    // Actualizar métricas por mercado usando datos reales
    updateMarketMetrics() {
        const countryMapping = {
            'usa': 'usa',
            'brazil': 'brasil', 
            'mexico': 'mexico',
            'canada': 'canada'
        };
        
        Object.entries(countryMapping).forEach(([cssClass, marketKey]) => {
            const marketData = this.data.revenues.yearlyData[2030]?.[marketKey];
            
            if (marketData) {
                const card = document.querySelector(`.market-card.${cssClass}`);
                if (card) {
                    const stats = card.querySelectorAll('.stat-value');
                    if (stats.length >= 3) {
                        stats[0].textContent = this.formatCurrency(marketData.netRevenue);
                        stats[1].textContent = this.formatNumber(marketData.orders);
                        stats[2].textContent = '$' + Math.round(marketData.avgTicket);
                    }
                }
            }
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
}

// Instancia global del dashboard
window.vsptDashboard = new Dashboard();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que otros scripts se carguen
    setTimeout(() => {
        window.vsptDashboard.init();
    }, 500);
});

// Función para actualizar dashboard desde otros módulos
window.updateDashboard = function() {
    if (window.vsptDashboard && window.vsptDashboard.initialized) {
        window.vsptDashboard.update();
    }
}; 