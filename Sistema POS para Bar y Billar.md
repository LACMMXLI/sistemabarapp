# Desarrollo de sistema POS web para bar y mesas de billar

Actúa como arquitecto de software senior y desarrollador full stack especializado en sistemas POS para restaurantes, bares y operación táctil en tabletas Android.

Debes diseñar e implementar un sistema POS web completo y funcional para un bar que opera:

- Venta rápida en barra.
- Servicio mediante mesas.
- Renta de mesas de billar por tiempo.
- Venta de bebidas y botanas.
- Control básico de inventario.
- Apertura, operación y corte de caja.
- Promociones automáticas por horario.
- Reportes administrativos.

No debes limitarte a crear una demostración visual, un prototipo, pantallas estáticas, pseudocódigo ni datos simulados. Debes construir una aplicación funcional, conectada realmente a PostgreSQL, con autenticación, permisos, persistencia, validaciones y flujos completos.

El sistema será utilizado en producción real. Prioriza estabilidad, velocidad operativa, seguridad, claridad visual y prevención de errores humanos.

# 1\. Objetivo del sistema

Construir un POS instalable como PWA y optimizado para tabletas Android, que permita:

- Iniciar sesión según el rol del empleado.
- Realizar ventas rápidas sin seleccionar una mesa.
- Abrir mesas normales.
- Agregar productos a una cuenta abierta.
- Iniciar y controlar sesiones de billar.
- Calcular automáticamente el consumo y tiempo de billar.
- Cobrar cuentas.
- Descontar inventario.
- Aplicar promociones por horario.
- Consultar ventas y reportes.
- Realizar apertura y corte de caja.
- Mantener todas las órdenes persistidas en PostgreSQL.

La operación cotidiana debe requerir la menor cantidad posible de interacciones.

# 2\. Stack tecnológico obligatorio

## Frontend

- React.
- Vite.
- TypeScript estricto.
- React Router.
- TanStack Query para solicitudes, caché y sincronización.
- Zustand o Context únicamente para estado local de interfaz.
- Zod para validación de contratos.
- PWA mediante vite-plugin-pwa.
- CSS moderno, Tailwind CSS o una solución equivalente.
- Interfaz optimizada para touch.

## Backend

- Next.js con TypeScript.
- Next.js App Router.
- Route Handlers bajo /api.
- No utilizar Server Actions para la comunicación con el frontend, porque React/Vite será una aplicación independiente.
- API REST claramente estructurada.
- Prisma ORM.
- PostgreSQL.
- Zod para validar entradas.
- JWT para autenticación.
- Argon2id o bcrypt para contraseñas.

## Arquitectura del repositorio

Usar un monorepo con pnpm workspaces, preferentemente:

/  
├── apps/  
│ ├── web/ # React + Vite + PWA  
│ └── api/ # Next.js exclusivamente como backend  
├── packages/  
│ ├── contracts/ # Esquemas Zod y tipos compartidos  
│ └── config/ # Configuración compartida  
├── docker-compose.yml  
├── pnpm-workspace.yaml  
├── package.json  
└── README.md

No mezclar las pantallas del frontend dentro del proyecto Next.js.

# 3\. Alcance inicial

El sistema será inicialmente para un solo negocio o establecimiento.

No implementar por ahora:

- Multiempresa o SaaS.
- Facturación electrónica.
- Nómina.
- Pedidos en línea.
- Integraciones contables.
- Modo offline completo.
- División compleja de cuentas.
- Integración directa con terminal bancaria.
- Integración directa con impresora o cajón de dinero sin conocer primero el hardware.

La arquitectura debe permitir agregar estas funciones posteriormente sin rehacer todo el sistema.

La PWA debe poder instalarse y almacenar los recursos estáticos, pero la primera versión será online-first. Si se pierde la conexión:

- Mostrar claramente que no hay conexión.
- No confirmar una operación que no llegó al servidor.
- No mostrar un guardado como exitoso hasta recibir respuesta de la API.
- Conservar en pantalla la orden que el usuario estaba visualizando.
- Evitar duplicados al reintentar.
- No simular que existen ventas offline si todavía no están implementadas.

