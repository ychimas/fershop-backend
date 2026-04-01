import Decimal from "decimal.js";

export type ExtraItemInput = {
  name?: string | null;
  op: "add" | "subtract";
  amountUsd: number | null;
};

export type PricingComputeInput = {
  precioUsdNeto: number | null;
  taxUsaPercent: number | null;
  envioCasilleroUsd: number | null;
  items: ExtraItemInput[];
  trmCopPorUsd: number | null;
  costosLocalesCop: number | null;
  margenDeseadoPercent: number | null;
  precioVentaMode: "auto" | "manual";
  precioVentaCopManual: number | null;
  anticipoMode: "percent" | "amount";
  anticipoPercentInput: number | null;
  anticipoCopInput: number | null;
};

export type PricingComputeOutput = {
  precioConTaxUsd: number;
  extrasUsd: number;
  costoTotalUsd: number;
  costoEnCop: number;
  costoRealTotalCop: number;
  precioVentaCopAuto: number;
  precioVentaCop: number;
  gananciaCop: number;
  margenRealSobreVentaPercent: number;
  anticipoPercent: number;
  anticipoCop: number;
  saldoCop: number;
  capitalPropioCop: number;
  percentCapitalPropioSobreCosto: number;
  markupSobreCostoPercent: number;
  roiSobreMiCapitalPercent: number;
};

const roundTo = (value: Decimal, decimals: number) => {
  return value.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
};

const toN = (value: number | null) => new Decimal(value ?? 0);

const clamp = (value: Decimal, min: Decimal, max: Decimal) => Decimal.min(Decimal.max(value, min), max);

export function computePricing(input: PricingComputeInput): PricingComputeOutput {
  const precioUsdNetoN = toN(input.precioUsdNeto);
  const taxUsaPercentN = toN(input.taxUsaPercent);
  const envioCasilleroUsdN = toN(input.envioCasilleroUsd);
  const trmCopPorUsdN = toN(input.trmCopPorUsd);
  const costosLocalesCopN = toN(input.costosLocalesCop);
  const margenDeseadoPercentN = toN(input.margenDeseadoPercent);

  const precioConTaxUsd = roundTo(
    precioUsdNetoN.mul(new Decimal(1).add(taxUsaPercentN.div(100))),
    2,
  );

  const extrasUsd = roundTo(
    input.items.reduce((acc, item) => {
      const amount = toN(item.amountUsd);
      if (amount.eq(0)) return acc;
      return acc.add(item.op === "add" ? amount : amount.neg());
    }, new Decimal(0)),
    2,
  );

  const costoTotalUsd = roundTo(precioConTaxUsd.add(envioCasilleroUsdN).add(extrasUsd), 2);
  const costoEnCop = roundTo(costoTotalUsd.mul(trmCopPorUsdN), 2);
  const costoRealTotalCop = roundTo(costoEnCop.add(costosLocalesCopN), 2);

  const margen = clamp(margenDeseadoPercentN.div(100), new Decimal(0), new Decimal(0.9999));
  const precioVentaCopAuto = roundTo(costoRealTotalCop.div(new Decimal(1).sub(margen)), 2);

  const precioVentaCop =
    input.precioVentaMode === "manual" && (input.precioVentaCopManual ?? 0) > 0
      ? new Decimal(input.precioVentaCopManual ?? 0)
      : precioVentaCopAuto;

  const gananciaCop = roundTo(precioVentaCop.sub(costoRealTotalCop), 2);
  const margenRealSobreVentaPercent = precioVentaCop.eq(0)
    ? new Decimal(0)
    : roundTo(gananciaCop.div(precioVentaCop).mul(100), 2);

  const anticipoPercentDefault = new Decimal(50);
  const anticipoPercentInputN = input.anticipoPercentInput === null ? anticipoPercentDefault : toN(input.anticipoPercentInput);
  const anticipoCopInputN = toN(input.anticipoCopInput);

  const anticipoPercent =
    input.anticipoMode === "percent"
      ? roundTo(anticipoPercentInputN, 2)
      : precioVentaCop.eq(0)
        ? new Decimal(0)
        : roundTo(anticipoCopInputN.div(precioVentaCop).mul(100), 2);

  const anticipoCop =
    input.anticipoMode === "amount"
      ? roundTo(anticipoCopInputN, 2)
      : roundTo(precioVentaCop.mul(anticipoPercentInputN.div(100)), 2);

  const saldoCop = roundTo(precioVentaCop.sub(anticipoCop), 2);
  const capitalPropioCop = roundTo(Decimal.max(costoRealTotalCop.sub(anticipoCop), 0), 2);
  const percentCapitalPropioSobreCosto = costoRealTotalCop.eq(0)
    ? new Decimal(0)
    : roundTo(capitalPropioCop.div(costoRealTotalCop).mul(100), 2);
  const markupSobreCostoPercent = costoRealTotalCop.eq(0)
    ? new Decimal(0)
    : roundTo(gananciaCop.div(costoRealTotalCop).mul(100), 2);
  const roiSobreMiCapitalPercent = capitalPropioCop.eq(0)
    ? new Decimal(0)
    : roundTo(gananciaCop.div(capitalPropioCop).mul(100), 2);

  return {
    precioConTaxUsd: precioConTaxUsd.toNumber(),
    extrasUsd: extrasUsd.toNumber(),
    costoTotalUsd: costoTotalUsd.toNumber(),
    costoEnCop: costoEnCop.toNumber(),
    costoRealTotalCop: costoRealTotalCop.toNumber(),
    precioVentaCopAuto: precioVentaCopAuto.toNumber(),
    precioVentaCop: roundTo(precioVentaCop, 2).toNumber(),
    gananciaCop: gananciaCop.toNumber(),
    margenRealSobreVentaPercent: margenRealSobreVentaPercent.toNumber(),
    anticipoPercent: anticipoPercent.toNumber(),
    anticipoCop: anticipoCop.toNumber(),
    saldoCop: saldoCop.toNumber(),
    capitalPropioCop: capitalPropioCop.toNumber(),
    percentCapitalPropioSobreCosto: percentCapitalPropioSobreCosto.toNumber(),
    markupSobreCostoPercent: markupSobreCostoPercent.toNumber(),
    roiSobreMiCapitalPercent: roiSobreMiCapitalPercent.toNumber(),
  };
}

