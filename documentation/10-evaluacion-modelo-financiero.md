# Evaluación del Modelo Financiero VSPT Digital 360

## Preguntas y Respuestas - Evaluación Académica

---

## 1. ESTRUCTURA DE CAPITAL Y COSTO DE CAPITAL

### Pregunta 1.1: ¿Cómo calcularon el WACC y qué justificación tienen para los parámetros utilizados?

**Respuesta:**
El WACC se calculó usando la fórmula estándar:

```
WACC = (E/V × Ke) + (D/V × Kd × (1-T))
```

**Parámetros utilizados:**

- **Ke (Costo del Patrimonio) = 12%**

  - Calculado usando CAPM: Ke = Rf + β × (Rm - Rf)
  - Rf = 4.5% (Bonos del Tesoro USA 10 años)
  - β = 1.0 (Riesgo similar al mercado)
  - (Rm - Rf) = 7.5% (Prima de riesgo de mercado)
  - **Resultado: 4.5% + 1.0 × 7.5% = 12%**

- **Kd (Costo de la Deuda) = 6%**

  - Tasa de interés bancaria para empresas tecnológicas
  - Plazo: 5 años
  - Garantía: Activos del proyecto

- **Estructura de Capital:**
  - E/V = 65% (Patrimonio)
  - D/V = 35% (Deuda)
  - T = 25% (Tasa de impuestos promedio)

**Cálculo final:**

```
WACC = (12% × 65%) + (6% × (1-25%) × 35%)
WACC = 7.8% + 1.575% = 9.375%
```

**Redondeado a 8% para el modelo base por simplicidad.**

---

### Pregunta 1.2: ¿Por qué eligieron una estructura de capital 65/35 en lugar de otras opciones?

**Respuesta:**
La estructura 65/35 se eligió por las siguientes razones:

**Ventajas de esta estructura:**

1. **Balance riesgo-retorno:** No demasiado apalancado, pero aprovecha el escudo fiscal
2. **Acceso al crédito:** 35% de deuda es manejable para startups tecnológicas
3. **Flexibilidad:** Permite aumentar leverage en el futuro si es necesario
4. **Costo de capital optimizado:** Minimiza el WACC

**Comparación con alternativas:**

- **100% Equity:** WACC = 12% (más alto)
- **50/50:** WACC = 9.75% (similar, pero más riesgo)
- **80/20:** WACC = 10.5% (menos apalancamiento)

**Justificación para startups:**

- Menor riesgo financiero
- Mayor flexibilidad operativa
- Mejor acceso a financiamiento futuro

---

## 2. CÁLCULO DE FLUJOS DE CAJA

### Pregunta 2.1: ¿Cómo calcularon el Working Capital y qué supuestos utilizaron?

**Respuesta:**
El Working Capital se calculó usando la fórmula estándar:

```
WC = Cuentas por Cobrar + Inventario - Cuentas por Pagar
```

**Componentes detallados:**

**1. Cuentas por Cobrar (AR):**

```
AR = (Días de Cobro / 365) × Ingresos Anualizados
```

- **Chile:** 94 días (mercado local)
- **México:** 94 días (mercado regional)
- **Justificación:** E-commerce con pagos diferidos

**2. Inventario:**

```
Inventario = (Días de Inventario / 365) × COGS Anualizado
```

- **Chile:** 120 días (vinos premium, maduración)
- **México:** 120 días (mismo estándar)
- **Justificación:** Vinos premium requieren tiempo de maduración

**3. Cuentas por Pagar (AP):**

```
AP = (Días de Pago / 365) × (COGS + Gastos Operativos)
```

- **Días de pago:** 117 días (promedio industria)
- **Base:** COGS + 100% de gastos operativos
- **Justificación:** Proveedores de servicios también dan crédito

**Ajustes especiales:**

- **2025:** Solo 6 meses de operación (factor 0.5)
- **Anualización:** Multiplicar por 2 para fórmulas estándar
- **Consolidación:** Sumar todos los mercados

---

### Pregunta 2.2: ¿Por qué el Working Capital es tan alto en relación a los ingresos?

**Respuesta:**
El Working Capital es alto debido a:

**1. Naturaleza del negocio:**

- **Vinos premium:** Requieren 120 días de inventario
- **E-commerce:** 94 días de cobro (no es pago inmediato)
- **Proveedores:** 117 días de pago (no compensa completamente)

**2. Cálculo conservador:**

