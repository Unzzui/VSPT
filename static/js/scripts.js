// ============================================================================
// VSPT DIGITAL EXPANSION - MODELO FINANCIERO PRINCIPAL (ORQUESTADOR)
// ============================================================================
// Este archivo contiene solo la lógica de orquestación y navegación
// Todas las funciones específicas están en módulos separados:
// - config.js: Constantes y parámetros
// - investments.js: CAPEX progresivo y financiamiento
// - revenues.js: Proyección de ingresos por país
// - costs.js: Costos operativos
// - workingCapital.js: Working capital por país
// - debt.js: Cronograma de deuda
// - cashflow.js: Flujos económico y financiero
// - sensitivity.js: Análisis de sensibilidad
// - utils.js: Utilitarios, métricas y validaciones
// ============================================================================

// Variables globales para almacenar datos del modelo
let modelData = {
    investments: {},
    revenues: {},
    costs: {},
    workingCapital: {},
    debt: {},
    economicCashFlow: {},
    financialCashFlow: {},
    sensitivity: {}
};

// ============================================================================
// FUNCIÓN PRINCIPAL DE NAVEGACIÓN
// ============================================================================

function showTab(tabName) {
    try {
        console.log(`🔄 Cambiando a tab: ${tabName}`);
        
        // Cerrar menú móvil si está abierto
        const tabsContainer = document.querySelector('.tabs');
        const menuButton = document.getElementById('mobile-menu-button');
        if (tabsContainer && tabsContainer.classList.contains('mobile-open')) {
            tabsContainer.classList.remove('mobile-open');
            if (menuButton) {
                menuButton.classList.remove('active');
                menuButton.setAttribute('aria-label', 'Abrir menú');
                
                // Restaurar ícono de hamburguesa
                const icon = menuButton.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
            }
        }
        
        // Ocultar todos los contenidos
        document.querySelectorAll('.content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Mostrar el contenido seleccionado
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            console.log(`✅ Tab ${tabName} mostrado`);
        } else {
            console.error(`❌ Elemento con ID ${tabName} no encontrado`);
            return;
        }
        
        // Remover clase 'active' de todos los tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Agregar clase 'active' al tab seleccionado
        const activeTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Llamar a la función específica de cada tab
        switch (tabName) {
            case 'dashboard':
                if (typeof updateDashboard === 'function') updateDashboard();
                break;
            case 'inversiones':
                if (typeof calculateOptimizedCapex === 'function') calculateOptimizedCapex();
                break;
            case 'ingresos':
                if (typeof calculateRevenues === 'function') calculateRevenues();
                break;
            case 'costos':
                if (typeof calculateCosts === 'function') calculateCosts();
                break;
            case 'workingCapital':
                if (typeof calculateWorkingCapital === 'function') calculateWorkingCapital();
                break;
            case 'debtSchedule':
                if (typeof calculateDebtSchedule === 'function') calculateDebtSchedule();
                break;
            case 'depreciaciones':
                if (typeof calculateDepreciation === 'function') calculateDepreciation();
                break;
            case 'economicFlow':
                if (typeof calculateEconomicCashFlow === 'function') calculateEconomicCashFlow();
                break;
            case 'financialFlow':
                if (typeof calculateFinancialCashFlow === 'function') calculateFinancialCashFlow();
                break;
            case 'sensibilidad':
                if (typeof updateSensitivity === 'function') updateSensitivity();
                break;
        }
        
    } catch (error) {
        console.error(`❌ Error en showTab(${tabName}):`, error);
    }
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DE CÁLCULOS
// ============================================================================

function updateCalculations() {
    try {
        console.log('🚀 Iniciando actualización completa del modelo financiero...');
        
        // 1. CAPEX Progresivo y Financiamiento (investments.js)
        if (typeof calculateOptimizedCapex === 'function') {
            calculateOptimizedCapex();
            console.log('✅ CAPEX progresivo y financiamiento calculados');
        } else {
            console.warn('⚠️ calculateOptimizedCapex no disponible');
        }
        
        // 2. Proyección de Ingresos (revenues.js)
        if (typeof calculateRevenues === 'function') {
            calculateRevenues();
            console.log('✅ Ingresos por país calculados');
        } else {
            console.warn('⚠️ calculateRevenues no disponible');
        }
        
        // 3. Costos Operativos (costs.js)
        if (typeof calculateCosts === 'function') {
            calculateCosts();
            console.log('✅ Costos operativos calculados');
        } else {
            console.warn('⚠️ calculateCosts no disponible');
        }
        
        // 4. Working Capital por País (workingCapital.js)
        if (typeof calculateWorkingCapital === 'function') {
            calculateWorkingCapital();
            console.log('✅ Working Capital calculado');
        } else {
            console.warn('⚠️ calculateWorkingCapital no disponible');
        }
        
        // 5. Estructura y Cronograma de Deuda (debt.js)
        if (typeof calculateDebtStructure === 'function') {
            calculateDebtStructure();
            console.log('✅ Cronograma de deuda calculado');
        } else {
            console.warn('⚠️ calculateDebtStructure no disponible');
        }
        
        // 6. Cronograma de Depreciaciones (depreciation.js)
        if (typeof calculateDepreciations === 'function') {
            calculateDepreciations();
            console.log('✅ Cronograma de depreciaciones calculado');
        } else {
            console.warn('⚠️ calculateDepreciations no disponible');
        }
        
        // 7. Flujo de Caja Económico (cashflow.js)
        if (typeof calculateEconomicCashFlow === 'function') {
            calculateEconomicCashFlow();
            console.log('✅ Flujo económico calculado');
        } else {
            console.warn('⚠️ calculateEconomicCashFlow no disponible');
        }
        
        // 8. Flujo de Caja Financiero (cashflow.js)
        if (typeof calculateFinancialCashFlow === 'function') {
            calculateFinancialCashFlow();
            console.log('✅ Flujo financiero calculado');
        } else {
            console.warn('⚠️ calculateFinancialCashFlow no disponible');
        }
        
        // 8.1. Sincronizar datos entre módulos
        syncDataBetweenModules();
        
        // 9. Análisis de Sensibilidad (sensitivity.js) - Solo ejecutar si estamos en la pestaña de sensibilidad
        setTimeout(() => {
            const sensitivityTab = document.querySelector('[onclick="showTab(\'sensitivity\')"]');
            const isSensitivityTabActive = sensitivityTab && sensitivityTab.classList.contains('active');
            
            if (isSensitivityTabActive && typeof updateSensitivity === 'function') {
                updateSensitivity();
                console.log('✅ Análisis de sensibilidad actualizado');
            } else if (!isSensitivityTabActive) {
                console.log('ℹ️ Análisis de sensibilidad omitido (no está en la pestaña activa)');
            } else {
                console.warn('⚠️ updateSensitivity no disponible');
            }
        }, 100);
        
        // 9. Métricas adicionales e indicadores (utils.js)
        if (typeof updateImpactMetrics === 'function') {
            updateImpactMetrics();
        }
        if (typeof updatePerformanceIndicators === 'function') {
            updatePerformanceIndicators();
        }
        if (typeof trackChanges === 'function') {
            trackChanges();
        }
        
        // 9.1. Actualizar métricas clave automáticamente
        if (typeof updateMetricsDisplay === 'function') {
            updateMetricsDisplay();
            console.log('✅ Métricas clave actualizadas automáticamente');
        }
        
        // 10. Actualizar Dashboard (dashboard.js)
        if (typeof updateDashboard === 'function') {
            updateDashboard();
            console.log('✅ Dashboard actualizado');
        }
        
        console.log('🎉 Modelo financiero actualizado completamente');
        
    } catch (error) {
        console.error('❌ Error en updateCalculations:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error en los cálculos. Verifique los datos ingresados.', 'error');
        }
    }
}