# 4\. Principios obligatorios

- Mínimos clics.
- Máximo dos interacciones para llegar a las funciones operativas principales.
- Interfaz compacta y sin espacios muertos.
- Botones táctiles grandes y bien distribuidos.
- Sin scroll general excesivo.
- El scroll debe existir dentro de listas o paneles específicos.
- La información principal debe verse sin abrir ventanas innecesarias.
- Todas las operaciones críticas deben persistirse inmediatamente.
- El servidor es la única autoridad para precios, permisos, totales, promociones e inventario.
- Nunca confiar en precios o totales enviados por el frontend.
- Las operaciones monetarias deben ser transaccionales.
- Doble toque o reintento de red no debe duplicar órdenes, pagos o movimientos.
- Usar claves de idempotencia en operaciones críticas.
- Registrar acciones sensibles en una bitácora de auditoría.
- No eliminar físicamente información financiera.
- Las cancelaciones deben conservar historial y motivo.

# 5\. Moneda, fechas y zona horaria

- Moneda: pesos mexicanos, MXN.
- Guardar dinero como enteros en centavos.
- No utilizar números de punto flotante para cantidades monetarias.
- Los precios capturados se consideran precios finales al cliente.
- Guardar timestamps en UTC.
- Mostrar fechas y aplicar promociones usando la zona horaria America/Tijuana.
- El cálculo de promociones nunca debe depender solamente de la hora del dispositivo.

# 6\. Roles y permisos

Implementar control de acceso tanto en frontend como en backend.

Ocultar una pantalla no es suficiente: cada endpoint debe validar el rol y responder 403 cuando el usuario no tenga permiso.

## ADMIN

Puede:

- Ver todas las mesas.
- Realizar ventas rápidas.
- Abrir y operar mesas.
- Iniciar, pausar, reanudar y finalizar billar.
- Cobrar cuentas.
- Crear, editar, activar y desactivar productos.
- Crear y editar categorías.
- Crear y configurar mesas.
- Consultar y ajustar inventario.
- Crear promociones.
- Abrir caja.
- Registrar entradas y salidas.
- Realizar corte de caja.
- Consultar reportes.
- Consultar auditoría.
- Administrar usuarios.
- Cambiar configuraciones.

## CAJERO

Puede:

- Realizar ventas rápidas.
- Ver y abrir mesas.
- Agregar productos.
- Modificar cantidades de una orden abierta.
- Cobrar cuentas cuando exista un turno de caja abierto.
- Controlar mesas de billar.
- Consultar únicamente la información necesaria para operar.

No puede:

- Abrir o cerrar caja.
- Ver cortes de caja.
- Ver reportes administrativos.
- Ver existencias completas.
- Ajustar inventario.
- Crear o editar productos.
- Crear promociones.
- Administrar usuarios.

## MESERO

En la primera versión tendrá permisos operativos similares al cajero:

- Ver mesas.
- Abrir mesas.
- Agregar productos.
- Cobrar cuentas si existe una caja abierta.
- Controlar billar.

No puede acceder a administración, inventario, reportes ni cortes.

Los permisos deben definirse en una matriz central, no repartirse como condiciones improvisadas en cada componente.

# 7\. Autenticación y seguridad

Implementar:

- Inicio de sesión con usuario y contraseña.
- Access token JWT de corta duración.
- Refresh token con rotación.
- Refresh token almacenado en cookie HttpOnly, Secure en producción y con configuración SameSite adecuada.
- No guardar refresh tokens en localStorage.
- Cierre de sesión.
- Endpoint para obtener el usuario actual.
- Contraseñas hasheadas.
- Usuarios activos e inactivos.
- Rate limiting en el inicio de sesión.
- Validación de variables de entorno.
- CORS configurado explícitamente.
- Manejo uniforme de errores.
- Nunca exponer hashes, secretos ni información sensible.

La sesión debe mantenerse al recargar la PWA, pero los permisos deben volver a validarse con el backend.

Endpoints mínimos:

POST /api/auth/login  
POST /api/auth/refresh  
POST /api/auth/logout  
GET /api/auth/me