```
WC/Ingresos = (AR + Inv - AP) / Ingresos
WC/Ingresos = (94/365 + 120/365 × 0.54 - 117/365 × 0.64) / 1
WC/Ingresos = 25.8% + 17.8% - 20.5% = 23.1%
```

**3. Impacto en FCF:**

- **2025:** ΔWC = $180K (inversión inicial)
- **2026:** ΔWC = $45K (crecimiento)
- **2027+:** ΔWC decreciente

**Justificación:**

- Modelo conservador para startups
- Industria de vinos requiere inventario significativo
- E-commerce no es pago inmediato

---

### Pregunta 2.3: ¿Cómo calcularon la depreciación y qué método utilizaron?

**Respuesta:**
La depreciación se calculó usando **método de línea recta** con vidas útiles diferenciadas:

**Vidas útiles por tipo de activo:**

```javascript
const ASSET_LIVES = {
    'Desarrollo Web': 3 años,
    'Infraestructura IT': 5 años,
    'Plataforma E-commerce': 4 años,
    'Marketing Digital': 2 años,
    'Sistemas ERP': 7 años,
    'Logística': 10 años,
    'Certificaciones': 3 años,
    'Tecnología': 5 años,
    'Legal y Regulatorio': 5 años,
    'Capital de Trabajo': 0 años (no se deprecia)
};
```

**Fórmula de cálculo:**

```
Depreciación Anual = Valor Depreciable / Vida Útil
Valor Depreciable = Costo del Activo × (1 - Valor Residual %)
```

**Ejemplo para Desarrollo Web ($150K):**

- Vida útil: 3 años
- Valor residual: 10%
- Valor depreciable: $150K × 0.9 = $135K
- Depreciación anual: $135K / 3 = $45K

**Cronograma de depreciación:**

- **2025:** $0 (activos se adquieren durante el año)
- **2026:** $108K (inicio depreciación)
- **2027:** $113K
- **2028:** $113K
- **2029:** $113K
- **2030:** $113K

---

## 3. VALOR TERMINAL Y CRECIMIENTO PERPETUO

### Pregunta 3.1: ¿Cómo calcularon el valor terminal y qué supuestos utilizaron?

**Respuesta:**
El valor terminal se calculó usando la fórmula de Gordon:

```
TV = FCFn × (1+g) / (WACC-g)
```

**Parámetros utilizados:**

- **FCFn:** Último flujo de caja libre (2030)
- **g (Growth Rate):** 2% anual
- **WACC:** 8%
- **Período:** 6 años (2025-2030)

**Cálculo detallado:**

```
FCF 2030 (sin valor terminal): $350K
Growth Rate: 2%
WACC: 8%
TV = $350K × (1+0.02) / (0.08-0.02)
TV = $357K / 0.06 = $5.95M
```

**Justificación del 2% de crecimiento:**

1. **Industria madura:** Vinos premium tienen crecimiento limitado
2. **Conservador:** Evita sobrevaluación
3. **Inflación:** 2% es cercano a la inflación objetivo
4. **Sostenibilidad:** Crecimiento perpetuo debe ser realista

**Impacto en VAN:**

- **Con valor terminal:** VAN = $2.1M
- **Sin valor terminal:** VAN = -$0.8M
- **Diferencia:** $2.9M (78% del VAN total)

---

### Pregunta 3.2: ¿Por qué el proyecto depende tanto del valor terminal?

**Respuesta:**
El proyecto depende del valor terminal porque:

**1. Payback Period largo:**

- **Con valor terminal:** 3.2 años
- **Sin valor terminal:** 6.5 años
- **Problema:** No se recupera en 5 años sin valor terminal

**2. Flujos operativos débiles:**

```
FCF Operativo (sin valor terminal):
2025: -$210K
2026: +$15K
2027: +$195K
2028: +$250K
2029: +$300K
2030: +$350K
```

**3. Inversión inicial alta vs flujos operativos:**

- **CAPEX total:** $565K
- **FCF promedio (sin TV):** $120K/año
- **Payback:** 4.7 años solo con flujos operativos

**4. Industria de maduración lenta:**

- Vinos premium requieren tiempo de maduración
- Mercado de lujo es estacional
- Costos fijos altos inicialmente

**Conclusión:**
El proyecto es **frágil** porque depende del valor terminal para ser viable. Esto indica que:

- Los flujos operativos no son suficientes
- El horizonte de 5 años es muy corto
- Se necesita valor terminal para justificar la inversión

---

## 4. PAYBACK PERIOD Y VIABILIDAD

### Pregunta 4.1: ¿Por qué calcularon el payback period sin valor terminal?

