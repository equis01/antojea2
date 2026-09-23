"use strict";

const order = { items: new Map(), fulfillment: "delivery", shipping: null, notes: "", address: "", location: null };
const money = new Intl.NumberFormat(CONFIG.business.locale, { style: "currency", currency: CONFIG.business.currency });
const productList = document.getElementById("products");
const orderStatus = document.getElementById("order-status");
const customizer = document.getElementById("customizer");
const cartDialog = document.getElementById("cart-dialog");
const photoDialog = document.getElementById("photo-dialog");
const customForm = document.getElementById("custom-form");
const quantityInput = document.getElementById("custom-quantity");
const optionFields = new Map();
let editingProduct = null;
let editingKey = null;
let returnToCart = false;
let selectedCategory = "all";
let locationRequest = 0;
let photoZoom = 100;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("dialog-open");
}

function closeDialog(dialog) {
  const restoreCart = dialog === customizer && returnToCart;
  if (dialog === customizer) returnToCart = false;
  dialog.close();
  if (restoreCart) showDialog(cartDialog);
  document.body.classList.toggle("dialog-open", Boolean(document.querySelector("dialog[open]")));
}

function setView(view) {
  document.getElementById("menu-view").hidden = view !== "menu";
  document.getElementById("catalogo").hidden = view !== "order";
  document.querySelectorAll("[data-view]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.view === view));
  });
  if (view === "order" && !productList.children.length) renderProducts(selectedCategory);
}

