// Funciones de navegación y control general
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

function updateCalculations() {
    try {
        console.log('Iniciando actualización de cálculos financieros...');
        
        calculateProgressiveCapex();
        console.log('✓ CAPEX progresivo calculado');
        
        calculateRevenues();
        console.log('✓ Ingresos calculados');
        
        calculateCosts();
        console.log('✓ Costos calculados');
        
        calculateWorkingCapital();
        console.log('✓ Working Capital calculado');
        
        calculateDebtStructure();
        console.log('✓ Estructura de deuda calculada');
        
        calculateEconomicCashFlow();
        console.log('✓ Flujo de caja económico calculado');
        
        calculateFinancialCashFlow();
        console.log('✓ Flujo de caja financiero calculado');
        
        // Análisis de sensibilidad solo si estamos en esa pestaña
        setTimeout(() => {
            const sensitivityTab = document.querySelector('[onclick="showTab(\'sensitivity\')"]');
            const isSensitivityTabActive = sensitivityTab && sensitivityTab.classList.contains('active');
            
            if (isSensitivityTabActive && typeof updateSensitivity === 'function') {
                updateSensitivity();
                console.log('✓ Análisis de sensibilidad actualizado');
            }
        }, 100);
        
        // Actualizar métricas adicionales
        updateImpactMetrics();
        updatePerformanceIndicators();
        trackChanges();
        
    } catch (error) {
        console.error('Error en updateCalculations:', error);
        showAlert('Error en los cálculos. Verifique los datos ingresados.', 'error');
    }
}

function showAlert(message, type = 'warning', duration = 3000) {
    // Crear o actualizar el elemento de alerta
    let alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'alertMessage';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            min-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(alertDiv);
    }
    
    // Configurar estilo según tipo
    const colors = {
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        info: '#2196f3'
    };
    
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    alertDiv.innerHTML = message;
    alertDiv.style.display = 'block';
    
    // Auto-ocultar después del tiempo especificado
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.style.display = 'none';
        }
    }, duration);
}