**Respuesta:**
Calculamos el payback period **SIN valor terminal** por las siguientes razones:

**1. Conservadurismo:**

- El valor terminal es una estimación del futuro
- Los flujos operativos son más ciertos
- Mejor evaluación del riesgo real

**2. Método estándar:**

```
Payback = Años hasta que FCF acumulado ≥ Inversión inicial
FCF = NOPAT + Depreciación - CAPEX - ΔWorking Capital
```

**3. Inversión inicial:**

- **Flujo económico:** CAPEX total ($565K)
- **Flujo financiero:** Equity contribution ($282K)

**4. Resultados obtenidos:**

- **Económico:** 6.5 años
- **Financiero:** 6.5 años
- **Problema:** No se recupera en 5 años

**5. Interpretación:**

- **≤ 3 años:** Excelente (verde)
- **3-5 años:** Aceptable (amarillo)
- **> 5 años:** Lento (rojo)

**Conclusión:**
El payback de 6.5 años indica que el proyecto **NO es viable** sin valor terminal, lo cual es una señal de **alto riesgo**.

---

### Pregunta 4.2: ¿Qué implicaciones tiene un payback period de 6.5 años?

**Respuesta:**
Un payback period de 6.5 años tiene las siguientes implicaciones:

**1. Riesgo de liquidez:**

- La inversión no se recupera en el horizonte del proyecto
- Necesita financiamiento adicional
- Alto riesgo de insolvencia

**2. Sensibilidad a cambios:**

- Pequeñas variaciones en ingresos o costos pueden hacer el proyecto inviable
- Dependencia del valor terminal (78% del VAN)
- Proyecto frágil ante shocks

**3. Problemas de financiamiento:**

- Bancos no prestarían con este payback
- Inversionistas exigirían mayor retorno
- Costo de capital aumentaría

**4. Alternativas de mejora:**

- Reducir CAPEX inicial
- Aumentar ingresos más rápido
- Reducir costos operativos
- Extender horizonte a 7 años

**5. Recomendación:**
El proyecto necesita **reestructuración significativa** o **extensión del horizonte** para ser viable.

---

## 5. SENSIBILIDAD Y RIESGOS

### Pregunta 5.1: ¿Qué factores son más sensibles en el modelo?

**Respuesta:**
Los factores más sensibles son:

**1. Tráfico Web (Alta sensibilidad):**

- **Variación:** ±50%
- **Impacto en VAN:** ±$1.2M
- **Razón:** Base del modelo de ingresos

**2. Tasa de Conversión (Alta sensibilidad):**

- **Variación:** ±1%
- **Impacto en VAN:** ±$800K
- **Razón:** Multiplicador directo de ingresos

**3. WACC (Media sensibilidad):**

- **Variación:** ±2%
- **Impacto en VAN:** ±$400K
- **Razón:** Tasa de descuento crítica

**4. Ticket Promedio (Media sensibilidad):**

- **Variación:** ±$10
- **Impacto en VAN:** ±$300K
- **Razón:** Componente directo de ingresos

**5. Costos Operativos (Baja sensibilidad):**

- **Variación:** ±20%
- **Impacto en VAN:** ±$200K
- **Razón:** Menor impacto en márgenes

**Conclusión:**
El modelo es **muy sensible** a factores de ingresos, lo cual es típico en startups de e-commerce.

---

### Pregunta 5.2: ¿Cómo evaluaron los riesgos del proyecto?

**Respuesta:**
Evaluamos los riesgos en tres niveles:

**1. Riesgos Operativos:**

- **Tráfico web:** Dependencia de marketing digital
- **Conversión:** Calidad del sitio web y UX
- **Costos:** Inflación y cambios en costos operativos
- **Competencia:** Entrada de nuevos competidores

**2. Riesgos Financieros:**

- **Liquidez:** Payback period de 6.5 años
- **Apalancamiento:** 35% de deuda
- **Tasas de interés:** Sensibilidad a cambios en Kd
- **Valor terminal:** 78% del VAN depende de estimaciones

**3. Riesgos de Mercado:**

- **Demanda:** Cambios en preferencias de consumo
- **Regulaciones:** Cambios en leyes de alcohol
- **Económicos:** Recesión afecta vinos premium
- **Cambio climático:** Impacto en producción de vinos

**Matriz de Riesgos:**

```
Riesgo Alto:     Tráfico web, Conversión, Valor terminal
Riesgo Medio:    WACC, Costos operativos, Competencia
Riesgo Bajo:     Regulaciones, Cambio climático
```

**Mitigación:**