function renderProducts(category = selectedCategory) {
  selectedCategory = category;
  const categoryOrder = new Map(CATEGORIES.map((item, index) => [item.id, index]));
  const visible = PRODUCTS.filter(product => category === "all" || product.category === category)
    .sort((a, b) => (categoryOrder.get(a.category) ?? CATEGORIES.length) - (categoryOrder.get(b.category) ?? CATEGORIES.length));
  document.querySelectorAll("#categories button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === category)));
  productList.replaceChildren();
  visible.forEach(product => {
    const article = element("article", "product");
    const media = element("div", "product-media");
    media.dataset.imageFrame = "";
    const img = element("img");
    img.alt = product.name;
    img.loading = "lazy";
    img.width = 1254;
    img.height = 1254;
    const fallback = element("p", "image-fallback", "Imagen próximamente");
    fallback.hidden = true;
    const preview = element("button", "photo-trigger");
    preview.type = "button";
    preview.setAttribute("aria-label", `Ampliar imagen de ${product.name}`);
    preview.setAttribute("aria-haspopup", "dialog");
    preview.setAttribute("aria-controls", "photo-dialog");
    preview.append(img);
    preview.addEventListener("click", () => openProductPhoto(product));
    img.addEventListener("error", () => { preview.hidden = true; });
    img.addEventListener("load", () => { preview.hidden = false; });
    media.append(preview, fallback);
    Site.prepareImage(img);
    if (product.image) img.src = product.image;
    else { preview.hidden = true; fallback.hidden = false; }
    const copy = element("div", "product-copy");
    copy.append(element("h3", "", product.name), element("p", "product-description", product.description));
    const bottom = element("div", "product-bottom");
    const button = element("button", "add-button", product.available ? "Elegir" : "Agotado");
    button.type = "button";
    button.disabled = !product.available;
    button.dataset.product = product.id;
    button.setAttribute("aria-label", product.available ? `Personalizar ${product.name}` : `${product.name}: agotado`);
    button.addEventListener("click", () => openCustomizer(product.id));
    bottom.append(element("span", "product-price", money.format(product.price)), button);
    copy.append(bottom);
    article.append(media, copy);
    productList.append(article);
  });
  if (!visible.length) productList.append(element("p", "", "No hay productos en esta categoría."));
  document.getElementById("catalog-status").textContent = `${visible.length} productos para elegir.`;
}

function renderCategories() {
  const nav = document.getElementById("categories");
  const filters = [{ id: "all", name: "Todos" }, ...CATEGORIES];
  filters.forEach(category => {
    const button = element("button", "", category.name);
    button.type = "button";
    button.dataset.category = category.id;
    button.setAttribute("aria-pressed", String(category.id === selectedCategory));
    button.addEventListener("click", () => {
      nav.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      renderProducts(category.id);
    });
    nav.append(button);
  });
}

function updatePhotoZoom(value) {
  photoZoom = Math.min(300, Math.max(100, value));
  const image = document.getElementById("product-photo");
  const viewport = document.getElementById("photo-viewport");
  const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
  const fittedWidth = Math.min(photoDialog.clientWidth, window.innerHeight * .65 * ratio);
  document.getElementById("photo-canvas").style.width = `${fittedWidth * photoZoom / 100}px`;
  document.getElementById("photo-zoom-label").textContent = `${photoZoom}%`;
  document.getElementById("photo-zoom-out").disabled = photoZoom === 100;
  document.getElementById("photo-zoom-in").disabled = photoZoom === 300;
  if (photoZoom === 100) {
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  }
}

function openProductPhoto(product) {
  if (!product.image) return;
  const image = document.getElementById("product-photo");
  image.hidden = false;
  document.getElementById("photo-fallback").hidden = true;
  document.getElementById("photo-title").textContent = product.name;
  image.alt = product.name;
  image.src = product.image;
  showDialog(photoDialog);
  updatePhotoZoom(100);
  photoDialog.scrollTop = 0;
}

// Los grupos vienen del catálogo; no hay precios ni ingredientes sueltos en HTML.
function renderOptionGroup(group, saved) {
  const fieldset = element("fieldset", "option-group");
  fieldset.append(element("legend", "", group.name));
  if (group.hint) {
    const hint = element("p", "muted", group.hint);
    hint.id = `hint-${group.id}`;
    fieldset.append(hint);
    fieldset.setAttribute("aria-describedby", hint.id);
  }
  const inputs = [];
  if (group.type === "fixed") fieldset.append(element("p", "muted", group.text));
  else if (group.type === "single") {
    const select = element("select");
    select.name = group.id;
    select.setAttribute("aria-label", `${group.section}: ${group.name}`);
    select.required = Boolean(group.required);
    const placeholder = element("option", "", "Elige una opción");
    placeholder.value = "";
    select.append(placeholder);
    group.choices.forEach(choice => {
      const option = element("option", "", `${choice.name}${choice.additionalPrice ? ` (+${money.format(choice.additionalPrice)})` : ""}`);
      option.value = choice.id;
      select.append(option);
    });
    select.value = saved?.values[0]?.id ?? group.default ?? "";
    fieldset.append(select);
    inputs.push(select);
  } else {
    group.choices.forEach(choice => {
      const label = element("label", "option-choice");
      const input = element("input");
      input.name = `${group.id}-${choice.id}`;
      input.dataset.choice = choice.id;
      const previous = saved?.values.find(value => value.id === choice.id);
      if (group.type === "multiple") {
        input.type = "checkbox";
        input.checked = Boolean(previous);
      } else {
        input.type = "number";
        input.min = "0";
        input.max = "99";
        input.step = "1";
        input.required = true;
        input.inputMode = "numeric";
        input.value = String(previous?.quantity ?? 0);
      }
      input.setAttribute("aria-label", `${group.section}: ${group.name}, ${choice.name}`);
      label.append(element("span", "", `${choice.name}${choice.additionalPrice ? ` · +${money.format(choice.additionalPrice)}` : ""}`), input);
      fieldset.append(label);
      inputs.push(input);
    });
  }
  optionFields.set(group.id, { group, inputs });
  if (group.type !== "quantity") return fieldset;
  const extras = element("details", "extras-group");
  extras.open = Boolean(saved?.values.length);
  extras.append(element("summary", "", `${group.name} · opcional`), fieldset);
  return extras;
}

function openCustomizer(id, key = null) {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product?.available) return;
  editingProduct = product;
  editingKey = key;
  returnToCart = cartDialog.open;
  if (cartDialog.open) cartDialog.close();
  const line = key ? order.items.get(key) : null;
  document.getElementById("custom-title").textContent = product.name;
  document.getElementById("custom-description").textContent = product.description;
  document.getElementById("custom-error").textContent = "";
  document.getElementById("custom-submit").firstChild.textContent = key ? "Guardar " : "Agregar ";
  quantityInput.value = String(line?.quantity ?? 1);
  const container = document.getElementById("custom-options");
  container.replaceChildren();
  optionFields.clear();
  const sections = new Map();
  product.options.forEach(group => {
    const sectionName = group.section || "Personaliza";
    if (!sections.has(sectionName)) {
      const section = element("details", "option-section");
      section.open = sections.size === 0;
      section.append(element("summary", "", sectionName));
      container.append(section);
      sections.set(sectionName, section);
    }
    sections.get(sectionName).append(renderOptionGroup(group, line?.selectedOptions.find(saved => saved.id === group.id)));
  });
  updateCustomization();
  showDialog(customizer);
  customizer.scrollTop = 0;
}

