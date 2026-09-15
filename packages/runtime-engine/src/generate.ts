import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { validateBlueprint } from "./validate";

const SYSTEM_PROMPT_PATH = path.resolve(__dirname, "../../../SYSTEM_PROMPT.md");

function leerSystemPrompt(): string {
  const raw = fs.readFileSync(SYSTEM_PROMPT_PATH, "utf-8");
  const partes = raw.split("````");
  return (partes[1] ?? raw).trim();
}

interface OpcionesGenerar {
  modelo?: string;
  temperatura?: number;
}

interface ResultadoGenerar {
  exito: boolean;
  blueprint?: object;
  errores?: string[];
  raw?: string;
}

export async function generateBlueprint(
  descripcion: string,
  opciones?: OpcionesGenerar
): Promise<ResultadoGenerar> {
  const client = new OpenAI({
    baseURL: process.env.IA_BASE_URL,
    apiKey: process.env.IA_API_KEY,
  });

  const modelo = opciones?.modelo ?? process.env.IA_MODELO ?? "deepseek-chat";
  const temperatura = opciones?.temperatura ?? 0.2;
  const systemPrompt = leerSystemPrompt();

  const respuesta = await client.chat.completions.create({
    model: modelo,
    temperature: temperatura,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: descripcion },
    ],
  });

  const raw = respuesta.choices[0]?.message?.content ?? "";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (error: any) {
    return {
      exito: false,
      errores: [`No se pudo parsear la respuesta como JSON: ${error.message}`],
      raw,
    };
  }

  const resultado = validateBlueprint(parsed);
  if (!resultado.valido) {
    return { exito: false, errores: resultado.errores };
  }

  return { exito: true, blueprint: parsed };
}
