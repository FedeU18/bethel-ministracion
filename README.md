# 📖 Bethel - Aplicación de Registro de Ministración

Aplicación Electron offline para registrar personas que desean ser ministradas por pastores en eventos de iglesia.

## 🚀 Características

- ✅ **Completamente Offline**: Funciona sin conexión a internet
- ✅ **Base de Datos Local**: SQLite integrado (better-sqlite3)
- ✅ **Interfaz Simple**: HTML, CSS y JavaScript vanilla (sin frameworks)
- ✅ **Segura**: Usa contextBridge de Electron para aislamiento de contexto
- ✅ **Persistencia**: Los datos se guardan localmente en la carpeta `/data`
- ✅ **Multiplataforma**: Diseñada para Windows (fácilmente adaptable a macOS/Linux)

## 📋 Requisitos

- Node.js 14 o superior
- npm 6 o superior
- Windows 7 o superior

## 🔧 Instalación

1. **Clonar/Descargar el proyecto**

   ```bash
   cd bethel-ministracion
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

## ▶️ Ejecutar la Aplicación

```bash
npm start
```

La aplicación se abrirá en una ventana de Electron.

## 📁 Estructura del Proyecto

```
bethel-ministracion/
├── src/
│   ├── main/
│   │   ├── main.js          # Proceso principal de Electron
│   │   └── preload.js       # Script de preload para seguridad
│   ├── renderer/
│   │   ├── index.html       # Interfaz principal
│   │   ├── renderer.js      # Lógica del frontend
│   │   └── styles.css       # Estilos
│   └── database/
│       └── db.js            # Módulo de SQLite
├── data/                     # Carpeta de datos (creada automáticamente)
│   └── ministracion.db       # Base de datos SQLite
├── package.json
└── README.md
```

## 💾 Base de Datos

### Tabla: `personas`

| Campo          | Tipo     | Descripción                             |
| -------------- | -------- | --------------------------------------- |
| id             | INTEGER  | ID único (autoincremental)              |
| apellido       | TEXT     | Apellido de la persona                  |
| nombre         | TEXT     | Nombre de la persona                    |
| fecha_registro | DATETIME | Fecha y hora de registro                |
| estado         | TEXT     | Estado (ej: 'registrado', 'ministrado') |

## 🎯 Funcionalidades Actuales

- ✅ Registrar nuevas personas
- ✅ Visualizar lista de personas registradas
- ✅ Almacenamiento persistente en SQLite
- ✅ Interfaz responsiva
- ✅ Timestamps automáticos

## 🔮 Mejoras Futuras

- [ ] Editar datos de personas
- [ ] Cambiar estado de ministración
- [ ] Exportar datos a Excel/PDF
- [ ] Búsqueda y filtrado de personas
- [ ] Backup automático de base de datos
- [ ] Múltiples eventos simultáneos

## 🔒 Seguridad

- Usa **contextBridge** de Electron para aislamiento seguro de procesos
- NodeIntegration deshabilitado
- remoteModule deshabilitado
- Escapado de HTML para prevenir inyecciones XSS

## 📝 Notas Importantes

- Los datos se guardan en `data/ministracion.db`
- No requiere conexión a internet
- Puede usarse en eventos de múltiples días
- Los datos persisten entre sesiones
- Compatible con Windows

## 🐛 Solución de Problemas

### La aplicación no inicia

1. Verifica que Node.js esté instalado: `node --version`
2. Instala las dependencias nuevamente: `npm install`
3. Elimina `node_modules` y vuelve a instalar

### Error: "MODULE_VERSION 127" vs "MODULE_VERSION 121"

Este error ocurre cuando `better-sqlite3` fue compilado con una versión diferente de Node.js.

**Solución automática:**

```bash
npm install
```

El proyecto está configurado para ejecutar `electron-rebuild` automáticamente después de instalar las dependencias.

**Si aún persiste el error, intenta:**

```bash
npm run rebuild
```

O manualmente:

```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Errores de base de datos

1. Elimina la carpeta `data/` para resetear la BD
2. Reinicia la aplicación (se creará una nueva BD)

## 📧 Contacto

Para soporte técnico, contacta al equipo de desarrollo.

---

**Última actualización**: 6 de febrero de 2026
