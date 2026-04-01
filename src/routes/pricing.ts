import { Router } from "express";
import { prisma } from "../config/prisma";
import { computePricing, type PricingComputeInput } from "../services/pricing";

export const pricingRouter = Router();

pricingRouter.post("/compute", async (req, res) => {
  const body = req.body ?? {};
  const input: PricingComputeInput = {
    precioUsdNeto: body.precioUsdNeto ?? null,
    taxUsaPercent: body.taxUsaPercent ?? null,
    envioCasilleroUsd: body.envioCasilleroUsd ?? null,
    items: Array.isArray(body.items) ? body.items : [],
    trmCopPorUsd: body.trmCopPorUsd ?? null,
    costosLocalesCop: body.costosLocalesCop ?? null,
    margenDeseadoPercent: body.margenDeseadoPercent ?? null,
    precioVentaMode: body.precioVentaMode === "manual" ? "manual" : "auto",
    precioVentaCopManual: body.precioVentaCopManual ?? null,
    anticipoMode: body.anticipoMode === "amount" ? "amount" : "percent",
    anticipoPercentInput: body.anticipoPercentInput ?? null,
    anticipoCopInput: body.anticipoCopInput ?? null,
  };

  const output = computePricing(input);
  res.json(output);
});

pricingRouter.post("/quotes", async (req, res) => {
  const body = req.body ?? {};
  const input: PricingComputeInput = {
    precioUsdNeto: body.precioUsdNeto ?? null,
    taxUsaPercent: body.taxUsaPercent ?? null,
    envioCasilleroUsd: body.envioCasilleroUsd ?? null,
    items: Array.isArray(body.items) ? body.items : [],
    trmCopPorUsd: body.trmCopPorUsd ?? null,
    costosLocalesCop: body.costosLocalesCop ?? null,
    margenDeseadoPercent: body.margenDeseadoPercent ?? null,
    precioVentaMode: body.precioVentaMode === "manual" ? "manual" : "auto",
    precioVentaCopManual: body.precioVentaCopManual ?? null,
    anticipoMode: body.anticipoMode === "amount" ? "amount" : "percent",
    anticipoPercentInput: body.anticipoPercentInput ?? null,
    anticipoCopInput: body.anticipoCopInput ?? null,
  };

  const clientId = typeof body.clientId === "string" ? body.clientId : null;
  const createdById = typeof body.createdById === "string" ? body.createdById : null;

  const output = computePricing(input);

  const quote = await prisma.quote.create({
    data: {
      clientId,
      createdById,
      precioUsdNeto: input.precioUsdNeto,
      taxUsaPercent: input.taxUsaPercent,
      envioCasilleroUsd: input.envioCasilleroUsd,
      trmCopPorUsd: input.trmCopPorUsd,
      costosLocalesCop: input.costosLocalesCop,
      margenDeseadoPercent: input.margenDeseadoPercent,
      precioVentaMode: input.precioVentaMode,
      precioVentaCopManual: input.precioVentaCopManual,
      anticipoMode: input.anticipoMode,
      anticipoPercentInput: input.anticipoPercentInput,
      anticipoCopInput: input.anticipoCopInput,
      precioConTaxUsd: output.precioConTaxUsd,
      extrasUsd: output.extrasUsd,
      costoTotalUsd: output.costoTotalUsd,
      costoEnCop: output.costoEnCop,
      costoRealTotalCop: output.costoRealTotalCop,
      precioVentaCopAuto: output.precioVentaCopAuto,
      precioVentaCop: output.precioVentaCop,
      gananciaCop: output.gananciaCop,
      margenRealSobreVentaPercent: output.margenRealSobreVentaPercent,
      anticipoPercent: output.anticipoPercent,
      anticipoCop: output.anticipoCop,
      saldoCop: output.saldoCop,
      capitalPropioCop: output.capitalPropioCop,
      percentCapitalPropioSobreCosto: output.percentCapitalPropioSobreCosto,
      markupSobreCostoPercent: output.markupSobreCostoPercent,
      roiSobreMiCapitalPercent: output.roiSobreMiCapitalPercent,
      extraItems: {
        create: input.items.map((i) => ({
          name: i.name ?? null,
          op: i.op === "subtract" ? "SUBTRACT" : "ADD",
          amountUsd: i.amountUsd ?? null,
        })),
      },
    },
    include: { extraItems: true },
  });

  res.status(201).json(quote);
});

pricingRouter.get("/quotes", async (req, res) => {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, extraItems: true },
  });
  res.json(quotes);
});