# 8\. Navegación y diseño general

## Pantalla inicial después del login

Mostrar accesos rápidos dependiendo del rol:

- Venta rápida.
- Mesas.
- Billar.
- Productos.
- Inventario.
- Caja.
- Reportes.
- Configuración.

Un empleado nunca debe ver módulos a los que no tiene acceso.

## Sidebar

- Colapsable.
- Mostrar iconos cuando esté cerrado.
- Permanecer accesible.
- No ocupar demasiado espacio.
- En pantallas estrechas puede mostrarse como panel superpuesto.
- Recordar localmente si el usuario lo dejó abierto o cerrado.

## Resoluciones objetivo

Diseñar y probar al menos en:

- 1024 × 600.
- 1280 × 800.
- Tableta en orientación horizontal.
- Diseño utilizable en orientación vertical.
- Vista móvil para consultas administrativas básicas.

## Reglas táctiles

- Áreas táctiles mínimas de aproximadamente 48 × 48 px.
- Evitar botones demasiado juntos.
- Deshabilitar botones mientras una operación crítica está procesándose.
- Mostrar confirmación visual inmediata.
- Evitar diálogos para acciones frecuentes.
- Usar confirmación para cancelaciones, cierre de caja y acciones irreversibles.

# 9\. Módulo de mesas

Crear dos tipos de mesa:

- STANDARD: mesa normal.
- BILLIARD: mesa de billar.

Estados visibles:

| Estado            | Color    | Significado                             |
| ----------------- | -------- | --------------------------------------- |
| Disponible        | Verde    | No tiene orden abierta ni billar activo |
| Ocupada           | Rojo     | Tiene una orden abierta                 |
| Billar activo     | Amarillo | Tiene una sesión de billar activa       |
| Fuera de servicio | Gris     | Desactivada por administración          |

Cada tarjeta de mesa debe mostrar:

- Nombre o número.
- Tipo.
- Estado.
- Tiempo transcurrido si tiene billar activo.
- Total acumulado de la orden.
- Nombre del empleado que la abrió.
- Hora de apertura.

Al tocar una mesa:

- Si está libre, abrir una nueva orden de forma atómica.
- Si ya tiene orden, recuperar esa misma orden.
- Nunca crear dos órdenes abiertas para la misma mesa.
- Si dos dispositivos intentan abrirla simultáneamente, solo uno debe crear la orden y ambos deben terminar viendo la misma cuenta.

El estado real de la mesa debe derivarse de la orden y sesión activa. No mantener estados contradictorios manualmente.

# 10\. Venta rápida

Implementar una pantalla de venta sin mesa.

Flujo:

1. Entrar a Venta rápida.
2. Crear o recuperar la venta en curso del dispositivo/usuario.
3. Seleccionar productos.
4. Mostrar subtotal, descuentos y total.
5. Elegir forma de pago.
6. Confirmar cobro.
7. Registrar la venta.
8. Descontar inventario.
9. Limpiar la pantalla para la siguiente venta.

No se debe crear una orden nueva con cada toque o recarga.

Debe prevenirse el cobro duplicado por doble toque.

# 11\. Pantalla de orden

Utilizar una distribución compacta de dos paneles.

## Panel izquierdo

- Categorías.
- Buscador.
- Grid de productos.
- Nombre.
- Precio actual.
- Indicador de agotado.
- Botón completo táctil.
- Filtros por categoría.

## Panel derecho

- Nombre o número de mesa.
- Empleado responsable.
- Tiempo de apertura.
- Productos agregados.
- Cantidad.
- Precio unitario aplicado.
- Subtotal por renglón.
- Promoción aplicada.
- Notas.
- Subtotal general.
- Descuentos.
- Cargo de billar.
- Total.
- Botón de cobrar.
- Botón de volver a mesas.

Acciones:

- Un toque agrega una unidad.
- Botones + y −.
- Eliminar un producto.
- Agregar nota corta.
- Guardado inmediato en servidor.
- Recuperación automática después de recargar.
- Actualización de total desde el servidor.

Usar actualización optimista únicamente cuando sea segura. Si la API falla, revertir la interfaz y mostrar el error.

