# Checklist de intranet

Fecha de corte: lunes 20 de julio de 2026.

## 1. Acceso y consistencia de navegacion

- [x] Normalizar rutas activas de seguridad en plural.
- [x] Mantener aliases de rutas antiguas para no romper accesos existentes.
- [x] Aplicar guard de acceso por sesion real.
- [x] Filtrar menu por permisos visibles y rol administrador.
- [x] Aplicar permisos por accion dentro de botones criticos.

## 2. Observabilidad operativa

- [x] Exponer endpoints de reportes operativos en backend.
- [x] Restringir reportes operativos a administradores.
- [x] Crear pantalla de reportes en intranet para:
  - [x] errores de servicio
  - [x] WhatsApp
  - [x] correos
  - [x] push
- [x] Agregar filtros por rango de fechas.
- [x] Agregar exportacion a Excel/CSV.
- [x] Agregar detalle expandible de `payloadJson` y `stackTrace`.

## 3. Finanzas en intranet

- [x] Preparar `apiUrlFinance` en ambientes.
- [x] Crear una primera seccion `Finanzas > Catalogos` conectada a `finance`.
- [x] Crear `Finanzas > Resumen` con cuentas, balance y movimientos reales.
- [x] Corregir servicios/paginas de finanzas que hoy siguen apuntando a `security`.
- [x] Conectar cuentas, transacciones, categorias y subcategorias con endpoints reales de `finance`.
- [x] Quitar placeholders de finanzas del frontend.

## 4. Dashboard real

- [x] Reemplazar widgets demo por metricas reales.
- [x] Conectar dashboard con analytics/backend.
- [x] Mostrar alertas operativas y actividad reciente.

## 5. Calidad y mantenimiento

- [x] Agregar pruebas del frontend para guards, menu y reportes.
- [x] Ejecutar tests en CI del frontend.
- [ ] Agregar lint en CI del frontend cuando exista script estable.
- [x] Documentar permisos minimos por rol.
- [x] Documentar flujo de soporte y revision de bitacoras.
- [x] Definir y aplicar matriz simple de roles reales.

## Prioridad recomendada

1. Agregar lint en CI del frontend cuando exista script estable.
2. Asignar usuarios reales de produccion a la matriz aplicada.
