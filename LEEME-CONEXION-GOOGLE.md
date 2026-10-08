# INVICTUS TRAINER — conectar el guardado a Google Sheets

Esta actualización conserva los estilos, recursos, avatares, teclas, niveles y reglas del juego. Cambia la persistencia, el ranking y la identificación por cédula solicitada. No requiere Firebase ni un servidor encendido en tu computador.

**Este es otro proyecto: no subas este ZIP a PASAPORTE-ARCADE ni pegues este script en el backend del Pasaporte o de Finnova.**

## 1. Crear el servidor en Apps Script

1. Entra a https://script.google.com/ con la cuenta que será dueña de los resultados.
2. Pulsa **Nuevo proyecto**. Nómbralo `BACKEND INVICTUS TRAINER`.
3. Abre `Código.gs` (o `Code.gs`), elimina el código de ejemplo y pega TODO el contenido de `google-apps-script/Code.gs` de este paquete.
4. Guarda con Ctrl+S.
5. En el selector de funciones de arriba elige **instalarInvictus** y pulsa **Ejecutar**.
6. Cuando Google lo solicite, pulsa **Revisar permisos**, selecciona tu cuenta y permite el acceso a Google Sheets. Si Google muestra una advertencia de aplicación no verificada para tu propio script, revisa que seas su dueño; la pantalla puede permitir **Configuración avanzada → Ir a BACKEND INVICTUS TRAINER → Permitir**. Si la organización bloquea la autorización, el administrador del dominio debe habilitarla.
7. Abre el **Registro de ejecución**. Verás `Instalación lista. Tu base de datos: https://docs.google.com/spreadsheets/d/...`.
8. Abre ese enlace: la base ya existe, con las pestañas **Jugadores** y **Partidas**. Guarda el enlace. No cambies sus nombres ni los encabezados.

Puedes ejecutar el instalador otra vez: reutiliza el archivo y conserva las filas. No hay que crear previamente un Excel ni copiar datos manualmente. El archivo `appsscript.json` se incluye como referencia opcional del manifiesto; el editor puede detectar los permisos automáticamente sin pegarlo.

## 2. Publicar la API

1. En Apps Script pulsa **Implementar → Nueva implementación**.
2. En el engranaje de tipo selecciona **Aplicación web**.
3. Descripción: `Invictus guardado v2`.
4. **Ejecutar como:** tú, propietario del script.
5. **Quién tiene acceso:** **Cualquier usuario** (incluye personas sin iniciar sesión).
6. Pulsa **Implementar** y autoriza si se solicita.
7. Copia la **URL de la aplicación web** que termina en `/exec`. No uses `/dev`, el ID del script ni la URL del archivo de Sheets.
8. Abre esa URL en una ventana de incógnito. Debe mostrar:

```json
{"ok":true,"service":"INVICTUS TRAINER","version":2}
```

Si pide iniciar sesión, el acceso no es público. Si tu cuenta `apuestasjer.com` no permite elegir acceso público, consulta al administrador del dominio; esta conexión desde GitHub Pages requiere esa opción. No hace falta habilitar APIs de Drive/Cloud ni configurar un consentimiento OAuth externo para este flujo básico.

**No publiques ni compartas la hoja de cálculo con “cualquiera con el enlace”.** El servidor escribe como su propietario. Comparte la hoja solo con las personas encargadas del informe.

## 3. Conectar la página

1. Abre `config.js` de este paquete.
2. Pega la URL anterior entre las comillas de `gasUrl`, así:

```js
window.INVICTUS_CONFIG = Object.freeze({
  gasUrl: 'https://script.google.com/macros/s/TU_IMPLEMENTACION/exec',
  requestTimeoutMs: 25000,
  retryIntervalMs: 60000
});
```

3. Guarda el archivo. La URL es pública; no pegues contraseñas, tokens ni claves de administrador.
4. En GitHub abre el repositorio de **INVICTUS TRAINER** y su pestaña **Code**.
5. Pulsa **Add file → Upload files**. Sube el contenido de la carpeta del proyecto, conservando `js/`, `css/` y `assets/` y dejando `index.html` en la raíz. No subas el ZIP cerrado ni una carpeta exterior extra.
6. Pulsa **Commit changes**. Si Pages ya estaba activo, conserva su configuración.
7. Si no estaba activo: **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**.
8. Revisa **Actions** y espera que termine el despliegue. Entra a la página publicada y pulsa Ctrl+F5.

Archivos cambiados respecto al original: `index.html`, `js/app.js`. Archivos nuevos de conexión: `config.js`, `js/storage.js`, `google-apps-script/Code.gs` y manifiesto. `css/styles.css` y todos los recursos originales se conservan iguales.

## 4. Comprobar que todo está conectado

1. En la página ingresa una cédula de prueba de 5 a 15 dígitos, sin puntos ni espacios, y pulsa **Consultar**. Si es nueva, completa el nombre y elige avatar. Pulsa **Ingresar al sistema**. Abre Sheets: debe aparecer una fila en **Jugadores**.
2. Termina una partida, ganando o perdiendo. Debe aparecer una fila en **Partidas**.
3. Comprueba nombre, puntos, precisión, modo, grado y fecha. También se guardan aciertos, intentos y resultado.
4. Abre la página en otro navegador o dispositivo. **La cédula se pide en cada visita**, aunque se haya usado antes. Consulta la misma cédula: debe recuperar el nombre y el avatar. Después pulsa **Ranking → Mis resultados** para ver todas tus partidas, cantidad total de partidas, victorias y mejor puntaje. **Ranking general** muestra las 20 mejores de todos los jugadores. Puedes cambiar de operador para consultar otra cédula.
5. Prueba otra partida con internet desconectado. El aviso debe indicar que está pendiente; al reconectar se envía automáticamente, siempre que la página esté abierta. También se reintenta al volver a abrir la página. No borres los datos del navegador antes de sincronizar.
6. **Limpiar copia local** solo limpia la copia del ranking: nunca borra las partidas de Sheets ni los envíos pendientes.

