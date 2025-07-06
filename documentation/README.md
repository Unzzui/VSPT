# Documentación del Modelo Financiero VSPT

## Descripción General

Este documento describe las metodologías de cálculo utilizadas en cada pestaña del modelo financiero interactivo para la evaluación del proyecto VSPT (Vinos Selectos Premium Trading).

## Estructura de la Documentación

La documentación está organizada por pestañas del modelo:

1. **[Dashboard](01-dashboard.md)** - Métricas principales y resumen ejecutivo
2. **[Parámetros de Negocio](02-parametros-negocio.md)** - Variables operativas y de mercado
3. **[Parámetros Financieros](03-parametros-financieros.md)** - Estructura de capital y tasas
4. **[Inventario](04-inventario.md)** - Gestión de stock y capital de trabajo
5. **[Inversiones](05-inversiones.md)** - CAPEX y cronograma de inversiones
6. **[Ingresos](06-ingresos.md)** - Proyecciones de revenue por mercado
7. **[Flujo Económico](07-flujo-economico.md)** - FCF sin considerar financiamiento
8. **[Flujo Financiero](08-flujo-financiero.md)** - FCF considerando estructura de deuda
9. **[Análisis de Sensibilidad](09-analisis-sensibilidad.md)** - Evaluación de riesgos y escenarios

## Convenciones Utilizadas

### Tasas de Descuento

- **WACC**: 8.0% (Costo Promedio Ponderado de Capital)
- **Ke**: 12.0% (Costo del Patrimonio)
- **Kd**: 6.0% (Costo de la Deuda)

### Estructura de Capital

- **Patrimonio**: 65%
- **Deuda**: 35%
- **Tasa de Impuestos**: 25%

### Horizonte de Evaluación

- **Período**: 2025-2030 (6 años)
- **Valor Terminal**: Calculado con crecimiento perpetuo del 2%
- **Moneda Base**: USD

### Supuestos Clave

- Inicio de operaciones: Q3 2025
- Expansión internacional: A partir de 2026
- Crecimiento decreciente en métricas operativas
- Distribución por mercados según plan estratégico

## Metodología General

El modelo utiliza un enfoque de flujos de caja descontados (DCF) con las siguientes características:

1. **Proyecciones Bottom-Up**: Desde métricas operativas hasta flujos de caja
2. **Análisis Dual**: Evaluación económica y financiera separada
3. **Sensibilidad Robusta**: Variaciones en factores críticos
4. **Escenarios Múltiples**: Pesimista, Base, Optimista y Stress Test

## Archivos de Documentación

Cada archivo contiene:

- Fórmulas matemáticas específicas
- Supuestos y parámetros utilizados
- Lógica de programación implementada
- Ejemplos de cálculo
- Referencias a código fuente

---

_Última actualización: Diciembre 2024_
_Versión del modelo: 1.0_