# 12\. Estados de órdenes

Definir como mínimo:

- OPEN: orden en operación.
- PAYMENT_PENDING: proceso de pago iniciado.
- PAID: pagada.
- CANCELLED: cancelada.
- REFUNDED: reembolsada o revertida por administrador.

Reglas:

- Solo puede existir una orden OPEN por mesa.
- Una orden pagada no puede editarse.
- Una orden cancelada no puede reabrirse silenciosamente.
- Cancelar una orden requiere motivo y usuario responsable.
- Cancelar productos debe dejar historial.
- Las modificaciones deben registrar autor y fecha.
- Al pagar una orden, la mesa debe quedar disponible.
- Si existe billar activo, no permitir pagar hasta finalizarlo o cancelarlo con autorización.

Cada OrderItem debe conservar una fotografía histórica de:

- Nombre del producto al momento de la venta.
- Precio base.
- Precio aplicado.
- Descuento.
- Promoción aplicada.
- Cantidad.
- Total.
- Usuario que lo agregó.

Modificar posteriormente el precio de un producto no debe cambiar órdenes anteriores.

# 13\. Productos y categorías

## Categorías

Campos mínimos:

- ID.
- Nombre.
- Color o icono opcional.
- Orden de visualización.
- Activa/inactiva.
- Fecha de creación y actualización.

Ejemplos:

- Cervezas.
- Bebidas preparadas.
- Refrescos.
- Botanas.
- Servicios.

No insertar estos ejemplos como datos falsos en producción.

## Productos

Campos mínimos:

- ID.
- Nombre.
- Descripción corta opcional.
- Precio en centavos.
- Categoría.
- SKU opcional.
- Tipo.
- Imagen opcional.
- Activo/inactivo.
- Controla inventario.
- Cantidad que descuenta por unidad vendida.
- Umbral de stock bajo.
- Orden de visualización.
- Fecha de creación y actualización.

Tipos:

- STANDARD.
- SERVICE.
- BILLIARD_SERVICE.

No eliminar productos que ya aparezcan en ventas. Deben desactivarse.

# 14\. Sistema de billar

El billar es una función crítica y debe manejarse con timestamps del servidor.

## Acciones

- Iniciar.
- Pausar.
- Reanudar.
- Finalizar.
- Cancelar con autorización y motivo.

## Estados

- ACTIVE.
- PAUSED.
- FINISHED.
- CANCELLED.

## Reglas

- Solo una sesión activa o pausada por mesa de billar.
- La mesa debe tener una orden abierta.
- El precio vigente debe guardarse como snapshot al iniciar.
- Cambiar posteriormente la tarifa no debe alterar una sesión ya iniciada.
- El servidor debe ser la autoridad del tiempo.
- El frontend puede actualizar el cronómetro visual cada segundo, pero no debe enviar actualizaciones cada segundo al backend.
- Guardar el tiempo acumulado al pausar.
- Al reanudar, iniciar un nuevo segmento de tiempo.
- Al finalizar, calcular el tiempo facturable y agregar el cargo a la orden.
- Evitar agregar dos veces el cargo si se repite la solicitud.
- Registrar quién inició, pausó, reanudó y finalizó.

## Tarifas

Permitir configurar:

- Precio por hora.
- Equivalente por minuto.
- Redondeo al siguiente minuto iniciado.
- Cargo mínimo opcional.

Fórmula base:

minutos_facturables = redondear_hacia_arriba(segundos_activos / 60)  
importe = minutos_facturables × tarifa_por_minuto

Si la tarifa se captura por hora, convertirla de manera consistente a tarifa por minuto y conservar el valor aplicado en la sesión.

La interfaz debe mostrar:

- Tiempo transcurrido.
- Estado.
- Tarifa.
- Costo estimado.
- Botón principal según estado.
- Confirmación al finalizar.

# 15\. Promociones

Implementar promociones automáticas por horario.

Cada promoción debe permitir:

- Nombre.
- Descripción.
- Estado activo/inactivo.
- Fecha inicial y final opcional.
- Días de la semana.
- Hora de inicio.
- Hora de finalización.
- Productos aplicables.
- Categorías aplicables.
- Precio fijo o porcentaje de descuento.
- Prioridad.
- Regla de acumulación.

