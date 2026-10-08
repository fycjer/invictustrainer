# INVICTUS TRAINER

Juego original con guardado central en Google Apps Script + Google Sheets.

Lee **LEEME-CONEXION-GOOGLE.md**: ejecuta el instalador, publica el script y pega la URL /exec en `config.js`. Sin esa configuración las partidas quedan en una cola local pendiente de sincronización.

Se pide la cédula en cada visita para recuperar perfil, avatar e historial. Se conservan los estilos y reglas originales. Google Sheets almacena todas las partidas finalizadas y permite descargar el informe como Excel; la web comparte las 20 mejores.

Pruebas: `node tests/storage.test.cjs`.
