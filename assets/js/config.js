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
    rappi: "https://www.rappi.com.mx/restaurantes/1930480041-antojea2"
  },
  business: {
    name: "Antojea2", city: "Querétaro", currency: "MXN", locale: "es-MX",
    hours: "Miércoles a domingo · 5:00 p. m. a 10:00 p. m.",
    serviceNotice: "Por el momento, solo envío a domicilio o recoger."
  },
  // Rutas relativas a la raíz del proyecto, incluso en GitHub Pages.
  pages: { home: "./", menu: "menu/", terms: "menu/#promociones" },
  mapsSearchUrl: "https://www.google.com/maps/search/",
  maps: {
    embed: "https://www.openstreetmap.org/export/embed.html",
    attribution: "https://www.openstreetmap.org/copyright"
  },
  menuImage: "assets/img/menu/menu.png",
  // Agregar únicamente términos reales confirmados, uno por cadena de texto.
  promotionTerms: [
    "Promociones válidas hasta agotar existencias.",
    "Sin restricciones adicionales."
  ]
};
