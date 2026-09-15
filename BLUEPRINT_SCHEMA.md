# Blueprint Schema — MicroApp Forge

Este documento define el **contrato de datos** para MicroApp Forge: la estructura JSON (el "blueprint") que describe una micro-aplicación completa para una PYME peruana. Todo generador de código, toda UI de edición y todo motor de ejecución del sistema deben leer y producir blueprints que cumplan este esquema.

## Reglas del contrato

1. Los nombres de tabla y de campo van en `snake_case`, en español, **sin tildes ni eñes con diacrítico** (ej. `cliente_nombre`, `telefono`, no `teléfono`).
2. Toda tabla debe empezar con el campo `id` (tipo `identificador`) y terminar con el campo `creado_en` (tipo `fecha_hora`). Ambos son gestionados por el sistema: el usuario no los llena a mano.
3. Los tipos de campo disponibles para el usuario son exactamente seis: `texto`, `numero`, `booleano`, `fecha`, `telefono`, `moneda`. Los tipos `identificador` y `fecha_hora` están reservados para `id` y `creado_en`.
4. Toda app tiene una o más tablas y una o más vistas. Cada vista pertenece a exactamente una tabla.
5. Si el dueño del negocio menciona la necesidad de **avisar, notificar o recordar** algo a alguien, el blueprint debe incluir al menos una alerta de WhatsApp (`alertas_whatsapp`).

---

## 1. Esquema JSON (JSON Schema, draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://microappforge.pe/schemas/blueprint.schema.json",
  "title": "MicroApp Forge Blueprint",
  "description": "Contrato de datos que describe una micro-aplicacion generada para una PYME peruana.",
  "type": "object",
  "required": ["nombre_app", "tablas", "vistas"],
  "additionalProperties": false,
  "properties": {
    "nombre_app": {
      "type": "string",
      "minLength": 1,
      "description": "Nombre legible de la aplicacion (puede incluir espacios y tildes, es solo para mostrar en pantalla)."
    },
    "descripcion": {
      "type": "string",
      "description": "Descripcion breve de para que sirve la app. Opcional."
    },
    "tablas": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/definitions/tabla" }
    },
    "vistas": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/definitions/vista" }
    },
    "alertas_whatsapp": {
      "type": "array",
      "description": "Lista de alertas automaticas enviadas por WhatsApp. Obligatoria si el usuario pidio avisar, notificar o recordar algo.",
      "items": { "$ref": "#/definitions/alerta_whatsapp" }
    }
  },
  "definitions": {
    "tabla": {
      "type": "object",
      "required": ["nombre", "campos"],
      "additionalProperties": false,
      "properties": {
        "nombre": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]*$",
          "description": "Nombre de la tabla en snake_case, sin tildes, en espanol."
        },
        "etiqueta": {
          "type": "string",
          "description": "Nombre legible de la tabla para mostrar en pantalla. Opcional."
        },
        "campos": {
          "type": "array",
          "minItems": 3,
          "items": { "$ref": "#/definitions/campo" },
          "description": "El primer campo debe ser 'id' (identificador) y el ultimo 'creado_en' (fecha_hora)."
        }
      }
    },
    "campo": {
      "type": "object",
      "required": ["nombre", "tipo", "obligatorio"],
      "additionalProperties": false,
      "properties": {
        "nombre": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]*$",
          "description": "Nombre del campo en snake_case, sin tildes, en espanol."
        },
        "tipo": {
          "type": "string",
          "enum": [
            "identificador",
            "texto",
            "numero",
            "booleano",
            "fecha",
            "telefono",
            "moneda",
            "fecha_hora"
          ],
          "description": "identificador y fecha_hora son de uso exclusivo del sistema (campos id y creado_en). Los campos definidos por el usuario usan: texto, numero, booleano, fecha, telefono o moneda."
        },
        "obligatorio": {
          "type": "boolean",
          "description": "Si el campo debe llenarse siempre para poder guardar el registro."
        },
        "etiqueta": {
          "type": "string",
          "description": "Nombre legible del campo para mostrar en pantalla. Opcional."
        }
      }
    },
    "vista": {
      "type": "object",
      "required": ["nombre", "tipo", "tabla"],
      "additionalProperties": false,
      "properties": {
        "nombre": {
          "type": "string",
          "description": "Nombre legible de la vista."
        },
        "tipo": {
          "type": "string",
          "enum": ["lista", "formulario"],
          "description": "'lista' muestra varios registros de la tabla; 'formulario' sirve para crear o editar un registro."
        },
        "tabla": {
          "type": "string",
          "description": "Nombre (snake_case) de la tabla asociada a esta vista. Debe existir en 'tablas'."
        },
        "campos_visibles": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Nombres de los campos de la tabla que se muestran en esta vista, en orden. Opcional: si se omite, se muestran todos."
        }
      }
    },
    "alerta_whatsapp": {
      "type": "object",
      "required": ["evento", "condicion", "destinatario", "mensaje"],
      "additionalProperties": false,
      "properties": {
        "evento": {
          "type": "string",
          "enum": ["registro_creado", "registro_actualizado", "campo_cambiado"],
          "description": "Que dispara la alerta: se crea un registro nuevo, se actualiza un registro, o cambia un campo especifico."
        },
        "campo": {
          "type": "string",
          "description": "Nombre del campo que dispara la alerta cuando evento es 'campo_cambiado'. Opcional segun el evento."
        },
        "condicion": {
          "type": "string",
          "description": "Expresion booleana sobre los campos de la tabla que debe cumplirse para enviar la alerta (ej. \"listo == true\")."
        },
        "destinatario": {
          "type": "string",
          "description": "Numero de telefono o referencia a un campo de telefono del registro (ej. \"{{cliente_telefono}}\") a quien se envia el mensaje."
        },
        "mensaje": {
          "type": "string",
          "description": "Texto del mensaje de WhatsApp. Puede incluir referencias a campos del registro con la sintaxis {{nombre_campo}}."
        }
      }
    }
  }
}
```

---

## 2. Ejemplo real: Panadería de Rosa (Surquillo)

Rosa tiene una panadería en Surquillo y quiere registrar pedidos con el nombre del cliente, su teléfono, qué pidió, si ya pagó y si el pedido está listo. Cuando el pedido queda listo, quiere avisarle al cliente por WhatsApp.

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
