import { Router } from "express";
import { prisma } from "../config/prisma";

export const clientsRouter = Router();

clientsRouter.get("/", async (req, res) => {
  try {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      sales: { select: { totalCop: true } },
    },
  });

  const data = clients.map((c) => {
    const totalSpentCop = c.sales.reduce((acc, s) => acc + s.totalCop.toNumber(), 0);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      address: c.address,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      ordersCount: c._count.orders,
      totalSpentCop,
    };
  });

  res.json(data);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

clientsRouter.post("/", async (req, res) => {
  const { name, email, phone, city, address, status } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const client = await prisma.client.create({
    data: {
      name,
      email: email ?? null,
      phone: phone ?? null,
      city: city ?? null,
      address: address ?? null,
      status: status ?? undefined,
    },
  });

  res.status(201).json(client);
});
