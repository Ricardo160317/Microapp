import { generateBlueprint } from "./packages/runtime-engine/src/index";

const descripcionRosa =
  "Hola, tengo una panadería en Surquillo. Quiero anotar los pedidos de mis clientas: su nombre, su teléfono, qué me piden, si ya me pagaron y si el pedido ya está listo. Cuando el pedido esté listo, avísame para poder avisarle a la clienta por WhatsApp que ya lo puede recoger.";

async function main() {
  const resultado = await generateBlueprint(descripcionRosa);

  if (resultado.exito) {
    console.log(JSON.stringify(resultado.blueprint, null, 2));
    console.log("✅ Prueba completada");
  } else {
    console.log("Errores:", resultado.errores);
    if (resultado.raw) {
      const raw =
        resultado.raw.length > 500 ? resultado.raw.slice(0, 500) + "..." : resultado.raw;
      console.log("Raw:", raw);
    }
    console.log("❌ Prueba fallida");
  }
}

main();
