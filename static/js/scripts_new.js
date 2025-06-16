// ============================================================================
// VSPT DIGITAL EXPANSION - MODELO FINANCIERO PRINCIPAL
// ============================================================================
// Este archivo contiene las variables globales y funciones principales
// Las funciones específicas están divididas en módulos separados
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

// Sistema de monitoreo de cambios
let previousValues = {};
let changeHistory = [];

// ============================================================================
// FUNCIÓN PRINCIPAL DE NAVEGACIÓN
// ============================================================================

function showTab(tabName) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Mostrar el contenido seleccionado
    document.getElementById(tabName).classList.remove('hidden');
    
    // Actualizar tabs activos
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Actualizar cálculos si es necesario
    updateCalculations();
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DE CÁLCULOS
// ============================================================================

function updateCalculations() {
    try {
        console.log('🚀 Iniciando actualización completa del modelo financiero...');
        
        // 1. CAPEX Progresivo y Financiamiento
        calculateProgressiveCapex();
        console.log('✅ CAPEX progresivo y financiamiento calculados');
        
        // 2. Proyección de Ingresos
        calculateRevenues();
        console.log('✅ Ingresos por país calculados');
        
        // 3. Costos Operativos
        calculateCosts();
        console.log('✅ Costos operativos calculados');
        
        // 4. Working Capital por País
        calculateWorkingCapital();
        console.log('✅ Working Capital calculado');
        
        // 5. Estructura y Cronograma de Deuda
        calculateDebtStructure();
        console.log('✅ Cronograma de deuda calculado');
        
        // 6. Flujo de Caja Económico
        calculateEconomicCashFlow();
        console.log('✅ Flujo económico calculado');
        
        // 7. Flujo de Caja Financiero
        calculateFinancialCashFlow();
        console.log('✅ Flujo financiero calculado');
        
        // 8. Análisis de Sensibilidad (con delay para asegurar datos)
        setTimeout(() => {
            updateSensitivity();
            console.log('✅ Análisis de sensibilidad actualizado');
        }, 100);
        
        // 9. Métricas adicionales e indicadores
        updateImpactMetrics();
        updatePerformanceIndicators();
        trackChanges();
        
        console.log('🎉 Modelo financiero actualizado completamente');
        
    } catch (error) {
        console.error('❌ Error en updateCalculations:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error en los cálculos. Verifique los datos ingresados.', 'error');
        }
    }
}

// ============================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando modelo financiero VSPT...');
    
    // Agregar event listeners a todos los inputs
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', updateCalculations);
        input.addEventListener('input', updateCalculations);
    });
    
    // Ejecutar cálculos iniciales
    setTimeout(() => {
        updateCalculations();
        console.log('🎯 Modelo inicializado correctamente');
    }, 500);
});

// ============================================================================
// FUNCIONES DE DESCARGA
// ============================================================================

function downloadExcel() {
    try {
        console.log('📥 Generando archivo Excel...');
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Agregar hojas con datos actuales del modelo
        if (modelData.investments) {
            const wsInvestments = createInvestmentsSheet();
            XLSX.utils.book_append_sheet(wb, wsInvestments, "CAPEX & Financiamiento");
        }
        
        if (modelData.revenues) {
            const wsRevenues = createRevenuesSheet();
            XLSX.utils.book_append_sheet(wb, wsRevenues, "Ingresos por País");
        }
        
        if (modelData.costs) {
            const wsCosts = createCostsSheet();
            XLSX.utils.book_append_sheet(wb, wsCosts, "Costos Operativos");
        }
        
        if (modelData.workingCapital) {
            const wsWC = createWorkingCapitalSheet();
            XLSX.utils.book_append_sheet(wb, wsWC, "Working Capital");
        }
        
        if (modelData.debt) {
            const wsDebt = createDebtSheet();
            XLSX.utils.book_append_sheet(wb, wsDebt, "Cronograma Deuda");
        }
        
        if (modelData.economicCashFlow) {
            const wsEconomic = createEconomicFlowSheet();
            XLSX.utils.book_append_sheet(wb, wsEconomic, "Flujo Económico");
        }
        
        if (modelData.financialCashFlow) {
            const wsFinancial = createFinancialFlowSheet();
            XLSX.utils.book_append_sheet(wb, wsFinancial, "Flujo Financiero");
        }
        
        // Descargar archivo
        const fileName = `VSPT_Modelo_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('✅ Archivo Excel generado exitosamente');
        if (typeof showAlert === 'function') {
            showAlert('Archivo Excel descargado exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error al generar archivo Excel', 'error');
        }
    }
}

// Funciones auxiliares para crear hojas de Excel (simplificadas)
function createInvestmentsSheet() {
    const data = [['Concepto', '2025', '2026', '2027', '2028', 'Total']];
    // Agregar datos de inversiones...
    return XLSX.utils.aoa_to_sheet(data);
}

function createRevenuesSheet() {
    const data = [['País/Métrica', '2026', '2027', '2028', '2029', '2030']];
    // Agregar datos de ingresos...
    return XLSX.utils.aoa_to_sheet(data);
}

function createCostsSheet() {
    const data = [['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']];
    // Agregar datos de costos...
    return XLSX.utils.aoa_to_sheet(data);
}

function createWorkingCapitalSheet() {
    const data = [['País/Concepto', '2025', '2026', '2027', '2028', '2029', '2030']];
    // Agregar datos de WC...
    return XLSX.utils.aoa_to_sheet(data);
}

function createDebtSheet() {
    const data = [['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']];
    // Agregar datos de deuda...
    return XLSX.utils.aoa_to_sheet(data);
}

function createEconomicFlowSheet() {
    const data = [['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']];
    // Agregar flujo económico...
    return XLSX.utils.aoa_to_sheet(data);
}

function createFinancialFlowSheet() {
    const data = [['Concepto', '2025', '2026', '2027', '2028', '2029', '2030']];
    // Agregar flujo financiero...
    return XLSX.utils.aoa_to_sheet(data);
}
