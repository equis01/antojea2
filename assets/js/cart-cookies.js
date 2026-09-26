"use strict";

// Solo productos y opciones; nunca teléfono, dirección, coordenadas ni datos bancarios.
const CartCookies = {
  path: new URL("../../", document.currentScript.src).pathname,
  read(name) {
    const pair = document.cookie.split("; ").find(value => value.startsWith(name + "="));
    return pair ? pair.slice(name.length + 1) : "";
  },
  write(name, value, age = 604800) {
    document.cookie = `${name}=${value}; Max-Age=${age}; Path=${this.path}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  },
  enabled() { return this.read("antojea_cart_preference") !== "off"; },
  clear() {
    for (let i = 0; i < 8; i++) this.write(`antojea_cart_${i}`, "", 0);
    this.write("antojea_cart_count", "", 0);
  },
  save(items) {
    if (!this.enabled()) return false;
    if (!items.length) { this.clear(); return true; }
    const raw = encodeURIComponent(JSON.stringify({ version: 1, items }));
    // Mantener las cabeceras HTTP pequeñas para hosting estático.
    if (raw.length > 7000) { this.clear(); return false; }
    const parts = raw.match(/.{1,3500}/g);
    this.clear();
    parts.forEach((part, i) => this.write(`antojea_cart_${i}`, part));
    this.write("antojea_cart_count", String(parts.length));
    return parts.every((part, i) => this.read(`antojea_cart_${i}`) === part);
  },
  load() {
    if (!this.enabled()) return [];
    try {
      const count = Number(this.read("antojea_cart_count"));
      if (!Number.isInteger(count) || count < 1 || count > 2) return [];
      const raw = Array.from({ length: count }, (_, i) => this.read(`antojea_cart_${i}`)).join("");
      const data = JSON.parse(decodeURIComponent(raw));
      return data.version === 1 && Array.isArray(data.items) && data.items.length <= 30 ? data.items : [];
    } catch { this.clear(); return []; }
  },
  disable() { this.clear(); this.write("antojea_cart_preference", "off"); },
  enable() { this.write("antojea_cart_preference", "", 0); }
};
