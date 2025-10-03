# Configuración de OpenAI para el Asistente IA

El Asistente IA de BusControl utiliza la API de OpenAI (GPT-4o-mini) para proporcionar respuestas inteligentes basadas en los datos de tu sistema en tiempo real.

## Pasos para configurar OpenAI

### 1. Obtener una API Key de OpenAI

1. Ve a [https://platform.openai.com/](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el menú lateral
4. Haz clic en **Create new secret key**
5. Copia la clave (empieza con `sk-...`)

### 2. Configurar la variable de entorno en Supabase

La API key de OpenAI debe configurarse como una variable de entorno en tu proyecto de Supabase:

```bash
# En Supabase Dashboard:
# 1. Ve a Project Settings > Edge Functions
# 2. En la sección "Secrets", agrega:
OPENAI_API_KEY=tu-api-key-aquí
```

**IMPORTANTE:** Las variables de entorno en Supabase Edge Functions se configuran automáticamente. No necesitas configurar nada manualmente en archivos .env locales para producción.

### 3. Modelo utilizado

El asistente está configurado para usar **GPT-4o-mini**, que es:
- Rápido y económico
- Excelente para tareas de análisis de datos
- Costo aproximado: $0.15 / 1M tokens de entrada, $0.60 / 1M tokens de salida

Si deseas cambiar el modelo, edita el archivo:
`supabase/functions/chat-assistant/index.ts` en la línea que dice:
```typescript
model: 'gpt-4o-mini',  // Puedes cambiar a 'gpt-4o', 'gpt-4-turbo', etc.
```

## Funcionalidades del Asistente IA

El asistente tiene acceso en tiempo real a:

1. **Estadísticas de Buses**
   - Total de buses
   - Buses activos, en mantenimiento, inactivos

2. **Viajes del Día**
   - Cantidad de viajes
   - Pasajeros transportados
   - Ingresos generados
   - Distancia recorrida

3. **Gastos Recientes (últimos 30 días)**
   - Gastos por categoría
   - Totales por tipo

4. **Mantenimiento**
   - Mantenimientos pendientes
   - En progreso
   - Completados

5. **Inventario**
   - Items con stock bajo
   - Total de items

6. **Empleados**
   - Distribución por posición
   - Total de empleados activos

## Preguntas de ejemplo

Puedes hacer preguntas como:

- "¿Cuántos viajes se realizaron hoy?"
- "¿Cuál es el estado actual de la flota?"
- "Dame un resumen de gastos del último mes"
- "¿Hay mantenimientos pendientes?"
- "¿Qué buses necesitan atención?"
- "Analiza el rendimiento de hoy vs ayer"
- "Recomienda optimizaciones para reducir costos"
- "¿Cuántos empleados tenemos por posición?"

## Costos estimados

Con **GPT-4o-mini**:
- Una conversación típica (10 mensajes): ~$0.001 - $0.005
- 1000 conversaciones al mes: ~$1 - $5 USD
- Muy económico para uso empresarial

## Seguridad

- ✅ Autenticación requerida (JWT)
- ✅ RLS (Row Level Security) activado
- ✅ Usuarios solo ven sus propias conversaciones
- ✅ API key almacenada de forma segura en Supabase
- ✅ No se exponen datos sensibles al frontend

## Troubleshooting

### Error: "OPENAI_API_KEY no está configurado"
Solución: Configura la variable de entorno en Supabase Dashboard.

### Error: "OpenAI API error"
Solución: Verifica que tu API key sea válida y que tengas créditos en tu cuenta de OpenAI.

### El asistente no responde con datos del sistema
Solución: Verifica que la función `get_system_stats()` esté funcionando correctamente ejecutando:
```sql
SELECT get_system_stats();
```

## Personalización

Para personalizar el comportamiento del asistente, edita el `systemPrompt` en:
`supabase/functions/chat-assistant/index.ts`

Puedes modificar:
- El tono de las respuestas
- Las áreas de especialización
- El formato de las respuestas
- Instrucciones específicas para tu empresa