// ============================================================================
// FUNCIÓN PARA SINCRONIZAR DATOS ENTRE MÓDULOS
// ============================================================================

function syncDataBetweenModules() {
    console.log('🔄 Sincronizando datos entre módulos...');
    
    // Verificar que modelData existe
    if (typeof modelData === 'undefined') {
        window.modelData = {};
    }
    
    // Verificar datos de ingresos
    if (modelData.revenues && modelData.revenues[2030]) {
        const revenue2030 = Object.keys(marketDistribution).reduce((sum, market) => {
            return sum + (modelData.revenues[2030][market] ? modelData.revenues[2030][market].netRevenue : 0);
        }, 0);
        
        console.log('📊 Datos sincronizados:', {
            'Revenue 2030 del modelo': `$${(revenue2030/1000000).toFixed(1)}M`,
            'Mercados disponibles': Object.keys(modelData.revenues[2030] || {}),
            'Datos por mercado 2030': Object.keys(modelData.revenues[2030] || {}).map(market => ({
                market,
                revenue: `$${((modelData.revenues[2030][market]?.netRevenue || 0)/1000000).toFixed(1)}M`,
                orders: Math.round(modelData.revenues[2030][market]?.orders || 0).toLocaleString()
            }))
        });
        
        // Forzar actualización de elementos específicos si están disponibles
        const totalRevenue2030Element = document.getElementById('totalRevenue2030');
        if (totalRevenue2030Element) {
            totalRevenue2030Element.textContent = `$${(revenue2030/1000000).toFixed(1)}M`;
        }
        
        // Actualizar análisis de sensibilidad si está disponible
        const sensitivityRevenueElement = document.getElementById('sensitivityRevenue');
        if (sensitivityRevenueElement) {
            sensitivityRevenueElement.textContent = `$${(revenue2030/1000000).toFixed(1)}M`;
            console.log('✅ Análisis de sensibilidad sincronizado:', `$${(revenue2030/1000000).toFixed(1)}M`);
        }
        
        // Actualizar dashboard si está disponible
        const dashTotalRevenueElement = document.getElementById('dashTotalRevenue');
        if (dashTotalRevenueElement) {
            dashTotalRevenueElement.textContent = `$${(revenue2030/1000000).toFixed(1)}M`;
        }
        
        // Forzar actualización del análisis de sensibilidad si está disponible
        setTimeout(() => {
            if (window.sensitivityAnalysis && typeof window.sensitivityAnalysis.updateBaseMetrics === 'function') {
                console.log('🔄 Forzando actualización de métricas de sensibilidad...');
                window.sensitivityAnalysis.updateBaseMetrics();
            }
            
            // También intentar con la función global
            if (typeof window.updateSensitivityAnalysis === 'function') {
                console.log('🔄 Forzando actualización global de sensibilidad...');
                window.updateSensitivityAnalysis();
            }
        }, 200);
        
    } else {
        console.warn('⚠️ Datos de ingresos no disponibles para sincronización');
    }
    
    console.log('✅ Sincronización completada');
}