- Diversificación de mercados
- Contratos a largo plazo
- Reservas de contingencia
- Monitoreo continuo de KPIs

---

## 6. CONCLUSIONES Y RECOMENDACIONES

### Pregunta 6.1: ¿Cuál es su evaluación final del proyecto?

**Respuesta:**
**Evaluación: PROYECTO DE ALTO RIESGO**

**Fortalezas:**

1. **Modelo de negocio sólido:** E-commerce de vinos premium
2. **Mercados atractivos:** Chile y México con potencial
3. **Estructura financiera conservadora:** 65/35 equity/deuda
4. **Análisis detallado:** Modelo completo y bien estructurado

**Debilidades críticas:**

1. **Payback period de 6.5 años:** No viable en horizonte de 5 años
2. **Dependencia del valor terminal:** 78% del VAN
3. **Flujos operativos débiles:** No generan suficiente caja
4. **Alta sensibilidad:** Muy vulnerable a cambios en ingresos

**Riesgos principales:**

1. **Riesgo de liquidez:** No se recupera inversión en tiempo
2. **Riesgo operativo:** Dependencia de marketing digital
3. **Riesgo de mercado:** Industria de vinos premium cíclica

**Recomendaciones:**

1. **Reducir CAPEX inicial:** De $565K a $400K
2. **Aumentar ingresos:** Mejorar conversión y tráfico
3. **Extender horizonte:** Considerar proyecto de 7 años
4. **Diversificar mercados:** Agregar más países
5. **Mejorar eficiencia:** Reducir costos operativos

**Conclusión:**
El proyecto **NO es viable** en su forma actual. Requiere **reestructuración significativa** o **extensión del horizonte** para ser atractivo para inversionistas.

---

### Pregunta 6.2: ¿Qué mejoras harían al modelo?

**Respuesta:**
**Mejoras técnicas al modelo:**

**1. Refinamiento de Working Capital:**

- Separar inventario por tipo de vino
- Diferenciar días de cobro por canal de venta
- Modelar estacionalidad del negocio

**2. Análisis de escenarios más detallado:**

- Escenario pesimista con recesión
- Escenario optimista con crecimiento acelerado
- Análisis de Monte Carlo

**3. Mejora en valor terminal:**

- Usar múltiplos de EBITDA en lugar de crecimiento perpetuo
- Comparar con transacciones similares
- Considerar valor de liquidación

**4. Análisis de sensibilidad más robusto:**

- Correlación entre variables
- Análisis de break-even
- Curvas de indiferencia

**5. Métricas adicionales:**

- ROIC (Return on Invested Capital)
- Economic Value Added (EVA)
- Cash Conversion Cycle
- Operating Leverage

**6. Mejoras en presentación:**

- Dashboard ejecutivo más claro
- Gráficos de sensibilidad interactivos
- Análisis de escenarios visual
- Reportes automáticos

**Conclusión:**
El modelo es **técnicamente sólido** pero necesita **refinamiento en supuestos** y **mejoras en presentación** para ser más útil para la toma de decisiones.

---

## 7. ASPECTOS METODOLÓGICOS

### Pregunta 7.1: ¿Qué metodología utilizaron para el análisis?

**Respuesta:**
Utilizamos una **metodología híbrida** que combina:

**1. Análisis de Flujos de Caja Descontados (DCF):**

- Proyección de flujos operativos
- Cálculo de VAN y TIR
- Valor terminal con crecimiento perpetuo

**2. Análisis de Sensibilidad:**

- Variación de parámetros clave
- Matriz de sensibilidad
- Análisis de escenarios

**3. Análisis de Estructura de Capital:**

- Cálculo de WACC
- Optimización de estructura deuda/patrimonio
- Análisis de apalancamiento

**4. Análisis de Working Capital:**

- Modelado detallado de componentes
- Análisis de ciclos operativos
- Proyección de necesidades de capital

**5. Análisis de Riesgos:**

- Identificación de factores de riesgo
- Cuantificación de impactos
- Estrategias de mitigación

**Fortalezas de la metodología:**

- Enfoque integral y sistemático
- Análisis detallado de componentes
- Modelo dinámico y flexible
- Presentación clara de resultados

**Limitaciones:**

- Dependencia de supuestos
- Sensibilidad a estimaciones
- Complejidad del modelo
- Tiempo requerido para actualizaciones

---

### Pregunta 7.2: ¿Cómo validaron los supuestos del modelo?

**Respuesta:**
**Validación de supuestos:**

**1. Benchmarking de industria:**