Los resultados no se consideran enviados hasta recibir la confirmación de su ID. Si el servidor guardó pero se perdió la respuesta, el reintento usa el mismo ID para evitar duplicar la partida.

## 5. Sacar el Excel

1. Abre el enlace del archivo creado por el instalador.
2. Pulsa **Archivo → Descargar → Microsoft Excel (.xlsx)**.
3. El Excel descargado contiene todas las pestañas y todas las partidas guardadas, aunque el ranking de la página solo muestre 20.

Sheets es la base activa. El `.xlsx` es una exportación en el momento de descargarlo; no se necesita subirlo otra vez para guardar las partidas nuevas.

**Jugadores** contiene IdJugador, Cedula, Nombre, Avatar, FechaRegistro y UltimaActualizacion. La cédula solo está en esta hoja privada; las partidas se vinculan por IdJugador. La API de consulta requiere una cédula exacta y no permite listar todos los jugadores.

### Columnas de Partidas

| Columna | Información |
|---|---|
| IdPartida / IdJugador | Identificadores usados para evitar duplicados y vincular el jugador |
| Nombre / Avatar | Registro del operador |
| Puntaje / PrecisionMostrada | Valores del resultado que ya mostraba el juego |
| Grado / Modo / Resultado | S–D, campaña o examen, victoria/derrota/importado |
| Nivel | Nivel en campaña; 0 en examen |
| AciertosTotales / IntentosTotales / PrecisionTotal | Resumen de toda la partida |
| TiempoPromedioMs / AlcanceTiempoPromedio | Promedio de respuestas correctas que conserva el juego; en campaña corresponde al último nivel, porque el juego original reinicia sus tiempos entre niveles |
| FechaClienteISO / FechaServidor | Hora enviada por el navegador y hora real de recepción en Bogotá |
| FechaHistorica | Texto de fecha del ranking anterior, si se importó |

Las partidas antiguas se importan desde el navegador que las tenía cuando registras tu cédula y el mismo nombre/alias. Solo se pueden recuperar sus mejores 20 registros, pues el original descartaba los demás. Al identificarte por cédula, se importan solo los registros antiguos cuyo nombre/alias coincida con el que ingresaste, para no atribuirte partidas de otras personas. Se marcan IMPORTADO; no se inventan aciertos, intentos ni año de la fecha antigua. La cédula se conserva como texto (incluidos ceros iniciales), y la misma cédula utiliza el mismo IdJugador en cualquier navegador. Si dos personas comparten el mismo alias antiguo, verifica manualmente esos registros importados: el archivo original no tenía cédulas para distinguirlas.

Se conserva cuándo guardaba el original: al ganar o perder. Salir de una partida a mitad de camino no crea un resultado final. No se cambió la mecánica ni se agregó guardado para retomar una ronda incompleta. “Recuperar todo lo del usuario” aquí significa perfil y resultados finalizados, no reanudar una partida interrumpida.

## 6. Actualizar el servidor después

Si modificas `Code.gs`, guarda y entra a **Implementar → Administrar implementaciones → lápiz → Versión: Nueva versión → Implementar**. Así mantienes la URL de `config.js`. Cambiar el código sin actualizar la implementación no cambia la API publicada.

## Problemas habituales

- **“Guardado local · falta conectar Google Sheets”:** falta la URL /exec en `config.js` o no tiene el formato correcto.
- **“Pendiente de envío”:** revisa internet, URL, permisos públicos y que hayas ejecutado el instalador. La cola se conserva para el próximo intento; no limpies el almacenamiento.
- **“Ejecuta instalarInvictus primero”:** ejecútalo desde el editor con tu cuenta; luego revisa la implementación.
- **Error de CORS o respuesta HTML:** abre /exec en incógnito y confirma el JSON. No cambies a `no-cors`: impediría confirmar el guardado. La conexión usa POST de texto sin cabeceras privadas para evitar preflight y sigue las redirecciones de Google.
- **Veo el código anterior:** confirma que subiste al repositorio correcto y que Actions terminó; recarga con Ctrl+F5.
- **No aparece una persona en el mismo instante:** espera la confirmación y comprueba la conexión. La escritura usa bloqueo para evitar colisiones entre solicitudes; Google impone cuotas de Apps Script.

El ranking muestra públicamente los nombres y puntuaciones, como el original. La cédula identifica a la persona, pero no es una contraseña: alguien que conozca una cédula puede consultar su perfil e historial. La cédula no se muestra en el ranking general. No se agregó autenticación porque se solicitó consulta por número; para limitar el historial exclusivamente a su titular haría falta contraseña o verificación adicional. El servidor valida formatos y evita duplicados, pero no puede certificar que un puntaje enviado por un navegador sea auténtico. No hay un endpoint público para borrar la base. Para un uso con resultados oficiales se requeriría autenticación y validación de la partida en el servidor.

Referencias oficiales:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://docs.github.com/en/pages/quickstart

## Validación del paquete

Se incluyen pruebas locales de la cola, reintentos, confirmación, ranking, validación del servidor y deduplicación. Ejecuta `node tests/storage.test.cjs`. Estas pruebas comprueban también recuperación por cédula desde dos sesiones distintas, preservación de ceros y vínculo al mismo jugador. Simulan Google y el navegador: debes realizar la comprobación real del apartado 4 después de configurar tu URL. No se ha publicado ni conectado el paquete a una cuenta Google desde aquí.