// ============================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando modelo financiero VSPT...');
    
    // Verificar que todos los módulos estén cargados
    const requiredFunctions = [
        'calculateOptimizedCapex',      // capex.js (nueva función optimizada)
        'calculateRevenues',            // revenues.js
        'calculateCosts',               // costs.js
        'calculateWorkingCapital',      // workingCapital.js
        'calculateDebtStructure',       // debt.js
        'calculateEconomicCashFlow',    // cashflow.js
        'calculateFinancialCashFlow',   // cashflow.js
        'updateSensitivity'             // sensitivity.js
    ];
    
    const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
    if (missingFunctions.length > 0) {
        console.warn('⚠️ Funciones faltantes:', missingFunctions);
        console.log('🔍 Verificar que todos los archivos JS están cargados en el HTML');
    } else {
        console.log('✅ Todos los módulos están disponibles');
    }
    
    // Agregar event listeners a todos los inputs para actualización automática
    const inputs = document.querySelectorAll('input, select');
    console.log(`🎛️ Configurando ${inputs.length} controles interactivos...`);
    
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            console.log(`🔄 Cambio detectado en: ${input.id || input.name}`);
            updateCalculations();
        });
        input.addEventListener('input', () => {
            // Debounce para inputs de texto
            clearTimeout(input.debounceTimer);
            input.debounceTimer = setTimeout(() => {
                console.log(`⚡ Input actualizado: ${input.id || input.name}`);
                updateCalculations();
            }, 300);
        });
    });
    
    // Ejecutar cálculos iniciales
    setTimeout(() => {
        updateCalculations();
        console.log('🎯 Modelo inicializado correctamente');
        
        // Mostrar tab inicial
        const firstTab = document.querySelector('.tab.active');
        if (!firstTab) {
            const firstTabButton = document.querySelector('.tab');
            if (firstTabButton) {
                firstTabButton.classList.add('active');
                // Activar el primer contenido
                const firstContent = document.querySelector('.content');
                if (firstContent) {
                    firstContent.classList.remove('hidden');
                }
            }
        }
    }, 500);
});

