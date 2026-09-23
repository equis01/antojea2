# Antojea2

Sitio estático en HTML, CSS y JavaScript vanilla. Sin librerías ni compilación. Las vistas de mapas usan OpenStreetMap y requieren conexión.

## Estructura

```text
antojea2/
├── index.html                  # Bio-link
├── menu/index.html             # Vistas de menú y pedido, con personalización
├── assets/
│   ├── css/                    # global.css, home.css, menu.css
│   ├── js/                     # config.js, products.js, main.js, menu.js
│   ├── brand/                  # Lineamientos originales en PDF
│   ├── img/
│   │   ├── brand/              # Logo
│   │   ├── menu/               # Menú completo vigente
│   │   ├── products/
│   │   │   ├── frappes/
│   │   │   └── hotcakes/
│   │   ├── combos/
│   │   └── social/             # Portada original
│   └── icons/                  # Logos de encabezado y favicon proporcionados
├── README.md
├── site.webmanifest
├── .htaccess                   # URLs limpias en Apache
└── .gitignore
```

## Marca e imágenes

- La portada usa el logo transparente `assets/icons/logo_letras blancas.png` sobre fondo oscuro; el encabezado usa `assets/icons/logo_letras negras.png` sobre fondo claro. La pestaña del navegador usa `assets/icons/favicon.png`. Se conservaron los archivos y sus nombres originales; los espacios en rutas HTML están codificados como `%20`.
- El logo anterior se conserva en `assets/img/brand/logo.png`. Para usar un SVG real, sube el archivo y cambia el `src` correspondiente. No se convirtió ninguna fotografía a SVG.
- Las fotos originales se conservaron sin modificaciones y se renombraron por producto. Sube futuras imágenes `.webp`, `.png` o `.jpg` a su categoría y actualiza `image` en `products.js`.
- La portada se conservó en `assets/img/social/portada.png`; los lineamientos en `assets/brand/lineamientos-de-marca.pdf`.
- Las imágenes ausentes muestran un reemplazo de texto. Una petición a un archivo inexistente puede aparecer como 404 en las herramientas del navegador, pero no rompe la interfaz.

## Enlaces y WhatsApp

Edita `assets/js/config.js`:

- `whatsapp`: `528124215678`, con código de país, sin `+` ni espacios.
- `whatsappBackup`: `524421916159`, número personal de respaldo. Aparece en la portada y en el pedido. Ambos destinatarios reciben el mismo texto preparado; el cliente elige uno y confirma el envío. Vacío, inválido o igual al principal oculta el respaldo. El sitio no detecta suspensiones de cuentas ni cambia el destinatario automáticamente.
- `business.hours`: miércoles a domingo, de 5:00 p. m. a 10:00 p. m.; se muestra en inicio y menú. Es informativo y no bloquea pedidos fuera de horario. Al cambiarlo, actualiza también los textos de respaldo en ambos HTML para visitantes sin JavaScript.
- `social`: enlaces completos de Instagram, Facebook y TikTok.
- `delivery`: enlaces completos de Uber Eats, DiDi Food y Rappi.
- `pages`: rutas internas. `business.city` indica Querétaro.
- Uber Eats, DiDi Food, Rappi, Instagram y Facebook ya están configurados con los enlaces proporcionados. Solo TikTok sigue pendiente. Los enlaces vacíos o inválidos quedan desactivados.
- Los enlaces HTTP/HTTPS a otros sitios (WhatsApp, deliveries, redes y Maps) usan `target="_blank"` y `rel="noopener noreferrer"`. Las páginas y anclas internas se abren en la misma pestaña. La regla está centralizada en `Site.setLinkTarget()` y también se aplica al generar o actualizar enlaces del pedido.

## Menú y precios

La página muestra una sola vista a la vez: **Ver menú** (imagen con zoom de 100% a 400%) o **Armar pedido** (productos por categoría). El pedido se revisa en un panel al pulsar la barra inferior. La imagen existente `assets/img/menu/menu.png` funciona en móvil sin depender de un lector PDF. El PDF de lineamientos es un documento de marca, no un menú.