Primera versión:

- No acumular promociones.
- Si coinciden varias, aplicar la promoción válida de mayor prioridad.
- Si tienen la misma prioridad, aplicar la que produzca el menor precio.
- Evaluar la promoción en el backend usando America/Tijuana.
- Guardar en cada producto vendido la promoción y el precio aplicado.
- Al terminar el horario, los artículos agregados anteriormente conservan su precio histórico.
- Los nuevos artículos usan el precio vigente al momento de agregarse.

Ejemplo funcional que debe poder configurarse desde administración:

Happy hour  
Todos los días  
6:00 p. m. a 10:00 p. m.  
Precio especial en productos seleccionados

# 16\. Inventario básico

La primera versión controlará principalmente bebidas por unidad.

Cada producto puede:

- No controlar inventario.
- Controlar inventario.
- Descontar una cantidad configurable por unidad vendida.

Implementar:

- Existencia actual.
- Stock inicial.
- Umbral de stock bajo.
- Ajustes manuales.
- Entradas.
- Salidas.
- Historial de movimientos.
- Usuario responsable.
- Motivo.
- Referencia a orden cuando el movimiento provenga de una venta.

Tipos mínimos de movimiento:

- INITIAL.
- PURCHASE.
- ADJUSTMENT_IN.
- ADJUSTMENT_OUT.
- SALE.
- SALE_REVERSAL.

Reglas:

- Descontar inventario cuando el producto se agrega a una orden, porque físicamente ya fue entregado.
- Si el artículo se elimina o la orden se cancela, generar el movimiento inverso.
- Todo debe ejecutarse dentro de una transacción.
- No modificar existencias sin crear un movimiento.
- Evitar inventario negativo, salvo configuración explícita del administrador.
- Si no hay stock suficiente, impedir agregar el producto y mostrar un mensaje.
- El frontend no decide si existe stock; lo decide el backend.
- Alertar visualmente cuando se alcance el nivel bajo.
- Un cajero o mesero únicamente verá "disponible", "poco stock" o "agotado", no la existencia completa.

# 17\. Caja y turnos

Distinguir entre:

- CashRegister: caja física.
- CashShift: turno o sesión de caja.
- CashMovement: entrada o salida.
- Payment: pago relacionado con una orden.

## Apertura

Solo ADMIN:

- Seleccionar caja.
- Capturar fondo inicial.
- Abrir turno.
- Registrar fecha, usuario y monto.

Solo puede existir un turno abierto por caja.

## Operación

Cajero, mesero y administrador pueden cobrar cuando haya un turno abierto.

Métodos de pago iniciales:

- Efectivo.
- Tarjeta.
- Transferencia.

Permitir un pago con uno o varios métodos para soportar pagos combinados.

Para efectivo:

- Capturar monto recibido.
- Calcular cambio.
- No permitir monto recibido menor al importe en efectivo requerido.

## Movimientos

Solo ADMIN:

- Entrada de efectivo.
- Salida de efectivo.
- Importe.
- Motivo obligatorio.
- Usuario.
- Fecha.

No tratar ventas como movimientos manuales.

## Corte de caja

Solo ADMIN.

Mostrar:

- Fondo inicial.
- Ventas totales.
- Ventas en efectivo.
- Ventas con tarjeta.
- Ventas por transferencia.
- Entradas de efectivo.
- Salidas de efectivo.
- Reembolsos.
- Efectivo esperado.
- Efectivo contado.
- Diferencia.
- Fecha de apertura.
- Fecha de cierre.
- Usuario que abrió.
- Usuario que cerró.

Fórmula:

efectivo_esperado =  
fondo_inicial  
\+ ventas_en_efectivo  
\+ entradas  
\- salidas  
\- reembolsos_en_efectivo

Al cerrar:

- Guardar el corte de forma permanente.
- No permitir más ventas en ese turno.
- No modificar el resultado posteriormente.
- Cualquier corrección debe quedar como ajuste auditado.

# 18\. Reportes

Solo ADMIN.

