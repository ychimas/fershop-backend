import { Router } from "express";
import { prisma } from "../config/prisma";

export const settingsRouter = Router();

const allowedBrands = new Set(["orange", "emerald", "blue", "red", "violet", "teal", "rose", "indigo"]);
const defaultBranding = {
  brand: "orange",
  name: "FerShop",
  subtitle: "PERSONAL SHOPPER",
};

async function getSetting(key: string) {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

settingsRouter.get("/brand", async (req, res) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "brand" } });
    const brand = row?.value && allowedBrands.has(row.value) ? row.value : "orange";
    res.json({ brand });
  } catch (e) {
    console.error(e);
    res.json({ brand: "orange" });
  }
});

settingsRouter.put("/brand", async (req, res) => {
  const { brand } = req.body ?? {};
  if (!brand || typeof brand !== "string" || !allowedBrands.has(brand)) {
    res.status(400).json({ error: "brand inválida" });
    return;
  }

  try {
    const saved = await prisma.setting.upsert({
      where: { key: "brand" },
      create: { key: "brand", value: brand },
      update: { value: brand },
    });
    res.json({ brand: saved.value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo guardar la marca" });
  }
});

settingsRouter.get("/branding", async (req, res) => {
  try {
    const [brandValue, nameValue, subtitleValue] = await Promise.all([
      getSetting("brand"),
      getSetting("brand_name"),
      getSetting("brand_subtitle"),
    ]);

    res.json({
      brand: brandValue && allowedBrands.has(brandValue) ? brandValue : defaultBranding.brand,
      name: nameValue?.trim() ? nameValue : defaultBranding.name,
      subtitle: subtitleValue?.trim() ? subtitleValue : defaultBranding.subtitle,
    });
  } catch (e) {
    console.error(e);
    res.json(defaultBranding);
  }
});

settingsRouter.put("/branding", async (req, res) => {
  const { brand, name, subtitle } = req.body ?? {};

  if (!brand || typeof brand !== "string" || !allowedBrands.has(brand)) {
    res.status(400).json({ error: "brand inválida" });
    return;
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name es requerido" });
    return;
  }

  if (subtitle !== undefined && subtitle !== null && typeof subtitle !== "string") {
    res.status(400).json({ error: "subtitle inválido" });
    return;
  }

  try {
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: "brand" },
        create: { key: "brand", value: brand },
        update: { value: brand },
      }),
      prisma.setting.upsert({
        where: { key: "brand_name" },
        create: { key: "brand_name", value: name.trim() },
        update: { value: name.trim() },
      }),
      prisma.setting.upsert({
        where: { key: "brand_subtitle" },
        create: { key: "brand_subtitle", value: subtitle?.trim() || defaultBranding.subtitle },
        update: { value: subtitle?.trim() || defaultBranding.subtitle },
      }),
    ]);

    res.json({
      brand,
      name: name.trim(),
      subtitle: subtitle?.trim() || defaultBranding.subtitle,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo guardar la identidad de marca" });
  }
});
