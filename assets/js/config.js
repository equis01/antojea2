"use strict";

// Todos los destinos configurables se editan aquí. Vacío = enlace desactivado.
const CONFIG = {
  whatsapp: "528124215678",
  // Número personal de respaldo, con código de país.
  whatsappBackup: "524421916159",
  whatsappMessage: "Hola, Antojea2. Me gustaría hacer un pedido.",
  social: {
    instagram: "https://www.instagram.com/antojea2/",
    facebook: "https://www.facebook.com/people/Antojea2/61593998056201/",
    tiktok: ""
  },
  delivery: {
    uberEats: "https://www.ubereats.com/queretaro/food-delivery/antojea2-mx/oVXaC5FrTvWvKI7yaI--MQ/",
    didiFood: "https://www.didi-food.com/es-MX/food/store/5764615870786308274/ANTOJEA2",
    rappi: "https://rappi.sng.link/Ev50a/ynhb?pcn=RX_MX_AL_OR_MU_705229_ALL_RES_RAP_ALL_NA_00000&_dl=gbrappi%3A%2F%2Fcom.grability.rappi%3Fstore_type%3Drestaurant%26brand_id%3D705229&_ddl=gbrappi%3A%2F%2Fcom.grability.rappi%3Fstore_type%3Drestaurant%26brand_id%3D705229&_fallback_redirect=https%3A%2F%2Frappi.com.mx%2F&_force_redirect=true"
  },
  business: {
    name: "Antojea2", city: "Querétaro", currency: "MXN", locale: "es-MX",
    hours: "Miércoles a domingo · 4:30 p. m. a 10:30 p. m.",
    serviceNotice: "Por el momento, solo envío a domicilio o recoger."
  },
  // Rutas relativas a la raíz del proyecto, incluso en GitHub Pages.
  schedule: {
    timeZone: "America/Mexico_City",
    days: [3, 4, 5, 6, 0], // Domingo = 0.
    opensAt: "16:30",
    closesAt: "22:30",
    intervalMinutes: 35,
    horizonDays: 5
  },
  // Opcional: URL /exec de Apps Script. Vacía mantiene el pedido solo por WhatsApp.
  orders: { endpoint: "" },
  shippingEstimate: { freeRadiusKm: 0.5, flatRate: 20, maxKm: 3 },
  addressSearch: { endpoint: "https://photon.komoot.io/api/", country: "MX", state: "Querétaro", bounds: [-100.7, 20, -99, 21.75] },
  pickup: {
    address: "C. Lago de Tláhuac 103, Lomas de San Pablo, Querétaro.",
    location: { latitude: 20.6201397, longitude: -100.4049431 }
  },
  payments: {
    transfer: { bank: "Banregio", clabe: "058597000150005643", card: "4741744691835416", account: "850555673", name: "Eduardo Vázquez" }
  },
  pages: { home: "./", menu: "menu/", promotions: "promociones/", terms: "terminos/", cookies: "cookies/" },
  mapsSearchUrl: "https://www.google.com/maps/search/",
  mapsDirectionsUrl: "https://www.google.com/maps/dir/",
  maps: {
    embed: "https://www.openstreetmap.org/export/embed.html",
    attribution: "https://www.openstreetmap.org/copyright"
  },
  menuImage: "assets/img/menu/menu.webp?v=20260929",
  // Agregar únicamente términos reales confirmados, uno por cadena de texto.
  promotionTerms: [
    "Promociones válidas hasta agotar existencias.",
    "Sin restricciones adicionales."
  ]
};