function readSelections(validate = false) {
  return [...optionFields.values()].map(({ group, inputs }) => {
    let values = [];
    if (group.type === "single") {
      const choice = group.choices.find(item => item.id === inputs[0].value);
      if (choice) values = [{ id: choice.id, quantity: 1 }];
      else if (validate && group.required) throw new Error(`Elige ${group.name.toLowerCase()} en ${group.section}.`);
    } else if (group.type === "multiple") {
      values = inputs.filter(input => input.checked).map(input => ({ id: input.dataset.choice, quantity: 1 }));
      if (validate && values.length > group.max) throw new Error(`Elige hasta ${group.max} opciones de ${group.name.toLowerCase()}.`);
    } else if (group.type === "quantity") {
      inputs.forEach(input => {
        const quantity = Number(input.value);
        if (validate && (!input.value || !Number.isInteger(quantity) || quantity < 0 || quantity > 99)) throw new Error("Usa cantidades enteras de 0 a 99 para los extras.");
        if (Number.isInteger(quantity) && quantity > 0 && quantity <= 99) values.push({ id: input.dataset.choice, quantity });
      });
    }
    return { id: group.id, values };
  });
}

function unitPrice(product, selectedOptions) {
  return product.price + selectedOptions.reduce((total, selection) => {
    const group = product.options.find(option => option.id === selection.id);
    return total + selection.values.reduce((sum, value) => {
      const choice = group?.choices?.find(item => item.id === value.id);
      return sum + (choice?.additionalPrice ?? 0) * value.quantity;
    }, 0);
  }, 0);
}

function updateCustomization() {
  optionFields.forEach(({ group, inputs }) => {
    if (group.type !== "multiple") return;
    const full = inputs.filter(input => input.checked).length >= group.max;
    inputs.forEach(input => { input.disabled = full && !input.checked; });
  });
  const price = unitPrice(editingProduct, readSelections());
  const quantity = Number(quantityInput.value);
  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= 99;
  document.getElementById("custom-total").textContent = validQuantity ? money.format(price * quantity) : "—";
}

