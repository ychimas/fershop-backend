import { Router } from "express";
import { prisma } from "../config/prisma";

export const shipmentsRouter = Router();

shipmentsRouter.get("/", async (req, res) => {
  try {
  const shipments = await prisma.shipment.findMany({
    orderBy: { shippedAt: "desc" },
    include: { order: { include: { client: true, items: { take: 1, orderBy: { id: "asc" } } } } },
  });

  res.json(
    shipments.map((s) => ({
      id: s.id,
      orderId: s.orderId,
      orderCode: s.order.code,
      orderStatus: s.order.status,
      clientName: s.order.client.name,
      productName: s.order.items[0]?.name ?? null,
      origin: s.origin,
      destination: s.destination,
      packagesCount: s.packagesCount,
      weightLb: s.weightLb === null ? null : s.weightLb.toNumber(),
      courier: s.courier,
      trackingIntl: s.trackingIntl,
      shippedAt: s.shippedAt,
      estimatedArrival: s.estimatedArrival,
      progressPercent: s.progressPercent,
    })),
  );
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

shipmentsRouter.post("/", async (req, res) => {
  const { orderId, destination, packagesCount, weightLb, courier, trackingIntl, estimatedArrival } = req.body ?? {};
  if (!orderId || typeof orderId !== "string") {
    res.status(400).json({ error: "orderId is required" });
    return;
  }
  if (!destination || typeof destination !== "string") {
    res.status(400).json({ error: "destination is required" });
    return;
  }

  const shipment = await prisma.shipment.create({
    data: {
      orderId,
      destination,
      packagesCount: typeof packagesCount === "number" && packagesCount > 0 ? packagesCount : 1,
      weightLb: typeof weightLb === "number" ? weightLb : null,
      courier: courier ?? null,
      trackingIntl: trackingIntl ?? null,
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
      progressPercent: 0,
    },
  });

  res.status(201).json({
    id: shipment.id,
    orderId: shipment.orderId,
    origin: shipment.origin,
    destination: shipment.destination,
    packagesCount: shipment.packagesCount,
    weightLb: shipment.weightLb === null ? null : shipment.weightLb.toNumber(),
    courier: shipment.courier,
    trackingIntl: shipment.trackingIntl,
    shippedAt: shipment.shippedAt,
    estimatedArrival: shipment.estimatedArrival,
    progressPercent: shipment.progressPercent,
  });
});