// ============================================================================
// FUNCIONES DE DESCARGA DELEGADAS A UTILS.JS
// ============================================================================

function downloadExcel() {
    try {
        if (typeof exportToExcel === 'function') {
            console.log('📥 Iniciando exportación a Excel...');
            exportToExcel();
        } else {
            console.error('❌ Función exportToExcel no disponible en utils.js');
            alert('Error: módulo de exportación no disponible');
        }
    } catch (error) {
        console.error('❌ Error en downloadExcel:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error al generar archivo Excel', 'error');
        } else {
            alert('Error al generar archivo Excel');
        }
    }
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA DEBUG
// ============================================================================

function debugModel() {
    console.log('🔍 Estado actual del modelo:', modelData);
    console.log('📊 Módulos disponibles:', {
        investments: typeof calculateOptimizedCapex !== 'undefined',
        revenues: typeof calculateRevenues !== 'undefined',
        costs: typeof calculateCosts !== 'undefined',
        workingCapital: typeof calculateWorkingCapital !== 'undefined',
        debt: typeof calculateDebtStructure !== 'undefined',
        depreciation: typeof calculateDepreciations !== 'undefined',
        cashflow: typeof calculateEconomicCashFlow !== 'undefined',
        sensitivity: typeof updateSensitivity !== 'undefined',
        utils: typeof exportToExcel !== 'undefined'
    });
}

function resetModel() {
    console.log('🔄 Reiniciando modelo...');
    modelData = {
        investments: {},
        revenues: {},
        costs: {},
        workingCapital: {},
        debt: {},
        depreciation: {},
        economicCashFlow: {},
        financialCashFlow: {},
        sensitivity: {}
    };
    updateCalculations();
}

// Función de debug específica para inventario
function debugInventory() {
    console.log('🔍 Debug de inventario:');
    
    const inventoryParams = getInventoryParams();
    console.log('📦 Parámetros de inventario:', inventoryParams);
    
    const totalBottlesNeeded = inventoryParams.initialStockMonths * 1000;
    const containersNeeded = Math.ceil(totalBottlesNeeded / inventoryParams.bottlesPerContainer);
    const inventoryInvestment = containersNeeded * inventoryParams.containerCost;
    
    console.log('📊 Cálculos:');
    console.log('- Botellas necesarias:', totalBottlesNeeded);
    console.log('- Contenedores necesarios:', containersNeeded);
    console.log('- Inversión total:', inventoryInvestment);
    console.log('- Inversión formateada:', `$${(inventoryInvestment/1000).toFixed(0)}K`);
    
    return {
        params: inventoryParams,
        totalBottlesNeeded,
        containersNeeded,
        inventoryInvestment
    };
}

// Función de debug específica para depreciaciones
function debugDepreciations() {
    if (typeof debugDepreciation === 'function') {
        return debugDepreciation();
    } else {
        console.warn('⚠️ debugDepreciation no disponible');
        return null;
    }
}

// Alias para función de exportación Excel
function downloadExcel() {
    if (typeof exportToExcel === 'function') {
        exportToExcel();
    } else {
        console.error('❌ exportToExcel no disponible');
    }
}

