import { Router } from "express";
import { prisma } from "../config/prisma";

export const quotesRouter = Router();

quotesRouter.get("/", async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, items: true },
    });
    res.json(
      quotes.map((q) => ({
        id: q.id,
        status: q.status,
        client: q.client ? { id: q.client.id, name: q.client.name } : null,
        note: q.note,
        currency: q.currency,
        totalCop: q.precioVentaCop ? q.precioVentaCop.toNumber() : 0,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        items: q.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitCop: i.unitCop.toNumber(),
          totalCop: i.totalCop.toNumber(),
        })),
      })),
    );
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

quotesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { client: true, items: true },
    });

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    res.json({
      id: quote.id,
      status: quote.status,
      client: quote.client
        ? {
            id: quote.client.id,
            name: quote.client.name,
            email: quote.client.email,
            phone: quote.client.phone,
            city: quote.client.city,
            address: quote.client.address,
          }
        : null,
      note: quote.note,
      currency: quote.currency,
      totalCop: quote.precioVentaCop ? quote.precioVentaCop.toNumber() : 0,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      items: quote.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitCop: i.unitCop.toNumber(),
        totalCop: i.totalCop.toNumber(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error cargando cotización" });
  }
});

quotesRouter.post("/", async (req, res) => {
  const body = req.body ?? {};
  const clientId = typeof body.clientId === "string" ? body.clientId : null;
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (!clientId) {
    res.status(400).json({ error: "clientId is required" });
    return;
  }

  const safeItems: Array<{
    productId?: string | null;
    name: string;
    quantity?: number;
    unitCop: number;
  }> = Array.isArray(body.items) ? body.items : [];

  const normalizedItems = safeItems
    .filter((i) => typeof i.name === "string" && i.name.trim().length > 0 && typeof i.unitCop === "number")
    .map((i) => {
      const quantity = typeof i.quantity === "number" && i.quantity > 0 ? Math.floor(i.quantity) : 1;
      const unitCop = Number.isFinite(i.unitCop) ? i.unitCop : 0;
      const totalCop = unitCop * quantity;
      const productId = typeof i.productId === "string" && i.productId.trim().length > 0 ? i.productId : null;
      return { productId, name: i.name.trim(), quantity, unitCop, totalCop };
    });

  if (normalizedItems.length === 0) {
    res.status(400).json({ error: "items is required" });
    return;
  }

  const totalCop = normalizedItems.reduce((acc, i) => acc + i.totalCop, 0);

  try {
    const quote = await prisma.quote.create({
      data: {
        status: "DRAFT",
        currency: "COP",
        note,
        clientId,
        precioVentaMode: "manual",
        precioVentaCopManual: totalCop,
        precioVentaCop: totalCop,
        items: {
          create: normalizedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitCop: i.unitCop,
            totalCop: i.totalCop,
          })),
        },
      },
      include: { client: true, items: true },
    });

    res.status(201).json({
      id: quote.id,
      status: quote.status,
      client: quote.client ? { id: quote.client.id, name: quote.client.name } : null,
      note: quote.note,
      currency: quote.currency,
      totalCop: quote.precioVentaCop ? quote.precioVentaCop.toNumber() : 0,
      createdAt: quote.createdAt,
      items: quote.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitCop: i.unitCop.toNumber(),
        totalCop: i.totalCop.toNumber(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando cotización" });
  }
});