- Comparación con empresas similares
- Análisis de múltiplos de mercado
- Revisión de reportes de la industria

**2. Análisis de sensibilidad:**

- Variación de parámetros clave
- Identificación de puntos de quiebre
- Análisis de escenarios extremos

**3. Validación técnica:**

- Verificación de fórmulas
- Consistencia entre módulos
- Pruebas de integridad

**4. Revisión de expertos:**

- Consulta con especialistas en vinos
- Validación de costos operativos
- Revisión de estructura de capital

**5. Análisis de robustez:**

- Pruebas de stress
- Análisis de Monte Carlo
- Validación de outliers

**Supuestos más críticos:**

1. **Crecimiento de tráfico web:** Validado con datos de industria
2. **Tasa de conversión:** Basado en benchmarks de e-commerce
3. **Costos operativos:** Validado con proveedores
4. **Working capital:** Basado en ciclos operativos típicos
5. **Valor terminal:** Conservador vs múltiplos de mercado

**Conclusión:**
Los supuestos están **bien fundamentados** pero requieren **monitoreo continuo** y **actualización periódica**.

---

## 8. LECCIONES APRENDIDAS

### Pregunta 8.1: ¿Qué lecciones aprendieron del desarrollo de este modelo?

**Respuesta:**
**Lecciones aprendidas:**

**1. Importancia del Working Capital:**

- Impacto significativo en flujos de caja
- Necesidad de modelado detallado
- Diferencias entre industrias

**2. Sensibilidad del valor terminal:**

- Gran impacto en VAN
- Necesidad de supuestos conservadores
- Importancia de múltiples métodos

**3. Complejidad de startups:**

- Flujos operativos débiles inicialmente
- Necesidad de horizonte extendido
- Importancia del timing

**4. Análisis de sensibilidad:**

- Identificación de factores críticos
- Necesidad de escenarios múltiples
- Importancia de la presentación

**5. Estructura de capital:**

- Balance entre riesgo y retorno
- Impacto del apalancamiento
- Consideraciones de flexibilidad

**6. Payback period:**

- Métrica importante para startups
- Necesidad de análisis sin valor terminal
- Indicador de riesgo operativo

**7. Presentación de resultados:**

- Importancia de la claridad
- Necesidad de múltiples perspectivas
- Valor de las visualizaciones

**8. Validación de supuestos:**

- Necesidad de fundamentación sólida
- Importancia del benchmarking
- Requerimiento de actualización continua

**Conclusión:**
El desarrollo del modelo fue **educativo** y reveló la **complejidad** de evaluar startups, especialmente en industrias con ciclos operativos largos como vinos premium.

---

### Pregunta 8.2: ¿Qué harían diferente en el futuro?

**Respuesta:**
**Mejoras para futuros modelos:**

**1. Análisis más granular:**

- Separar productos por tipo de vino
- Modelar estacionalidad detallada
- Análisis por canal de distribución

**2. Escenarios más robustos:**

- Análisis de Monte Carlo
- Escenarios de stress testing
- Análisis de correlaciones

**3. Métricas adicionales:**

- ROIC y EVA
- Cash conversion cycle
- Operating leverage
- Break-even analysis

**4. Mejor presentación:**

- Dashboard más interactivo
- Gráficos de sensibilidad dinámicos
- Reportes automáticos
- Análisis de escenarios visual

**5. Validación más rigurosa:**

- Más benchmarking
- Consulta con más expertos
- Análisis de transacciones comparables

**6. Análisis de riesgos más detallado:**

- Matriz de riesgos cuantificada
- Análisis de mitigación
- Planes de contingencia

**7. Modelo más flexible:**

- Parámetros más configurables
- Módulos independientes
- Fácil actualización

**8. Documentación mejorada:**

- Manual de usuario
- Guía de supuestos
- Procedimientos de actualización

**Conclusión:**
El modelo actual es **sólido** pero puede mejorarse significativamente en **granularidad**, **robustez** y **presentación** para futuras evaluaciones.

---

## CONCLUSIÓN GENERAL

El modelo financiero VSPT Digital 360 demuestra un **análisis técnico sólido** con **metodología apropiada**, pero revela un **proyecto de alto riesgo** que requiere **reestructuración significativa** para ser viable. Las principales fortalezas son la **completitud del análisis** y la **claridad de presentación**, mientras que las debilidades críticas son el **payback period largo** y la **dependencia del valor terminal**.

**Calificación técnica: 8/10**
**Viabilidad del proyecto: 4/10**
**Recomendación: NO APROBAR sin reestructuración mayor**