// Función para restaurar valores por defecto
function resetToDefaults() {
    console.log('🔄 Restaurando valores por defecto...');
    
    try {
        // Confirmar con el usuario
        const confirmReset = confirm('¿Está seguro de que desea restaurar todos los valores por defecto? Esta acción no se puede deshacer.');
        
        if (!confirmReset) {
            console.log('❌ Reset cancelado por el usuario');
            return;
        }
        
        // Valores por defecto según especificación del usuario
        const defaultValues = {
            // CAPEX & Financing
            'bottlesPerContainer': 12000,
            'containerCost': 5000,
            'initialStock': 3,
            'debtRatio': 50,
            'interestRate': 6,
            'debtTerm': 5,
            
            // Ingresos
            'initialTraffic': 9100,
            'trafficGrowth': 100,
            'initialConversion': 2,
            'conversionGrowthRate': 40,
            'avgTicket': 50,
            
            // Costos
            'salesSalary': 50000,
            'marketingPct': 10,
            'inflation': 2,
            
            // Depreciaciones
            'residualValue': 10,
            'depreciationMethod': 'linear'
        };
        
        // Aplicar valores por defecto a todos los inputs
        Object.keys(defaultValues).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                if (element.type === 'select-one') {
                    element.value = defaultValues[elementId];
                } else {
                    element.value = defaultValues[elementId];
                }
                console.log(`✅ ${elementId}: ${defaultValues[elementId]}`);
            } else {
                console.warn(`⚠️ Elemento ${elementId} no encontrado`);
            }
        });
        
        // Resetear selects de sensibilidad
        const sensitivitySelects = {
            'conversionScenario': 'base',
            'trafficScenario': 'base',
            'logisticsScenario': 'base'
        };
        
        Object.keys(sensitivitySelects).forEach(selectId => {
            const element = document.getElementById(selectId);
            if (element) {
                element.value = sensitivitySelects[selectId];
                console.log(`✅ ${selectId}: ${sensitivitySelects[selectId]}`);
            }
        });
        
        // Resetear modelo de datos
        modelData = {
            investments: {},
            revenues: {},
            costs: {},
            workingCapital: {},
            debt: {},
            depreciation: {},
            economicCashFlow: {},
            financialCashFlow: {},
            sensitivity: {}
        };
        
        // Recalcular todo el modelo con los nuevos valores
        setTimeout(() => {
            updateCalculations();
            console.log('✅ Modelo restaurado a valores por defecto');
            
            // Mostrar mensaje de confirmación
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--success);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 9999;
                font-weight: 600;
                font-size: 16px;
            `;
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Valores restaurados correctamente';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
        }, 500);
        
    } catch (error) {
        console.error('❌ Error restaurando valores por defecto:', error);
        alert('Error al restaurar valores por defecto. Ver consola para más detalles.');
    }
}

// ============================================================================
// FUNCIÓN PARA MENÚ HAMBURGUESA RESPONSIVE
// ============================================================================

function toggleMobileMenu() {
    const tabsContainer = document.querySelector('.tabs');
    const menuButton = document.getElementById('mobile-menu-button');
    
    if (tabsContainer && menuButton) {
        // Toggle de visibilidad del menú en móvil
        tabsContainer.classList.toggle('mobile-open');
        menuButton.classList.toggle('active');
        
        // Cambiar el aria-label del botón
        const isExpanded = tabsContainer.classList.contains('mobile-open');
        menuButton.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
        
        // Cambiar ícono del botón
        const icon = menuButton.querySelector('i');
        if (icon) {
            icon.className = isExpanded ? 'fas fa-times' : 'fas fa-bars';
        }
        
        console.log(`📱 Menú móvil ${isExpanded ? 'abierto' : 'cerrado'}`);
    }
}

// Cerrar menú móvil al redimensionar ventana a desktop
window.addEventListener('resize', function() {
    const tabsContainer = document.querySelector('.tabs');
    const menuButton = document.getElementById('mobile-menu-button');
    
    if (window.innerWidth >= 769) { // breakpoint para desktop
        if (tabsContainer) {
            tabsContainer.classList.remove('mobile-open');
        }
        if (menuButton) {
            menuButton.classList.remove('active');
            menuButton.setAttribute('aria-label', 'Abrir menú');
            
            // Restaurar ícono de hamburguesa
            const icon = menuButton.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }
});

// Exponer funciones globalmente
window.downloadExcel = downloadExcel;
window.resetToDefaults = resetToDefaults;
window.showTab = showTab;
window.toggleMobileMenu = toggleMobileMenu;