## Ventas

- Hoy.
- Ayer.
- Rango personalizado.
- Total vendido.
- Cantidad de órdenes.
- Ticket promedio.
- Ventas por método de pago.
- Ventas por hora.
- Ventas por empleado.

## Productos

- Productos más vendidos.
- Cantidades vendidas.
- Ingreso por producto.
- Ingreso por categoría.

## Billar

- Sesiones.
- Tiempo total.
- Ingreso por mesa.
- Sesiones canceladas.
- Usuario que operó la sesión.

Los reportes deben usar exclusivamente órdenes pagadas y considerar correctamente cancelaciones y reembolsos.

No calcular reportes importantes únicamente en el frontend.

# 19\. Actualización entre dispositivos

Implementar sincronización inicial mediante polling con TanStack Query.

- Refrescar mesas y órdenes activas cada pocos segundos.
- Invalidar consultas después de cada cambio.
- No consultar el cronómetro de billar cada segundo.
- El cronómetro se calcula localmente usando el timestamp proporcionado por el servidor.
- Cuando otro dispositivo modifique una cuenta, actualizar la vista.
- Mostrar aviso si la versión local quedó desactualizada.
- Usar un campo version o control optimista para evitar sobrescribir cambios concurrentes.

No agregar WebSockets si el polling satisface correctamente el alcance inicial.

# 20\. Modelo de datos mínimo

El schema.prisma debe incluir modelos equivalentes a:

- User.
- Role o enum de roles.
- Category.
- Product.
- DiningTable, evitando usar un nombre SQL ambiguo como Table.
- Order.
- OrderItem.
- Payment.
- PaymentDetail.
- CashRegister.
- CashShift.
- CashMovement.
- Inventory.
- InventoryMovement.
- Promotion.
- Relaciones entre promociones, productos y categorías.
- BilliardRate.
- BilliardSession.
- AuditLog.
- RefreshToken.

Agregar:

- Llaves foráneas.
- Índices.
- Restricciones únicas.
- Campos de auditoría.
- Borrado lógico cuando corresponda.
- createdAt.
- updatedAt.
- Usuario responsable.
- Estados mediante enums.

Crear migraciones reales.

Agregar restricciones de base de datos para prevenir, entre otras cosas:

- Dos órdenes abiertas en la misma mesa.
- Dos turnos abiertos para la misma caja.
- Dos sesiones activas de billar en la misma mesa.
- Duplicación de pagos por reintento.

Si Prisma no expresa una restricción parcial de PostgreSQL, crearla mediante una migración SQL controlada.

# 21\. Transacciones e idempotencia

Usar transacciones de Prisma en operaciones críticas:

- Abrir una mesa.
- Agregar o retirar productos.
- Descontar o devolver inventario.
- Iniciar o finalizar billar.
- Cobrar una orden.
- Registrar pagos.
- Cancelar una orden.
- Abrir o cerrar caja.

Usar Idempotency-Key o un identificador equivalente para:

- Crear órdenes.
- Agregar productos cuando pueda existir reintento.
- Finalizar billar.
- Procesar pagos.
- Cerrar caja.

Si se recibe dos veces la misma solicitud, devolver el resultado original sin repetir la operación.

# 22\. API mínima

Diseñar endpoints REST consistentes para:

/api/auth/\*  
/api/users/\*  
/api/categories/\*  
/api/products/\*  
/api/tables/\*  
/api/orders/\*  
/api/orders/:id/items/\*  
/api/orders/:id/pay  
/api/orders/:id/cancel  
/api/billiard/rates/\*  
/api/billiard/sessions/\*  
/api/promotions/\*  
/api/inventory/\*  
/api/cash/registers/\*  
/api/cash/shifts/\*  
/api/cash/movements/\*  
/api/reports/\*  
/api/audit/\*  
/api/health

Cada endpoint debe tener:

- Validación Zod.
- Autenticación.
- Autorización.
- Respuesta tipada.
- Código HTTP correcto.
- Manejo de errores.
- Mensajes comprensibles.
- Registro de acciones cuando corresponda.

Usar un formato uniforme de respuesta de error, por ejemplo:

