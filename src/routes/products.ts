import { Router } from "express";
import { prisma } from "../config/prisma";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
    try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    const data = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        stock: p.stock,
        imageUrl: p.imageUrl,
        priceUsd: p.priceUsd === null ? null : p.priceUsd.toNumber(),
        priceCop: p.priceCop === null ? null : p.priceCop.toNumber(),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    }));
    res.json(data);
    } catch (e) {
        console.error(e);
        res.json([]);
    }
});

productsRouter.post("/", async (req, res) => {
    const { name, category, description, stock, priceUsd, priceCop, imageUrl } = req.body ?? {};
    if (!name || typeof name !== "string") {
        res.status(400).json({ error: "name is required" });
        return;
    }

    const product = await prisma.product.create({
        data: {
            name,
            category: category ?? undefined,
            description: description ?? null,
            stock: typeof stock === "number" ? stock : 0,
            priceUsd: typeof priceUsd === "number" ? priceUsd : null,
            priceCop: typeof priceCop === "number" ? priceCop : null,
            imageUrl: imageUrl ?? null,
        },
    });

    res.status(201).json({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        stock: product.stock,
        imageUrl: product.imageUrl,
        priceUsd: product.priceUsd === null ? null : product.priceUsd.toNumber(),
        priceCop: product.priceCop === null ? null : product.priceCop.toNumber(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    });
});

productsRouter.patch("/:id/image", async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body ?? {};

    if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
    }

    if (imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== "string") {
        res.status(400).json({ error: "imageUrl must be string or null" });
        return;
    }

    try {
        const product = await prisma.product.update({
            where: { id },
            data: { imageUrl: imageUrl ?? null },
        });

        res.json({
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            stock: product.stock,
            imageUrl: product.imageUrl,
            priceUsd: product.priceUsd === null ? null : product.priceUsd.toNumber(),
            priceCop: product.priceCop === null ? null : product.priceCop.toNumber(),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "No se pudo actualizar la imagen" });
    }
});

