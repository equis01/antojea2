"use strict";

// Una consulta al pasar a pago o pulsar Buscar; nunca por cada tecla.
const AddressSearch = {
  cache: new Map(), controller: null, lastRequest: 0,
  cancel() { this.controller?.abort(); this.controller = null; },
  normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); },
  async find(address) {
    this.cancel();
    const key = this.normalize(address);
    if (this.cache.has(key)) return this.cache.get(key);
    const controller = new AbortController();
    this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 1200 - (Date.now() - this.lastRequest))));
      if (controller.signal.aborted) throw new Error("cancelled");
      this.lastRequest = Date.now();
      const config = CONFIG.addressSearch;
      const url = new URL(config.endpoint);
      url.searchParams.set("q", `${address}, Querétaro, México`);
      url.searchParams.set("countrycode", config.country);
      url.searchParams.set("bbox", config.bounds.join(","));
      url.searchParams.set("limit", "5");
      const response = await fetch(url, { signal: controller.signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
      if (!response.ok) throw new Error("Búsqueda no disponible");
      const data = await response.json();
      const results = (Array.isArray(data.features) ? data.features : []).filter(feature => {
        const p = feature.properties || {}, xy = feature.geometry?.coordinates;
        return String(p.countrycode).toUpperCase() === config.country && this.normalize(p.state) === this.normalize(config.state)
          && (p.street || p.type === "street" || p.osm_key === "highway")
          && feature.geometry?.type === "Point" && Array.isArray(xy) && xy.length >= 2 && xy.every(Number.isFinite)
          && xy[0] >= config.bounds[0] && xy[0] <= config.bounds[2] && xy[1] >= config.bounds[1] && xy[1] <= config.bounds[3];
      }).map(feature => {
        const p = feature.properties;
        return { latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0],
          label: [...new Set([p.name, [p.street, p.housenumber].filter(Boolean).join(" "), p.district, p.city, p.postcode, p.state, "México"].filter(Boolean))].join(", ") };
      });
      this.cache.set(key, results);
      if (this.cache.size > 20) this.cache.delete(this.cache.keys().next().value);
      return results;
    } finally {
      clearTimeout(timeout);
      if (this.controller === controller) this.controller = null;
    }
  }
};
