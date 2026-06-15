# Política de privacidad de Navegador Scroll Inteligente

**Última actualización**: 14 de junio de 2026

## Recopilación de datos

Durante el uso normal de desplazamiento, Navegador Scroll Inteligente **no** recopila ni transmite historial, URL o dominios visitados, títulos o contenido de páginas, búsquedas, formularios, posiciones, marcadores ni cuentas. La única excepción son los datos que usted envía expresamente mediante el formulario opcional descrito abajo.

La extensión incluye estadísticas de uso anónimas opcionales. Esta función está desactivada de forma predeterminada para usuarios nuevos y existentes. Solo se recopilan y transmiten datos después de activar expresamente **Enviar estadísticas de uso anónimas** en la página de opciones.

Cuando se activa, la extensión puede enviar:

- Ajustes enumerados o agrupados por intervalos, como la distribución de botones, el intervalo de tamaño, el estilo de iconos y las opciones de herramientas de lectura.
- Recuentos diarios agregados en UTC de acciones permitidas, como el uso de botones de inicio/final, comandos de teclado, saltos de progreso, acciones de marcadores y acciones del índice.
- Recuentos diarios agregados en UTC de activaciones o desactivaciones de la extensión y de funciones avanzadas.
- La versión de la extensión y el idioma de la interfaz seleccionado.

La solicitud de estadísticas no contiene URL, dominios, títulos, texto de páginas, datos de marcadores, listas de sitios habilitados, colores personalizados exactos, identificadores persistentes de usuario, identificadores publicitarios ni huellas digitales del dispositivo. La extensión no crea un ID permanente de instalación o usuario.

## Almacenamiento local

La extensión utiliza la API de almacenamiento integrada de Chrome (`chrome.storage.sync`) para guardar preferencias como la velocidad de desplazamiento, la posición de los botones, los colores, la opacidad y los ajustes de herramientas de lectura. Estos datos se sincronizan mediante la infraestructura de Google entre los dispositivos donde haya iniciado sesión en Chrome. Si activa las estadísticas opcionales, solo el subconjunto enumerado o agrupado descrito anteriormente puede incluirse en una solicitud; no se envían valores personalizados exactos.

La extensión también puede usar `chrome.storage.local` para guardar el estado de activación por sitio y los marcadores de posición de desplazamiento cuando utilice esas funciones. Los marcadores contienen la URL, el progreso aproximado, el título de la página y metadatos relacionados con el contenedor de desplazamiento para permitir la reanudación posterior. Estos datos permanecen en el navegador y no se transmiten al desarrollador ni a terceros.

Cuando se activa la navegación inteligente por secciones, la extensión puede leer los encabezados visibles de la página actual para crear un índice en memoria. El índice, los textos de los encabezados y la estructura de la página no se guardan en Chrome ni se transmiten al desarrollador o a terceros.

El consentimiento para las estadísticas, hasta siete días UTC de recuentos agregados pendientes y un lote temporal de reintento se guardan en `chrome.storage.local`. Al desactivar las estadísticas se detiene inmediatamente la recopilación, se eliminan los datos pendientes, se cancela la programación de envíos y se revocan los permisos opcionales. Las estadísticas agregadas recibidas anteriormente por el servidor caducan según los plazos indicados a continuación.

## Permisos de host

La extensión solicita permisos amplios de host (`<all_urls>`) exclusivamente para insertar botones flotantes de desplazamiento en las páginas web. Este permiso es necesario para su función principal. La extensión **no** lee, intercepta, recopila, almacena ni transmite el contenido de las páginas que visita.

El permiso para el endpoint de estadísticas y el permiso de programación `alarms` son opcionales. Chrome solo los solicita al activar las estadísticas anónimas y se utilizan únicamente para enviar lotes agregados con tamaño limitado a:

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Procesamiento y conservación de estadísticas

El endpoint es operado por el desarrollador mediante Cloudflare Workers y Cloudflare D1. No se utilizan SDK de estadísticas de terceros, redes publicitarias, píxeles de seguimiento, cookies, scripts remotos ni intermediarios de datos.

Los lotes aceptados se convierten inmediatamente en contadores diarios agregados. No se guardan eventos de acciones individuales. Los ID aleatorios de lote utilizados únicamente para evitar duplicados durante los reintentos se conservan hasta 30 días. Las estadísticas diarias agregadas se conservan hasta 13 meses.

Cloudflare puede procesar metadatos de red habituales, como la dirección IP y los encabezados de solicitud, para prestar y proteger el servicio conforme a sus políticas de infraestructura. La extensión no añade URL de páginas, referentes, datos personalizados del agente de usuario ni identificadores persistentes, y el desarrollador no utiliza esos metadatos para identificar usuarios o crear perfiles.

Los datos se utilizan únicamente para evaluar el uso de funciones, la distribución de ajustes, los valores predeterminados y las prioridades del producto. No se venden, no se usan para publicidad ni se comparten para elaborar perfiles.

## Sugerencias y comentarios

El formulario opcional solo envía datos cuando usted confirma el envío. Se incluyen el tipo, el mensaje, la versión y el idioma de la interfaz. El contacto y hasta tres imágenes JPEG, PNG o WebP se envían solo si usted los proporciona. El formulario no recopila la URL actual ni el idioma del navegador. La extensión no guarda el contenido.

El endpoint funciona con Cloudflare Workers y D1 y usa Resend para reenviar el correo. Para limitar la frecuencia se utiliza un hash con sal de la dirección de red; no se guarda la IP en texto claro. Solo se conservan registros sin contenido durante un máximo de 30 días. El mensaje, contacto e imágenes no se almacenan en D1. El permiso opcional del host se solicita al enviar y se revoca al terminar.

## Uso limitado de Chrome Web Store

El uso de información recibida mediante las API de Chrome cumple la [Política de Datos de Usuario de Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/limited-use), incluidos los requisitos de Uso limitado. Los datos solo se utilizan para ofrecer o mejorar la finalidad única de la extensión y no se transfieren ni se utilizan para publicidad personalizada, decisiones crediticias o venta a intermediarios de datos.

## Privacidad infantil

La extensión no recopila deliberadamente información personal de ninguna persona, incluidos menores de 13 años.

## Cambios en esta política

Los cambios en esta política se reflejarán en una versión actualizada de la extensión y en esta página.

## Contacto

Si tiene preguntas sobre esta política de privacidad, escriba a: **kscj.ty@gmail.com**
