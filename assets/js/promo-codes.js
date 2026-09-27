"use strict";

// Solo códigos autorizados. No hay promociones activas hasta agregarlas aquí.
// Campos: code, type (fixed/percent), value, minSubtotal, expires (YYYY-MM-DD o ""), active.
// Un código por pedido; descuento sobre productos con extras, nunca sobre envío.
const PROMO_CODES = [];

const PromoCodes = {
  evaluate(value, subtotal, today) {
    const code = String(value || "").trim().toUpperCase();
    if (!code) return { code: "", discount: 0, error: "" };
    const promo = PROMO_CODES.find(item => item.active === true && item.code === code);
    if (!promo) return { code: "", discount: 0, error: "Este código no está disponible. Revisa cómo está escrito." };
    if (promo.expires && today > promo.expires) return { code: "", discount: 0, error: "Este código ya venció." };
    if (!Number.isFinite(subtotal) || subtotal <= 0 || subtotal < (promo.minSubtotal || 0)) return { code: "", discount: 0, error: `El código requiere al menos $${(promo.minSubtotal || 0).toFixed(2)} en productos.` };
    if (!["fixed", "percent"].includes(promo.type) || !Number.isFinite(promo.value) || promo.value <= 0 || (promo.type === "percent" && promo.value > 100)) return { code: "", discount: 0, error: "Este código no está disponible." };
    const amount = promo.type === "percent" ? subtotal * promo.value / 100 : promo.value;
    return { code, discount: Math.min(Math.round(subtotal * 100), Math.round(amount * 100)) / 100, error: "" };
  }
};
