# Sistema de Tarifas para Choferes y Pasajeros

## Descripción General

Este módulo proporciona dos interfaces sincronizadas en tiempo real:

1. **UI Chofer** (`/driver`): Interfaz para que el chofer seleccione destinos y calcule tarifas
2. **UI Pasajero** (`/passenger-display`): Display externo de solo lectura que muestra el monto a abonar

## Características Implementadas

### UI del Chofer
- Detección automática de ubicación GPS del bus
- Búsqueda y selección de destinos
- Accesos rápidos a destinos frecuentes
- Cálculo automático de tarifas basado en:
  - Tarifa base: 5,000 PYG
  - Costo por kilómetro: 1,500 PYG/km
  - Distancia calculada con fórmula de Haversine
- Desglose detallado de costos
- Estimación de tiempo de arribo (ETA)
- Confirmación de cobro con generación de ticket

### UI del Pasajero
- Display en pantalla completa con alto contraste
- Tipografía extra grande (hasta 12rem) para fácil lectura
- Tres estados visuales:
  1. **Esperando**: Pantalla de espera mientras no hay tarifa
  2. **Cotización**: Muestra el monto calculado
  3. **Confirmado**: Muestra el pago confirmado con ticket
- Actualización en tiempo real sincronizada con UI del chofer

### Base de Datos
Se crearon las siguientes tablas en Supabase:

- `destinations`: Destinos disponibles con coordenadas GPS
- `fare_quotes`: Cotizaciones de tarifas generadas
- `tickets`: Tickets confirmados de pago
- `buses`: Información de buses (si no existía)
- `bus_locations`: Ubicaciones GPS de buses en tiempo real

## Acceso a las Interfaces

### UI del Chofer
```
http://localhost:5173/driver
```

Esta interfaz permite:
- Ver la ubicación actual del bus
- Buscar destinos por nombre, dirección o zona
- Seleccionar destino y ver tarifa calculada
- Confirmar el cobro

### UI del Pasajero (Display Externo)
```
http://localhost:5173/passenger-display
```

Esta interfaz debe abrirse en una segunda pantalla o dispositivo y muestra:
- El monto a abonar en tamaño extra grande
- El destino seleccionado
- Estado de confirmación del pago

## Sincronización entre Pantallas

Las dos interfaces se comunican usando **BroadcastChannel API**, lo que permite:

- Sincronización en tiempo real sin servidor adicional
- Funciona cuando ambas ventanas están en el mismo navegador
- Actualizaciones instantáneas de estado

### Eventos Sincronizados:
1. `FARE_QUOTE`: Cuando el chofer selecciona un destino
2. `FARE_CONFIRMED`: Cuando el chofer confirma el cobro
3. `FARE_RESET`: Cuando se reinicia para un nuevo pasajero

## Configuración para Kiosk Mode (Display Externo)

Para usar la pantalla de pasajero como display permanente:

### Chrome/Chromium:
```bash
google-chrome --kiosk --app=http://localhost:5173/passenger-display
```

### Firefox:
1. Presionar F11 para modo pantalla completa
2. Navegar a `http://localhost:5173/passenger-display`

## Destinos Pre-cargados

El sistema incluye 8 destinos de ejemplo en Asunción, Paraguay:

1. Terminal Central
2. Shopping del Sol
3. Mercado 4
4. Hospital de Clínicas
5. Aeropuerto Silvio Pettirossi
6. Shopping Mariscal
7. Terminal de Ómnibus
8. Ciudad del Este (Terminal)

## Modo Offline

El sistema incluye manejo básico de errores:

- Si no hay GPS disponible, usa la última ubicación conocida
- Si falla la conexión, muestra mensajes de error claros
- Fallback a ubicación por defecto (Terminal Central)

## Flujo de Uso

1. **Inicio**: El chofer abre `/driver` en su tablet/monitor
2. **Display**: Se abre `/passenger-display` en pantalla externa
3. **Selección**: Chofer busca y selecciona destino del pasajero
4. **Cotización**: Sistema calcula tarifa y la muestra en ambas pantallas
5. **Confirmación**: Chofer presiona "Confirmar y Cobrar"
6. **Ticket**: Se genera ticket y ambas pantallas muestran confirmación
7. **Reset**: Después de 5 segundos, el sistema se reinicia para el siguiente pasajero

## API Endpoints Utilizados

El servicio `fareService.ts` interactúa con las siguientes tablas de Supabase:

- `GET destinations`: Lista destinos disponibles
- `POST fare_quotes`: Crea nueva cotización
- `POST tickets`: Confirma y genera ticket
- `GET/POST bus_locations`: Obtiene/actualiza ubicación del bus

## Personalización de Tarifas

Para modificar la configuración de tarifas, editar en `/src/services/fareService.ts`:

```typescript
const FARE_CONFIG = {
  baseFare: 5000,        // Tarifa base en PYG
  perKmRate: 1500,       // Costo por kilómetro
  currency: 'PYG',       // Moneda (PYG, ARS, USD, etc.)
  avgSpeedKmh: 30,       // Velocidad promedio para calcular ETA
};
```

## Agregar Nuevos Destinos

Para agregar destinos, insertar en la tabla `destinations`:

```sql
INSERT INTO destinations (id, name, address, latitude, longitude, zone, is_active)
VALUES ('dst_009', 'Nuevo Destino', 'Dirección', -25.2808, -57.6312, 'Zona', true);
```

## Seguridad

- Todas las tablas tienen Row Level Security (RLS) habilitado
- Los usuarios autenticados pueden crear cotizaciones y tickets
- Las ubicaciones de buses son visibles para todos los usuarios autenticados

## Requisitos Técnicos

- Node.js 18+
- Navegador con soporte para:
  - BroadcastChannel API
  - Geolocation API
  - CSS Grid y Flexbox

## Troubleshooting

### Las pantallas no se sincronizan
- Verificar que ambas ventanas estén en el mismo navegador
- Verificar que BroadcastChannel esté soportado (no funciona en Safari < 15.4)

### No detecta ubicación GPS
- Dar permisos de ubicación al navegador
- Verificar que el dispositivo tenga GPS habilitado
- El sistema usará ubicación por defecto si falla

### Error al calcular tarifa
- Verificar conexión a Supabase
- Verificar que las credenciales en `.env` sean correctas
- Revisar consola del navegador para errores específicos