{  
"error": {  
"code": "INSUFFICIENT_STOCK",  
"message": "No existe inventario suficiente para agregar el producto.",  
"details": {}  
}  
}

No devolver errores internos o stack traces al frontend en producción.

# 23\. Datos iniciales

No utilizar productos, ventas, mesas ni usuarios falsos dentro de la aplicación.

Crear un proceso de inicialización que:

- Genere únicamente los roles requeridos.
- Cree el primer administrador usando variables de entorno.
- No tenga credenciales hardcodeadas.
- Permita posteriormente crear mesas, categorías y productos desde administración.

Los datos de pruebas automatizadas deben estar aislados del entorno de producción.

# 24\. Manejo de errores

Implementar y mostrar correctamente:

- Sin conexión.
- Sesión expirada.
- Permiso insuficiente.
- Producto agotado.
- Mesa ocupada por otro usuario.
- Orden modificada desde otro dispositivo.
- Caja no abierta.
- Pago ya procesado.
- Billar ya iniciado.
- Fallo del servidor.
- Datos inválidos.

La interfaz debe:

- Explicar el problema.
- Evitar perder lo que el usuario estaba viendo.
- Permitir reintentar cuando sea seguro.
- No repetir automáticamente pagos.
- No mostrar mensajes técnicos al empleado.

# 25\. PWA

Implementar:

- Manifest.
- Nombre e iconos configurables.
- Instalación en Android.
- display: standalone.
- Color de tema.
- Service worker.
- Caché de archivos estáticos.
- Pantalla clara cuando no exista conexión.
- Detección de nueva versión.
- Aviso para actualizar la aplicación.

No almacenar respuestas sensibles indiscriminadamente en el service worker.

# 26\. Pruebas obligatorias

## Unitarias

Probar al menos:

- Cálculo de totales.
- Promociones.
- Conversión de tarifa de billar.
- Pausa y reanudación.
- Redondeo de minutos.
- Efectivo esperado.
- Cambio.
- Descuento y reversión de inventario.
- Permisos.

## Integración

Probar:

- Login.
- Apertura de mesa.
- Prevención de doble orden.
- Agregar producto.
- Falta de inventario.
- Cobro.
- Prevención de doble pago.
- Apertura y cierre de caja.
- Inicio y finalización de billar.
- Acceso prohibido por rol.

## End-to-end

Crear al menos un flujo automatizado:

login administrador  
→ abrir caja  
→ crear o seleccionar mesa  
→ agregar producto  
→ cobrar  
→ verificar mesa libre  
→ verificar inventario  
→ verificar venta en corte

Y otro flujo:

abrir mesa de billar  
→ iniciar sesión  
→ pausar  
→ reanudar  
→ finalizar  
→ agregar cargo  
→ cobrar cuenta

# 27\. Criterios de aceptación

El sistema no se considera terminado hasta comprobar que:

1. El administrador puede iniciar sesión.
2. Puede crear categorías, productos y mesas.
3. Puede abrir un turno de caja.
4. Un empleado puede iniciar sesión y solo ve sus módulos permitidos.
5. Puede realizar una venta rápida.
6. Puede abrir una mesa.
7. Puede agregar productos.
8. La orden sigue existiendo después de recargar.
9. Dos dispositivos no crean dos cuentas en la misma mesa.
10. Una venta descuenta inventario.
11. Retirar el producto devuelve inventario.
12. Una promoción se aplica usando el horario de Tijuana.
13. El precio aplicado queda guardado históricamente.
14. Una sesión de billar calcula correctamente el tiempo.
15. Pausar billar detiene el tiempo facturable.
16. Finalizar billar agrega el cargo una sola vez.
17. Cobrar libera la mesa.
18. Un doble toque no genera dos pagos.
19. El corte calcula correctamente el efectivo esperado.
20. Un usuario sin permiso recibe 403 en la API.
21. La aplicación puede instalarse como PWA.
22. La aplicación compila sin errores.
23. Las migraciones funcionan en una base limpia.
24. Las pruebas críticas pasan.
25. No existen pantallas con información simulada.

# 28\. Desarrollo y entrega

