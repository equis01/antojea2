// Script vinculado a una hoja PRIVADA. Copia products.js como Catalog.gs y promo-codes.js como PromoCodes.gs.
const HEADERS = ["Folio", "Creado", "Canal", "Nombre", "Teléfono", "Modalidad", "Programado", "Detalle", "Subtotal", "Envío", "Descuento", "Total", "Estado", "Pago", "Dirección cliente", "Ubicación cliente", "Observaciones", "Método de pago", "Correo", "Código de promoción"];
const STATES = ["Pendiente", "Confirmado", "Preparando", "Entregado", "Cancelado"];
const PAYMENTS = ["Pendiente", "Pagado", "Reembolsado"];
const HOURS = { zone: "America/Mexico_City", days: [3, 4, 5, 6, 0], opens: "16:30", closes: "22:30" };

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Antojea2")
    .addItem("Preparar hojas", "setup")
    .addItem("Registrar venta manual", "manualSale")
    .addItem("Actualizar resumen y clientes", "refreshReports").addToUi();
}

function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", book.getId());
  book.setSpreadsheetTimeZone(HOURS.zone);
  const sheet = book.getSheetByName("Pedidos") || book.insertSheet("Pedidos");
  if (!sheet.getLastRow()) sheet.appendRow(HEADERS);
  // Agregar columnas al final sin desplazar pedidos de versiones anteriores.
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (existing.some((value, index) => value !== HEADERS[index] && !(index >= 17 && value === ""))) throw new Error("La hoja Pedidos tiene columnas distintas. Usa una hoja nueva.");
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sheet.getRange("B2:B").setNumberFormat("yyyy-mm-dd hh:mm");
  sheet.getRange("E2:E").setNumberFormat("@");
  sheet.getRange("I2:L").setNumberFormat('"$"#,##0.00');
  sheet.getRange("M2:M").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATES, true).setAllowInvalid(false).build());
  sheet.getRange("N2:N").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PAYMENTS, true).setAllowInvalid(false).build());
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).createFilter();
  refreshReports();
}

function book_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Ejecuta setup primero.");
  return SpreadsheetApp.openById(id);
}

function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json_({ ok: false, message: "Solo recepción de solicitudes." }); }

