# Operacion y mantenimiento de intranet

Fecha de corte: lunes 20 de julio de 2026.

## Permisos minimos por rol

La intranet valida acceso en tres niveles:

- Ruta: el guard bloquea pantallas si la sesion no tiene una opcion con el `path` solicitado.
- Navegacion: el menu solo muestra opciones con `isVisibleNavegacion` habilitado o rol administrador.
- Accion: los botones criticos se muestran solo si la opcion tiene la accion requerida.

Acciones operativas esperadas:

- `Ver Detalle`: permite consultar pantallas y registros.
- `Crear`: habilita formularios o botones de alta.
- `Editar`: habilita cambios, asignaciones, envio de campanas y cambios de permisos.
- `Eliminar`: habilita seleccion masiva y eliminacion de registros.

Matriz final aplicada:

- `ADMINISTRADOR`: acceso total a todas las opciones y acciones.
- `MANTENEDOR`: acceso a `Multitabla` y `Campanas` con `Listar`, `Ver Detalle`, `Crear`, `Editar`, `Eliminar`, `Guardar` y `Exportar`.
- `SOPORTE`: acceso a `Reportes` con `Listar`, `Ver Detalle` y `Exportar`.
- `FINANZAS`: acceso a `Finanzas > Resumen` con `Listar`, `Ver Detalle` y `Exportar`; acceso a `Finanzas > Catalogos` con `Listar`, `Ver Detalle`, `Crear`, `Editar`, `Eliminar`, `Guardar` y `Exportar`.
- `CLIENTE`: sin acceso operativo a intranet; se conserva para la aplicacion cliente/movil.

La matriz se aplica desde el seeder de seguridad del backend. El seeder crea los roles base, las opciones de intranet y los permisos faltantes sin borrar permisos existentes ni reasignar usuarios.

## Flujo de soporte y bitacoras

1. Revisar `Dashboard` para confirmar si hay errores recientes, fallos de mensajeria o variaciones financieras.
2. Entrar a `Seguridad > Reportes` y filtrar por el rango de fechas del incidente.
3. Revisar primero `Errores de servicio`; si existe `stackTrace`, abrir el detalle y copiar el identificador del registro.
4. Si el incidente viene de comunicaciones, revisar `WhatsApp`, `Correos` o `Push` segun el canal afectado.
5. Exportar CSV cuando el caso requiera evidencia o comparacion entre registros.
6. Corregir datos operativos desde el modulo correspondiente, nunca directamente desde la base de datos salvo contingencia aprobada.
7. Registrar en el seguimiento del incidente: fecha, usuario afectado, modulo, endpoint/ruta, ID de log y accion correctiva.

## Criterios de cierre de incidente

- El error ya no aparece al repetir la operacion afectada.
- El log nuevo queda en estado exitoso o no se genera una excepcion nueva.
- Si hubo datos corregidos, el mantenedor responsable valida la pantalla funcional.
- Si hubo cambio de permisos, un administrador valida con un usuario no administrador.

## Controles pendientes recomendados

- Agregar lint en CI cuando exista script estable y dependencias de ESLint completas.
- Revisar usuarios reales de produccion y asignarlos a uno de los roles aplicados.
