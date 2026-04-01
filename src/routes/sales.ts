import { Router } from "express";
import { prisma } from "../config/prisma";

export const salesRouter = Router();

salesRouter.get("/", async (req, res) => {
  try {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      items: { take: 1, orderBy: { id: "asc" } },
      payments: { take: 1, orderBy: { paidAt: "desc" } },
    },
  });

  res.json(
    sales.map((s) => ({
      id: s.id,
      client: { id: s.clientId, name: s.client.name },
      producto: s.items[0]?.name ?? null,
      totalCop: s.totalCop.toNumber(),
      paidCop: s.paidCop.toNumber(),
      status: s.status,
      method: s.payments[0]?.method ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  );
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

salesRouter.post("/", async (req, res) => {
  const { clientId, orderId, status, totalCop, paidCop, items, payment } = req.body ?? {};
  if (!clientId || typeof clientId !== "string") {
    res.status(400).json({ error: "clientId is required" });
    return;
  }
  if (typeof totalCop !== "number" || totalCop <= 0) {
    res.status(400).json({ error: "totalCop is required" });
    return;
  }

  const safeItems: Array<{ productId?: string | null; name: string; quantity?: number; unitCop?: number }> = Array.isArray(items)
    ? items
    : [];

  const normalizedItems = safeItems
    .filter((i) => typeof i?.name === "string" && i.name.trim().length > 0)
    .map((i) => {
      const quantity = typeof i.quantity === "number" && i.quantity > 0 ? i.quantity : 1;
      const unitCop = typeof i.unitCop === "number" ? i.unitCop : totalCop;
      return {
        productId: i.productId ?? null,
        name: i.name.trim(),
        quantity,
        unitCop,
        totalCop: unitCop * quantity,
      };
    });

  const sale = await prisma.sale.create({
    data: {
      clientId,
      orderId: orderId ?? null,
      status: status ?? undefined,
      totalCop,
      paidCop: typeof paidCop === "number" ? paidCop : 0,
      items: {
        create: normalizedItems.length
          ? normalizedItems.map((i) => ({
              productId: i.productId,
              name: i.name,
              quantity: i.quantity,
              unitCop: i.unitCop,
              totalCop: i.totalCop,
            }))
          : [{ name: "Venta", quantity: 1, unitCop: totalCop, totalCop }],
      },
      payments: payment
        ? {
            create: {
              method: payment.method ?? undefined,
              amountCop: typeof payment.amountCop === "number" ? payment.amountCop : totalCop,
              note: payment.note ?? null,
            },
          }
        : undefined,
    },
    include: { client: true, items: true, payments: true },
  });

  res.status(201).json({
    id: sale.id,
    client: { id: sale.clientId, name: sale.client.name },
    totalCop: sale.totalCop.toNumber(),
    paidCop: sale.paidCop.toNumber(),
    status: sale.status,
    createdAt: sale.createdAt,
  });
});
