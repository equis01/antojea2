"use strict";

// Fechas civiles del negocio, independientes de la zona horaria del teléfono.
const Schedule = {
  localNow(now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: CONFIG.schedule.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(now).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  },
  options(now = new Date()) {
    const local = this.localNow(now);
    const today = new Date(`${local.date}T12:00:00Z`);
    const open = CONFIG.schedule.days.includes(today.getUTCDay()) && local.time >= CONFIG.schedule.opensAt && local.time < CONFIG.schedule.closesAt;
    const options = open ? [{ value: "now", label: "Lo antes posible" }] : [];
    const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    for (let offset = 0; offset < CONFIG.schedule.horizonDays; offset++) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() + offset);
      if (!CONFIG.schedule.days.includes(day.getUTCDay())) continue;
      const date = day.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("es-MX", {
        timeZone: "UTC", weekday: "long", day: "numeric", month: "long"
      }).format(day);
      for (let minute = minutes(CONFIG.schedule.opensAt); minute < minutes(CONFIG.schedule.closesAt); minute += CONFIG.schedule.intervalMinutes) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
        if (offset === 0 && time <= local.time) continue;
        options.push({ value: `${date}T${time}`, label: `${label} · ${time} h` });
      }
    }
    return { open, options };
  }
};
