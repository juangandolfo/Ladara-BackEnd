# Contrato frontend: dashboard administrativo

> Propuesta acordada para implementar. Estos endpoints todavía no están disponibles hasta completar el backend.

## Dashboard

`GET /api/analytics/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`

Requiere bearer token de un administrador. Las fechas son días calendario inclusivos en la zona horaria configurada del negocio; los timestamps se guardan en UTC. El rango máximo es 366 días. La moneda es UYU.

### Respuesta `200 OK`

```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31", "timezone": "America/Montevideo" },
    "sales": { "currency": "UYU", "confirmedRevenue": 0, "paidOrderCount": 0 },
    "revenueByDay": [
      { "date": "2026-10-01", "revenue": 0, "paidOrderCount": 0 }
    ],
    "monthlyTarget": { "amount": null, "achievedAmount": 0, "completionPercent": null },
    "categorySales": [
      { "categoryId": 1, "categoryName": "Accesorios", "revenue": 0, "unitsSold": 0, "sharePercent": 0 }
    ],
    "activeUsersByCountry": [
      { "country": "UY", "userCount": 0, "sharePercent": 0 }
    ],
    "recentActivity": [
      {
        "id": "event-id",
        "type": "order.payment_confirmed",
        "description": "Pago confirmado",
        "createdAt": "2026-10-12T15:30:00.000Z",
        "actorName": "Nombre del administrador"
      }
    ]
  }
}
```

Las listas son `[]` cuando no hay resultados. `revenueByDay` incluye todos los días del rango, incluso los que tienen ventas en cero. `monthlyTarget.amount` es `null` si no existe meta; `completionPercent` es `null` si no hay meta o si la meta configurada es cero. `achievedAmount` sigue siendo el ingreso confirmado del rango. Los porcentajes se expresan de 0 a 100 y se redondean a dos decimales.

### Reglas de cálculo

- **Ventas confirmadas:** pedidos que actualmente tienen estado de pago `paid` y `paidAt` dentro del rango. Se suma el total guardado del pedido, incluidos impuestos y envío. Si un pedido se revierte a impago, deja de contar; no hay historial de reversiones en esta versión.
- **Ingresos diarios:** misma regla, agrupada por fecha local de negocio según `paidAt`.
- **Meta:** se usa la última meta configurada. `achievedAmount` suma ingresos del rango solicitado, incluso si abarca más de un mes. La meta es un valor de referencia vigente, no una meta histórica asociada al período.
- **Categorías:** requiere IDs de categoría y un snapshot de categoría por artículo al realizar checkout. Se distribuye el total de cada pedido pagado proporcionalmente al importe de sus líneas por categoría, incluyendo impuestos y envío; las categorías suman el ingreso confirmado. Las unidades se cuentan desde los artículos. La migración de pedidos anteriores solo puede asignar la categoría actual del producto, no reconstruir la histórica.
- **Clientes por país:** usuarios únicos con pedidos colocados (`checkoutAt` dentro del rango; carritos excluidos). Se asigna cada usuario al país de facturación de su pedido más reciente en el período. `country` es código ISO 3166-1 alpha-2; será `null` si no se puede normalizar el dato histórico. Los porcentajes usan el total de usuarios únicos.
- **Actividad:** hasta 20 eventos del rango, más recientes primero. Se empieza a registrar desde el lanzamiento; no se reconstruye actividad anterior. Tipos previstos: `order.placed`, `order.payment_confirmed`, `order.completed`, `product.created`, `product.updated`, `product.deleted`, `business_setting.updated`. `actorName` solo identifica administradores; para clientes o eventos del sistema será `null`. Las descripciones no deben incluir datos de clientes.
- **No disponibles:** visitantes únicos, tasa de conversión y fuentes de tráfico quedan fuera de esta versión. El frontend no debe estimarlos a partir de pedidos ni mostrar valores inventados.

### Respuestas de error

- `400 Bad Request`: fechas ausentes o inválidas, `from > to`, rango mayor a 366 días, o configuración inválida. El frontend debe mostrar un error de rango/entrada y permitir corregirlo.
- `401 Unauthorized`: token ausente o inválido; el frontend debe iniciar el flujo de autenticación.
- `403 Forbidden`: usuario autenticado sin permisos de administrador; mostrar acceso denegado. El formato del cuerpo puede variar.
- `500 Internal Server Error`: error inesperado; mostrar mensaje genérico y permitir reintentar.

## Configuración del dashboard

Las lecturas requieren autenticación; las escrituras requieren administrador. Las respuestas exitosas usan `{ "success": true, "data": ... }`.

| Método y ruta | Uso desde frontend | Entrada |
| --- | --- | --- |
| `GET /api/settings/monthly-sales-target` | Consultar la meta actual para el formulario. | — |
| `PUT /api/settings/monthly-sales-target` | Guardar la nueva meta; refrescar el dashboard después. | `{ "amount": 250000 }` (UYU, número no negativo). |
| `GET /api/settings/timezone` | Consultar la zona horaria configurada y mostrarla en el selector. | — |
| `PUT /api/settings/timezone` | Guardar una zona IANA válida; los rangos futuros se interpretan con ella. | `{ "timezone": "America/Montevideo" }` |

Respuestas de lectura: `{ "success": true, "data": { "key": "monthlySalesTarget", "value": 250000 } }` y `{ "success": true, "data": { "key": "timezone", "value": "America/Montevideo" } }`. Las escrituras devuelven el mismo formato con el valor persistido. El valor inicial de zona horaria es `America/Montevideo`; si no hay meta, la lectura devuelve `value: null`.

Las escrituras inválidas devuelven `400`; token ausente/inválido devuelve `401`; usuario no administrador devuelve `403`. El frontend debe validar para dar feedback inmediato, pero el backend es la autoridad y debe volver a validar.

## Qué gestiona cada lado

**Frontend**

- Elegir/enviar `from` y `to`, consumir las respuestas y presentar errores/estados vacíos.
- Mostrar importes como UYU y porcentajes recibidos; no recalcular agregados ni inferir métricas no instrumentadas.
- Permitir consultar y editar meta y zona horaria solo a administradores; validar el formulario para UX y luego guardar con los endpoints indicados.
- Tratar `null` como dato no disponible y listas vacías como ausencia de resultados; no reemplazar `null` por cero.
- Seguir enviando la categoría del producto como texto por los endpoints de producto existentes; no crear ni administrar IDs de categoría. El backend resuelve el ID y captura snapshots al checkout.

**Backend**

- Autenticar y autorizar; validar rango, calcular agregados en la zona configurada y devolver la forma definida.
- Persistir categorías y snapshots históricos de artículos, normalizar países, metas, zona horaria y eventos de actividad mediante migraciones donde corresponda.
- Aplicar las reglas de ingresos, clientes, porcentajes y privacidad; no exponer datos de clientes.
- No proporcionar visitantes, conversión ni fuentes hasta implementar analítica real junto al frontend.
