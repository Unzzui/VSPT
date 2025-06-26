# VSPT Digital 360 - Modelo Financiero de Expansión Internacional

## Descripción del Proyecto

Este proyecto presenta un modelo financiero integral para la expansión digital internacional de VSPT Wine Group, enfocado en los mercados de Chile y México para el período 2025-2030. El modelo incluye análisis de viabilidad económica y financiera, proyecciones de ingresos, costos operativos, estructura de financiamiento y análisis de sensibilidad.

## Características Principales

### Modelo Financiero Completo

- **CAPEX Optimizado**: $565K (reducido 29.4% vs original de $800K)
- **Estructura de Financiamiento**: 50% deuda / 50% equity
- **Cronograma de Deuda**: Sistema de amortización francesa a 5 años
- **Working Capital**: Cálculo dinámico por país con inventarios realistas

### Análisis de Mercados

- **Chile**: 65% del mercado (mercado principal)
- **México**: 35% del mercado (mercado secundario)
- **Expansión Progresiva**: Modelo de madurez del negocio con crecimiento decreciente

### Métricas Financieras

- **VAN Económico**: Análisis sin estructura financiera
- **VAN Financiero**: Análisis con estructura de deuda
- **TIR Económica**: Comparación vs WACC (8%)
- **TIR Financiera**: Comparación vs Costo de Equity (12%)

### Análisis de Sensibilidad

- **6 Factores Clave**: Tráfico web, tasa de conversión, costos operativos, ticket promedio, velocidad de expansión, tipo de cambio
- **Escenarios Múltiples**: Optimista, pesimista y base
- **Impacto en VAN**: Análisis cuantitativo de cada factor

## Estructura Técnica

### Arquitectura del Sistema

```
VSPT/
├── index.html              # Interfaz principal
├── static/
│   ├── js/
│   │   ├── config.js       # Parámetros y configuración
│   │   ├── investments.js  # CAPEX y financiamiento
│   │   ├── revenues.js     # Proyección de ingresos
│   │   ├── costs.js        # Costos operativos
│   │   ├── workingCapital.js # Capital de trabajo
│   │   ├── debt.js         # Cronograma de deuda
│   │   ├── depreciation.js # Depreciaciones
│   │   ├── cashflow.js     # Flujos económico y financiero
│   │   ├── sensitivity.js  # Análisis de sensibilidad
│   │   ├── dashboard.js    # Dashboard ejecutivo
│   │   ├── utils.js        # Utilidades y exportación
│   │   └── scripts.js      # Orquestador principal
│   ├── css/
│   │   ├── styles.css      # Estilos principales
│   │   └── styles-tailwind.css # Estilos Tailwind
│   └── img/
│       ├── vspt.png        # Logo corporativo
│       └── favicon.png     # Favicon
└── README.md               # Este archivo
```

### Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework CSS**: Tailwind CSS
- **Librerías**: Chart.js (gráficos), XLSX.js (exportación Excel)
- **Iconografía**: Font Awesome
- **Arquitectura**: Modular con separación de responsabilidades

## Parámetros del Modelo

### Configuración Financiera

- **Ratio de Deuda**: 50%
- **Tasa de Interés**: 6% anual
- **Plazo de Deuda**: 5 años
- **WACC**: 8%
- **Costo de Equity**: 12%
- **Tasa de Impuestos**: 27% (Chile)

### Parámetros de Negocio

- **Tráfico Inicial**: 9,100 visitas/mes
- **Tasa de Conversión**: 2%
- **Ticket Promedio**: $50 USD
- **Crecimiento Anual**: Modelo decreciente (100% → 70%)
- **Mejora Conversión**: Modelo decreciente (40% → 5%)

### Parámetros de Inventario

- **Botellas por Contenedor**: 12,000
- **Costo por Contenedor**: $5,000 USD
- **Stock Inicial**: 6 meses
- **Días de Inventario**: Chile (30), México (45)

## Funcionalidades

### Dashboard Ejecutivo

- Evaluación de viabilidad económica y financiera
- KPIs principales en tiempo real
- Gráficos de evolución de flujos de caja
- Resumen de mercados y métricas

