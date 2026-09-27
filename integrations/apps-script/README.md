# Registro opcional de pedidos y POS básico

El sitio funciona sin esta integración. `CONFIG.orders.endpoint` se entrega vacío: no se envían datos a Sheets hasta configurarlo. No requiere instalar dependencias ni cambiar el hosting estático.

## Activar

1. Crea un Google Sheets **privado**, dedicado a Antojea2. No lo publiques en la web ni habilites acceso público a sus hojas.
2. Abre **Extensiones → Apps Script**. Copia `Code.gs` de esta carpeta en el editor.
3. Crea otro archivo de script llamado `Catalog.gs` y pega el contenido completo de `assets/js/products.js`. Así el servidor conoce los precios y opciones reales. No necesita las imágenes. Crea además PromoCodes.gs con el contenido completo de assets/js/promo-codes.js, aunque todavía no haya códigos activos.
4. Ejecuta `setup` desde el editor con tu cuenta y autoriza el acceso. Crea `Pedidos`, `Resumen` y `Clientes`, y guarda el ID de la hoja en las propiedades privadas del script. Ejecutar de nuevo no borra los pedidos.
5. En **Implementar → Nueva implementación → Aplicación web**, selecciona ejecutar como tú y permitir acceso a cualquier usuario. Esto permite recibir solicitudes sin pedir al cliente una cuenta de Google; la hoja sigue privada. Si tu organización no permite esa opción, necesitarás una cuenta o servicio que permita recibir pedidos públicos.
6. Copia la URL de implementación que termina en `/exec` a `CONFIG.orders.endpoint` en `assets/js/config.js`.
7. Publica los archivos estáticos y prueba un pedido desde el sitio real. Confirma que aparece **una sola fila**, que coincide el folio de WhatsApp y que el estado inicial es `Pendiente`. Prueba también el respaldo y un error de conexión.

Cuando cambies precios, disponibilidad u opciones, actualiza **Catalog.gs y el catálogo del sitio**; publica una nueva versión de la implementación de Apps Script. Al cambiar horarios, sincroniza `HOURS` en Code.gs y `CONFIG.schedule`. Las horas usan `America/Mexico_City`.

