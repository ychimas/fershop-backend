import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clientsCount = await prisma.client.count();
  const productsCount = await prisma.product.count();
  const ordersCount = await prisma.order.count();
  const salesCount = await prisma.sale.count();

  if (clientsCount === 0) {
    await prisma.client.createMany({
      data: [
        { name: "María García", email: "maria@email.com", phone: "+57 300 123 4567", city: "Bogotá", status: "ACTIVE" },
        { name: "Carlos Ruiz", email: "carlos@email.com", phone: "+57 311 987 6543", city: "Medellín", status: "ACTIVE" },
        { name: "Ana López", email: "ana@email.com", phone: "+57 320 456 7890", city: "Cali", status: "ACTIVE" },
        { name: "Pedro Sánchez", email: "pedro@email.com", phone: "+57 315 321 0987", city: "Barranquilla", status: "INACTIVE" },
        { name: "Laura Díaz", email: "laura@email.com", phone: "+57 318 654 3210", city: "Cartagena", status: "ACTIVE" },
      ],
      skipDuplicates: true,
    });
  }

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });

  if (productsCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: "Nike Air Max 90", category: "FOOTWEAR", stock: 3, priceUsd: 120, priceCop: 620000 },
        { name: "MacBook Air M3", category: "TECHNOLOGY", stock: 1, priceUsd: 1099, priceCop: 5200000 },
        { name: "Coach Tabby Bag", category: "ACCESSORIES", stock: 2, priceUsd: 195, priceCop: 890000 },
        { name: "PS5 Slim", category: "TECHNOLOGY", stock: 0, priceUsd: 449, priceCop: 2100000 },
        { name: "Ray-Ban Wayfarer", category: "ACCESSORIES", stock: 5, priceUsd: 85, priceCop: 420000 },
      ],
    });
  }

  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });

  if (ordersCount === 0 && clients.length && products.length) {
    const order1 = await prisma.order.create({
      data: {
        code: `FS-${new Date().getFullYear()}-000001`,
        status: "IN_TRANSIT",
        clientId: clients[0].id,
        totalUsd: 120,
        totalCop: 620000,
        items: {
          create: [
            {
              productId: products[0].id,
              name: products[0].name,
              quantity: 1,
              unitUsd: 120,
              unitCop: 620000,
              totalUsd: 120,
              totalCop: 620000,
            },
          ],
        },
      },
    });

    const order2 = await prisma.order.create({
      data: {
        code: `FS-${new Date().getFullYear()}-000002`,
        status: "PURCHASED",
        clientId: clients[1].id,
        totalUsd: 1099,
        totalCop: 5200000,
        items: {
          create: [
            {
              productId: products[1].id,
              name: products[1].name,
              quantity: 1,
              unitUsd: 1099,
              unitCop: 5200000,
              totalUsd: 1099,
              totalCop: 5200000,
            },
          ],
        },
      },
    });

    await prisma.purchase.createMany({
      data: [
        { orderId: order1.id, storeName: "Nike.com", trackingUS: "1Z999AA10123456789", amountUsd: 120 },
        { orderId: order2.id, storeName: "Apple Store", trackingUS: "1Z999AA10987654321", amountUsd: 1099 },
      ],
    });

    await prisma.shipment.createMany({
      data: [
        {
          orderId: order1.id,
          destination: clients[0].city ?? "Bogotá",
          packagesCount: 1,
          weightLb: 8.5,
          courier: "DHL",
          trackingIntl: "INT-0001",
          progressPercent: 60,
        },
      ],
    });
  }

  if (salesCount === 0 && clients.length && products.length) {
    await prisma.sale.create({
      data: {
        clientId: clients[0].id,
        totalCop: 620000,
        paidCop: 620000,
        status: "PAID",
        items: {
          create: [
            {
              productId: products[0].id,
              name: products[0].name,
              quantity: 1,
              unitCop: 620000,
              totalCop: 620000,
            },
          ],
        },
        payments: {
          create: { method: "TRANSFER", amountCop: 620000, note: "Pago completo" },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });

