import { Router } from "express";
import { prisma } from "../config/prisma";

export const reportsRouter = Router();

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

reportsRouter.get("/", async (req, res) => {
  try {
    const since = daysAgo(30);

    const [salesAgg, shipmentsAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { totalCop: true },
      }),
      prisma.shipment.aggregate({
        where: { shippedAt: { gte: since } },
        _sum: { weightLb: true },
      }),
    ]);

    const ingresosTotalesCop = salesAgg._sum.totalCop ? salesAgg._sum.totalCop.toNumber() : 0;
    const volumenImportadoLb = shipmentsAgg._sum.weightLb ? shipmentsAgg._sum.weightLb.toNumber() : 0;

    res.json({
      ingresosTotalesCop,
      volumenImportadoLb,
      margenPromedioPercent: 0,
      ingresosTrendPercent: 0,
      volumenTrendPercent: 0,
    });
  } catch (e) {
    console.error(e);
    res.json({
      ingresosTotalesCop: 0,
      volumenImportadoLb: 0,
      margenPromedioPercent: 0,
      ingresosTrendPercent: 0,
      volumenTrendPercent: 0,
    });
  }
});
