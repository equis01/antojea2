"use strict";

// Registro opcional. No intercepta la apertura normal del enlace de WhatsApp.
const Orders = {
  snapshot: "", currentId: "", pending: new Set(), saved: new Set(),
  enabled() { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(CONFIG.orders.endpoint); },
  newId() {
    // 50 bits aleatorios, sin 0/O ni 1/I; dos bloques fáciles de dictar.
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    const code = [...crypto.getRandomValues(new Uint8Array(10))].map(byte => alphabet[byte & 31]).join("");
    return `${code.slice(0, 5)}-${code.slice(5)}`;
  },
  identify(payload) {
    const snapshot = JSON.stringify(payload);
    if (snapshot !== this.snapshot) {
      this.snapshot = snapshot;
      this.currentId = this.newId();
    }
    return this.currentId;
  },
  async register(payload, id) {
    if (!this.enabled() || this.pending.has(id) || this.saved.has(id)) return;
    const status = document.getElementById("registration-status");
    const announce = text => { status.hidden = false; status.textContent = text; };
    this.pending.add(id);
    announce("Registrando solicitud… Confirma el envío del mensaje en WhatsApp.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(CONFIG.orders.endpoint, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ ...payload, id, website: document.getElementById("order-website").value }),
        credentials: "omit", redirect: "follow", keepalive: true, signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.id !== id) throw new Error("Registro no confirmado");
      this.saved.add(id);
      announce("Solicitud registrada; pendiente de confirmación por el negocio.");
    } catch {
      announce("No pudimos confirmar el registro. Tu pedido puede atenderse con el mensaje de WhatsApp; no necesitas enviarlo de nuevo.");
    } finally {
      clearTimeout(timer);
      this.pending.delete(id);
    }
  }
};
