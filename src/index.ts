import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clientsRouter } from "./routes/clients";
import { ordersRouter } from "./routes/orders";
import { pricingRouter } from "./routes/pricing";
import { productsRouter } from "./routes/products";
import { purchasesRouter } from "./routes/purchases";
import { salesRouter } from "./routes/sales";
import { shipmentsRouter } from "./routes/shipments";
import { dashboardRouter } from "./routes/dashboard";
import { reportsRouter } from "./routes/reports";
import { settingsRouter } from "./routes/settings";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "FerShop API is running" });
});

app.use("/api/v1/clients", clientsRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/purchases", purchasesRouter);
app.use("/api/v1/shipments", shipmentsRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/pricing", pricingRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/settings", settingsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