function doPost(event) {
  let lock;
  try {
    const raw = event && event.postData && event.postData.contents;
    if (!raw || raw.length > 45000) throw new Error("Solicitud inválida");
    const input = JSON.parse(raw);
    // El honeypot también se comprueba aquí; ocultarlo en HTML no basta.
    if (typeof input.website !== "string" || input.website !== "") return json_({ ok: false });
    if (!/^([2-9A-HJ-NP-Z]{5}-[2-9A-HJ-NP-Z]{5}|A2-\d{6}-[0-9A-F]{12}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(input.id || "")) throw new Error("Folio inválido");
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = book_().getSheetByName("Pedidos");
    // El mismo folio en principal/respaldo o reintentos solo ocupa una fila.
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(input.id).matchEntireCell(true).findNext()) return json_({ ok: true, id: input.id });
    const valid = validateOrder_(input);
    append_(sheet, [input.id, new Date(), "Web", valid.name, valid.phone, valid.fulfillment, valid.schedule, valid.detail, valid.subtotal,
      valid.fulfillment === "Recoger" ? 0 : "", valid.discount, "", "Pendiente", "Pendiente", valid.address, valid.location, valid.notes, valid.payment, valid.email, valid.promoCode]);
    SpreadsheetApp.flush();
    return json_({ ok: true, id: input.id });
  } catch (_) {
    return json_({ ok: false, message: "No se pudo registrar. Confirma el pedido por WhatsApp." });
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

function text_(value, max) {
  if (typeof value !== "string" || value.length > max) throw new Error("Texto inválido");
  return value.trim();
}
function safeCell_(value) {
  // Evita que un nombre, referencia o nota se convierta en fórmula de Sheets.
  return typeof value === "string" && /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}
function append_(sheet, row) {
  sheet.appendRow(row.map(safeCell_));
  const index = sheet.getLastRow();
  // Sin tarifa confirmada no se publica un total de envío como definitivo.
  sheet.getRange(index, 12).setFormula(`=IF(OR(I${index}="",J${index}=""),"",MAX(0,I${index}+J${index}-K${index}))`);
}

function validSchedule_(value, now) {
  const date = Utilities.formatDate(now, HOURS.zone, "yyyy-MM-dd");
  const time = Utilities.formatDate(now, HOURS.zone, "HH:mm");
  const today = new Date(date + "T12:00:00Z");
  if (value === "now") {
    if (!HOURS.days.includes(today.getUTCDay()) || time < HOURS.opens || time >= HOURS.closes) throw new Error("Fuera de horario");
    return "Lo antes posible · por confirmar";
  }
  const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  for (let offset = 0; offset < 5; offset++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + offset);
    if (!HOURS.days.includes(day.getUTCDay())) continue;
    for (let minute = minutes(HOURS.opens); minute < minutes(HOURS.closes); minute += 35) {
      const slotTime = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      if (offset === 0 && slotTime <= time) continue;
      const slot = day.toISOString().slice(0, 10) + "T" + slotTime;
      if (value === slot) return slot.replace("T", " ") + " · por confirmar";
    }
  }
  throw new Error("Fecha no disponible");
}

function validateOrder_(input) {
  const methods = { cash: "Efectivo", transfer: "Transferencia", card: "Tarjeta sin contacto" };
  if (!Object.prototype.hasOwnProperty.call(methods, input.paymentMethod)) throw new Error("Elige método de pago");
  if (!["delivery", "pickup"].includes(input.fulfillment)) throw new Error("Modalidad inválida");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30) throw new Error("Productos inválidos");
  const customer = input.customer || {};
  const name = text_(customer.name, 80);
  let phone = text_(customer.phone, 20).replace(/[\s()+-]/g, "");
  const email = text_(customer.email || "", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo inválido");
  if (phone && !/^\d{10,15}$/.test(phone)) throw new Error("Teléfono inválido");
  if (/^\d{10}$/.test(phone)) phone = "52" + phone;
  let subtotal = 0;
  const lines = input.items.map(line => {
    const product = PRODUCTS.find(item => item.id === line.productId && item.available);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error("Producto inválido");
    const selections = line.selectedOptions;
    if (!Array.isArray(selections) || selections.length !== product.options.length || new Set(selections.map(s => s.id)).size !== selections.length) throw new Error("Opciones inválidas");
    let unit = product.price;
    const details = product.options.map(group => {
      const selection = selections.find(s => s.id === group.id);
      if (!selection || !Array.isArray(selection.values)) throw new Error("Falta opción");
      const values = selection.values;
      if (new Set(values.map(v => v.id)).size !== values.length) throw new Error("Opción repetida");
      if (group.type === "fixed") {
        if (values.length) throw new Error("Receta fija");
        return `${group.section} / ${group.name}: ${group.text}`;
      }
      if (values.length > group.choices.length || (group.type === "single" && (values.length > 1 || (group.required && values.length !== 1))) || (group.type === "multiple" && values.length > group.max)) throw new Error("Demasiadas opciones");
      const descriptions = values.map(value => {
        const choice = group.choices.find(item => item.id === value.id);
        if (!choice || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 99 || (group.type !== "quantity" && value.quantity !== 1)) throw new Error("Extra inválido");
        unit += choice.additionalPrice * value.quantity;
        return `${value.quantity} × ${choice.name}`;
      });
      return `${group.section} / ${group.name}: ${descriptions.join(", ") || "Ninguno"}`;
    });
    subtotal += unit * line.quantity;
    return `${line.quantity} × ${product.name} — $${(unit * line.quantity).toFixed(2)}\n${details.join("\n")}`;
  });
  const detail = lines.join("\n\n");
  if (detail.length > 45000) throw new Error("Pedido demasiado largo");
  let location = "";
  if (input.fulfillment === "delivery" && input.location !== null) {
    const point = input.location;
    if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) throw new Error("Ubicación inválida");
    location = `https://www.google.com/maps/search/?api=1&query=${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
  }
  const promo = PromoCodes.evaluate(text_(input.promoCode || "", 40), subtotal, Utilities.formatDate(new Date(), HOURS.zone, "yyyy-MM-dd"));
  if (promo.error) throw new Error("Promoción no aplicable");
  return { name, phone, email, promoCode: promo.code, discount: promo.discount, payment: methods[input.paymentMethod], fulfillment: input.fulfillment === "pickup" ? "Recoger" : "Envío", schedule: validSchedule_(input.scheduledFor, new Date()),
    detail, subtotal, address: input.fulfillment === "delivery" ? text_(input.address, 400) : "", location, notes: text_(input.notes, 600) };
}

function manualSale() {
  const ui = SpreadsheetApp.getUi();
  const amount = ui.prompt("Venta manual cobrada", "Importe de productos en MXN, sin envío (ej. 125.50):", ui.ButtonSet.OK_CANCEL);
  if (amount.getSelectedButton() !== ui.Button.OK) return;
  const raw = amount.getResponseText().trim();
  const total = Number(raw);
  if (!/^\d+(\.\d{1,2})?$/.test(raw) || total <= 0 || total > 100000) { ui.alert("Importe inválido."); return; }
  const customer = ui.prompt("Cliente", "Nombre opcional:", ui.ButtonSet.OK_CANCEL);
  if (customer.getSelectedButton() !== ui.Button.OK) return;
  const phone = ui.prompt("Cliente", "Teléfono opcional (10 dígitos o con código de país):", ui.ButtonSet.OK_CANCEL);
  if (phone.getSelectedButton() !== ui.Button.OK) return;
  let number = phone.getResponseText().trim().replace(/[\s()+-]/g, "");
  if (number && !/^\d{10,15}$/.test(number)) { ui.alert("Teléfono inválido."); return; }
  if (/^\d{10}$/.test(number)) number = "52" + number;
  const payment = ui.prompt("Método de pago", "Escribe 1 para efectivo, 2 para transferencia o 3 para tarjeta sin contacto:", ui.ButtonSet.OK_CANCEL);
  if (payment.getSelectedButton() !== ui.Button.OK) return;
  const method = { "1": "Efectivo", "2": "Transferencia", "3": "Tarjeta sin contacto" }[payment.getResponseText().trim()];
  if (!method) { ui.alert("Elige 1, 2 o 3."); return; }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    append_(book_().getSheetByName("Pedidos"), [Utilities.getUuid(), new Date(), "Manual", text_(customer.getResponseText(), 80), number,
      "Recoger", "", "Venta manual · sin desglose", total, 0, 0, "", "Entregado", "Pagado", "", "", "", method, "", ""]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  refreshReports();
}

function refreshReports() {
  const book = book_();
  const source = book.getSheetByName("Pedidos");
  const rows = source.getLastRow() > 1 ? source.getRange(2, 1, source.getLastRow() - 1, HEADERS.length).getValues() : [];
  const sales = rows.filter(row => row[12] === "Entregado" && row[13] === "Pagado" && typeof row[11] === "number");
  const revenue = sales.reduce((sum, row) => sum + row[11], 0);
  const customers = new Map();
  sales.forEach(row => {
    if (!row[4] && !row[18]) return; // No confundir personas con el mismo nombre.
    const key = row[4] ? String(row[4]) : String(row[18]).toLowerCase();
    const record = customers.get(key) || [key, row[3], 0, 0, row[1]];
    record[2]++; record[3] += row[11];
    if (row[1] > record[4]) { record[4] = row[1]; record[1] = row[3]; }
    customers.set(key, record);
  });
  const summary = book.getSheetByName("Resumen") || book.insertSheet("Resumen");
  summary.clearContents();
  const metrics = [["Métrica · histórico completo", "Valor"], ["Actualizado", new Date()], ["Pedidos registrados", rows.length],
    ["Ventas entregadas y pagadas", sales.length], ["Ingresos con envío (MXN)", revenue],
    ["Ticket promedio con envío (MXN)", sales.length ? revenue / sales.length : 0],
    ["Clientes identificados por teléfono o correo", customers.size], ["Clientes con 2+ compras", [...customers.values()].filter(c => c[2] >= 2).length],
    ["Entregados y pagados sin total (revisar envío)", rows.filter(r => r[12] === "Entregado" && r[13] === "Pagado" && typeof r[11] !== "number").length]];
  summary.getRange(1, 1, metrics.length, 2).setValues(metrics);
  const sheet = book.getSheetByName("Clientes") || book.insertSheet("Clientes");
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 5).setValues([["Teléfono o correo", "Nombre", "Compras", "Gasto con envío (MXN)", "Última compra"]]);
  sheet.getRange("A2:A").setNumberFormat("@");
  if (customers.size) sheet.getRange(2, 1, customers.size, 5).setValues([...customers.values()].map(row => row.map(safeCell_)));
  sheet.setFrozenRows(1);
}