Al armar el pedido se selecciona **Todos** por defecto. Los filtros aparecen en este orden: **Todos, Combos, Mini Hotcakes, Frappés**. El catálogo completo mantiene los combos al principio, con el mismo tamaño de fotos y estilo que las demás categorías; después aparecen mini hotcakes y frappés. El orden se controla en `CATEGORIES`. Tocar directamente una foto, sin texto superpuesto, abre un visor dentro de la página, con zoom de 100% a 300%, desplazamiento y cierre con el botón × o Escape. Ver una foto no agrega productos ni modifica el pedido.

El botón **Contacto** abre un diálogo con el número principal y el número personal de respaldo. Ambos se leen desde `config.js`; sus enlaces abren WhatsApp en otra pestaña. El diálogo se cierra con × o Escape y devuelve el foco al botón Contacto.

Para reemplazar el menú usa el mismo nombre de archivo. Si cambias la ruta, actualiza `menuImage` en `config.js` y el `src` de respaldo en `menu/index.html` (este último permite verlo sin JavaScript).

`assets/js/products.js` contiene las categorías y 12 productos transcritos del menú proporcionado, con precios reales vigentes hasta nuevo aviso. Edita `price`, `description`, `available` e `image` allí. `available: false` muestra “Agotado” y desactiva el botón. Mantén sincronizados el catálogo y la imagen del menú al cambiar precios o disponibilidad.

`options` controla los campos y precios del personalizador. Tipos: `single` para leche, crema, sabores o futuros tamaños; `multiple` para ingredientes incluidos con un máximo; `quantity` para porciones extra; `fixed` para recetas de combos. Cada opción tiene `additionalPrice`. Las rutas de imágenes son relativas a `menu/index.html`.

- Frappés: leche entera o deslactosada (+$5), con o sin crema batida.
- Mini hotcakes: hasta 2 untables y 1 topping incluidos, sin obligación de elegirlos. Las porciones extra se agregan aparte: $5 por untable y $10 por topping, incluso del mismo ingrediente ya seleccionado.
- Combos: cada bebida tiene su propia leche y crema, sin recargo por deslactosada. En el familiar se elige el sabor de los 4 frappés y se personalizan las 2 órdenes de hotcakes por separado. Pa’ el antojo conserva su receta de Nutella y fresa y permite extras.
- `SPREADS`, `TOPPINGS` y `FLAVORS` centralizan los ingredientes y sabores. `frappeOptions()` y `hotcakeOptions()` generan grupos reutilizables.

## Lista y futuras compras

`menu.js` separa vistas, filtros, visor, personalizador y estado del pedido. “Elegir” abre un diálogo con opciones, cantidad y precio actualizado; “Agregar” confirma la preparación. Preparaciones iguales suman unidades y preparaciones diferentes permanecen separadas. Desde el pedido se pueden editar opciones y cantidades, eliminar unidades o vaciarlo. El subtotal incluye todos los extras por unidad. El mensaje de WhatsApp contiene los ingredientes de cada producto, las cantidades, el subtotal y las observaciones; el usuario debe enviarlo en WhatsApp.

El pedido se conserva al cambiar de vista, pero solo mientras la página está abierta: no se guarda al recargar. No hay pagos ni checkout complejo. `order` reserva `shipping`; `getSubtotal()` incluye personalizaciones y `getTotal()` permanece pendiente hasta confirmar envío; al recoger no se suma envío. `buildOrderMessage()` separa cada producto, subtotal, entrega y observaciones con líneas en blanco; usa saltos reales CRLF y `Site.whatsapp()` los codifica una sola vez.

## Ubicación y entrega

La dirección y las coordenadas del negocio no se publican en el sitio ni en su configuración. El punto para recoger se comparte por WhatsApp al confirmar el pedido.

Solo se ofrecen **Envío a domicilio** y **Recoger**. El cliente elige en el pedido; al recoger, se coordina el punto por WhatsApp y se elimina la ubicación del cliente, incluso si había una solicitud pendiente. En envío, abre **Datos de entrega** para escribir dirección y referencias o pulsar **Usar mi ubicación**. La API de geolocalización del navegador pide permiso únicamente al pulsar ese botón. Se genera un enlace `https://www.google.com/maps/search/?api=1&query=LATITUD,LONGITUD`, sin API key ni SDK de Google. `CONFIG.mapsSearchUrl` centraliza ese destino.

