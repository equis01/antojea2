"use strict";

// Animación de bienvenida de 1.5 segundos, independiente de imágenes lentas.
function showLoader() {
  const loader = document.createElement("div");
  loader.className = "site-loader";
  loader.setAttribute("role", "status");
  loader.innerHTML = `<svg viewBox="0 0 80 96" fill="none" aria-hidden="true">
    <g class="blender-jar"><path d="M22 18H57L53 61H27Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M57 24H64Q72 24 68 39Q66 45 55 45" stroke="currentColor" stroke-width="3"/>
    <path d="M22 17H58M29 11H50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M28 38Q39 31 52 38L50 56H30Z" fill="#E65A1F"/>
    <g class="blender-mix" stroke="#F4B000" stroke-width="3" stroke-linecap="round"><path d="M33 43L45 40M36 49L46 47"/></g></g>
    <path d="M27 65H53L59 85H21Z" fill="currentColor"/><circle cx="40" cy="75" r="4" fill="#F4B000"/>
    <path d="M20 89H60" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg><p>Preparando tu antojo…</p>`;
  document.body.append(loader);
  const content = [...document.body.children].filter(node => node !== loader && node.tagName !== "SCRIPT" && !node.inert);
  content.forEach(node => { node.inert = true; });
  const remove = () => {
    loader.remove();
    content.forEach(node => { node.inert = false; });
    clearTimeout(timer);
  };
  const timer = setTimeout(remove, 1500);
  window.addEventListener("pageshow", event => { if (event.persisted) remove(); });
}
showLoader();

// Resolver desde este script evita depender del dominio o del nombre del repositorio.
const SITE_ROOT = new URL("../../", document.currentScript.src);
const Site = {
  url(path) { return new URL(path, SITE_ROOT).href; },
  mapsUrl(location) {
    if (!location) return "";
    const url = new URL(CONFIG.mapsSearchUrl);
    url.searchParams.set("api", "1");
    url.searchParams.set("query", `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`);
    return url.href;
  },
  mapPreviewUrl(location) {
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return "";
    const { latitude, longitude } = location;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return "";
    const url = new URL(CONFIG.maps.embed);
    const bounds = [Math.max(-180, longitude - .004), Math.max(-90, latitude - .0025), Math.min(180, longitude + .004), Math.min(90, latitude + .0025)];
    url.searchParams.set("bbox", bounds.map(value => value.toFixed(6)).join(","));
    url.searchParams.set("layer", "mapnik");
    url.searchParams.set("marker", `${latitude.toFixed(6)},${longitude.toFixed(6)}`);
    return url.href;
  },
  whatsapp(message = CONFIG.whatsappMessage, number = CONFIG.whatsapp) {
    if (!/^\d{10,15}$/.test(number)) return "";
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  },
  externalUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch { return ""; }
  },
  setLinkTarget(anchor, url) {
    const destination = new URL(url, SITE_ROOT);
    const external = ["http:", "https:"].includes(destination.protocol) && destination.origin !== SITE_ROOT.origin;
    if (external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  },
  bindLink(anchor, url) {
    const status = anchor.querySelector("[data-link-status]");
    if (!url) {
      anchor.removeAttribute("href");
      anchor.setAttribute("aria-disabled", "true");
      if (status) status.textContent = "Pendiente de enlace";
      return;
    }
    anchor.href = url;
    Site.setLinkTarget(anchor, url);
    anchor.removeAttribute("aria-disabled");
    if (status) status.textContent = "Ir ↗";
  },
  prepareImage(img) {
    const frame = img.closest("[data-image-frame]");
    const fallback = frame?.querySelector(".image-fallback, .brand-fallback");
    const failed = () => { img.hidden = true; if (fallback) fallback.hidden = false; };
    img.addEventListener("error", failed);
    img.addEventListener("load", () => { img.hidden = false; if (fallback) fallback.hidden = true; });
    if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) failed();
  }
};

document.querySelectorAll("[data-link]").forEach(anchor => {
  const key = anchor.dataset.link;
  let url = "";
  if (key === "whatsapp") url = Site.whatsapp();
  else if (key === "whatsappBackup") {
    url = CONFIG.whatsappBackup !== CONFIG.whatsapp ? Site.whatsapp(CONFIG.whatsappMessage, CONFIG.whatsappBackup) : "";
    anchor.hidden = !url;
  }
  else if (Object.hasOwn(CONFIG.pages, key)) url = Site.url(CONFIG.pages[key]);
  else {
    const [group, name] = key.split(".");
    url = Site.externalUrl(CONFIG[group]?.[name]);
  }
  Site.bindLink(anchor, url);
});
document.querySelectorAll("a[href]").forEach(anchor => Site.setLinkTarget(anchor, anchor.href));
document.querySelectorAll("img[data-fallback]").forEach(Site.prepareImage);
document.querySelectorAll("[data-business-hours]").forEach(node => { node.textContent = CONFIG.business.hours; });
document.querySelectorAll("[data-service-notice]").forEach(node => { node.textContent = CONFIG.business.serviceNotice; });