function saveCustomization(event) {
  event.preventDefault();
  try {
    if (!editingProduct?.available) throw new Error("Este producto está agotado.");
    const quantity = Number(quantityInput.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Elige una cantidad entre 1 y 99.");
    const selectedOptions = readSelections(true);
    // La preparación completa forma la clave: variantes distintas nunca se mezclan.
    const key = `${editingProduct.id}:${JSON.stringify(selectedOptions)}`;
    const existing = key !== editingKey ? order.items.get(key)?.quantity ?? 0 : 0;
    if (existing + quantity > 99) throw new Error("Puedes agregar hasta 99 unidades de una misma preparación.");
    if (editingKey) order.items.delete(editingKey);
    order.items.set(key, { product: editingProduct, quantity: existing + quantity, selectedOptions });
    renderDraft();
    orderStatus.textContent = `${editingProduct.name}: ${editingKey ? "personalización actualizada" : "agregado a tu pedido"}.`;
    closeDialog(customizer);
  } catch (error) { document.getElementById("custom-error").textContent = error.message; }
}

function optionSections(line) {
  const sections = new Map();
  line.selectedOptions.forEach(selection => {
    const group = line.product.options.find(option => option.id === selection.id);
    if (!group || (group.type === "quantity" && !selection.values.length)) return;
    const values = group.type === "fixed" ? group.text : selection.values.map(value => {
      const choice = group.choices.find(item => item.id === value.id);
      return `${group.type === "quantity" ? `${value.quantity} × ` : ""}${choice.name}${choice.additionalPrice ? ` (+${money.format(choice.additionalPrice * value.quantity)})` : ""}`;
    }).join(", ");
    const section = group.section || "Personalización";
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(`${group.name}: ${values || "Ninguno"}`);
  });
  return sections;
}

function describeOptions(line) {
  const sections = optionSections(line);
  return [...sections].flatMap(([title, values]) => sections.size > 1 ? [`${title}: ${values.join(" · ")}`] : values);
}

function getSubtotal() {
  return [...order.items.values()].reduce((sum, line) => sum + unitPrice(line.product, line.selectedOptions) * line.quantity, 0);
}

function getTotal() { return order.shipping === null ? null : getSubtotal() + order.shipping; }

function mapsUrl() {
  return Site.mapsUrl(order.location);
}

function buildOrderMessage() {
  // Saltos reales CRLF, codificados una sola vez por Site.whatsapp().
  const newline = "\r\n";
  const blocks = [`Hola, ${CONFIG.business.name}. Mi pedido:`];
  order.items.forEach(line => {
    const sections = optionSections(line);
    const details = [...sections].map(([title, values]) => [
      ...(sections.size > 1 ? [title] : []),
      ...values.map(value => `- ${value}`)
    ].join(newline)).join(newline + newline);
    blocks.push([
      `*${line.quantity} × ${line.product.name}*`,
      details,
      `Importe: ${money.format(unitPrice(line.product, line.selectedOptions) * line.quantity)}`
    ].filter(Boolean).join(newline));
  });
  blocks.push(`*Subtotal con extras: ${money.format(getSubtotal())}*`);
  if (order.fulfillment === "pickup") {
    blocks.push("*Entrega: recoger*");
  } else {
    blocks.push([
      "*Entrega: envío a domicilio*",
      order.address.trim(),
      order.location ? `Ubicación:${newline}${mapsUrl()}` : ""
    ].filter(Boolean).join(newline));
  }
  if (order.notes.trim()) blocks.push(`*Observaciones*${newline}${order.notes.trim()}`);
  blocks.push(order.fulfillment === "pickup" ? "Disponibilidad y hora para recoger por confirmar." : "Envío y disponibilidad por confirmar.");
  return blocks.join(newline + newline);
}

function updateOrderLink() {
  const message = buildOrderMessage();
  Site.bindLink(document.getElementById("send-list"), order.items.size ? Site.whatsapp(message) : "");
  const backup = document.getElementById("send-backup");
  const backupUrl = order.items.size && CONFIG.whatsappBackup !== CONFIG.whatsapp ? Site.whatsapp(message, CONFIG.whatsappBackup) : "";
  Site.bindLink(backup, backupUrl);
  backup.hidden = !backupUrl;
}

function renderLocation(busy = false, message = "") {
  const button = document.getElementById("use-location");
  button.disabled = busy;
  button.textContent = busy ? "Obteniendo ubicación…" : order.location ? "Actualizar ubicación" : "Usar mi ubicación";
  const remove = document.getElementById("remove-location");
  remove.hidden = !busy && !order.location;
  remove.textContent = busy ? "Cancelar" : "Quitar ubicación";
  const map = document.getElementById("location-map");
  map.hidden = !order.location;
  Site.bindLink(map, mapsUrl());
  const previewUrl = order.fulfillment === "delivery" ? Site.mapPreviewUrl(order.location) : "";
  const preview = document.getElementById("customer-map");
  document.getElementById("location-preview").hidden = !previewUrl;
  if (previewUrl) {
    if (preview.getAttribute("src") !== previewUrl) preview.src = previewUrl;
  } else preview.removeAttribute("src");
  document.getElementById("location-status").textContent = message;
  updateOrderLink();
}

function clearLocation(message = "") {
  // Invalida respuestas pendientes sin reactivar una ubicación que el usuario quitó.
  locationRequest += 1;
  order.location = null;
  renderLocation(false, message);
}

function requestLocation() {
  if (order.fulfillment !== "delivery") return;
  const requestId = ++locationRequest;
  if (!window.isSecureContext) {
    renderLocation(false, "Para usar tu ubicación, abre el sitio con HTTPS. También puedes escribir la dirección.");
    return;
  }
  if (!navigator.geolocation) {
    renderLocation(false, "Tu navegador no ofrece ubicación. Escribe tu dirección y referencias.");
    return;
  }
  order.location = null;
  renderLocation(true, "Autoriza el acceso a tu ubicación cuando el navegador lo solicite.");
  const failed = error => {
    if (requestId !== locationRequest) return;
    const messages = {
      1: "No se autorizó la ubicación. Puedes escribir tu dirección o cambiar el permiso del navegador.",
      2: "No pudimos obtener tu ubicación. Intenta de nuevo o escribe tu dirección.",
      3: "La ubicación tardó demasiado. Intenta de nuevo o escribe tu dirección."
    };
    renderLocation(false, messages[error.code] || "No se pudo obtener tu ubicación. Escribe tu dirección.");
  };
  try {
    navigator.geolocation.getCurrentPosition(position => {
      if (requestId !== locationRequest) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { failed({ code: 2 }); return; }
      order.location = { latitude, longitude, accuracy };
      const precision = Number.isFinite(accuracy) ? ` Precisión aproximada: ${Math.round(accuracy)} m.` : "";
      renderLocation(false, `Ubicación agregada.${precision} Revisa el punto antes de enviar.`);
    }, failed, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  } catch { failed({ code: 2 }); }
}

function setFulfillment(value) {
  if (!["delivery", "pickup"].includes(value)) return;
  order.fulfillment = value;
  const pickup = value === "pickup";
  order.shipping = pickup ? 0 : null;
  document.querySelectorAll('[name="fulfillment"]').forEach(input => { input.checked = input.value === value; });
  document.getElementById("delivery-details").hidden = pickup;
  document.getElementById("pickup-details").hidden = !pickup;
  document.getElementById("fulfillment-note").textContent = pickup
    ? "Disponibilidad y hora para recoger por confirmar."
    : "Envío y disponibilidad por confirmar.";
  if (pickup) clearLocation();
  else updateOrderLink();
}

function changeQuantity(key, delta) {
  const line = order.items.get(key);
  if (!line || line.quantity + delta > 99) return;
  line.quantity += delta;
  if (line.quantity <= 0) order.items.delete(key);
  renderDraft();
  orderStatus.textContent = "Pedido actualizado.";
  // Restaurar foco después de reconstruir la lista, incluido el último producto.
  const row = [...document.querySelectorAll(".draft-items > li")].find(item => item.dataset.key === key);
  (row?.querySelector(delta > 0 ? ".increase" : ".decrease") || cartDialog.querySelector(".close-button"))?.focus();
}

function renderDraft() {
  const hasItems = order.items.size > 0;
  document.getElementById("cart-bar").hidden = !hasItems;
  document.body.classList.toggle("has-cart", hasItems);
  document.getElementById("cart-empty").hidden = hasItems;
  document.getElementById("cart-details").hidden = !hasItems;
  document.getElementById("cart-actions").hidden = !hasItems;
  const list = document.getElementById("draft-items");
  list.replaceChildren();
  order.items.forEach((line, key) => {
    const item = element("li");
    item.dataset.key = key;
    const heading = element("div", "draft-heading");
    heading.append(element("h3", "", line.product.name), element("strong", "", money.format(unitPrice(line.product, line.selectedOptions) * line.quantity)));
    const options = element("ul", "draft-options");
    describeOptions(line).forEach(description => options.append(element("li", "", description)));
    const controls = element("div", "draft-controls");
    const edit = element("button", "text-button", "Editar");
    edit.type = "button";
    edit.setAttribute("aria-label", `Editar ${line.product.name}`);
    edit.addEventListener("click", () => openCustomizer(line.product.id, key));
    const stepper = element("div", "draft-stepper");
    const minus = element("button", "decrease", "−");
    const plus = element("button", "increase", "+");
    [minus, plus].forEach(button => { button.type = "button"; });
    minus.setAttribute("aria-label", `Quitar una unidad de ${line.product.name}`);
    plus.setAttribute("aria-label", `Agregar una unidad de ${line.product.name}`);
    plus.disabled = line.quantity >= 99;
    minus.addEventListener("click", () => changeQuantity(key, -1));
    plus.addEventListener("click", () => changeQuantity(key, 1));
    stepper.append(minus, element("span", "", String(line.quantity)), plus);
    controls.append(edit, stepper);
    item.append(heading, options, controls);
    list.append(item);
  });
  const subtotal = money.format(getSubtotal());
  document.getElementById("subtotal").textContent = subtotal;
  document.getElementById("cart-subtotal").textContent = subtotal;
  const count = [...order.items.values()].reduce((sum, line) => sum + line.quantity, 0);
  document.getElementById("cart-count").textContent = `(${count})`;
  updateOrderLink();
}

function setupViewer() {
  const img = document.getElementById("menu-image");
  const configuredImage = Site.url(CONFIG.menuImage);
  if (img.src !== configuredImage) img.src = configuredImage;
  const sheet = document.getElementById("menu-sheet");
  const viewport = document.getElementById("menu-viewport");
  const minus = document.getElementById("zoom-out");
  const plus = document.getElementById("zoom-in");
  let zoom = 100;
  function update(value) {
    zoom = Math.min(400, Math.max(100, value));
    sheet.style.width = `${zoom}%`;
    document.getElementById("zoom-label").textContent = `${zoom}%`;
    minus.disabled = zoom === 100;
    plus.disabled = zoom === 400;
    if (zoom === 100) { viewport.scrollTop = 0; viewport.scrollLeft = 0; }
  }
  minus.addEventListener("click", () => update(zoom - 50));
  plus.addEventListener("click", () => update(zoom + 50));
  document.getElementById("zoom-reset").addEventListener("click", () => update(100));
  document.getElementById("viewer-controls").hidden = false;
  update(100);
}

function renderPromotionTerms() {
  const terms = CONFIG.promotionTerms.filter(term => typeof term === "string" && term.trim());
  if (!terms.length) return;
  const list = element("ul");
  terms.forEach(term => list.append(element("li", "", term)));
  document.getElementById("promotion-terms").replaceChildren(list);
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeDialog(document.getElementById(button.dataset.close)));
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("cancel", event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener("close", () => {
    document.body.classList.toggle("dialog-open", Boolean(document.querySelector("dialog[open]")));
  });
});
customForm.addEventListener("submit", saveCustomization);
customForm.addEventListener("input", updateCustomization);
customForm.addEventListener("change", updateCustomization);
// Abrir secciones plegadas antes de que el navegador enfoque un campo obligatorio.
customForm.addEventListener("invalid", event => {
  let parent = event.target.parentElement;
  while (parent && parent !== customForm) { if (parent.tagName === "DETAILS") parent.open = true; parent = parent.parentElement; }
}, true);
document.getElementById("review-order").addEventListener("click", () => showDialog(cartDialog));
document.getElementById("open-contact").addEventListener("click", () => showDialog(document.getElementById("contact-dialog")));
document.getElementById("open-contact").hidden = false;
document.querySelectorAll("[data-contact-number]").forEach(node => {
  const number = CONFIG[node.dataset.contactNumber] || "";
  node.textContent = /^52\d{10}$/.test(number) ? `+52 ${number.slice(2).replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}` : number;
});
document.getElementById("photo-zoom-in").addEventListener("click", () => updatePhotoZoom(photoZoom + 50));
document.getElementById("photo-zoom-out").addEventListener("click", () => updatePhotoZoom(photoZoom - 50));
document.getElementById("photo-reset").addEventListener("click", () => updatePhotoZoom(100));
document.getElementById("product-photo").addEventListener("load", () => { if (photoDialog.open) updatePhotoZoom(photoZoom); });
window.addEventListener("resize", () => { if (photoDialog.open) updatePhotoZoom(photoZoom); });
document.getElementById("clear-list").addEventListener("click", () => {
  order.items.clear();
  order.notes = "";
  order.address = "";
  document.getElementById("order-notes").value = "";
  document.getElementById("delivery-address").value = "";
  clearLocation();
  setFulfillment("delivery");
  renderDraft();
  orderStatus.textContent = "Pedido vacío.";
  cartDialog.querySelector(".close-button").focus();
});
document.getElementById("order-notes").addEventListener("input", event => {
  order.notes = event.target.value;
  updateOrderLink();
});
document.getElementById("delivery-address").addEventListener("input", event => {
  order.address = event.target.value;
  updateOrderLink();
});
document.getElementById("use-location").addEventListener("click", requestLocation);
document.querySelectorAll('[name="fulfillment"]').forEach(input => {
  input.addEventListener("change", () => setFulfillment(input.value));
});
document.getElementById("remove-location").addEventListener("click", () => clearLocation("Ubicación retirada del pedido."));
document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
document.getElementById("view-switch").hidden = false;
setupViewer();
renderCategories();
renderPromotionTerms();
renderDraft();
if (location.hash === "#catalogo") setView("order");
if (location.hash === "#promociones") document.querySelector("#promociones details").open = true;