El cliente puede revisar el punto, actualizarlo o quitarlo antes de enviar. Es su ubicación actual, no una dirección de entrega verificada: puede complementar el punto con una dirección escrita. Tras autorizar y obtener la ubicación, aparece un mapa de OpenStreetMap con el punto y se incluye un enlace de Google Maps en el mensaje. Las coordenadas se comparten con OpenStreetMap para mostrar la vista previa; el sitio conserva el pedido solo en memoria, sin backend propio. Quitar la ubicación elimina la vista previa y el punto del mensaje. Los destinos están centralizados en `CONFIG.maps` y `CONFIG.mapsSearchUrl`. Los permisos denegados, tiempos de espera y navegadores sin soporte tienen mensajes y alternativa manual.

Se necesita HTTPS en producción; `localhost` permite probarlo con Live Server. Una IP de red local servida por HTTP normalmente no permite geolocalización en el celular. No se calcula distancia, cobertura ni tarifa a partir del punto. Documentación: [geolocalización del navegador](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) y [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

## Encabezado y carga

Ambas páginas tienen un encabezado fijo; el contenido y los enlaces internos respetan su altura. El panel de marca de la portada se desplaza con la página y puede crecer, para no recortar el texto en pantallas bajas o con zoom. Las categorías solo se muestran en el catálogo, no como texto fijo de la portada.

`main.js` muestra una pequeña licuadora vectorial animada durante **1.5 segundos**, sin esperar imágenes lentas. El contenido queda inactivo mientras el loader lo cubre. No necesita imágenes ni librerías y respeta la preferencia de movimiento reducido. Sin JavaScript no aparece ningún loader.

## URLs sin .html

Los enlaces internos usan `./`, `menu/` y `../`. Así se navega sin `.html` en Live Server, GitHub Pages y otros servidores estáticos que sirven `index.html` para cada carpeta. Abre el proyecto desde un servidor local, no con doble clic en el archivo.

En Apache 2.4, `.htaccess` también redirige enlaces antiguos: `index.html` → `./`, `menu/index.html` → `menu/`, y páginas existentes como `contacto.html` → `contacto`. Las URLs sin extensión se resuelven internamente solo si existe el archivo HTML; imágenes, CSS, JS y archivos inexistentes no se reescriben. Conserva parámetros y funciona en una subcarpeta, sin fijar el dominio ni el nombre del repositorio.

El hosting debe permitir `.htaccess`, `mod_rewrite` y `AllowOverride` para `FileInfo`, `Indexes` y `Options`. **GitHub Pages y Live Server no ejecutan `.htaccess`**: allí funcionan las rutas de carpeta, pero no esas redirecciones de Apache. Para nuevas páginas compatibles con todos estos hosts, crea `nombre/index.html`. Referencia: [mod_rewrite de Apache](https://httpd.apache.org/docs/2.4/rewrite/remapping.html).

## Términos de promociones

Los términos confirmados están en `CONFIG.promotionTerms`: **hasta agotar existencias, sin restricciones adicionales**. Las condiciones del menú (extras, leches y envío) se transcribieron en una sección separada de `menu/index.html`. Al modificar los términos, actualiza también el texto de respaldo en esa página para visitantes sin JavaScript.

## Probar con Live Server

1. Abre esta carpeta en VS Code.
2. Instala la extensión Live Server, si no la tienes.
3. Haz clic derecho en `index.html` y elige **Open with Live Server**.
4. Revisa el inicio, el menú, los filtros, el zoom y la lista desde una ventana móvil y una de escritorio.

No ejecutes `npm install`: no se requiere Node ni un proceso de compilación.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. En **Settings → Pages**, elige **Deploy from a branch**.
3. Selecciona tu rama (por ejemplo, `main`) y la carpeta **/(root)**; guarda.
4. Abre la URL que GitHub indique cuando termine la publicación.

Las rutas son relativas, por lo que sirven tanto bajo un dominio propio como bajo `usuario.github.io/repositorio/`. También puedes subir estos archivos a cualquier hosting estático. El manifiesto no añade funcionamiento sin conexión ni instala un service worker.