Documentación oficial: [aplicaciones web de Apps Script](https://developers.google.com/apps-script/guides/web).

## Flujo

- Horarios cada 35 minutos desde 16:30 hasta antes de 22:30, para hoy y los cuatro días siguientes, solo miércoles a domingo y descartando horas pasadas. Durante el horario se ofrece Lo antes posible (aprox. 45 minutos para envío). Todo sujeto a confirmación.
- Al pulsar el enlace, WhatsApp abre normalmente en otra pestaña y comienza el registro en paralelo. El nombre es opcional; teléfono y correo también son opcionales y los campos se muestran incluso sin Sheets. El sitio explica su uso para atender pedidos; no hay suscripción a publicidad.
- Abrir WhatsApp **no permite saber si el mensaje fue enviado**. El registro es una solicitud pendiente. El cliente todavía debe enviar el mensaje y el negocio confirmar disponibilidad, horario y envío.
- Un folio identifica el mismo pedido y sus reintentos, incluido el enlace de respaldo. Modificar el pedido genera otro folio: revisa y cancela la solicitud anterior si era una corrección. La deduplicación no persiste en el navegador al recargar.
- El registro usa una petición POST simple con respuesta JSON. Solo muestra «registrada» tras una respuesta correcta con el folio correspondiente. No usa `no-cors`, que impediría confirmar el resultado. Si falla, el WhatsApp sigue funcionando; el pedido puede registrarse manualmente. Cerrar la página de inmediato o restricciones de red pueden impedir confirmar el registro.

## Operar en Sheets

Recarga la hoja para ver el menú **Antojea2**:

- **Registrar venta manual**: captura una venta ya cobrada, sin desglose de productos, con nombre y teléfono opcionales. Se registra como recogida, entregada y pagada; puedes corregir modalidad y envío en la fila. No sirve como factura ni procesa pagos.
- En **Pedidos**, busca el folio recibido por WhatsApp y cambia `Estado` conforme lo atiendes. Marca `Pago` cuando realmente se haya cobrado. Para envíos, llena `Envío` con la tarifa acordada, incluso `0` si es gratis; hasta entonces el total queda vacío. `Descuento` es un importe en MXN, inicialmente cero. No sobrescribas la fórmula de `Total`.
- **Actualizar resumen y clientes**: recalcula los reportes de todo el histórico. No es automático; ejecútalo al terminar de actualizar estados, pagos o importes. Las hojas de reportes se regeneran: escribe notas operativas solo en Pedidos.
- Las ventas y el ticket promedio consideran únicamente `Entregado` + `Pagado` con total numérico. El ticket es ingresos cobrados con envío y descuentos / cantidad de esas ventas. Cancelados, reembolsados y pendientes no entran. No calcula utilidad, impuestos ni comisiones de plataformas.
- **Clientes** agrupa compras entregadas y pagadas por teléfono o, cuando no hay teléfono, por correo; no por nombre. Normaliza teléfonos mexicanos de diez dígitos a `52…`. Los pedidos históricos sin contacto sí cuentan en ventas, pero no en clientes identificados. Un cliente que alterna entre teléfono y correo puede aparecer como dos contactos. Un teléfono compartido o escrito incorrectamente limita la precisión de este reporte.

## Protección y límites

- El honeypot se revisa en el navegador y en Apps Script. El servidor también valida tamaños, cantidades, opciones y horarios, y recalcula importes con Catalog.gs. Los textos se protegen contra fórmulas de Sheets. Un bloqueo de escritura evita duplicados por peticiones simultáneas del mismo folio.
- El endpoint público **solo recibe solicitudes**; no expone pedidos, reportes o clientes, ni permite marcar pagos o cambiar estados. Las tareas de administración ocurren en la hoja con tu cuenta de Google. No pongas contraseñas o tokens de administración en el JavaScript público.
- El honeypot no detiene un bot que conoce el formato de la petición. Esta versión no incluye CAPTCHA, límites por IP ni protección contra abuso sostenido. Apps Script tiene cuotas; si aumenta el volumen o hay abuso, habrá que reforzar el receptor.
- No se envían promociones ni se guardan datos de tarjetas. Limita el acceso a la hoja al personal que atiende pedidos; conserva solo los datos que necesites.
- Esta integración está preparada y probada localmente con respuestas simuladas. El despliegue real y sus permisos se verifican después de crear tu hoja y publicar el script.

## Método de pago

El receptor requiere paymentMethod (cash, transfer o card) y guarda la elección en la última columna Método de pago. El estado Pago sigue pendiente hasta verificar el cobro. Si ya usabas la versión anterior, ejecuta setup una vez: agrega la columna sin desplazar los datos. Vuelve a implementar el script antes de activar el nuevo sitio. Las ventas manuales también preguntan el método de pago.

## Folio del pedido

Cada pedido muestra un folio copiable con formato XXXXX-XXXXX (por ejemplo K7M4P-9RX2D) y lo incluye en WhatsApp, incluso sin Sheets. Principal y respaldo llevan el mismo folio para la misma versión del pedido. Si cambian los datos, se genera otro; al vaciar o recargar la página se inicia una referencia nueva. La cookie conserva productos, no folios ni datos personales.

El folio usa 10 caracteres aleatorios (50 bits), sin caracteres ambiguos 0/O ni 1/I. La posibilidad de coincidencia es extremadamente baja, pero la generación sin un registro central no garantiza unicidad absoluta: no es consecutivo ni acredita pago o confirmación. Al activar Sheets se guarda exactamente el mismo identificador. Actualiza y vuelve a implementar Code.gs para que acepte el formato nuevo; sigue admitiendo los folios largos y UUID anteriores.


## Códigos de promoción y correo

Code.gs requiere PromoCodes.gs (copia del archivo público assets/js/promo-codes.js). Mantén ambos catálogos de códigos sincronizados y publica una nueva versión al cambiarlos. El receptor valida el código y calcula el descuento sobre los importes que él mismo obtiene del catálogo; no acepta descuentos enviados por el navegador.

Ejecutar setup añade Correo y Código de promoción al final de Pedidos, conservando las columnas anteriores. El importe de descuento va en Descuento. El envío estimado del sitio sigue sujeto a confirmación; llena Envío con la tarifa acordada antes de dar por cerrado el total.
