# FixIt - Sistema de Servicios Técnicos Locales

Este proyecto es una aplicación funcional que corre 100% en el lado del cliente utilizando localStorage para la persistencia de datos.

## Requisitos
- Node.js 18+

## Instalación y Ejecución
1. Abrir terminal en la carpeta del proyecto:
   `cd D:\Fixit`
2. Instalar dependencias:
   `npm install`
3. Iniciar servidor de desarrollo:
   `npm run dev`

## Credenciales de Prueba
Para probar la app rápidamente, utiliza estas cuentas:

- **Cliente:**
  - Email: `cliente@test.com`
  - Password: `123456`

- **Técnico:**
  - Email: `tecnico@test.com`
  - Password: `123456`

## Notas Técnicas
- **Persistencia:** Todos los datos (usuarios, solicitudes, chats) se guardan en el `localStorage` del navegador.
- **Limpieza de datos:** Para resetear la aplicación y borrar todos los datos de prueba, abre la consola del navegador (F12) y ejecuta:
  `localStorage.clear()`
  Luego recarga la página.
