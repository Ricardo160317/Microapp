import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { blueprintsRouter } from "./routes/blueprints";
import { registrosRouter } from "./routes/registros";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, servicio: "microapp-forge-core-api" }));

app.use("/auth", authRouter);
app.use("/blueprints", blueprintsRouter);
app.use("/registros", registrosRouter);

const PORT = process.env.CORE_API_PORT ? Number(process.env.CORE_API_PORT) : 3001;
app.listen(PORT, () => {
  console.log(`core-api escuchando en http://localhost:${PORT}`);
});
