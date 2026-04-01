import { Router } from "express";
import { prisma } from "../config/prisma";

export const purchasesRouter = Router();

purchasesRouter.get("/", async (req, res) => {
  try {
  const purchases = await prisma.purchase.findMany({
    orderBy: { purchasedAt: "desc" },
    include: { order: { include: { client: true, items: { take: 1, orderBy: { id: "asc" } } } } },
  });

  res.json(
    purchases.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderCode: p.order.code,
      orderStatus: p.order.status,
      clientName: p.order.client.name,
      productName: p.order.items[0]?.name ?? null,
      storeName: p.storeName,
      trackingUS: p.trackingUS,
      amountUsd: p.amountUsd === null ? null : p.amountUsd.toNumber(),
      purchasedAt: p.purchasedAt,
    })),
  );
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

purchasesRouter.post("/", async (req, res) => {
  const { orderId, storeName, trackingUS, amountUsd } = req.body ?? {};
  if (!orderId || typeof orderId !== "string") {
    res.status(400).json({ error: "orderId is required" });
    return;
  }
  if (!storeName || typeof storeName !== "string") {
    res.status(400).json({ error: "storeName is required" });
    return;
  }

  const purchase = await prisma.purchase.create({
    data: {
      orderId,
      storeName,
      trackingUS: trackingUS ?? null,
      amountUsd: typeof amountUsd === "number" ? amountUsd : null,
    },
  });

  res.status(201).json({
    id: purchase.id,
    orderId: purchase.orderId,
    storeName: purchase.storeName,
    trackingUS: purchase.trackingUS,
    amountUsd: purchase.amountUsd === null ? null : purchase.amountUsd.toNumber(),
    purchasedAt: purchase.purchasedAt,
  });
});
