import { Router } from "express";
import { prisma } from "../config/prisma";

export const dashboardRouter = Router();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

dashboardRouter.get("/", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [monthlySalesAgg, ordersActiveCount, shipmentsInTransitCount, activeClientsCount, recentOrders, purchasesInWarehouseCount, deliveredCountThisMonth, ordersCountThisMonth] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: monthStart } },
          _sum: { totalCop: true },
        }),
        prisma.order.count({
          where: {
            status: {
              in: ["QUOTED", "PURCHASED", "IN_TRANSIT", "IN_CUSTOMS", "IN_COLOMBIA"],
            },
          },
        }),
        prisma.shipment.count({
          where: {
            order: { status: { in: ["IN_TRANSIT", "IN_CUSTOMS", "IN_COLOMBIA"] } },
          },
        }),
        prisma.client.count({ where: { status: "ACTIVE" } }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            client: true,
            items: { take: 1, orderBy: { id: "asc" } },
          },
        }),
        prisma.purchase.count({
          where: {
            order: { shipment: null },
          },
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: monthStart },
            status: "DELIVERED",
          },
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: monthStart },
          },
        }),
      ]);

    const monthlySalesCop = monthlySalesAgg._sum.totalCop ? monthlySalesAgg._sum.totalCop.toNumber() : 0;

    const deliveriesCompletedPercent =
      ordersCountThisMonth > 0 ? Math.round((deliveredCountThisMonth / ordersCountThisMonth) * 100) : 0;

    res.json({
      cards: {
        monthlySalesCop,
        ordersActiveCount,
        shipmentsInTransitCount,
        activeClientsCount,
      },
      quick: {
        monthlyGoalPercent: 0,
        deliveriesCompletedPercent,
        deliveredCount: deliveredCountThisMonth,
        ordersCount: ordersCountThisMonth,
        avgDeliveryDays: 0,
        packagesInWarehouseCount: purchasesInWarehouseCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        code: o.code,
        clientName: o.client.name,
        productName: o.items[0]?.name ?? null,
        status: o.status,
        totalCop: o.totalCop === null ? null : o.totalCop.toNumber(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.json({
      cards: {
        monthlySalesCop: 0,
        ordersActiveCount: 0,
        shipmentsInTransitCount: 0,
        activeClientsCount: 0,
      },
      quick: {
        monthlyGoalPercent: 0,
        deliveriesCompletedPercent: 0,
        deliveredCount: 0,
        ordersCount: 0,
        avgDeliveryDays: 0,
        packagesInWarehouseCount: 0,
      },
      recentOrders: [],
    });
  }
});