Trabaja por etapas, pero no te detengas después de crear la estructura o presentar un plan.

## Etapa 1

- Inspeccionar el repositorio.
- Identificar archivos existentes.
- Proponer estructura final.
- Documentar supuestos mínimos.
- Configurar monorepo y herramientas.

## Etapa 2

- PostgreSQL.
- Prisma.
- Modelos.
- Migraciones.
- Inicialización de administrador.
- Autenticación.
- Roles y permisos.

## Etapa 3

- Categorías.
- Productos.
- Mesas.
- Órdenes.
- Venta rápida.
- Inventario.

## Etapa 4

- Billar.
- Promociones.
- Pagos.
- Caja y corte.

## Etapa 5

- Reportes.
- Auditoría.
- PWA.
- Manejo de errores.
- Sincronización entre dispositivos.

## Etapa 6

- Pruebas.
- Docker.
- Documentación.
- Verificación final.

Después de cada etapa:

- Ejecutar TypeScript.
- Ejecutar lint.
- Ejecutar pruebas relacionadas.
- Corregir errores antes de avanzar.
- No dejar funciones críticas con TODO.
- No afirmar que una función está terminada sin probarla.

# 29\. Entregables obligatorios

Entregar:

1. Monorepo completo.
2. Frontend React/Vite funcional.
3. Backend Next.js funcional.
4. schema.prisma completo.
5. Migraciones.
6. Script de inicialización.
7. API conectada a PostgreSQL.
8. Autenticación y roles.
9. Flujo de venta rápida.
10. Flujo de mesa.
11. Flujo de billar.
12. Flujo de pago.
13. Caja y corte.
14. Inventario.
15. Promociones.
16. Reportes.
17. PWA instalable.
18. Pruebas.
19. .env.example.
20. Dockerfiles separados.
21. docker-compose.yml.
22. README completo.

El README debe explicar:

- Requisitos.
- Instalación.
- Variables de entorno.
- Inicio en desarrollo.
- Migraciones.
- Creación del administrador.
- Ejecución de pruebas.
- Construcción para producción.
- Despliegue en servidor propio.
- Copias de seguridad de PostgreSQL.
- Restauración de la base de datos.

# 30\. Preparación para producción

Crear:

- Dockerfile del frontend.
- Dockerfile del backend.
- PostgreSQL mediante Docker Compose para desarrollo.
- Build standalone del backend Next.js.
- Build estático del frontend servido eficientemente.
- Health checks.
- Variables de entorno documentadas.
- Logs estructurados.
- Configuración de CORS.
- Migraciones ejecutables como tarea controlada.
- Volumen persistente para PostgreSQL.
- Política de reinicio.
- Endpoint /api/health.

El proyecto debe poder desplegarse posteriormente en un servidor propio mediante Coolify, manteniendo frontend, backend y PostgreSQL como servicios independientes.

No acoplar el código a Coolify. Solamente prepararlo correctamente para contenedores y variables de entorno.

# 31\. Restricciones finales

- No entregar pseudocódigo.
- No entregar únicamente documentación.
- No crear pantallas desconectadas del backend.
- No usar arrays locales como base de datos.
- No usar precios enviados por el cliente.
- No usar credenciales hardcodeadas.
- No usar datos simulados en producción.
- No omitir validaciones.
- No omitir permisos en backend.
- No sustituir funciones por botones sin comportamiento.
- No marcar como completado algo que no se haya ejecutado.
- No reescribir funciones ya terminadas sin necesidad.
- No agregar complejidad fuera del alcance.
- No cambiar el stack tecnológico.
- No pedir confirmación por decisiones menores: utiliza los criterios definidos.
- Si aparece una decisión realmente bloqueante, explica el impacto y ofrece opciones concretas.

Comienza inspeccionando el proyecto actual. Después presenta un plan breve y procede inmediatamente con la implementación. Continúa hasta completar y verificar el flujo principal:

login  
→ apertura de caja  
→ venta rápida o apertura de mesa  
→ agregar productos  
→ billar opcional  
→ cobro  
→ actualización de inventario  
→ liberación de mesa  
→ corte de caja  
→ reportes