### Módulos de Análisis

1. **CAPEX & Financing**: Inversiones y estructura de financiamiento
2. **Ingresos**: Proyección por país con drivers dinámicos
3. **Costos**: Desglose detallado de costos operativos
4. **Working Capital**: Capital de trabajo por país
5. **Deuda**: Cronograma de amortización francesa
6. **Depreciaciones**: Cronograma de depreciación de activos
7. **Flujo Económico**: Análisis sin estructura financiera
8. **Flujo Financiero**: Análisis con estructura de deuda
9. **Sensibilidad**: Análisis de factores clave

### Exportación de Datos

- **Excel Completo**: Exportación de todas las tablas y métricas
- **Formato Profesional**: Hojas organizadas por módulo
- **Cálculos Automáticos**: Fórmulas Excel para verificación

## Metodología

### Enfoque de Valuación

- **Flujo de Caja Libre**: Método de valuación principal
- **VAN Económico**: Descontado al WACC
- **VAN Financiero**: Descontado al costo de equity
- **TIR**: Tasa interna de retorno del proyecto
- **Período de Recuperación**: Tiempo de recuperación de la inversión

### Análisis de Sensibilidad

- **Método de Escenarios**: Optimista, base y pesimista
- **Análisis de Factores**: Impacto individual de cada variable
- **Simulación Monte Carlo**: Para factores críticos
- **Análisis de Break-Even**: Puntos de equilibrio

### Validaciones

- **Rangos de Parámetros**: Validación de entradas
- **Coherencia de Datos**: Verificación entre módulos
- **Manejo de Errores**: Try-catch en cálculos críticos
- **Logs de Debug**: Trazabilidad de cálculos

## Resultados Principales

### Viabilidad del Proyecto

- **VAN Económico**: Positivo (viable económicamente)
- **VAN Financiero**: Positivo (viable financieramente)
- **TIR Económica**: Superior al WACC
- **TIR Financiera**: Superior al costo de equity

### Optimización Realizada

- **CAPEX Reducido**: 29.4% de ahorro vs propuesta original
- **Enfoque en Mercados Clave**: Chile y México
- **Estructura de Financiamiento**: Balanceada deuda/equity
- **Gestión de Riesgos**: Análisis de sensibilidad completo

### Factores de Riesgo Identificados

- **Alto Riesgo**: Tráfico web, tasa de conversión, costos operativos
- **Riesgo Medio**: Velocidad de expansión, ticket promedio
- **Bajo Riesgo**: Tipo de cambio

## Instalación y Uso

### Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, para desarrollo)

### Instalación

1. Clonar o descargar el repositorio
2. Abrir `index.html` en el navegador
3. El modelo se inicializa automáticamente

### Uso

1. **Configuración**: Ajustar parámetros en los controles superiores
2. **Navegación**: Usar las pestañas para acceder a cada módulo
3. **Análisis**: Revisar métricas y gráficos en tiempo real
4. **Exportación**: Descargar modelo completo en Excel

## Desarrollo y Mantenimiento

### Estructura de Código

- **Modular**: Cada funcionalidad en archivo separado
- **Reutilizable**: Funciones genéricas en utils.js
- **Escalable**: Fácil agregar nuevos mercados o módulos
- **Mantenible**: Código documentado y bien estructurado

### Extensibilidad

- **Nuevos Mercados**: Agregar en marketDistribution
- **Nuevos Módulos**: Crear archivo JS independiente
- **Nuevas Métricas**: Extender funciones de cálculo
- **Nuevos Gráficos**: Usar Chart.js para visualizaciones

## Autores y Créditos

**Desarrollado por**: Alumnos de DUOC UC  
**Asignatura**: Finanzas Corporativas  
**Profesor**: [Nombre del Profesor]  
**Fecha**: 2025  
**Versión**: 1.0

## Licencia

Este proyecto es desarrollado con fines educativos para la asignatura de Finanzas Corporativas en DUOC UC. Todos los derechos reservados.

---

_Modelo Financiero VSPT Digital 360 - Expansión Internacional 2025-2030_
