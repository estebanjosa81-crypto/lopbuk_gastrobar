# media-library — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: gestión centralizada de imágenes del tenant — sube, lista y elimina en Cloudinary
- **Sin tabla DB**: las imágenes viven en Cloudinary, NO en la BD. El módulo es un proxy hacia la API de Cloudinary
- **Upload directo**: el frontend sube directo a Cloudinary con `upload_preset` público para mejor performance — el backend NO maneja el binario
- **Componente**: `ui/cloudinary-upload.tsx` es el widget reutilizable de upload que usan todos los formularios con imagen
- **Archivos**: `media-library.routes.ts`, `ui/cloudinary-upload.tsx` · Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
