# Test Blueprint — Caso Rosa (Panadería, Surquillo)

Este archivo es el caso de prueba de referencia para validar el System Prompt (`SYSTEM_PROMPT.md`) contra el contrato de datos (`BLUEPRINT_SCHEMA.md`). Sirve para probar el motor real cuando se construya: se le da el input exacto y se compara su salida contra el JSON esperado.

---

## Input exacto (lo que escribiría Rosa en la plataforma)

```
Hola, tengo una panadería en Surquillo. Quiero anotar los pedidos de mis clientas: su nombre, su teléfono, qué me piden, si ya me pagaron y si el pedido ya está listo. Cuando el pedido esté listo, avísame para poder avisarle a la clienta por WhatsApp que ya lo puede recoger.
```

---

## JSON esperado como salida

```json
{
  "nombre_app": "Pedidos Panadería Rosa",
  "descripcion": "App para registrar pedidos de la panadería de Rosa en Surquillo y avisar a los clientes por WhatsApp cuando su pedido esté listo.",
  "tablas": [
    {
      "nombre": "pedidos",
      "etiqueta": "Pedidos",
      "campos": [
        {
          "nombre": "id",
          "tipo": "identificador",
          "obligatorio": true
        },
        {
          "nombre": "cliente_nombre",
          "etiqueta": "Nombre del cliente",
          "tipo": "texto",
          "obligatorio": true
        },
        {
          "nombre": "cliente_telefono",
          "etiqueta": "Teléfono del cliente",
          "tipo": "telefono",
          "obligatorio": true
        },
        {
          "nombre": "pedido_detalle",
          "etiqueta": "Qué pidió",
          "tipo": "texto",
          "obligatorio": true
        },
        {
          "nombre": "pagado",
          "etiqueta": "¿Pagó?",
          "tipo": "booleano",
          "obligatorio": true
        },
        {
          "nombre": "listo",
          "etiqueta": "¿Pedido listo?",
          "tipo": "booleano",
          "obligatorio": true
        },
        {
          "nombre": "creado_en",
          "tipo": "fecha_hora",
          "obligatorio": true
        }
      ]
    }
  ],
  "vistas": [
    {
      "nombre": "Lista de pedidos",
      "tipo": "lista",
      "tabla": "pedidos",
      "campos_visibles": [
        "cliente_nombre",
        "pedido_detalle",
        "pagado",
        "listo",
        "creado_en"
      ]
    },
    {
      "nombre": "Nuevo pedido",
      "tipo": "formulario",
      "tabla": "pedidos",
      "campos_visibles": [
        "cliente_nombre",
        "cliente_telefono",
        "pedido_detalle",
        "pagado",
        "listo"
      ]
    }
  ],
  "alertas_whatsapp": [
    {
      "evento": "campo_cambiado",
      "campo": "listo",
      "condicion": "listo == true",
      "destinatario": "{{cliente_telefono}}",
      "mensaje": "Hola {{cliente_nombre}}, tu pedido (\"{{pedido_detalle}}\") ya está listo para recoger en la panadería. ¡Te esperamos!"
    }
  ]
}
```

---

## Checklist de validación

Al comparar la salida real del motor contra este esperado, verificar:

- [ ] La respuesta es JSON válido y nada más (sin ```json, sin texto antes/después).
- [ ] Todos los nombres de tabla y campo están en snake_case, sin tildes.
- [ ] La tabla `pedidos` empieza con `id` (tipo `identificador`) y termina con `creado_en` (tipo `fecha_hora`).
- [ ] Los campos definidos por el usuario solo usan: `texto`, `numero`, `booleano`, `fecha`, `telefono`, `moneda`.
- [ ] Existe al menos una vista de tipo `lista` y una de tipo `formulario`, ambas asociadas a `pedidos`.
- [ ] `alertas_whatsapp` no está vacío, porque el input contiene la palabra "avísame" (dispara la regla de alerta obligatoria).
- [ ] La alerta usa `{{cliente_telefono}}` como destinatario y un mensaje en tuteo.
