"use strict";

const CATEGORIES = [
  { id: "combos", name: "Combos" },
  { id: "hotcakes", name: "Mini Hotcakes" },
  { id: "frappes", name: "Frappés" }
];

// Precios y opciones del menú vigente. Los combos incluyen leche deslactosada.
const FLAVORS = ["Fresa", "Moka", "Oreo", "Chocolate", "Nutella", "Capuchino"];
const SPREADS = ["Nutella", "Chocolate", "Lechera"];
const TOPPINGS = ["Fresa", "Plátano", "Durazno", "Oreo"];
const choices = (names, price = 0) => names.map((name, index) => ({ id: String(index), name, additionalPrice: price }));

function frappeOptions(prefix = "drink", section = "Tu frappé", combo = false, chooseFlavor = false) {
  const groups = [];
  if (chooseFlavor) groups.push({ id: `${prefix}-flavor`, section, name: "Sabor", type: "single", required: true, choices: choices(FLAVORS) });
  groups.push(
    { id: `${prefix}-milk`, section, name: "Leche", type: "single", required: true, default: "whole", choices: [
      { id: "whole", name: "Entera", additionalPrice: 0 },
      { id: "lactose-free", name: "Deslactosada", additionalPrice: combo ? 0 : 5 }
    ] },
    { id: `${prefix}-cream`, section, name: "Crema batida", type: "single", required: true, default: "with", choices: [
      { id: "with", name: "Con crema", additionalPrice: 0 },
      { id: "without", name: "Sin crema", additionalPrice: 0 }
    ] }
  );
  return groups;
}

function hotcakeOptions(prefix = "hotcakes", section = "Tus mini hotcakes", fixed = false) {
  const groups = fixed ? [
    { id: `${prefix}-recipe`, section, name: "Receta del combo", type: "fixed", text: "Nutella y fresa" }
  ] : [
    { id: `${prefix}-spreads`, section, name: "Untables incluidos", type: "multiple", max: 2, hint: "Elige hasta 2. También puedes dejarlos sin untable.", choices: choices(SPREADS) },
    { id: `${prefix}-toppings`, section, name: "Topping incluido", type: "multiple", max: 1, hint: "Elige 1 o déjalos sin topping.", choices: choices(TOPPINGS) }
  ];
  groups.push(
    { id: `${prefix}-extra-spreads`, section, name: "Untables extra", type: "quantity", hint: "$5 por porción adicional.", choices: choices(SPREADS, 5) },
    { id: `${prefix}-extra-toppings`, section, name: "Toppings extra", type: "quantity", hint: "$10 por porción adicional.", choices: choices(TOPPINGS, 10) }
  );
  return groups;
}

const FRAPPE_OPTIONS = frappeOptions();
const HOTCAKE_OPTIONS = hotcakeOptions();
const FAMILY_OPTIONS = [
  ...Array.from({ length: 4 }, (_, index) => frappeOptions(`drink-${index + 1}`, `Frappé ${index + 1}`, true, true)).flat(),
  ...hotcakeOptions("hotcakes-1", "Mini hotcakes 1 · 15 piezas"),
  ...hotcakeOptions("hotcakes-2", "Mini hotcakes 2 · 15 piezas")
];

// Mantén sincronizados estos precios y assets/img/menu/menu.png.
const PRODUCTS = [
  { id: "FR-FRE", category: "frappes", name: "Frappé de Fresa", description: "Leche y crema batida a tu gusto.", price: 65, image: "../assets/img/products/frappes/fresa.png", available: true, options: FRAPPE_OPTIONS },
  { id: "FR-MOK", category: "frappes", name: "Frappé de Moka", description: "Leche y crema batida a tu gusto.", price: 50, image: "../assets/img/products/frappes/moka.png", available: true, options: FRAPPE_OPTIONS },
  { id: "FR-ORE", category: "frappes", name: "Frappé de Oreo", description: "Leche y crema batida a tu gusto.", price: 65, image: "../assets/img/products/frappes/oreo.png", available: true, options: FRAPPE_OPTIONS },
  { id: "FR-CHO", category: "frappes", name: "Frappé de Chocolate", description: "Leche y crema batida a tu gusto.", price: 60, image: "../assets/img/products/frappes/chocolate.png", available: true, options: FRAPPE_OPTIONS },
  { id: "FR-NUT", category: "frappes", name: "Frappé de Nutella", description: "Leche y crema batida a tu gusto.", price: 60, image: "../assets/img/products/frappes/nutella.png", available: true, options: FRAPPE_OPTIONS },
  { id: "FR-CAP", category: "frappes", name: "Frappé de Capuchino", description: "Leche y crema batida a tu gusto.", price: 55, image: "../assets/img/products/frappes/capuchino.png", available: true, options: FRAPPE_OPTIONS },
  { id: "HC-15", category: "hotcakes", name: "Mini hotcakes · 15 piezas", description: "Incluyen hasta 2 untables y 1 topping.", price: 50, image: "../assets/img/products/hotcakes/nutella-fresa.png", available: true, options: HOTCAKE_OPTIONS },
  { id: "HC-25", category: "hotcakes", name: "Mini hotcakes · 25 piezas", description: "Incluyen hasta 2 untables y 1 topping.", price: 60, image: "../assets/img/products/hotcakes/nutella-fresa.png", available: true, options: HOTCAKE_OPTIONS },
  { id: "HC-35", category: "hotcakes", name: "Mini hotcakes · 35 piezas", description: "Incluyen hasta 2 untables y 1 topping.", price: 70, image: "../assets/img/products/hotcakes/nutella-fresa.png", available: true, options: HOTCAKE_OPTIONS },
  { id: "CO-PAR", category: "combos", name: "Combo pareja", description: "2 frappés de Nutella.", price: 110, image: "../assets/img/combos/pareja.png", available: true, options: [
    ...frappeOptions("drink-1", "Frappé de Nutella 1", true),
    ...frappeOptions("drink-2", "Frappé de Nutella 2", true)
  ] },
  { id: "CO-ANT", category: "combos", name: "Pa’ el antojo", description: "1 frappé de Nutella + 15 mini hotcakes con Nutella y fresa.", price: 100, image: "../assets/img/combos/pa-el-antojo.png", available: true, options: [
    ...frappeOptions("drink", "Frappé de Nutella", true),
    ...hotcakeOptions("hotcakes", "Mini hotcakes · 15 piezas", true)
  ] },
  { id: "CO-FAM", category: "combos", name: "Combo familiar", description: "4 frappés + 2 órdenes de 15 mini hotcakes.", price: 250, image: "../assets/img/combos/familiar.png", available: true, options: FAMILY_OPTIONS }
];

/* Para agregar productos, copia una entrada y usa un id único.
   options soporta single (variantes/tamaños), multiple (incluidos), quantity (extras)
   y fixed (recetas de combos). additionalPrice es el precio por opción o porción.
   available: false muestra Agotado. Las cantidades pertenecen a cada línea del pedido. */
