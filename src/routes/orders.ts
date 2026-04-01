import { Router } from "express";
import { prisma } from "../config/prisma";

export const ordersRouter = Router();

const statusToStep = (status: string) => {
    if (status === "QUOTED") return 1;
    if (status === "PURCHASED") return 2;
    if (status === "IN_TRANSIT" || status === "IN_CUSTOMS" || status === "IN_COLOMBIA") return 3;
    if (status === "DELIVERED") return 4;
    return 0;
};

ordersRouter.get("/", async (req, res) => {
    try {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            client: true,
            items: { take: 1, orderBy: { id: "asc" } },
        },
    });

    res.json(
        orders.map((o) => ({
            id: o.id,
            code: o.code,
            status: o.status,
            step: statusToStep(o.status),
            client: { id: o.clientId, name: o.client.name },
            producto: o.items[0]?.name ?? null,
            totalUsd: o.totalUsd === null ? null : o.totalUsd.toNumber(),
            totalCop: o.totalCop === null ? null : o.totalCop.toNumber(),
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        })),
    );
    } catch (e) {
        console.error(e);
        res.json([]);
    }
});

ordersRouter.post("/", async (req, res) => {
    const { clientId, quoteId, items, status } = req.body ?? {};
    if (!clientId || typeof clientId !== "string") {
        res.status(400).json({ error: "clientId is required" });
        return;
    }

    const safeItems: Array<{
        productId?: string | null;
        name: string;
        quantity?: number;
        unitUsd?: number | null;
        unitCop?: number | null;
    }> = Array.isArray(items) ? items : [];

    const normalizedItems = safeItems
        .filter((i) => typeof i?.name === "string" && i.name.trim().length > 0)
        .map((i) => {
            const quantity = typeof i.quantity === "number" && i.quantity > 0 ? i.quantity : 1;
            const productId = typeof i.productId === "string" && i.productId.trim().length > 0 ? i.productId : null;
            const unitUsd = typeof i.unitUsd === "number" ? i.unitUsd : null;
            const unitCop = typeof i.unitCop === "number" ? i.unitCop : null;
            const totalUsd = unitUsd === null ? null : unitUsd * quantity;
            const totalCop = unitCop === null ? null : unitCop * quantity;
            return { productId, name: i.name.trim(), quantity, unitUsd, unitCop, totalUsd, totalCop };
        });

    const totalUsd = normalizedItems.reduce((acc, i) => acc + (i.totalUsd ?? 0), 0);
    const totalCop = normalizedItems.reduce((acc, i) => acc + (i.totalCop ?? 0), 0);

    const now = new Date();
    const code = `FS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;

    const order = await prisma.order.create({
        data: {
            code,
            status: status ?? undefined,
            clientId,
            quoteId: quoteId ?? null,
            totalUsd: normalizedItems.length ? totalUsd : null,
            totalCop: normalizedItems.length ? totalCop : null,
            items: {
                create: normalizedItems.map((i) => ({
                    productId: i.productId,
                    name: i.name,
                    quantity: i.quantity,
                    unitUsd: i.unitUsd,
                    unitCop: i.unitCop,
                    totalUsd: i.totalUsd,
                    totalCop: i.totalCop,
                })),
            },
        },
        include: { items: true, client: true },
    });

    res.status(201).json({
        id: order.id,
        code: order.code,
        status: order.status,
        step: statusToStep(order.status),
        client: { id: order.clientId, name: order.client.name },
        totalUsd: order.totalUsd === null ? null : order.totalUsd.toNumber(),
        totalCop: order.totalCop === null ? null : order.totalCop.toNumber(),
        createdAt: order.createdAt,
    });
});

