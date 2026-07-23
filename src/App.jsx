import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar, Clock, Sparkles, Scissors, Users, Package, Wallet,
  TrendingUp, TrendingDown, Plus, X, Check, Lock, ChevronLeft,
  ChevronRight, ChevronDown, Trash2, Pencil, ShoppingBag, User, Settings,
  AlertCircle, CalendarCheck, CircleDollarSign, MessageCircle, Download
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList
} from "recharts";
import { supabase } from "./supabaseClient.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------------------------------------------------------------- */
/* Constantes de dominio                                                   */
/* ---------------------------------------------------------------------- */

const CATEGORIES = [
  { id: "facial", name: "Facial", color: "#6E9179" },
  { id: "manos_pies", name: "Manos y pies", color: "#B97A5D" },
  { id: "pestanas", name: "Pestañas y cejas", color: "#C29A47" },
  { id: "corporal", name: "Corporal", color: "#8779AD" },
  { id: "social", name: "Social", color: "#5C8B9C" },
  { id: "otros", name: "Otros", color: "#948A7C" },
];

// Catálogo real de servicios de The Glam Room (relevado de la lista provista).
// Duración en minutos: estimación editable, ya que la lista original no incluía tiempos.
// Precio en 0: a completar por el local, ya que no se proveyeron precios.
const SEED_SERVICES = [
  // Facial
  { name: "Limpieza facial profunda", categoryId: "facial", duration: 60, price: 0, description: "Limpieza en profundidad de poros, remoción de impurezas y células muertas para una piel renovada." },
  { name: "Sesión de fototerapia LED", categoryId: "facial", duration: 30, price: 0, description: "Tratamiento con luz LED que estimula la piel para mejorar su textura y luminosidad." },
  { name: "Pack de 4 sesiones de fototerapia LED", categoryId: "facial", duration: 30, price: 0, description: "Cuatro sesiones de fototerapia LED para potenciar los resultados con tratamiento continuo." },
  { name: "Sesión de dermaplaning", categoryId: "facial", duration: 45, price: 0, description: "Exfoliación mecánica que retira células muertas y vello facial fino, dejando la piel más luminosa." },
  { name: "Shock de hidratación", categoryId: "facial", duration: 30, price: 0, description: "Tratamiento intensivo de hidratación profunda para pieles resecas o deshidratadas." },
  { name: "Limpieza facial profunda + Dermaplaning", categoryId: "facial", duration: 90, price: 0, description: "Combina limpieza profunda con exfoliación mecánica para una piel renovada y luminosa." },
  { name: "Limpieza facial + Dermapen facial", categoryId: "facial", duration: 75, price: 0, description: "Limpieza facial junto con microagujas para estimular la renovación celular." },
  { name: "Limpieza facial profunda + Shock de hidratación", categoryId: "facial", duration: 75, price: 0, description: "Limpieza en profundidad combinada con hidratación intensiva." },
  { name: "Hidralips", categoryId: "facial", duration: 20, price: 0, description: "Tratamiento hidratante específico para labios resecos o agrietados." },
  { name: "Pack de Hidralips (3 sesiones) + Bálsamo de regalo", categoryId: "facial", duration: 20, price: 0, description: "Tres sesiones de hidratación labial profunda. Incluye un bálsamo de regalo." },
  { name: "Pack de peeling (3 sesiones) + Protector solar de regalo", categoryId: "facial", duration: 30, price: 0, description: "Tres sesiones de peeling para renovar la piel. Incluye protector solar de regalo." },
  // Manos y pies
  { name: "Manicura tradicional", categoryId: "manos_pies", duration: 45, price: 0, description: "Corte, limado y esmaltado clásico de uñas." },
  { name: "Semipermanente liso", categoryId: "manos_pies", duration: 60, price: 0, description: "Esmaltado semipermanente de larga duración sobre uña natural." },
  { name: "Capping liso", categoryId: "manos_pies", duration: 75, price: 0, description: "Refuerzo de la uña natural con una capa protectora y esmaltado semipermanente." },
  { name: "Soft gel", categoryId: "manos_pies", duration: 90, price: 0, description: "Extensión o refuerzo de uñas con gel flexible, de aspecto natural." },
  { name: "Pedicuría | Belleza de pies", categoryId: "manos_pies", duration: 60, price: 0, description: "Cuidado completo de pies: corte, limado, cutículas y esmaltado." },
  { name: "Podología + Semipermanente", categoryId: "manos_pies", duration: 90, price: 0, description: "Tratamiento podológico junto con esmaltado semipermanente." },
  { name: "Remoción por TheGlam", categoryId: "manos_pies", duration: 20, price: 0, description: "Retiro de esmalte semipermanente o gel realizado previamente en el local." },
  { name: "Remoción por colega", categoryId: "manos_pies", duration: 20, price: 0, description: "Retiro de esmalte semipermanente o gel realizado en otro salón." },
  // Pestañas y cejas
  { name: "Perfilado", categoryId: "pestanas", duration: 20, price: 0, description: "Diseño y depilación de cejas para definir su forma." },
  { name: "Laminado", categoryId: "pestanas", duration: 45, price: 0, description: "Alisado y fijación de pestañas o cejas para un efecto más prolijo y voluminoso." },
  { name: "Lifting", categoryId: "pestanas", duration: 45, price: 0, description: "Curvado y fijación de pestañas naturales para un efecto rizado duradero." },
  { name: "Perfilado + Laminado", categoryId: "pestanas", duration: 60, price: 0, description: "Diseño de cejas combinado con laminado para un acabado prolijo." },
  { name: "Perfilado + Lifting", categoryId: "pestanas", duration: 60, price: 0, description: "Diseño de cejas combinado con lifting de pestañas." },
  { name: "Perfilado + Laminado + Lifting", categoryId: "pestanas", duration: 75, price: 0, description: "Tratamiento completo de cejas y pestañas: diseño, laminado y lifting." },
  // Corporal
  { name: "Auto-bronceado", categoryId: "corporal", duration: 30, price: 0, description: "Aplicación de bronceado sin sol, de efecto natural y progresivo." },
  { name: "Depilación láser", categoryId: "corporal", duration: 30, price: 0, description: "Depilación con tecnología láser para reducción del vello a largo plazo." },
  // Social
  { name: "Maquillaje social", categoryId: "social", duration: 60, price: 0, description: "Maquillaje profesional para eventos y ocasiones especiales.", variablePrice: true },
  { name: "Maquillaje social y peinado", categoryId: "social", duration: 90, price: 0, description: "Maquillaje y peinado profesional para eventos especiales.", variablePrice: true },
  { name: "Glitter", categoryId: "social", duration: 15, price: 0, description: "Aplicación de brillos decorativos para looks de fiesta." },
];

const EMPLOYEE_COLORS = ["#6E9179", "#B97A5D", "#C29A47", "#8779AD", "#5C8B9C", "#948A7C", "#4F7A63"];

const EXPENSE_CATEGORIES = ["Alquiler", "Insumos", "Sueldos", "Servicios (luz/agua/internet)", "Marketing", "Otros"];

const SALON_OPEN = 9 * 60;   // 09:00 en minutos
const SALON_CLOSE = 19 * 60; // 19:00 en minutos
const SLOT_STEP = 30;
const BUFFER_MINUTES = 10; // descanso entre un servicio y el siguiente, por profesional
const RESCHEDULE_LIMIT_HOURS = 24; // desde acá la clienta ya no puede cancelar/reprogramar sola

const STATUS_LABEL = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};

const STATUS_COLOR = {
  pendiente: "#C29A47",
  confirmado: "#5C8B9C",
  completado: "#6E9179",
  cancelado: "#A79A8D",
};

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

const formatDateHuman = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
};

const minutesToHHMM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const hhmmToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

/* ---------------------------------------------------------------------- */
/* Persistencia (Supabase, datos compartidos del local)                    */
/* ---------------------------------------------------------------------- */

function useCloudState(key, fallback) {
  const [data, setData] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("app_data")
          .select("value")
          .eq("key", key)
          .maybeSingle();
        if (mounted) {
          if (error || !row) setData(fallback);
          else setData(row.value);
        }
      } catch (e) {
        if (mounted) setData(fallback);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();

    // Tiempo real: si otra persona (otra profesional, otro dispositivo)
    // cambia estos datos, se actualiza acá solo, sin recargar la página.
    const channel = supabase
      .channel(`app_data_${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_data", filter: `key=eq.${key}` },
        (payload) => {
          if (mounted && payload.new && payload.new.value !== undefined) {
            setData(payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = async (next) => {
    setData(next);
    try {
      const { error } = await supabase
        .from("app_data")
        .upsert({ key, value: next, updated_at: new Date().toISOString() });
      if (error) setSaveError("No se pudo guardar. Probá de nuevo.");
      else setSaveError(null);
    } catch (e) {
      setSaveError("No se pudo guardar. Revisá tu conexión.");
    }
  };

  return [data, save, loaded, saveError];
}

/* ---------------------------------------------------------------------- */
/* Componentes visuales de marca                                          */
/* ---------------------------------------------------------------------- */

function BulbDivider({ items }) {
  // Fila de "luces de espejo de camerino": codifica de verdad las categorías/colores.
  return (
    <div className="bulb-divider">
      {items.map((it, i) => (
        <div className="bulb-item" key={i}>
          <span className="bulb" style={{ "--bulb-color": it.color }} />
          {it.label && <span className="bulb-label">{it.label}</span>}
        </div>
      ))}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
      <span>{toast.message}</span>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card ${wide ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  const Icon = icon;
  return (
    <div className="empty-state">
      <Icon size={28} strokeWidth={1.5} />
      <p className="empty-title">{title}</p>
      <p className="empty-hint">{hint}</p>
    </div>
  );
}

function Avatar({ name, color, size = 30 }) {
  const initials = (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span
      className="avatar"
      style={{ "--avatar-color": color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* App principal                                                          */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [services, setServices, servicesLoaded, servicesErr] = useCloudState("glamroom:services", []);
  const [employees, setEmployees, employeesLoaded, employeesErr] = useCloudState("glamroom:employees", []);
  const [products, setProducts, productsLoaded, productsErr] = useCloudState("glamroom:products", []);
  const [appointments, setAppointments, apptsLoaded, apptsErr] = useCloudState("glamroom:appointments", []);
  const [transactions, setTransactions, txLoaded, txErr] = useCloudState("glamroom:transactions", []);
  const [settings, setSettings, settingsLoaded, settingsErr] = useCloudState("glamroom:settings", { adminPin: "1234", paymentLink: "", depositNote: "" });
  const [gallery, setGallery, galleryLoaded, galleryErr] = useCloudState("glamroom:gallery", []);
  const [fixedExpenses, setFixedExpenses, fixedExpensesLoaded, fixedExpensesErr] = useCloudState("glamroom:fixedExpenses", []);

  const allLoaded = servicesLoaded && employeesLoaded && productsLoaded && apptsLoaded && txLoaded && settingsLoaded && galleryLoaded && fixedExpensesLoaded;
  const anySaveError = servicesErr || employeesErr || productsErr || apptsErr || txErr || settingsErr || galleryErr || fixedExpensesErr;

  const [view, setView] = useState("cliente"); // 'cliente' | 'misturnos' | 'panel'
  const [session, setSession] = useState(null); // null | { role: 'admin'|'staff', employeeId: string|null }
  const [tab, setTab] = useState("turnos");
  const [toast, setToast] = useState(null);

  const notify = (message, type = "ok") => {
    setToast({ message, type });
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2600);
  };

  if (!allLoaded) {
    return (
      <div className="glam-root loading-root">
        <GlobalStyle />
        <div className="loading-box">
          <Sparkles size={22} className="spin-slow" />
          <span>Abriendo The Glam Room…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glam-root">
      <GlobalStyle />
      {anySaveError && (
        <div className="connection-banner">
          <AlertCircle size={14} /> No se pudieron guardar los últimos cambios. Revisá tu conexión a internet.
        </div>
      )}
      <Toast toast={toast} />
      <Header view={view} setView={setView} onLeavePanel={() => setSession(null)} />

      <main className="main-area">
        {view === "cliente" && (
          <ClienteBooking
            services={services}
            employees={employees}
            appointments={appointments}
            setAppointments={setAppointments}
            settings={settings}
            gallery={gallery}
            notify={notify}
          />
        )}

        {view === "misturnos" && (
          <MisTurnos
            services={services}
            employees={employees}
            appointments={appointments}
            setAppointments={setAppointments}
            notify={notify}
          />
        )}

        {view === "panel" && !session && (
          <LoginGate settings={settings} employees={employees} onLogin={(s) => setSession(s)} />
        )}

        {view === "panel" && session && (
          <PanelAdmin
            session={session}
            tab={tab} setTab={setTab}
            services={services} setServices={setServices}
            employees={employees} setEmployees={setEmployees}
            products={products} setProducts={setProducts}
            appointments={appointments} setAppointments={setAppointments}
            transactions={transactions} setTransactions={setTransactions}
            settings={settings} setSettings={setSettings}
            gallery={gallery} setGallery={setGallery}
            fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses}
            notify={notify}
          />
        )}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Header                                                                  */
/* ---------------------------------------------------------------------- */

function Header({ view, setView, onLeavePanel }) {
  return (
    <header className="glam-header">
      <div className="brand">
        <span className="brand-mark">✦</span>
        <div className="brand-text">
          <span className="brand-name">The Glam Room</span>
          <span className="brand-sub">Estética integral</span>
        </div>
      </div>
      <div className="view-toggle">
        <button
          className={view === "cliente" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => { setView("cliente"); onLeavePanel(); }}
        >
          Reservar turno
        </button>
        <button
          className={view === "misturnos" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => { setView("misturnos"); onLeavePanel(); }}
        >
          Mis turnos
        </button>
        <button
          className={view === "panel" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => { setView("panel"); }}
        >
          Ingresar
        </button>
      </div>
    </header>
  );
}

function LoginGate({ settings, employees, onLogin }) {
  const [selected, setSelected] = useState(""); // "" = administración general
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const masterPin = settings.adminPin || settings.pin || "1234";

  const handleLogin = () => {
    if (!selected) {
      if (pin === masterPin) onLogin({ role: "admin", employeeId: null });
      else setErr(true);
      return;
    }
    const emp = employees.find((e) => e.id === selected);
    if (emp && emp.pin && pin === emp.pin) {
      onLogin({ role: emp.isAdmin ? "admin" : "staff", employeeId: emp.id });
    } else {
      setErr(true);
    }
  };

  return (
    <div className="pin-gate">
      <Lock size={26} />
      <h2>Ingresar</h2>
      <p>Elegí tu nombre e ingresá tu PIN personal.</p>
      <select
        className="select-input"
        style={{ maxWidth: 240 }}
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setPin(""); setErr(false); }}
      >
        <option value="">Administración general</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <input
        className="pin-input"
        type="password"
        inputMode="numeric"
        maxLength={8}
        value={pin}
        onChange={(e) => { setPin(e.target.value); setErr(false); }}
        placeholder="••••"
      />
      {err && <span className="pin-error">PIN incorrecto.</span>}
      <button className="btn btn-primary" onClick={handleLogin}>Entrar</button>
      <span className="pin-hint">
        Si sos administradora, entrás con acceso completo. Si sos empleada, ves tu propia agenda y tus propios
        ingresos. Los PINs personales se configuran en Servicios y equipo, editando a cada profesional.
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Disponibilidad de turnos                                                */
/* ---------------------------------------------------------------------- */

function getBusyRanges(appointments, employeeId, date, services, excludeId) {
  return appointments
    .filter((a) => a.employeeId === employeeId && a.date === date && a.status !== "cancelado" && a.id !== excludeId)
    .map((a) => {
      const svc = services.find((s) => s.id === a.serviceId);
      const dur = a.overrideDuration || (svc ? svc.duration : 30);
      const start = hhmmToMinutes(a.time);
      // Sumamos el descanso a ambos lados para garantizar el hueco entre servicios,
      // sin importar el orden en el que se agenden los turnos.
      return { start: start - BUFFER_MINUTES, end: start + dur + BUFFER_MINUTES };
    });
}

function generateSlots(appointments, employeeId, date, duration, services, excludeId) {
  if (!employeeId || !date || !duration) return [];
  const busy = getBusyRanges(appointments, employeeId, date, services, excludeId);
  const slots = [];
  for (let t = SALON_OPEN; t + duration <= SALON_CLOSE; t += SLOT_STEP) {
    const overlaps = busy.some((b) => t < b.end && t + duration > b.start);
    if (!overlaps) slots.push(minutesToHHMM(t));
  }
  return slots;
}

// Para turnos con dos servicios: el segundo arranca apenas termina el primero
// (más el descanso), y hace falta que la segunda profesional también esté
// libre en ese horario calculado.
function generateComboSlots(appointments, employee1Id, duration1, employee2Id, duration2, date, services) {
  const primarySlots = generateSlots(appointments, employee1Id, date, duration1, services);
  if (!employee2Id || !duration2) return primarySlots;

  const busy2 = getBusyRanges(appointments, employee2Id, date, services);
  return primarySlots.filter((s) => {
    const t1 = hhmmToMinutes(s);
    const t2 = t1 + duration1 + BUFFER_MINUTES;
    if (t2 + duration2 > SALON_CLOSE) return false;
    const overlaps2 = busy2.some((b) => t2 < b.end && t2 + duration2 > b.start);
    return !overlaps2;
  });
}

function isEmployeeOnTimeOff(employee, date) {
  if (!employee?.timeOff || !date) return false;
  return employee.timeOff.some((t) => date >= t.start && date <= t.end);
}

function hoursUntilAppt(appt) {
  const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
  return (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
}

/* ---------------------------------------------------------------------- */
/* Vista Clienta: flujo de reserva                                         */
/* ---------------------------------------------------------------------- */

function ImageCarousel({ images }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 3800);
    return () => clearInterval(t);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="gallery-carousel">
      {images.map((img, i) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          className={`gallery-slide ${i === index ? "active" : ""}`}
        />
      ))}
      {images.length > 1 && (
        <div className="gallery-dots">
          {images.map((img, i) => (
            <span key={img.id} className={`gallery-dot ${i === index ? "active" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceAccordion({ services, selectedId, onSelect, excludeId }) {
  const [openCat, setOpenCat] = useState(null);

  // Si ya hay un servicio elegido, abrimos su categoría al entrar/volver.
  useEffect(() => {
    if (selectedId) {
      const s = services.find((sv) => sv.id === selectedId);
      if (s) setOpenCat(s.categoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="accordion">
      {CATEGORIES.map((cat) => {
        const list = services.filter((s) => s.categoryId === cat.id && s.id !== excludeId);
        if (list.length === 0) return null;
        const isOpen = openCat === cat.id;
        const hasSelection = list.some((s) => s.id === selectedId);
        return (
          <div key={cat.id} className={`accordion-item ${hasSelection ? "has-selection" : ""}`}>
            <button className="accordion-header" onClick={() => setOpenCat(isOpen ? null : cat.id)}>
              <span className="bulb" style={{ "--bulb-color": cat.color, width: 10, height: 10 }} />
              <span className="accordion-title">{cat.name}</span>
              {hasSelection && !isOpen && <Check size={14} color="var(--sage)" />}
              <ChevronDown size={16} className={`accordion-chevron ${isOpen ? "open" : ""}`} />
            </button>
            <div className={`accordion-body-wrap ${isOpen ? "open" : ""}`}>
              <div className="accordion-body">
                {list.map((s) => (
                  <button
                    key={s.id}
                    className={`service-row ${selectedId === s.id ? "selected" : ""}`}
                    onClick={() => onSelect(s.id)}
                  >
                    <span>{s.name}</span>
                    <span className="service-meta">
                      <Clock size={13} /> {s.duration} min · {s.variablePrice ? "precio a coordinar" : formatMoney(s.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClienteBooking({ services, employees, appointments, setAppointments, settings, gallery, notify }) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(null);
  const [wantsSecond, setWantsSecond] = useState(false);
  const [serviceId2, setServiceId2] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeId2, setEmployeeId2] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [done, setDone] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const service2 = wantsSecond ? services.find((s) => s.id === serviceId2) : null;
  const eligibleEmployees = employees.filter((e) => e.serviceIds?.includes(serviceId));
  const eligibleEmployees2 = employees.filter((e) => e.serviceIds?.includes(serviceId2));
  const employee = employees.find((e) => e.id === employeeId);
  const employee2 = employees.find((e) => e.id === employeeId2);

  const employeeOnLeave = isEmployeeOnTimeOff(employee, date);
  const employee2OnLeave = service2 ? isEmployeeOnTimeOff(employee2, date) : false;

  const slots = useMemo(
    () =>
      service && employeeId && !employeeOnLeave && !employee2OnLeave
        ? generateComboSlots(
            appointments, employeeId, service.duration,
            service2 ? employeeId2 : null, service2 ? service2.duration : null,
            date, services
          )
        : [],
    [appointments, employeeId, employeeId2, date, service, service2, services, employeeOnLeave, employee2OnLeave]
  );

  // Horarios calculados del combo, una vez elegido el horario de inicio.
  const time2 = useMemo(() => {
    if (!time || !service || !service2) return null;
    return minutesToHHMM(hhmmToMinutes(time) + service.duration + BUFFER_MINUTES);
  }, [time, service, service2]);

  const maxDate = addDays(todayStr(), 60);

  const reset = () => {
    setStep(1); setServiceId(null); setWantsSecond(false); setServiceId2(null);
    setEmployeeId(null); setEmployeeId2(null); setDate(todayStr());
    setTime(null); setClientName(""); setClientPhone(""); setDone(false);
  };

  if (services.length === 0) {
    return (
      <div className="card center-card">
        <EmptyState
          icon={Sparkles}
          title="Todavía no hay servicios cargados"
          hint="El local está terminando de configurar la agenda. Volvé a intentar más tarde."
        />
      </div>
    );
  }

  if (done) {
    const link1 = employee?.paymentLink || settings?.paymentLink || "";
    const link2 = service2 ? (employee2?.paymentLink || settings?.paymentLink || "") : "";
    const showTwoLinks = link1 && link2 && link1 !== link2;
    const singleLink = link1 || link2;

    return (
      <div className="card center-card">
        <CalendarCheck size={30} color="var(--sage)" />
        <h2>¡Turno solicitado!</h2>
        <p className="muted">
          Pediste <strong>{service.name}</strong> con <strong>{employee.name}</strong> el{" "}
          {formatDateHuman(date)} a las {time} hs.
          {service2 && (
            <> Y <strong>{service2.name}</strong> con <strong>{employee2.name}</strong> a continuación, a las {time2} hs.</>
          )}{" "}
          El local te confirma el turno a la brevedad.
        </p>
        {settings?.depositNote && (link1 || link2) && <p className="muted small">{settings.depositNote}</p>}
        {showTwoLinks ? (
          <div className="deposit-box">
            <a className="btn btn-primary" href={link1} target="_blank" rel="noopener noreferrer">
              <CircleDollarSign size={16} /> Pagar seña a {employee.name}
            </a>
            <a className="btn btn-primary" href={link2} target="_blank" rel="noopener noreferrer">
              <CircleDollarSign size={16} /> Pagar seña a {employee2.name}
            </a>
          </div>
        ) : singleLink ? (
          <div className="deposit-box">
            <a className="btn btn-primary" href={singleLink} target="_blank" rel="noopener noreferrer">
              <CircleDollarSign size={16} /> Pagar seña ahora
            </a>
          </div>
        ) : null}
        <button className="btn btn-ghost" onClick={reset}>Reservar otro turno</button>
      </div>
    );
  }

  return (
    <div className="booking-wizard">
      <BulbDivider items={CATEGORIES.map((c) => ({ color: c.color, label: c.name }))} />

      <div className="wizard-steps">
        {["Servicio", "Profesional", "Fecha y hora", "Tus datos"].map((label, i) => (
          <div key={label} className={`wizard-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}>
            <span className="wizard-step-num">{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h3>Elegí un servicio</h3>
          <ServiceAccordion
            services={services}
            selectedId={serviceId}
            onSelect={(id) => { setServiceId(id); setEmployeeId(null); setTime(null); }}
          />

          {service && (
            <div className="summary-box" style={{ marginTop: 12 }}>
              <div>
                <span className="bulb" style={{ "--bulb-color": categoryById(service.categoryId)?.color, width: 10, height: 10 }} />
                {service.name}
              </div>
              <div><Clock size={14} /> {service.duration} minutos</div>
              <div><CircleDollarSign size={14} /> {service.variablePrice ? "Precio a coordinar con el local" : formatMoney(service.price)}</div>
              {service.description && <p className="service-description">{service.description}</p>}
            </div>
          )}

          <label className="checkbox-row" style={{ marginTop: 14 }}>
            <input
              type="checkbox"
              checked={wantsSecond}
              onChange={(e) => {
                setWantsSecond(e.target.checked);
                if (!e.target.checked) { setServiceId2(null); setEmployeeId2(null); }
                setTime(null);
              }}
            />
            Sumar otro servicio a este mismo turno
          </label>

          {wantsSecond && (
            <div style={{ marginTop: 10 }}>
              <h3 style={{ fontSize: 14 }}>Segundo servicio</h3>
              <ServiceAccordion
                services={services}
                selectedId={serviceId2}
                excludeId={serviceId}
                onSelect={(id) => { setServiceId2(id); setEmployeeId2(null); setTime(null); }}
              />
              {service2 && (
                <div className="summary-box" style={{ marginTop: 12 }}>
                  <div>
                    <span className="bulb" style={{ "--bulb-color": categoryById(service2.categoryId)?.color, width: 10, height: 10 }} />
                    {service2.name}
                  </div>
                  <div><Clock size={14} /> {service2.duration} minutos</div>
                  <div><CircleDollarSign size={14} /> {service2.variablePrice ? "Precio a coordinar con el local" : formatMoney(service2.price)}</div>
                  {service2.description && <p className="service-description">{service2.description}</p>}
                </div>
              )}
            </div>
          )}

          <div className="wizard-actions">
            <button
              className="btn btn-primary"
              disabled={!serviceId || (wantsSecond && !serviceId2)}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>¿Con quién querés atenderte?</h3>
          <p className="muted small">Para {service.name}</p>
          {eligibleEmployees.length === 0 ? (
            <EmptyState icon={Users} title="Sin profesional disponible" hint="Nadie realiza este servicio todavía. Probá con otro servicio." />
          ) : (
            <div className="employee-grid">
              {eligibleEmployees.map((e) => (
                <button
                  key={e.id}
                  className={`employee-option ${employeeId === e.id ? "selected" : ""}`}
                  onClick={() => { setEmployeeId(e.id); setTime(null); }}
                >
                  <Avatar name={e.name} color={e.color} size={38} />
                  <span>{e.name}</span>
                </button>
              ))}
            </div>
          )}

          {service2 && (
            <>
              <h3 style={{ marginTop: 18 }}>¿Y para el segundo servicio?</h3>
              <p className="muted small">Para {service2.name}</p>
              {eligibleEmployees2.length === 0 ? (
                <EmptyState icon={Users} title="Sin profesional disponible" hint="Nadie realiza este servicio todavía." />
              ) : (
                <div className="employee-grid">
                  {eligibleEmployees2.map((e) => (
                    <button
                      key={e.id}
                      className={`employee-option ${employeeId2 === e.id ? "selected" : ""}`}
                      onClick={() => { setEmployeeId2(e.id); setTime(null); }}
                    >
                      <Avatar name={e.name} color={e.color} size={38} />
                      <span>{e.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="wizard-actions">
            <button className="btn btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={16} /> Atrás</button>
            <button
              className="btn btn-primary"
              disabled={!employeeId || (service2 && !employeeId2)}
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3>Elegí día y horario</h3>
          {service2 && (
            <p className="muted small">
              Es un turno combinado: el segundo servicio arranca apenas termina el primero
              (con {BUFFER_MINUTES} min de descanso entre medio).
            </p>
          )}
          <input
            className="date-input"
            type="date"
            value={date}
            min={todayStr()}
            max={maxDate}
            onChange={(e) => { setDate(e.target.value); setTime(null); }}
          />
          {slots.length === 0 ? (
            (employeeOnLeave || employee2OnLeave) ? (
              <EmptyState icon={Calendar} title="Profesional de vacaciones ese día" hint="Probá con otra fecha, o elegí otra profesional." />
            ) : (
              <EmptyState icon={Clock} title="No hay horarios libres ese día" hint="Probá con otra fecha, o con otro profesional." />
            )
          ) : (
            <div className="slot-grid">
              {slots.map((s) => (
                <button key={s} className={`slot-btn ${time === s ? "selected" : ""}`} onClick={() => setTime(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {time && service2 && (
            <div className="summary-box" style={{ marginTop: 12 }}>
              <div><Clock size={14} /> {service.name}: {time} a {minutesToHHMM(hhmmToMinutes(time) + service.duration)} hs</div>
              <div><Clock size={14} /> {service2.name}: {time2} a {minutesToHHMM(hhmmToMinutes(time2) + service2.duration)} hs</div>
            </div>
          )}
          <div className="wizard-actions">
            <button className="btn btn-ghost" onClick={() => setStep(2)}><ChevronLeft size={16} /> Atrás</button>
            <button className="btn btn-primary" disabled={!time} onClick={() => setStep(4)}>Continuar</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h3>Tus datos</h3>
          <div className="summary-box">
            <div><Scissors size={14} /> {service.name}</div>
            <div><User size={14} /> {employee.name}</div>
            <div><Calendar size={14} /> {formatDateHuman(date)} · {time} hs</div>
            <div><CircleDollarSign size={14} /> {service.variablePrice ? "Precio a coordinar con el local" : formatMoney(service.price)}</div>
          </div>
          {service2 && (
            <div className="summary-box" style={{ marginTop: 8 }}>
              <div><Scissors size={14} /> {service2.name}</div>
              <div><User size={14} /> {employee2.name}</div>
              <div><Calendar size={14} /> {formatDateHuman(date)} · {time2} hs</div>
              <div><CircleDollarSign size={14} /> {service2.variablePrice ? "Precio a coordinar con el local" : formatMoney(service2.price)}</div>
            </div>
          )}
          <label className="field-label">Nombre y apellido</label>
          <input className="text-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Tu nombre" />
          <label className="field-label">Teléfono</label>
          <input className="text-input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Tu WhatsApp o celular" />
          <div className="wizard-actions">
            <button className="btn btn-ghost" onClick={() => setStep(3)}><ChevronLeft size={16} /> Atrás</button>
            <button
              className="btn btn-primary"
              disabled={!clientName.trim()}
              onClick={() => {
                const comboId = service2 ? uid() : undefined;
                const appt = {
                  id: uid(), serviceId, employeeId, date, time,
                  clientName: clientName.trim(), clientPhone: clientPhone.trim(),
                  status: "pendiente", paymentStatus: "pendiente", notes: "", comboId, reminderSent: false, createdAt: Date.now(),
                };
                const newAppts = [appt];
                if (service2) {
                  newAppts.push({
                    id: uid(), serviceId: serviceId2, employeeId: employeeId2, date, time: time2,
                    clientName: clientName.trim(), clientPhone: clientPhone.trim(),
                    status: "pendiente", paymentStatus: "pendiente", notes: "", comboId, reminderSent: false, createdAt: Date.now(),
                  });
                }
                setAppointments([...appointments, ...newAppts]);
                notify("Turno solicitado con éxito");
                setDone(true);
              }}
            >
              Confirmar reserva
            </button>
          </div>
        </div>
      )}

      <ImageCarousel images={gallery} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Mis turnos: la clienta busca, cancela o reprograma sin llamar al local  */
/* ---------------------------------------------------------------------- */

function MisTurnos({ services, employees, appointments, setAppointments, notify }) {
  const [searchInput, setSearchInput] = useState("");
  const [searched, setSearched] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);

  const normalize = (p) => (p || "").replace(/\D/g, "");

  const myAppts = useMemo(() => {
    if (!searched) return [];
    const digits = normalize(searchInput);
    const nameLower = searchInput.trim().toLowerCase();
    if (digits.length < 6 && nameLower.length < 3) return [];
    return appointments.filter((a) => {
      const phoneMatch = digits.length >= 6 && normalize(a.clientPhone) === digits;
      const nameMatch = nameLower.length >= 3 && a.clientName.toLowerCase().includes(nameLower);
      return phoneMatch || nameMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, searched]);

  const today = todayStr();
  const upcoming = myAppts
    .filter((a) => a.status !== "cancelado" && a.status !== "completado" && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = myAppts
    .filter((a) => a.status === "completado" || a.status === "cancelado" || a.date < today)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const completedCount = myAppts.filter((a) => a.status === "completado").length;

  const cancelAppt = (appt) => {
    if (appt.comboId) {
      setAppointments(appointments.map((a) => (a.comboId === appt.comboId ? { ...a, status: "cancelado" } : a)));
    } else {
      setAppointments(appointments.map((a) => (a.id === appt.id ? { ...a, status: "cancelado" } : a)));
    }
    notify("Turno cancelado");
  };

  return (
    <div className="booking-wizard">
      <div className="card">
        <h3>Buscá tus turnos</h3>
        <p className="muted small">Escribí tu nombre o tu teléfono, lo que te resulte más fácil.</p>
        <div className="form-stack">
          <input
            className="text-input"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearched(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && searchInput.trim()) setSearched(true); }}
            placeholder="Tu nombre o tu teléfono"
          />
          <button className="btn btn-primary" disabled={!searchInput.trim()} onClick={() => setSearched(true)}>
            Buscar
          </button>
        </div>

        {searched && myAppts.length === 0 && (
          <div style={{ marginTop: 10 }}>
            <EmptyState icon={Calendar} title="No encontramos turnos" hint="Revisá que sea el mismo nombre o teléfono que usaste al reservar." />
          </div>
        )}
      </div>

      {searched && myAppts.length > 0 && (
        <>
          <LoyaltyCard completedCount={completedCount} />

          {upcoming.length > 0 && (
            <>
              <h3 style={{ margin: "20px 0 10px" }}>Próximos turnos</h3>
              <div className="appt-list">
                {upcoming.map((appt) => (
                  <MyApptCard
                    key={appt.id}
                    appt={appt}
                    services={services}
                    employees={employees}
                    appointments={appointments}
                    onCancel={() => cancelAppt(appt)}
                    isRescheduling={rescheduleId === appt.id}
                    onStartReschedule={() => setRescheduleId(appt.id)}
                    onCancelReschedule={() => setRescheduleId(null)}
                    onConfirmReschedule={(date, time) => {
                      setAppointments(appointments.map((a) =>
                        a.id === appt.id ? { ...a, date, time, status: "pendiente", reminderSent: false } : a
                      ));
                      setRescheduleId(null);
                      notify("Turno reprogramado");
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 style={{ margin: "20px 0 10px" }}>Historial</h3>
              <div className="appt-list">
                {past.map((appt) => (
                  <MyApptCard key={appt.id} appt={appt} services={services} employees={employees} appointments={appointments} readOnly />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function LoyaltyCard({ completedCount }) {
  const filled = completedCount === 0 ? 0 : (completedCount % 10 === 0 ? 10 : completedCount % 10);
  const rewardsEarned = Math.floor(completedCount / 10);
  const justCompleted = completedCount > 0 && completedCount % 10 === 0;

  return (
    <div className="card loyalty-card">
      <div className="tab-header-row" style={{ marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Tarjeta de fidelidad</h4>
        {rewardsEarned > 0 && (
          <span className="admin-badge">
            {rewardsEarned} turno{rewardsEarned > 1 ? "s" : ""} gratis ganado{rewardsEarned > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="loyalty-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`loyalty-stamp ${i < filled ? "filled" : ""}`}>
            {i < filled ? <Sparkles size={16} /> : <span>{i + 1}</span>}
          </div>
        ))}
      </div>
      {justCompleted ? (
        <p className="loyalty-message loyalty-complete">🎉 ¡Completaste tu tarjeta! Mencionalo en tu próxima visita para tu turno gratis.</p>
      ) : (
        <p className="loyalty-message">
          Te falta{10 - filled !== 1 ? "n" : ""} {10 - filled} turno{10 - filled !== 1 ? "s" : ""} realizado{10 - filled !== 1 ? "s" : ""} para tu turno gratis.
        </p>
      )}
    </div>
  );
}

function MyApptCard({ appt, services, employees, appointments, onCancel, isRescheduling, onStartReschedule, onCancelReschedule, onConfirmReschedule, readOnly }) {
  const svc = services.find((s) => s.id === appt.serviceId);
  const emp = employees.find((e) => e.id === appt.employeeId);
  const cat = svc ? categoryById(svc.categoryId) : null;
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [rDate, setRDate] = useState(appt.date);
  const [rTime, setRTime] = useState(null);

  const onLeave = isEmployeeOnTimeOff(emp, rDate);
  const rSlots = useMemo(
    () => (svc && emp && !onLeave ? generateSlots(appointments, emp.id, rDate, svc.duration, services, appt.id) : []),
    [appointments, emp, rDate, svc, services, appt.id, onLeave]
  );

  const maxDate = addDays(todayStr(), 60);
  const hoursLeft = hoursUntilAppt(appt);
  const tooLateToChange = hoursLeft < RESCHEDULE_LIMIT_HOURS;

  return (
    <div className="card" style={{ borderLeft: `4px solid ${cat ? cat.color : "#948A7C"}`, marginBottom: 12 }}>
      <div className="appt-main-line">
        <strong>{svc ? svc.name : "Servicio"}</strong>
        <span className="status-badge" style={{ "--chip-color": STATUS_COLOR[appt.status] }}>{STATUS_LABEL[appt.status]}</span>
        {appt.comboId && <span className="combo-badge">Combo</span>}
      </div>
      <div className="appt-sub-line" style={{ marginBottom: 10 }}>
        <Avatar name={emp ? emp.name : "?"} color={emp ? emp.color : "#948A7C"} size={20} />
        {emp ? emp.name : "Sin asignar"} · {formatDateHuman(appt.date)} · {appt.time} hs
      </div>

      {!readOnly && tooLateToChange && !isRescheduling && !confirmingCancel && (
        <p className="muted small" style={{ margin: 0 }}>
          Este turno es en menos de {RESCHEDULE_LIMIT_HOURS} hs — para cancelarlo o cambiar el horario, contactá al local directamente.
        </p>
      )}

      {!readOnly && !tooLateToChange && !isRescheduling && !confirmingCancel && (
        <div className="finance-actions">
          {!appt.comboId && <button className="btn btn-tiny" onClick={onStartReschedule}>Reprogramar</button>}
          <button className="btn btn-tiny btn-ghost" onClick={() => setConfirmingCancel(true)}>Cancelar turno</button>
        </div>
      )}

      {confirmingCancel && (
        <div className="summary-box">
          <span>¿Seguro que querés cancelar este turno?</span>
          <div className="finance-actions">
            <button className="btn btn-tiny btn-ghost" onClick={() => setConfirmingCancel(false)}>Volver</button>
            <button className="btn btn-tiny" style={{ background: "var(--money-neg)", color: "#fff" }} onClick={onCancel}>
              Sí, cancelar
            </button>
          </div>
        </div>
      )}

      {isRescheduling && (
        <div className="summary-box">
          <label className="field-label">Nueva fecha</label>
          <input
            className="date-input" type="date" value={rDate} min={todayStr()} max={maxDate}
            onChange={(e) => { setRDate(e.target.value); setRTime(null); }}
          />
          {onLeave ? (
            <span className="muted small">Tu profesional está de vacaciones ese día, probá con otra fecha.</span>
          ) : rSlots.length === 0 ? (
            <span className="muted small">No hay horarios libres ese día.</span>
          ) : (
            <div className="slot-grid">
              {rSlots.map((s) => (
                <button key={s} className={`slot-btn ${rTime === s ? "selected" : ""}`} onClick={() => setRTime(s)}>{s}</button>
              ))}
            </div>
          )}
          <div className="finance-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-tiny btn-ghost" onClick={onCancelReschedule}>Volver</button>
            <button className="btn btn-tiny btn-primary" disabled={!rTime} onClick={() => onConfirmReschedule(rDate, rTime)}>
              Confirmar nuevo horario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Panel Admin                                                             */
/* ---------------------------------------------------------------------- */

function PanelAdmin(props) {
  const { tab, setTab, session, employees } = props;
  const role = session.role;
  const employeeId = session.employeeId;
  const me = employeeId ? employees.find((e) => e.id === employeeId) : null;

  const adminTabs = [
    { id: "turnos", label: "Turnos", icon: Calendar },
    { id: "finanzas", label: "Finanzas", icon: Wallet },
    { id: "equipo", label: "Servicios y equipo", icon: Users },
    { id: "productos", label: "Productos", icon: Package },
    { id: "ajustes", label: "Ajustes", icon: Settings },
  ];
  const staffTabs = [
    { id: "miagenda", label: "Mi agenda", icon: Calendar },
    { id: "misingresos", label: "Mis ingresos", icon: Wallet },
  ];
  const tabs = role === "admin" ? adminTabs : staffTabs;
  const defaultTab = role === "admin" ? "turnos" : "miagenda";
  const activeTab = tabs.some((t) => t.id === tab) ? tab : defaultTab;

  return (
    <div className="panel-shell">
      <nav className="tab-rail">
        {me && (
          <div className="tab-rail-me">
            <Avatar name={me.name} color={me.color} size={26} />
            <span>{me.name}</span>
          </div>
        )}
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon size={16} /> <span>{t.label}</span>
          </button>
        ))}
        {role === "staff" && <span className="role-badge">Acceso de empleada</span>}
      </nav>
      <div className="panel-content">
        {activeTab === "turnos" && role === "admin" && <TurnosTab {...props} />}
        {activeTab === "finanzas" && role === "admin" && <FinanzasTab {...props} />}
        {activeTab === "equipo" && role === "admin" && <EquipoTab {...props} />}
        {activeTab === "productos" && role === "admin" && <ProductosTab {...props} />}
        {activeTab === "ajustes" && role === "admin" && <AjustesTab {...props} />}
        {activeTab === "miagenda" && role === "staff" && <TurnosTab {...props} restrictToEmployeeId={employeeId} />}
        {activeTab === "misingresos" && role === "staff" && <MisIngresosEmpleada {...props} employeeId={employeeId} />}
      </div>
    </div>
  );
}

/* --------------------------- Turnos tab --------------------------- */

function TurnosTab({ services, employees, appointments, setAppointments, transactions, setTransactions, settings, restrictToEmployeeId, notify }) {
  const [date, setDate] = useState(todayStr());
  const [employeeFilter, setEmployeeFilter] = useState(restrictToEmployeeId || "todas");
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("lista"); // 'lista' | 'calendario'
  const [detailApptId, setDetailApptId] = useState(null);

  const effectiveFilter = restrictToEmployeeId || employeeFilter;

  const dayAppts = appointments
    .filter((a) => a.date === date && (effectiveFilter === "todas" || a.employeeId === effectiveFilter))
    .sort((a, b) => a.time.localeCompare(b.time));

  const counts = dayAppts.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const detailAppt = detailApptId ? appointments.find((a) => a.id === detailApptId) || null : null;

  const changeStatus = (appt, newStatus) => {
    const updated = appointments.map((a) => (a.id === appt.id ? { ...a, status: newStatus } : a));
    setAppointments(updated);

    if (newStatus === "completado") notify("Turno marcado como realizado");
    else if (newStatus === "cancelado") notify("Turno cancelado", "ok");
    else if (newStatus === "confirmado") notify("Turno confirmado");
  };

  const removeAppt = (appt) => {
    setAppointments(appointments.filter((a) => a.id !== appt.id));
    notify("Turno eliminado");
  };

  // El ingreso en Finanzas se genera automáticamente en el momento en que el
  // pago pasa a "completo" (sin importar si el turno ya fue realizado o no),
  // y se retira si el pago se destilda por error. Así, marcar el cobro es la
  // única acción que hace falta para que quede contemplado en Finanzas.
  const registerPaymentComplete = (appt) => {
    const svc = services.find((s) => s.id === appt.serviceId);
    const emp = employees.find((e) => e.id === appt.employeeId);
    const tx = {
      id: uid(), type: "ingreso_servicio", date: appt.date,
      amount: appt.overridePrice != null ? appt.overridePrice : (svc ? svc.price : 0),
      description: svc ? svc.name : "Servicio",
      categoryId: svc ? svc.categoryId : null,
      serviceId: appt.serviceId,
      employeeId: appt.employeeId, employeeName: emp ? emp.name : "—",
      serviceName: svc ? svc.name : "Servicio",
      appointmentId: appt.id, createdAt: Date.now(),
    };
    setTransactions([...transactions, tx]);
  };

  const withdrawPayment = (appt) => {
    setTransactions(transactions.filter((t) => t.appointmentId !== appt.id));
  };

  // Arma el link de WhatsApp con el mensaje ya escrito; falta un solo toque
  // para enviarlo. El envío real y automático (sin tocar nada) requiere la
  // API de WhatsApp Business de Meta, que es un trámite aparte del local.
  const formatPhoneForWhatsapp = (phone) => {
    let digits = (phone || "").replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("54")) return digits;
    if (digits.startsWith("0")) digits = digits.slice(1);
    return "549" + digits;
  };

  const sendReminder = (appt) => {
    const phone = formatPhoneForWhatsapp(appt.clientPhone);
    if (!phone) { notify("Esta clienta no tiene teléfono cargado", "error"); return; }
    const svc = services.find((s) => s.id === appt.serviceId);
    const message =
      `Hola ${appt.clientName}! Te confirmamos tu turno de ${svc ? svc.name : "tu servicio"} ` +
      `en The Glam Room el ${formatDateHuman(appt.date)} a las ${appt.time} hs. ¡Te esperamos! ✨`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    setAppointments(appointments.map((a) => (a.id === appt.id ? { ...a, reminderSent: true } : a)));
  };

  const PAYMENT_ORDER = ["pendiente", "sena", "completo"];
  const PAYMENT_LABEL = { pendiente: "Sin pagar", sena: "Seña pagada", completo: "Pago completo" };

  const [priceModalAppt, setPriceModalAppt] = useState(null);
  const [priceModalValue, setPriceModalValue] = useState("");

  const cyclePaymentStatus = (appt) => {
    const current = appt.paymentStatus || "pendiente";
    const nextIndex = (PAYMENT_ORDER.indexOf(current) + 1) % PAYMENT_ORDER.length;
    const next = PAYMENT_ORDER[nextIndex];

    if (next === "completo") {
      const svc = services.find((s) => s.id === appt.serviceId);
      if (svc?.variablePrice && appt.overridePrice == null) {
        setPriceModalAppt(appt);
        setPriceModalValue(svc.price ? String(svc.price) : "");
        return;
      }
    }

    setAppointments(appointments.map((a) => (a.id === appt.id ? { ...a, paymentStatus: next } : a)));

    if (next === "completo") {
      registerPaymentComplete(appt);
      notify("Pago completo: ingreso cargado en Finanzas");
    } else if (current === "completo") {
      withdrawPayment(appt);
      notify(`Pago cambiado a "${PAYMENT_LABEL[next]}", se retiró el ingreso de Finanzas`);
    } else {
      notify(`Pago: ${PAYMENT_LABEL[next]}`);
    }
  };

  const confirmVariablePriceAndComplete = () => {
    const appt = priceModalAppt;
    const amount = Number(priceModalValue) || 0;
    const updatedAppt = { ...appt, paymentStatus: "completo", overridePrice: amount };
    setAppointments(appointments.map((a) => (a.id === appt.id ? updatedAppt : a)));
    registerPaymentComplete(updatedAppt);
    notify("Pago completo: ingreso cargado en Finanzas");
    setPriceModalAppt(null);
  };

  return (
    <div>
      <div className="tab-header-row">
        <h2>Agenda de turnos</h2>
        <div className="finance-actions">
          {settings?.paymentLink && (
            <a className="btn btn-tiny" href={settings.paymentLink} target="_blank" rel="noopener noreferrer">
              <CircleDollarSign size={14} /> Link general de seña
            </a>
          )}
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Turno manual</button>
        </div>
      </div>

      <div className="day-nav">
        <button className="icon-btn" onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={18} /></button>
        <div className="day-nav-label">
          <strong>{formatDateHuman(date)}</strong>
          <button className="link-btn" onClick={() => setDate(todayStr())}>Hoy</button>
        </div>
        <button className="icon-btn" onClick={() => setDate(addDays(date, 1))}><ChevronRight size={18} /></button>
        <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {!restrictToEmployeeId && (
          <select className="select-input" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="todas">Todas las profesionales</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <div className="view-toggle" style={{ marginLeft: "auto" }}>
          <button className={viewMode === "lista" ? "toggle-btn active" : "toggle-btn"} onClick={() => setViewMode("lista")}>Lista</button>
          <button className={viewMode === "calendario" ? "toggle-btn active" : "toggle-btn"} onClick={() => setViewMode("calendario")}>Calendario</button>
        </div>
      </div>

      <div className="status-strip">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="status-chip" style={{ "--chip-color": STATUS_COLOR[key] }}>
            {label}: {counts[key] || 0}
          </span>
        ))}
      </div>

      {viewMode === "lista" ? (
        dayAppts.length === 0 ? (
          <EmptyState icon={Calendar} title="Sin turnos para este día" hint="Agregá un turno manual o esperá reservas de clientas." />
        ) : (
          <div className="appt-list">
            {dayAppts.map((a) => {
              const svc = services.find((s) => s.id === a.serviceId);
              const emp = employees.find((e) => e.id === a.employeeId);
              const cat = svc ? categoryById(svc.categoryId) : null;
              return (
                <div key={a.id} className="appt-card" style={{ "--cat-color": cat ? cat.color : "#948A7C" }}>
                  <div className="appt-time">{a.time}</div>
                  <div className="appt-info">
                    <div className="appt-main-line">
                      <strong>{svc ? svc.name : "Servicio eliminado"}</strong>
                      <span className="status-badge" style={{ "--chip-color": STATUS_COLOR[a.status] }}>{STATUS_LABEL[a.status]}</span>
                      {a.comboId && <span className="combo-badge">Combo</span>}
                    </div>
                    <div className="appt-sub-line">
                      <Avatar name={emp ? emp.name : "?"} color={emp ? emp.color : "#948A7C"} size={20} />
                      {emp ? emp.name : "Sin asignar"} · {a.clientName} {a.clientPhone && `· ${a.clientPhone}`}
                    </div>
                  </div>
                  <ApptActionsRow
                    a={a} emp={emp} settings={settings}
                    cyclePaymentStatus={cyclePaymentStatus} changeStatus={changeStatus} removeAppt={removeAppt}
                    sendReminder={sendReminder}
                    PAYMENT_LABEL={PAYMENT_LABEL}
                  />
                </div>
              );
            })}
          </div>
        )
      ) : (
        <DayCalendar
          appointments={dayAppts}
          employees={effectiveFilter === "todas" ? employees : employees.filter((e) => e.id === effectiveFilter)}
          services={services}
          date={date}
          onSelectAppt={(a) => setDetailApptId(a.id)}
        />
      )}

      <Modal open={!!detailAppt} onClose={() => setDetailApptId(null)} title="Detalle del turno">
        {detailAppt && (() => {
          const svc = services.find((s) => s.id === detailAppt.serviceId);
          const emp = employees.find((e) => e.id === detailAppt.employeeId);
          const cat = svc ? categoryById(svc.categoryId) : null;
          return (
            <div className="form-stack">
              <div className="summary-box">
                <div>
                  <span className="bulb" style={{ "--bulb-color": cat ? cat.color : "#948A7C", width: 10, height: 10 }} />
                  {svc ? svc.name : "Servicio eliminado"}
                </div>
                <div><Avatar name={emp ? emp.name : "?"} color={emp ? emp.color : "#948A7C"} size={18} /> {emp ? emp.name : "Sin asignar"}</div>
                <div><Calendar size={14} /> {formatDateHuman(detailAppt.date)} · {detailAppt.time} hs</div>
                <div><User size={14} /> {detailAppt.clientName} {detailAppt.clientPhone && `· ${detailAppt.clientPhone}`}</div>
              </div>
              {detailAppt.comboId && <span className="combo-badge">Combo</span>}
              <ApptActionsRow
                a={detailAppt} emp={emp} settings={settings}
                cyclePaymentStatus={cyclePaymentStatus} changeStatus={changeStatus}
                removeAppt={(appt) => { removeAppt(appt); setDetailApptId(null); }}
                sendReminder={sendReminder}
                PAYMENT_LABEL={PAYMENT_LABEL}
              />
            </div>
          );
        })()}
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo turno manual">
        <ManualApptForm
          services={services} employees={employees} appointments={appointments}
          defaultDate={date} restrictToEmployeeId={restrictToEmployeeId}
          onSave={(appt) => {
            setAppointments([...appointments, appt]);
            if (appt.paymentStatus === "completo") registerPaymentComplete(appt);
            setShowModal(false);
            notify("Turno agregado");
          }}
        />
      </Modal>

      <Modal open={!!priceModalAppt} onClose={() => setPriceModalAppt(null)} title="Precio de este servicio">
        <div className="form-stack">
          <p className="muted small">
            Este servicio tiene precio variable. Ingresá el monto final de esta vez para cargarlo en Finanzas.
          </p>
          <label className="field-label">Precio</label>
          <input
            className="text-input" type="number" min="0" autoFocus
            value={priceModalValue} onChange={(e) => setPriceModalValue(e.target.value)}
          />
          <button className="btn btn-primary" disabled={priceModalValue === ""} onClick={confirmVariablePriceAndComplete}>
            Confirmar y marcar pago completo
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ApptActionsRow({ a, emp, settings, cyclePaymentStatus, changeStatus, removeAppt, sendReminder, PAYMENT_LABEL }) {
  return (
    <div className="appt-actions">
      {(emp?.paymentLink || settings?.paymentLink) && (
        <a
          className="icon-btn"
          href={emp?.paymentLink || settings?.paymentLink}
          target="_blank" rel="noopener noreferrer"
          title={`Link de seña de ${emp ? emp.name : "el local"}`}
        >
          <CircleDollarSign size={15} />
        </a>
      )}
      <button
        className={`icon-btn ${a.reminderSent ? "reminder-sent" : ""}`}
        onClick={() => sendReminder(a)}
        title={a.reminderSent ? "Recordatorio ya enviado (tocar para reenviar)" : "Enviar recordatorio por WhatsApp"}
      >
        <MessageCircle size={15} />
      </button>
      <button
        className={`payment-chip payment-${a.paymentStatus || "pendiente"}`}
        onClick={() => cyclePaymentStatus(a)}
        title="Tocar para avanzar el estado de pago"
      >
        {PAYMENT_LABEL[a.paymentStatus || "pendiente"]}
      </button>
      {a.status === "pendiente" && <button className="btn btn-tiny btn-primary" onClick={() => changeStatus(a, "confirmado")}>Confirmar</button>}
      {(a.status === "pendiente" || a.status === "confirmado") && (
        <button className="btn btn-tiny btn-success" onClick={() => changeStatus(a, "completado")}>Completar</button>
      )}
      {a.status !== "cancelado" && a.status !== "completado" && (
        <button className="btn btn-tiny btn-ghost" onClick={() => changeStatus(a, "cancelado")}>Cancelar</button>
      )}
      <button className="icon-btn" onClick={() => removeAppt(a)}><Trash2 size={15} /></button>
    </div>
  );
}

// Calendario tipo agenda: una columna por profesional, con los turnos
// posicionados como bloques según su horario real. Así se ve de un
// vistazo qué espacios del día ya están ocupados.
function DayCalendar({ appointments, employees, services, date, onSelectAppt }) {
  const totalMinutes = SALON_CLOSE - SALON_OPEN;
  const hourMarks = [];
  for (let t = SALON_OPEN; t <= SALON_CLOSE; t += 60) hourMarks.push(t);

  if (employees.length === 0) {
    return <EmptyState icon={Users} title="Sin profesionales para mostrar" hint="Elegí otro filtro o cargá profesionales en Servicios y equipo." />;
  }

  return (
    <div className="day-calendar">
      <div className="day-calendar-ruler">
        {hourMarks.map((t) => (
          <span key={t} className="day-calendar-ruler-mark" style={{ top: `${((t - SALON_OPEN) / totalMinutes) * 100}%` }}>
            {minutesToHHMM(t)}
          </span>
        ))}
      </div>
      <div className="day-calendar-columns">
        {employees.map((emp) => {
          const empAppts = appointments.filter((a) => a.employeeId === emp.id && a.status !== "cancelado");
          const onLeave = isEmployeeOnTimeOff(emp, date);
          return (
            <div key={emp.id} className="day-calendar-col">
              <div className="day-calendar-col-header">
                <Avatar name={emp.name} color={emp.color} size={20} />
                <span>{emp.name}</span>
              </div>
              <div className="day-calendar-col-body">
                {onLeave && (
                  <div className="day-calendar-leave">
                    <Calendar size={16} />
                    <span>De vacaciones</span>
                  </div>
                )}
                {hourMarks.map((t) => (
                  <div key={t} className="day-calendar-gridline" style={{ top: `${((t - SALON_OPEN) / totalMinutes) * 100}%` }} />
                ))}
                {!onLeave && empAppts.length === 0 && <span className="day-calendar-empty">Sin turnos</span>}
                {empAppts.map((a) => {
                  const svc = services.find((s) => s.id === a.serviceId);
                  const dur = a.overrideDuration || (svc ? svc.duration : 30);
                  const start = hhmmToMinutes(a.time);
                  const top = ((start - SALON_OPEN) / totalMinutes) * 100;
                  const height = (dur / totalMinutes) * 100;
                  const cat = svc ? categoryById(svc.categoryId) : null;
                  return (
                    <button
                      key={a.id}
                      className={`day-calendar-block status-${a.status}`}
                      style={{ top: `${top}%`, height: `${height}%`, "--block-color": cat ? cat.color : "#948A7C" }}
                      onClick={() => onSelectAppt(a)}
                      title={`${a.time} · ${svc ? svc.name : "Servicio"} · ${a.clientName}`}
                    >
                      <span className="day-calendar-block-time">{a.time}</span>
                      <span className="day-calendar-block-title">{svc ? svc.name : "Servicio"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManualApptForm({ services, employees, appointments, defaultDate, restrictToEmployeeId, onSave }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [employeeId, setEmployeeId] = useState(restrictToEmployeeId || "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pendiente");
  const [customDuration, setCustomDuration] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const service = services.find((s) => s.id === serviceId);
  const eligible = employees.filter((e) => e.serviceIds?.includes(serviceId));
  const employee = employees.find((e) => e.id === employeeId);
  const employeeOnLeave = isEmployeeOnTimeOff(employee, date);

  useEffect(() => {
    if (service?.variablePrice) {
      setCustomDuration(String(service.duration));
      setCustomPrice(String(service.price || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const effectiveDuration = service?.variablePrice ? (Number(customDuration) || service.duration) : service?.duration;

  const slots = useMemo(
    () => (service && employeeId && effectiveDuration && !employeeOnLeave ? generateSlots(appointments, employeeId, date, effectiveDuration, services) : []),
    [appointments, employeeId, date, service, services, employeeOnLeave, effectiveDuration]
  );

  if (services.length === 0) return <EmptyState icon={Scissors} title="No hay servicios" hint="Cargá servicios en la pestaña Servicios y equipo." />;

  return (
    <div className="form-stack">
      <label className="field-label">Servicio</label>
      <select
        className="select-input" value={serviceId}
        onChange={(e) => { setServiceId(e.target.value); if (!restrictToEmployeeId) setEmployeeId(""); setTime(""); }}
      >
        {CATEGORIES.map((cat) => {
          const list = services.filter((s) => s.categoryId === cat.id);
          if (list.length === 0) return null;
          return (
            <optgroup key={cat.id} label={cat.name}>
              {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          );
        })}
      </select>

      {restrictToEmployeeId ? (
        <>
          <label className="field-label">Profesional</label>
          <div className="summary-box" style={{ margin: "2px 0 0" }}>
            <div><Avatar name={employee?.name || "?"} color={employee?.color || "#948A7C"} size={18} /> {employee?.name}</div>
          </div>
          {employee && !employee.serviceIds?.includes(serviceId) && (
            <span className="pin-error">No realizás este servicio — elegí otro.</span>
          )}
        </>
      ) : (
        <>
          <label className="field-label">Profesional</label>
          <select className="select-input" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setTime(""); }}>
            <option value="">Elegí una profesional</option>
            {eligible.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </>
      )}

      <label className="field-label">Fecha</label>
      <input className="date-input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />

      {service?.variablePrice && (
        <div className="two-col" style={{ gap: 10 }}>
          <div>
            <label className="field-label">Duración esta vez (min)</label>
            <input
              className="text-input" type="number" min="5" step="5"
              value={customDuration} onChange={(e) => { setCustomDuration(e.target.value); setTime(""); }}
            />
          </div>
          <div>
            <label className="field-label">Precio esta vez</label>
            <input
              className="text-input" type="number" min="0"
              value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
            />
          </div>
        </div>
      )}

      {employeeId && (
        <>
          <label className="field-label">Horario</label>
          {slots.length === 0 ? (
            <span className="muted small">
              {employeeOnLeave ? "Esta profesional está de vacaciones ese día." : "No hay horarios libres para esta fecha."}
            </span>
          ) : (
            <div className="slot-grid">
              {slots.map((s) => (
                <button key={s} className={`slot-btn ${time === s ? "selected" : ""}`} onClick={() => setTime(s)}>{s}</button>
              ))}
            </div>
          )}
        </>
      )}

      <label className="field-label">Clienta</label>
      <input className="text-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre" />
      <input className="text-input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Teléfono (opcional)" />

      <label className="field-label">Estado del pago</label>
      <select className="select-input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
        <option value="pendiente">Sin pagar</option>
        <option value="sena">Seña pagada</option>
        <option value="completo">Pago completo</option>
      </select>

      <button
        className="btn btn-primary"
        disabled={!serviceId || !employeeId || !date || !time || !clientName.trim()}
        onClick={() => onSave({
          id: uid(), serviceId, employeeId, date, time,
          clientName: clientName.trim(), clientPhone: clientPhone.trim(),
          status: "confirmado", paymentStatus, notes: "", reminderSent: false, createdAt: Date.now(),
          overrideDuration: service?.variablePrice ? Number(customDuration) || undefined : undefined,
          overridePrice: service?.variablePrice ? Number(customPrice) || 0 : undefined,
        })}
      >
        Guardar turno
      </button>
    </div>
  );
}

/* --------------------------- Finanzas tab --------------------------- */

function MisIngresosEmpleada({ employeeId, employees, transactions }) {
  const [period, setPeriod] = useState("mes");
  const [customStart, setCustomStart] = useState(addDays(todayStr(), -7));
  const [customEnd, setCustomEnd] = useState(todayStr());

  const me = employees.find((e) => e.id === employeeId);

  const range = useMemo(() => {
    const today = todayStr();
    if (period === "hoy") return [today, today];
    if (period === "semana") return [addDays(today, -6), today];
    if (period === "mes") {
      const d = new Date();
      const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      return [first, today];
    }
    return [customStart, customEnd];
  }, [period, customStart, customEnd]);

  const myTx = transactions.filter(
    (t) => t.type === "ingreso_servicio" && t.employeeId === employeeId && t.date >= range[0] && t.date <= range[1]
  );
  const total = myTx.reduce((s, t) => s + t.amount, 0);

  const byCategory = CATEGORIES.map((c) => ({
    name: c.name, color: c.color,
    value: myTx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0),
  })).filter((c) => c.value > 0);

  return (
    <div>
      <div className="tab-header-row">
        <h2>Mis ingresos{me ? ` — ${me.name}` : ""}</h2>
      </div>
      <p className="muted small" style={{ marginTop: -8 }}>
        Esto es lo que generaste vos con tus turnos cobrados. No incluye a las demás profesionales ni los
        gastos del local.
      </p>

      <div className="period-row">
        {["hoy", "semana", "mes", "rango"].map((p) => (
          <button key={p} className={`toggle-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
            {p === "hoy" ? "Hoy" : p === "semana" ? "Últimos 7 días" : p === "mes" ? "Este mes" : "Rango"}
          </button>
        ))}
        {period === "rango" && (
          <>
            <input className="date-input" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span className="muted">a</span>
            <input className="date-input" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
      </div>

      <div className="kpi-row">
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label"><TrendingUp size={14} /> Generaste</span>
          <span className="kpi-value kpi-positive">{formatMoney(total)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label"><CalendarCheck size={14} /> Turnos cobrados</span>
          <span className="kpi-value">{myTx.length}</span>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="card chart-card">
          <h4>Por categoría de servicio</h4>
          <ResponsiveContainer width="100%" height={Math.max(120, byCategory.length * 44)}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill: "var(--ink)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E6DFD4", borderRadius: 8, color: "#3A3530" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                <LabelList dataKey="value" position="right" formatter={(v) => formatMoney(v)} fill="#3A3530" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h4>Detalle</h4>
        {myTx.length === 0 ? (
          <EmptyState icon={CircleDollarSign} title="Sin ingresos en este período" hint="Cuando completes y cobres un turno, va a aparecer acá." />
        ) : (
          <div className="tx-table">
            {[...myTx].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
              <div key={t.id} className="tx-row">
                <span className="tx-date">{formatDateHuman(t.date)}</span>
                <span className="tx-desc">{t.description}</span>
                <span className="tx-amount kpi-positive">+{formatMoney(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinanzasTab({ products, setProducts, transactions, setTransactions, employees, services, appointments, fixedExpenses, setFixedExpenses, notify }) {
  const [period, setPeriod] = useState("mes");
  const [customStart, setCustomStart] = useState(addDays(todayStr(), -7));
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [modal, setModal] = useState(null); // 'ingreso' | 'gasto' | 'venta'

  const range = useMemo(() => {
    const today = todayStr();
    if (period === "hoy") return [today, today];
    if (period === "semana") return [addDays(today, -6), today];
    if (period === "mes") {
      const d = new Date();
      const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      return [first, today];
    }
    return [customStart, customEnd];
  }, [period, customStart, customEnd]);

  const filtered = transactions.filter((t) => t.date >= range[0] && t.date <= range[1]);

  const ingresos = filtered.filter((t) => t.type.startsWith("ingreso")).reduce((s, t) => s + t.amount, 0);
  const egresos = filtered.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const neto = ingresos - egresos;

  // Proyección: turnos ya agendados (pendientes o confirmados, sin realizar todavía)
  // dentro del período elegido, valuados a precio de lista de cada servicio.
  const proyectado = appointments
    .filter((a) => (a.status === "pendiente" || a.status === "confirmado") && a.date >= range[0] && a.date <= range[1])
    .reduce((sum, a) => {
      const svc = services.find((s) => s.id === a.serviceId);
      return sum + (svc ? svc.price : 0);
    }, 0);
  const totalEstimado = ingresos + proyectado;

  const byCategory = CATEGORIES.map((c) => ({
    name: c.name, color: c.color,
    value: filtered.filter((t) => t.type === "ingreso_servicio" && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0),
  })).filter((c) => c.value > 0);

  const byEmployee = employees.map((e) => ({
    name: e.name.split(" ")[0], color: e.color,
    value: filtered.filter((t) => t.type === "ingreso_servicio" && t.employeeId === e.id).reduce((s, t) => s + t.amount, 0),
  })).filter((e) => e.value > 0).sort((a, b) => b.value - a.value);

  const last6Months = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const label = d.toLocaleDateString("es-AR", { month: "short" });
      const startS = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const nextD = new Date(y, m + 1, 1);
      const endS = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, "0")}-01`;
      const monthTx = transactions.filter((t) => t.date >= startS && t.date < endS);
      arr.push({
        mes: label,
        Ingresos: monthTx.filter((t) => t.type.startsWith("ingreso")).reduce((s, t) => s + t.amount, 0),
        Egresos: monthTx.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0),
      });
    }
    return arr;
  }, [transactions]);

  const removeTx = (tx) => {
    setTransactions(transactions.filter((t) => t.id !== tx.id));
    notify("Movimiento eliminado");
  };

  const periodLabel =
    period === "hoy" ? "Hoy" :
    period === "semana" ? "Últimos 7 días" :
    period === "mes" ? "Este mes" :
    `${range[0]} a ${range[1]}`;

  const sortedFiltered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsResumen = XLSX.utils.aoa_to_sheet([
      ["The Glam Room — Reporte financiero"],
      ["Período", periodLabel],
      ["Rango de fechas", `${range[0]} a ${range[1]}`],
      [],
      ["Ingresos", ingresos],
      ["Egresos", egresos],
      ["Ganancia neta", neto],
      ["Agendado (sin realizar)", proyectado],
      ["Total estimado del período", totalEstimado],
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    const movRows = [["Fecha", "Tipo", "Descripción", "Empleada / Categoría", "Monto"]];
    sortedFiltered.forEach((t) => {
      movRows.push([
        t.date,
        t.type === "egreso" ? "Gasto" : t.type === "ingreso_producto" ? "Venta de producto" : "Ingreso por servicio",
        t.description || "",
        t.employeeName || t.categoryName || "",
        t.type === "egreso" ? -t.amount : t.amount,
      ]);
    });
    const wsMov = XLSX.utils.aoa_to_sheet(movRows);
    XLSX.utils.book_append_sheet(wb, wsMov, "Movimientos");

    XLSX.writeFile(wb, `glamroom-finanzas-${range[0]}_${range[1]}.xlsx`);
    notify("Excel descargado");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("The Glam Room — Reporte financiero", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Período: ${periodLabel}  ·  ${range[0]} a ${range[1]}`, 14, 25);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 32,
      head: [["Indicador", "Monto"]],
      body: [
        ["Ingresos", formatMoney(ingresos)],
        ["Egresos", formatMoney(egresos)],
        ["Ganancia neta", formatMoney(neto)],
        ["Agendado (sin realizar)", formatMoney(proyectado)],
        ["Total estimado del período", formatMoney(totalEstimado)],
      ],
      theme: "plain",
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Fecha", "Tipo", "Descripción", "Detalle", "Monto"]],
      body: sortedFiltered.map((t) => [
        formatDateHuman(t.date),
        t.type === "egreso" ? "Gasto" : t.type === "ingreso_producto" ? "Venta" : "Servicio",
        t.description || "",
        t.employeeName || t.categoryName || "",
        (t.type === "egreso" ? "-" : "+") + formatMoney(t.amount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [110, 145, 121] },
    });

    doc.save(`glamroom-finanzas-${range[0]}_${range[1]}.pdf`);
    notify("PDF descargado");
  };

  return (
    <div>
      <div className="tab-header-row">
        <h2>Finanzas</h2>
        <div className="finance-actions">
          <button className="btn btn-tiny" onClick={() => setModal("ingreso")}><Plus size={14} /> Ingreso</button>
          <button className="btn btn-tiny" onClick={() => setModal("gasto")}><Plus size={14} /> Gasto</button>
          <button className="btn btn-tiny" onClick={() => setModal("venta")}><Plus size={14} /> Venta de producto</button>
          <button className="btn btn-tiny" onClick={exportToExcel}><Download size={14} /> Excel</button>
          <button className="btn btn-tiny" onClick={exportToPDF}><Download size={14} /> PDF</button>
        </div>
      </div>

      <div className="period-row">
        {["hoy", "semana", "mes", "rango"].map((p) => (
          <button key={p} className={`toggle-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
            {p === "hoy" ? "Hoy" : p === "semana" ? "Últimos 7 días" : p === "mes" ? "Este mes" : "Rango"}
          </button>
        ))}
        {period === "rango" && (
          <>
            <input className="date-input" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span className="muted">a</span>
            <input className="date-input" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label"><TrendingUp size={14} /> Ingresos</span>
          <span className="kpi-value kpi-positive">{formatMoney(ingresos)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label"><TrendingDown size={14} /> Egresos</span>
          <span className="kpi-value kpi-negative">{formatMoney(egresos)}</span>
        </div>
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label"><Wallet size={14} /> Ganancia neta</span>
          <span className={`kpi-value ${neto >= 0 ? "kpi-positive" : "kpi-negative"}`}>{formatMoney(neto)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label"><CalendarCheck size={14} /> Agendado (sin realizar)</span>
          <span className="kpi-value kpi-projected">{formatMoney(proyectado)}</span>
        </div>
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label"><Sparkles size={14} /> Total estimado del período</span>
          <span className="kpi-value kpi-projected">{formatMoney(totalEstimado)}</span>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: -10, marginBottom: 16 }}>
        "Agendado" son turnos pendientes o confirmados dentro del período que todavía no se realizaron ni cobraron —
        una proyección si se cumple lo agendado, valuado a precio de lista. No es plata ya en caja.
      </p>

      <div className="chart-grid">
        <div className="card chart-card">
          <h4>Ingresos por categoría de servicio</h4>
          {byCategory.length === 0 ? (
            <EmptyState icon={Sparkles} title="Sin datos en este período" hint="Completá turnos para ver la distribución." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "var(--ink)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E6DFD4", borderRadius: 8, color: "#3A3530" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => formatMoney(v)} fill="#3A3530" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card">
          <h4>Ranking por profesional</h4>
          {byEmployee.length === 0 ? (
            <EmptyState icon={Users} title="Sin datos en este período" hint="Completá turnos para ver quién facturó más." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byEmployee} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--ink)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E6DFD4", borderRadius: 8, color: "#3A3530" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byEmployee.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => formatMoney(v)} fill="#3A3530" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card chart-card">
        <h4>Evolución últimos 6 meses</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={last6Months} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD4" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--ink)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--ink)", fontSize: 11 }} axisLine={false} tickLine={false} width={70}
              tickFormatter={(v) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(v)} />
            <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E6DFD4", borderRadius: 8, color: "#3A3530" }} />
            <Bar dataKey="Ingresos" fill="#5C8268" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Egresos" fill="#B4574A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h4>Movimientos del período</h4>
        {filtered.length === 0 ? (
          <EmptyState icon={CircleDollarSign} title="Sin movimientos" hint="Los turnos completados y ventas de productos aparecen acá." />
        ) : (
          <div className="tx-table">
            {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
              <div key={t.id} className="tx-row">
                <span className="tx-date">{formatDateHuman(t.date)}</span>
                <span className="tx-desc">
                  {t.description}
                  {t.employeeName && <span className="muted small"> · {t.employeeName}</span>}
                </span>
                <span className={`tx-amount ${t.type === "egreso" ? "kpi-negative" : "kpi-positive"}`}>
                  {t.type === "egreso" ? "-" : "+"}{formatMoney(t.amount)}
                </span>
                <button className="icon-btn" onClick={() => removeTx(t)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BreakEvenSection
        services={services}
        fixedExpenses={fixedExpenses}
        setFixedExpenses={setFixedExpenses}
        transactions={transactions}
        setTransactions={setTransactions}
        notify={notify}
      />

      <Modal open={modal === "ingreso"} onClose={() => setModal(null)} title="Registrar ingreso manual">
        <ManualTxForm type="ingreso_servicio" onSave={(tx) => { setTransactions([...transactions, tx]); setModal(null); notify("Ingreso registrado"); }} />
      </Modal>
      <Modal open={modal === "gasto"} onClose={() => setModal(null)} title="Registrar gasto">
        <ExpenseForm onSave={(tx) => { setTransactions([...transactions, tx]); setModal(null); notify("Gasto registrado"); }} />
      </Modal>
      <Modal open={modal === "venta"} onClose={() => setModal(null)} title="Registrar venta de producto">
        <SaleForm
          products={products}
          onSave={({ tx, updatedProducts }) => {
            setTransactions([...transactions, tx]);
            setProducts(updatedProducts);
            setModal(null);
            notify("Venta registrada");
          }}
        />
      </Modal>
    </div>
  );
}

function ManualTxForm({ onSave }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  return (
    <div className="form-stack">
      <label className="field-label">Descripción</label>
      <input className="text-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Propina, seña, servicio no agendado" />
      <label className="field-label">Fecha</label>
      <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label className="field-label">Monto</label>
      <input className="text-input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <button
        className="btn btn-primary"
        disabled={!description.trim() || !amount || Number(amount) <= 0}
        onClick={() => onSave({
          id: uid(), type: "ingreso_servicio", date, amount: Number(amount),
          description: description.trim(), createdAt: Date.now(),
        })}
      >
        Guardar ingreso
      </button>
    </div>
  );
}

function ExpenseForm({ onSave }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  return (
    <div className="form-stack">
      <label className="field-label">Categoría</label>
      <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <label className="field-label">Descripción</label>
      <input className="text-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Alquiler julio" />
      <label className="field-label">Fecha</label>
      <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label className="field-label">Monto</label>
      <input className="text-input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <button
        className="btn btn-primary"
        disabled={!description.trim() || !amount || Number(amount) <= 0}
        onClick={() => onSave({
          id: uid(), type: "egreso", date, amount: Number(amount),
          description: `${category}: ${description.trim()}`, categoryName: category, createdAt: Date.now(),
        })}
      >
        Guardar gasto
      </button>
    </div>
  );
}

function SaleForm({ products, onSave }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(todayStr());
  const product = products.find((p) => p.id === productId);
  const total = product ? product.price * qty : 0;
  const overStock = product && qty > product.stock;

  if (products.length === 0) return <EmptyState icon={Package} title="No hay productos cargados" hint="Agregalos en la pestaña Productos." />;

  return (
    <div className="form-stack">
      <label className="field-label">Producto</label>
      <select className="select-input" value={productId} onChange={(e) => { setProductId(e.target.value); setQty(1); }}>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
      </select>
      <label className="field-label">Cantidad</label>
      <input className="text-input" type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <label className="field-label">Fecha</label>
      <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="summary-box"><span>Total: {formatMoney(total)}</span></div>
      {overStock && <span className="pin-error">No hay stock suficiente (disponible: {product.stock}).</span>}
      <button
        className="btn btn-primary"
        disabled={!product || qty <= 0 || overStock}
        onClick={() => {
          const tx = {
            id: uid(), type: "ingreso_producto", date, amount: total,
            description: `Venta: ${product.name} x${qty}`, productName: product.name,
            cost: (product.cost || 0) * qty, createdAt: Date.now(),
          };
          const updatedProducts = products.map((p) => p.id === productId ? { ...p, stock: p.stock - qty } : p);
          onSave({ tx, updatedProducts });
        }}
      >
        Registrar venta
      </button>
    </div>
  );
}

/* --------------------------- Gastos fijos y punto de equilibrio --------------------------- */

function BreakEvenSection({ services, fixedExpenses, setFixedExpenses, transactions, setTransactions, notify }) {
  const [modal, setModal] = useState(null);

  const totalFixed = fixedExpenses.reduce((s, fe) => s + fe.amount, 0);
  const monthKey = todayStr().slice(0, 7);
  const monthStart = monthKey + "-01";
  const registeredIds = new Set(
    transactions.filter((t) => t.fixedExpenseId && t.periodMonth === monthKey).map((t) => t.fixedExpenseId)
  );
  const pendingCount = fixedExpenses.filter((fe) => !registeredIds.has(fe.id)).length;

  const registerThisMonth = () => {
    const toAdd = fixedExpenses
      .filter((fe) => !registeredIds.has(fe.id))
      .map((fe) => ({
        id: uid(), type: "egreso", date: todayStr(), amount: fe.amount,
        description: `${fe.category}: ${fe.name}`, categoryName: fe.category,
        fixedExpenseId: fe.id, periodMonth: monthKey, createdAt: Date.now(),
      }));
    if (toAdd.length === 0) { notify("Ya estaban todos registrados este mes"); return; }
    setTransactions([...transactions, ...toAdd]);
    notify(`${toAdd.length} gasto(s) fijo(s) registrados en Finanzas`);
  };

  const removeFixed = (fe) => {
    setFixedExpenses(fixedExpenses.filter((x) => x.id !== fe.id));
    notify("Gasto fijo eliminado");
  };

  const breakEvenRows = services
    .filter((s) => s.price > 0)
    .map((s) => {
      const needed = totalFixed > 0 ? Math.ceil(totalFixed / s.price) : 0;
      const done = transactions.filter(
        (t) => t.type === "ingreso_servicio" && t.serviceId === s.id && t.date >= monthStart
      ).length;
      const pct = needed > 0 ? Math.min(100, Math.round((done / needed) * 100)) : 0;
      return { service: s, needed, done, pct };
    })
    .sort((a, b) => a.needed - b.needed);

  return (
    <div className="card">
      <div className="tab-header-row">
        <h4>Gastos fijos y punto de equilibrio</h4>
        <button className="btn btn-tiny" onClick={() => setModal("new")}><Plus size={14} /> Gasto fijo</button>
      </div>
      <p className="muted small" style={{ marginTop: -6 }}>
        Cargá acá tus costos que se repiten todos los meses (alquiler, sueldos, servicios) para calcular
        cuántos turnos de cada servicio necesitás para cubrirlos.
      </p>

      {fixedExpenses.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin gastos fijos cargados" hint="Agregá el alquiler, sueldos u otros costos mensuales." />
      ) : (
        <>
          <div className="list-simple">
            {fixedExpenses.map((fe) => (
              <div key={fe.id} className="list-row">
                <span className="list-row-main">{fe.name}</span>
                <span className="muted small">{fe.category}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{formatMoney(fe.amount)}</span>
                {registeredIds.has(fe.id) && (
                  <span className="admin-badge" style={{ color: "var(--money-pos)", borderColor: "var(--money-pos)" }}>
                    Este mes ✓
                  </span>
                )}
                <button className="icon-btn" onClick={() => removeFixed(fe)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="tab-header-row" style={{ marginTop: 12 }}>
            <span style={{ fontWeight: 600 }}>Total fijo mensual: {formatMoney(totalFixed)}</span>
            <button className="btn btn-tiny" onClick={registerThisMonth} disabled={pendingCount === 0}>
              {pendingCount === 0 ? "Ya cargados este mes" : `Registrar ${pendingCount} en Finanzas`}
            </button>
          </div>

          {breakEvenRows.length > 0 && (
            <div className="breakeven-table" style={{ marginTop: 16 }}>
              {breakEvenRows.map((row) => (
                <div key={row.service.id} className="breakeven-row">
                  <div className="breakeven-name">
                    <span className="bulb" style={{ "--bulb-color": categoryById(row.service.categoryId)?.color, width: 9, height: 9 }} />
                    {row.service.name}
                  </div>
                  <div className="breakeven-bar-track">
                    <div className="breakeven-bar-fill" style={{ width: `${row.pct}%` }} />
                  </div>
                  <div className="breakeven-count">{row.done} / {row.needed} turnos</div>
                </div>
              ))}
            </div>
          )}
          {breakEvenRows.length === 0 && (
            <p className="muted small" style={{ marginTop: 12 }}>
              Cargá precios reales en tus servicios (Servicios y equipo) para ver el cálculo por servicio.
            </p>
          )}
        </>
      )}

      <Modal open={modal === "new"} onClose={() => setModal(null)} title="Nuevo gasto fijo">
        <FixedExpenseForm
          onSave={(fe) => { setFixedExpenses([...fixedExpenses, { ...fe, id: uid() }]); setModal(null); notify("Gasto fijo agregado"); }}
        />
      </Modal>
    </div>
  );
}

function FixedExpenseForm({ onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  return (
    <div className="form-stack">
      <label className="field-label">Nombre</label>
      <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Alquiler del local" />
      <label className="field-label">Categoría</label>
      <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <label className="field-label">Monto mensual</label>
      <input className="text-input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !amount || Number(amount) <= 0}
        onClick={() => onSave({ name: name.trim(), category, amount: Number(amount) })}
      >
        Guardar gasto fijo
      </button>
    </div>
  );
}

/* --------------------------- Equipo tab --------------------------- */

function EquipoTab({ services, setServices, employees, setEmployees, notify }) {
  const [svcModal, setSvcModal] = useState(null); // null | 'new' | service object
  const [empModal, setEmpModal] = useState(null);

  const importCatalog = () => {
    const existingNames = new Set(services.map((s) => s.name.trim().toLowerCase()));
    const toAdd = SEED_SERVICES
      .filter((s) => !existingNames.has(s.name.trim().toLowerCase()))
      .map((s) => ({ ...s, id: uid() }));
    if (toAdd.length === 0) {
      notify("Ya tenías todos esos servicios cargados");
      return;
    }
    setServices([...services, ...toAdd]);
    notify(`Se agregaron ${toAdd.length} servicios. Revisá precios y duraciones.`);
  };

  return (
    <div>
      <div className="tab-header-row">
        <h2>Servicios y equipo</h2>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="tab-header-row">
            <h4>Servicios</h4>
            <div className="finance-actions">
              <button className="btn btn-tiny" onClick={importCatalog}><Sparkles size={14} /> Cargar catálogo de Glam Room</button>
              <button className="btn btn-tiny" onClick={() => setSvcModal("new")}><Plus size={14} /> Servicio</button>
            </div>
          </div>
          {services.length === 0 ? (
            <EmptyState icon={Scissors} title="Sin servicios" hint="Agregá el primero para empezar a recibir turnos, o cargá el catálogo completo con el botón de arriba." />
          ) : (
            <div className="list-simple">
              {services.map((s) => {
                const cat = categoryById(s.categoryId);
                return (
                  <div key={s.id} className="list-row">
                    <span className="bulb" style={{ "--bulb-color": cat?.color, width: 10, height: 10 }} />
                    <span className="list-row-main">{s.name}</span>
                    <span className="muted small">{s.duration} min · {formatMoney(s.price)}</span>
                    <button className="icon-btn" onClick={() => setSvcModal(s)}><Pencil size={14} /></button>
                    <button className="icon-btn" onClick={() => { setServices(services.filter((x) => x.id !== s.id)); notify("Servicio eliminado"); }}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="tab-header-row">
            <h4>Equipo</h4>
            <button className="btn btn-tiny" onClick={() => setEmpModal("new")}><Plus size={14} /> Profesional</button>
          </div>
          {employees.length === 0 ? (
            <EmptyState icon={Users} title="Sin profesionales" hint="Agregá a tu equipo para asignarles servicios." />
          ) : (
            <div className="list-simple">
              {employees.map((e) => (
                <div key={e.id} className="list-row">
                  <Avatar name={e.name} color={e.color} size={22} />
                  <span className="list-row-main">
                    {e.name}
                    {e.isAdmin && <span className="admin-badge">Administradora</span>}
                  </span>
                  <span className="muted small">{e.serviceIds?.length || 0} servicios</span>
                  <button className="icon-btn" onClick={() => setEmpModal(e)}><Pencil size={14} /></button>
                  <button className="icon-btn" onClick={() => { setEmployees(employees.filter((x) => x.id !== e.id)); notify("Profesional eliminada"); }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!svcModal} onClose={() => setSvcModal(null)} title={svcModal === "new" ? "Nuevo servicio" : "Editar servicio"}>
        <ServiceForm
          initial={svcModal !== "new" ? svcModal : null}
          onSave={(data) => {
            if (svcModal === "new") setServices([...services, { ...data, id: uid() }]);
            else setServices(services.map((s) => (s.id === svcModal.id ? { ...s, ...data } : s)));
            setSvcModal(null);
            notify("Servicio guardado");
          }}
        />
      </Modal>

      <Modal open={!!empModal} onClose={() => setEmpModal(null)} title={empModal === "new" ? "Nueva profesional" : "Editar profesional"}>
        <EmployeeForm
          services={services}
          initial={empModal !== "new" ? empModal : null}
          onSave={(data) => {
            if (empModal === "new") setEmployees([...employees, { ...data, id: uid() }]);
            else setEmployees(employees.map((e) => (e.id === empModal.id ? { ...e, ...data } : e)));
            setEmpModal(null);
            notify("Profesional guardada");
          }}
        />
      </Modal>
    </div>
  );
}

function ServiceForm({ initial, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || CATEGORIES[0].id);
  const [duration, setDuration] = useState(initial?.duration || 30);
  const [price, setPrice] = useState(initial?.price || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [variablePrice, setVariablePrice] = useState(initial?.variablePrice || false);
  return (
    <div className="form-stack">
      <label className="field-label">Nombre del servicio</label>
      <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Manicura semipermanente" />
      <label className="field-label">Categoría</label>
      <select className="select-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label className="field-label">Duración (minutos)</label>
      <input className="text-input" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      <label className="field-label">Precio {variablePrice ? "de referencia" : ""}</label>
      <input className="text-input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
      <label className="checkbox-row">
        <input type="checkbox" checked={variablePrice} onChange={(e) => setVariablePrice(e.target.checked)} />
        Precio y duración variables (se definen en cada turno, ej. maquillaje o peinado)
      </label>
      {variablePrice && (
        <span className="muted small">
          Al cargar un turno manual de este servicio, la profesional va a poder ajustar la duración y el
          precio para esa vez puntual. En la reserva online de la clienta se va a mostrar "precio a
          coordinar con el local" en vez de un monto fijo.
        </span>
      )}
      <label className="field-label">Descripción breve (la ve la clienta al elegir el servicio)</label>
      <textarea
        className="text-input" rows={3} style={{ resize: "vertical", fontFamily: "inherit" }}
        value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Ej: Limpieza en profundidad de poros para una piel renovada."
      />
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !price || Number(price) < 0}
        onClick={() => onSave({ name: name.trim(), categoryId, duration: Number(duration), price: Number(price), description: description.trim(), variablePrice })}
      >
        Guardar servicio
      </button>
    </div>
  );
}

function EmployeeForm({ services, initial, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || EMPLOYEE_COLORS[0]);
  const [serviceIds, setServiceIds] = useState(initial?.serviceIds || []);
  const [isAdmin, setIsAdmin] = useState(initial?.isAdmin || false);
  const [paymentLink, setPaymentLink] = useState(initial?.paymentLink || "");
  const [pin, setPin] = useState(initial?.pin || "");
  const [timeOff, setTimeOff] = useState(initial?.timeOff || []);
  const [toStart, setToStart] = useState(todayStr());
  const [toEnd, setToEnd] = useState(todayStr());
  const [toReason, setToReason] = useState("");

  const toggleService = (id) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTimeOff = () => {
    if (toEnd < toStart) return;
    setTimeOff([...timeOff, { id: uid(), start: toStart, end: toEnd, reason: toReason.trim() }]);
    setToReason("");
  };

  const allSelected = services.length > 0 && serviceIds.length === services.length;

  return (
    <div className="form-stack">
      <label className="field-label">Nombre</label>
      <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
      <label className="field-label">Color identificador</label>
      <div className="color-picker">
        {EMPLOYEE_COLORS.map((c) => (
          <button key={c} className={`color-swatch ${color === c ? "selected" : ""}`} style={{ "--swatch-color": c }} onClick={() => setColor(c)} />
        ))}
      </div>

      <div className="tab-header-row" style={{ marginBottom: 0, marginTop: 6 }}>
        <label className="field-label" style={{ margin: 0 }}>Servicios que realiza</label>
        {services.length > 0 && (
          <button
            className="link-btn"
            onClick={() => setServiceIds(allSelected ? [] : services.map((s) => s.id))}
          >
            {allSelected ? "Ninguno" : "Marcar todos"}
          </button>
        )}
      </div>
      {services.length === 0 ? (
        <span className="muted small">Cargá servicios primero.</span>
      ) : (
        <div className="checkbox-list">
          {services.map((s) => (
            <label key={s.id} className="checkbox-row">
              <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      )}

      <label className="field-label" style={{ marginTop: 8 }}>Link de pago de seña (propio de esta profesional)</label>
      <input
        className="text-input"
        value={paymentLink}
        onChange={(e) => setPaymentLink(e.target.value)}
        placeholder="https://mpago.la/... (opcional)"
      />
      <span className="muted small">
        Si lo dejás vacío, se usa el link general del local (Panel → Ajustes) cuando corresponda.
      </span>

      <label className="field-label" style={{ marginTop: 8 }}>Vacaciones / días libres</label>
      {timeOff.length > 0 && (
        <div className="list-simple">
          {timeOff.map((t) => (
            <div key={t.id} className="list-row">
              <span className="list-row-main">
                {formatDateHuman(t.start)}{t.end !== t.start ? ` — ${formatDateHuman(t.end)}` : ""}
              </span>
              {t.reason && <span className="muted small">{t.reason}</span>}
              <button className="icon-btn" onClick={() => setTimeOff(timeOff.filter((x) => x.id !== t.id))}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="timeoff-add-row">
        <input className="date-input" type="date" value={toStart} onChange={(e) => { setToStart(e.target.value); if (toEnd < e.target.value) setToEnd(e.target.value); }} />
        <span className="muted small">a</span>
        <input className="date-input" type="date" value={toEnd} min={toStart} onChange={(e) => setToEnd(e.target.value)} />
        <input className="text-input" value={toReason} onChange={(e) => setToReason(e.target.value)} placeholder="Motivo (opcional)" />
        <button className="btn btn-tiny" onClick={addTimeOff}><Plus size={14} /> Agregar</button>
      </div>
      <span className="muted small">
        Esos días, esta profesional no va a aparecer disponible ni para clientas ni para turnos manuales.
      </span>

      <label className="checkbox-row" style={{ marginTop: 8 }}>
        <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
        Rol de administradora (acceso completo al panel, incluida Finanzas)
      </label>

      <label className="field-label" style={{ marginTop: 8 }}>PIN personal para ingresar al panel</label>
      <input
        className="text-input" value={pin} maxLength={8}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Ej: 4821"
      />
      <span className="muted small">
        Con este PIN y su nombre, esta persona entra a su propio panel. Si es administradora, ve todo;
        si no, solo ve su propia agenda y sus propios ingresos.
      </span>

      <button
        className="btn btn-primary"
        disabled={!name.trim()}
        onClick={() => onSave({ name: name.trim(), color, serviceIds, isAdmin, paymentLink: paymentLink.trim(), timeOff, pin: pin.trim() })}
      >
        Guardar profesional
      </button>
    </div>
  );
}

/* --------------------------- Productos tab --------------------------- */

function ProductosTab({ products, setProducts, notify }) {
  const [modal, setModal] = useState(null);

  return (
    <div>
      <div className="tab-header-row">
        <h2>Productos</h2>
        <button className="btn btn-primary" onClick={() => setModal("new")}><Plus size={16} /> Producto</button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Sin productos cargados" hint="Agregá los productos que vendés en el local." />
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id} className="card product-card">
              <div className="tab-header-row">
                <strong>{p.name}</strong>
                <div>
                  <button className="icon-btn" onClick={() => setModal(p)}><Pencil size={14} /></button>
                  <button className="icon-btn" onClick={() => { setProducts(products.filter((x) => x.id !== p.id)); notify("Producto eliminado"); }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="muted small">Precio: {formatMoney(p.price)} · Costo: {formatMoney(p.cost)}</div>
              <div className={`stock-badge ${p.stock <= 3 ? "stock-low" : ""}`}>Stock: {p.stock}</div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nuevo producto" : "Editar producto"}>
        <ProductForm
          initial={modal !== "new" ? modal : null}
          onSave={(data) => {
            if (modal === "new") setProducts([...products, { ...data, id: uid() }]);
            else setProducts(products.map((p) => (p.id === modal.id ? { ...p, ...data } : p)));
            setModal(null);
            notify("Producto guardado");
          }}
        />
      </Modal>
    </div>
  );
}

function ProductForm({ initial, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [cost, setCost] = useState(initial?.cost ?? "");
  const [stock, setStock] = useState(initial?.stock ?? 0);
  return (
    <div className="form-stack">
      <label className="field-label">Nombre</label>
      <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Esmalte semipermanente" />
      <label className="field-label">Precio de venta</label>
      <input className="text-input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
      <label className="field-label">Costo</label>
      <input className="text-input" type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
      <label className="field-label">Stock actual</label>
      <input className="text-input" type="number" min="0" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
      <button
        className="btn btn-primary"
        disabled={!name.trim() || price === ""}
        onClick={() => onSave({ name: name.trim(), price: Number(price), cost: Number(cost || 0), stock: Number(stock) })}
      >
        Guardar producto
      </button>
    </div>
  );
}

/* --------------------------- Ajustes tab --------------------------- */

function AjustesTab({ settings, setSettings, gallery, setGallery, notify }) {
  const [adminPin, setAdminPin] = useState(settings.adminPin || settings.pin || "1234");
  const [paymentLink, setPaymentLink] = useState(settings.paymentLink || "");
  const [depositNote, setDepositNote] = useState(settings.depositNote || "");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // permite volver a elegir el mismo archivo más tarde
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("gallery").upload(path, file);
      if (error) {
        notify("No se pudo subir " + file.name, "error");
        continue;
      }
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      uploaded.push({ id: uid(), url: data.publicUrl, path });
    }
    if (uploaded.length > 0) {
      await setGallery([...gallery, ...uploaded]);
      notify(`${uploaded.length} foto(s) agregadas a la galería`);
    }
    setUploading(false);
  };

  const handleDelete = async (img) => {
    await supabase.storage.from("gallery").remove([img.path]);
    setGallery(gallery.filter((g) => g.id !== img.id));
    notify("Foto eliminada");
  };

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h4>Ajustes del panel</h4>
      <label className="field-label">PIN maestro (administración general)</label>
      <input className="text-input" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} maxLength={8} />
      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={() => { setSettings({ ...settings, adminPin }); notify("PIN actualizado"); }}
      >
        Guardar PIN
      </button>
      <p className="muted small" style={{ marginTop: 14 }}>
        Este PIN es un acceso general de respaldo (para vos, la dueña). Cada profesional ahora tiene su
        propio nombre y PIN personal, configurable en <strong>Servicios y equipo</strong>, editando a cada
        una: si la marcás como administradora, ve todo igual que con este PIN; si no, solo ve su propia
        agenda ("Mi agenda") y sus propios ingresos ("Mis ingresos").
      </p>

      <hr className="settings-divider" />

      <h4>Pago de seña</h4>
      <label className="field-label">Link de pago (Mercado Pago u otro)</label>
      <input
        className="text-input"
        value={paymentLink}
        onChange={(e) => setPaymentLink(e.target.value)}
        placeholder="https://mpago.la/..."
      />
      <label className="field-label">Mensaje para la clienta (opcional)</label>
      <input
        className="text-input"
        value={depositNote}
        onChange={(e) => setDepositNote(e.target.value)}
        placeholder="Ej: La seña es de $5.000 y se descuenta del total"
      />
      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={() => { setSettings({ ...settings, paymentLink: paymentLink.trim(), depositNote: depositNote.trim() }); notify("Datos de seña actualizados"); }}
      >
        Guardar datos de seña
      </button>
      <p className="muted small" style={{ marginTop: 14 }}>
        Cuando cargues un link, tus clientas van a ver un botón "Pagar seña ahora" al confirmar su turno,
        y vos vas a poder marcar en cada turno si la seña ya fue pagada.
      </p>

      <hr className="settings-divider" />

      <h4>Galería de fotos</h4>
      <p className="muted small" style={{ marginTop: -6 }}>
        Estas fotos van pasando en un carrusel, abajo del todo, mientras la clienta elige su turno.
      </p>
      <label className="btn btn-tiny" style={{ display: "inline-flex", cursor: "pointer", width: "fit-content" }}>
        <Plus size={14} /> {uploading ? "Subiendo…" : "Subir fotos"}
        <input
          type="file" accept="image/*" multiple
          onChange={handleUpload} disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {gallery.length === 0 ? (
        <p className="muted small" style={{ marginTop: 10 }}>Todavía no subiste ninguna foto.</p>
      ) : (
        <div className="gallery-grid">
          {gallery.map((img) => (
            <div key={img.id} className="gallery-thumb">
              <img src={img.url} alt="" />
              <button className="gallery-thumb-remove" onClick={() => handleDelete(img)} title="Eliminar foto">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Estilos globales                                                       */
/* ---------------------------------------------------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

      .glam-root {
        --bg: #FBF8F4;
        --surface: #FFFFFF;
        --surface-2: #F2EEE7;
        --border: #E6DFD4;
        --ink: #3A3530;
        --sage: #6E9179;
        --clay: #C68A6E;
        --money-pos: #5C8268;
        --money-neg: #B4574A;
        --muted: #8B8175;
        --ease: cubic-bezier(0.16, 1, 0.3, 1);

        background: var(--bg);
        color: var(--ink);
        font-family: 'Work Sans', sans-serif;
        min-height: 100vh;
        width: 100%;
      }

      .glam-root * { box-sizing: border-box; }

      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes overlayFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalPop {
        from { opacity: 0; transform: scale(0.96) translateY(6px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translate(-50%, 10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      .loading-root { display: flex; align-items: center; justify-content: center; min-height: 300px; }
      .loading-box { display: flex; align-items: center; gap: 10px; color: var(--sage); font-family: 'Fraunces', serif; font-size: 18px; }
      .spin-slow { animation: spin 2.2s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .glam-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 22px; border-bottom: 1px solid var(--border);
        flex-wrap: wrap; gap: 12px; position: relative; overflow: hidden;
      }
      .glam-header::before {
        content: ""; position: absolute; top: -70px; left: -40px; width: 240px; height: 240px;
        background: radial-gradient(circle, rgba(110, 145, 121, 0.16), transparent 70%);
        pointer-events: none;
      }
      .brand { display: flex; align-items: center; gap: 10px; position: relative; }
      .brand-mark {
        color: var(--sage); font-size: 20px; display: inline-flex; transition: transform 0.5s var(--ease);
      }
      .brand:hover .brand-mark { transform: rotate(18deg) scale(1.2); }
      .brand-text { display: flex; flex-direction: column; line-height: 1.15; }
      .brand-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; letter-spacing: 0.2px; }
      .brand-sub { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; }

      .view-toggle { display: flex; gap: 6px; background: var(--surface); padding: 4px; border-radius: 999px; }
      .toggle-btn {
        border: none; background: transparent; color: var(--muted); padding: 8px 16px; border-radius: 999px;
        font-family: 'Work Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer;
        transition: background-color 0.22s var(--ease), color 0.22s var(--ease);
      }
      .toggle-btn.active { background: var(--sage); color: #FFFFFF; }

      .main-area { padding: 20px 22px 60px; max-width: 1100px; margin: 0 auto; }

      /* Bulb divider (signature motif) */
      .bulb-divider { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; padding: 6px 0 22px; }
      .bulb-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
      .bulb {
        width: 12px; height: 12px; border-radius: 50%; display: inline-block;
        background: var(--bulb-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bulb-color) 18%, transparent);
      }
      @media (prefers-reduced-motion: reduce) {
        .glam-root *, .glam-root *::before, .glam-root *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }
      .bulb-label { white-space: nowrap; }

      /* Cards */
      .card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
        padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 4px 18px rgba(58, 53, 48, 0.06);
        animation: fadeSlideIn 0.4s var(--ease) both;
      }
      .center-card { max-width: 460px; margin: 40px auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .card h2, .card h3, .card h4 { font-family: 'Fraunces', serif; font-weight: 600; margin: 0 0 12px; }
      .muted { color: var(--muted); }
      .small { font-size: 12px; }

      /* Buttons */
      .btn {
        border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600;
        cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: 'Work Sans', sans-serif;
        transition: transform 0.22s var(--ease), opacity 0.2s var(--ease), background-color 0.2s var(--ease),
                    border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
      }
      .btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn:not(:disabled):active { transform: scale(0.965); }
      @media (hover: hover) {
        .btn-primary:not(:disabled):hover { box-shadow: 0 4px 14px rgba(110, 145, 121, 0.28); transform: translateY(-1px); }
        .btn-tiny:not(:disabled):hover, .btn-ghost:not(:disabled):hover { background: var(--surface-2); border-color: var(--sage); }
      }
      .btn-primary { background: var(--sage); color: #FFFFFF; }
      .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
      .btn-success { background: var(--money-pos); color: #FFFFFF; }
      .btn-tiny { padding: 6px 12px; font-size: 12.5px; background: var(--surface-2); color: var(--ink); border: 1px solid var(--border); }
      .icon-btn {
        background: transparent; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 8px;
        display: inline-flex; transition: background-color 0.18s var(--ease), color 0.18s var(--ease), transform 0.18s var(--ease);
      }
      .icon-btn:hover { background: var(--surface-2); color: var(--ink); }
      .icon-btn.reminder-sent { color: var(--money-pos); }
      .icon-btn:active { transform: scale(0.92); }
      .link-btn { background: none; border: none; color: var(--sage); font-size: 12px; cursor: pointer; text-decoration: underline; padding: 0; }

      /* PIN gate */
      .pin-gate { max-width: 320px; margin: 60px auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--sage); }
      .pin-gate h2 { font-family: 'Fraunces', serif; color: var(--ink); margin: 4px 0 0; }
      .pin-gate p { color: var(--muted); font-size: 13px; margin: 0; }
      .pin-input {
        font-family: 'IBM Plex Mono', monospace; font-size: 22px; letter-spacing: 6px; text-align: center;
        background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px; color: var(--ink); width: 140px;
      }
      .pin-error { color: var(--money-neg); font-size: 12px; }
      .pin-hint { color: var(--muted); font-size: 11px; margin-top: 6px; }

      /* Wizard (booking) */
      .booking-wizard { max-width: 640px; margin: 0 auto; }
      .wizard-steps { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
      .wizard-step { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
      .wizard-step.active { color: var(--ink); }
      .wizard-step-num {
        width: 20px; height: 20px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center;
        justify-content: center; font-size: 11px; border: 1px solid var(--border);
      }
      .wizard-step.active .wizard-step-num { background: var(--sage); color: #FFFFFF; border-color: var(--sage); }
      .wizard-step.done .wizard-step-num { background: var(--money-pos); color: #FFFFFF; border-color: var(--money-pos); }
      .wizard-actions { display: flex; justify-content: space-between; margin-top: 16px; }

      
      .accordion { display: flex; flex-direction: column; gap: 8px; }
      .accordion-item {
        background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
        transition: border-color 0.25s var(--ease);
      }
      .accordion-item.has-selection { border-color: var(--sage); }
      .accordion-header {
        width: 100%; display: flex; align-items: center; gap: 8px; background: transparent; border: none;
        color: var(--ink); padding: 13px 14px; cursor: pointer; font-family: 'Work Sans', sans-serif; font-size: 14px; text-align: left;
        transition: background-color 0.2s var(--ease);
      }
      .accordion-header:active { background: var(--border); }
      @media (hover: hover) {
        .accordion-header:hover { background: var(--surface-2); }
        .accordion-header:hover .accordion-chevron { color: var(--sage); }
      }
      .accordion-title { flex: 1; font-weight: 500; }
      .accordion-chevron { color: var(--muted); transition: transform 0.3s var(--ease); flex-shrink: 0; }
      .accordion-chevron.open { transform: rotate(180deg); }
      .accordion-body-wrap {
        display: grid; grid-template-rows: 0fr;
        transition: grid-template-rows 0.32s var(--ease);
      }
      .accordion-body-wrap.open { grid-template-rows: 1fr; }
      .accordion-body {
        display: flex; flex-direction: column; border-top: 1px solid var(--border); overflow: hidden; min-height: 0;
      }
      .service-row {
        display: flex; justify-content: space-between; align-items: center; text-align: left;
        background: transparent; border: none; border-bottom: 1px solid var(--border); padding: 11px 14px;
        color: var(--ink); cursor: pointer; font-family: 'Work Sans', sans-serif; font-size: 13.5px;
        transition: background-color 0.2s var(--ease), color 0.2s var(--ease), padding-left 0.2s var(--ease);
      }
      .service-row:last-child { border-bottom: none; }
      .service-row.selected { background: #E8EFE9; color: var(--sage); }
      @media (hover: hover) {
        .service-row:hover:not(.selected) { background: var(--surface-2); padding-left: 18px; }
      }
      .service-row .service-meta { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); }
      .service-row.selected .service-meta { color: var(--sage); opacity: 0.8; }

      .employee-grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .employee-option {
        display: flex; flex-direction: column; align-items: center; gap: 6px; background: var(--surface-2);
        border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; color: var(--ink); cursor: pointer; min-width: 90px;
        transition: background-color 0.2s var(--ease), border-color 0.2s var(--ease), transform 0.15s var(--ease);
      }
      .employee-option.selected { border-color: var(--sage); background: #E8EFE9; }
      .employee-option:active { transform: scale(0.97); }
      @media (hover: hover) {
        .employee-option:hover:not(.selected) { border-color: var(--sage); transform: translateY(-2px); box-shadow: 0 8px 16px rgba(58, 53, 48, 0.08); }
      }

      .avatar {
        border-radius: 50%; background: var(--avatar-color); display: inline-flex; align-items: center; justify-content: center;
        font-weight: 700; color: #FFFFFF; font-family: 'Work Sans', sans-serif; flex-shrink: 0;
      }

      .date-input, .text-input, .select-input {
        background: var(--surface-2); border: 1px solid var(--border); color: var(--ink); border-radius: 8px;
        padding: 9px 11px; font-size: 14px; font-family: 'Work Sans', sans-serif; width: 100%;
        transition: border-color 0.2s var(--ease);
      }
      .date-input:focus, .text-input:focus, .select-input:focus { border-color: var(--sage); outline: none; }
      .date-input { width: auto; }
      .service-select { padding: 13px 12px; font-size: 15px; border-radius: 10px; }
      .field-label { font-size: 12px; color: var(--muted); margin: 6px 0 -4px; text-transform: uppercase; letter-spacing: 0.4px; }

      .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; margin-top: 8px; }
      .slot-btn {
        background: var(--surface-2); border: 1px solid var(--border); color: var(--ink); border-radius: 8px;
        padding: 8px 4px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; cursor: pointer;
        transition: background-color 0.18s var(--ease), border-color 0.18s var(--ease), color 0.18s var(--ease), transform 0.15s var(--ease);
      }
      .slot-btn.selected { border-color: var(--sage); background: #E8EFE9; color: var(--sage); }
      .slot-btn:active { transform: scale(0.94); }
      @media (hover: hover) {
        .slot-btn:hover:not(.selected) { border-color: var(--sage); color: var(--sage); transform: translateY(-1px); }
      }

      .summary-box {
        display: flex; flex-direction: column; gap: 6px; background: var(--surface-2); border-radius: 10px; padding: 12px 14px; margin: 10px 0;
        font-size: 13.5px; animation: fadeSlideIn 0.3s var(--ease) both;
      }
      .summary-box div { display: flex; align-items: center; gap: 8px; }
      .service-description { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.4; }

      /* Panel */
      .panel-shell { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
      .tab-rail { display: flex; flex-direction: column; gap: 4px; min-width: 190px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 8px; }
      .tab-btn {
        display: flex; align-items: center; gap: 10px; text-align: left; background: transparent; border: none;
        color: var(--muted); padding: 10px 12px; border-radius: 9px; cursor: pointer; font-size: 13.5px; font-family: 'Work Sans', sans-serif;
        transition: background-color 0.2s var(--ease), color 0.2s var(--ease), padding-left 0.2s var(--ease);
      }
      .tab-btn.active { background: var(--surface-2); color: var(--ink); }
      .tab-btn:hover:not(.active) { background: #F2EEE7; padding-left: 16px; }
      .panel-content { flex: 1; min-width: 280px; }
      .tab-rail-me {
        display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 6px;
        border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600;
      }
      .role-badge {
        margin-top: 6px; font-size: 10.5px; text-align: center; color: var(--muted); border: 1px dashed var(--border);
        border-radius: 8px; padding: 6px 8px;
      }
      .admin-badge {
        font-size: 10px; color: var(--sage); border: 1px solid var(--sage); border-radius: 999px;
        padding: 1px 8px; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.4px;
      }

      @media (max-width: 720px) {
        .tab-rail { flex-direction: row; overflow-x: auto; width: 100%; }
        .tab-btn span { display: none; }
      }

      .tab-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
      .finance-actions { display: flex; gap: 8px; flex-wrap: wrap; }

      .day-nav { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
      .day-nav-label { display: flex; align-items: center; gap: 8px; font-size: 14px; min-width: 140px; }

      .status-strip { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
      .status-chip, .status-badge {
        font-size: 11px; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--chip-color); color: var(--chip-color);
        transition: opacity 0.2s var(--ease);
      }

      .payment-chip {
        font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid transparent; cursor: pointer;
        font-family: 'Work Sans', sans-serif; font-weight: 600;
        transition: background-color 0.22s var(--ease), color 0.22s var(--ease), border-color 0.22s var(--ease), transform 0.15s var(--ease);
      }
      .payment-chip:active { transform: scale(0.95); }
      .payment-chip.payment-pendiente { background: rgba(139, 129, 117, 0.14); color: var(--muted); border-color: var(--muted); }
      .payment-chip.payment-sena { background: rgba(198, 138, 110, 0.16); color: var(--clay); border-color: var(--clay); }
      .payment-chip.payment-completo { background: rgba(92, 130, 104, 0.16); color: var(--money-pos); border-color: var(--money-pos); }

      .settings-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0 14px; }
      .deposit-box { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 6px 0; }

      .appt-list { display: flex; flex-direction: column; gap: 10px; }
      .appt-card {
        display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border);
        border-left: 4px solid var(--cat-color); border-radius: 10px; padding: 12px 14px; flex-wrap: wrap;
        transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.25s var(--ease);
      }
      @media (hover: hover) {
        .appt-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(58, 53, 48, 0.09); border-color: var(--cat-color); }
      }
      .appt-time { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--sage); min-width: 52px; }
      .appt-info { flex: 1; min-width: 200px; }
      .appt-main-line { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
      .combo-badge {
        font-size: 10px; color: var(--clay); border: 1px solid var(--clay); border-radius: 999px;
        padding: 1px 8px; text-transform: uppercase; letter-spacing: 0.4px;
      }

      .loyalty-card { background: linear-gradient(135deg, var(--surface) 60%, #F2EEE7); }
      .loyalty-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 10px 0; }
      .loyalty-stamp {
        aspect-ratio: 1; border-radius: 50%; border: 1.5px dashed var(--border); display: flex;
        align-items: center; justify-content: center; color: var(--muted); font-size: 13px;
        font-family: 'IBM Plex Mono', monospace; transition: all 0.25s var(--ease);
      }
      .loyalty-stamp.filled {
        border: 1.5px solid var(--sage); background: var(--sage); color: #FFFFFF;
        animation: fadeSlideIn 0.4s var(--ease) both;
      }
      .loyalty-message { font-size: 12.5px; color: var(--muted); margin: 6px 0 0; }
      .loyalty-message.loyalty-complete { color: var(--sage); font-weight: 600; }

      .appt-sub-line { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); }
      .appt-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

      .day-calendar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
      .day-calendar-ruler { flex: 0 0 40px; position: relative; height: 640px; margin-top: 34px; }
      .day-calendar-ruler-mark {
        position: absolute; font-size: 10.5px; color: var(--muted); transform: translateY(-50%);
        font-family: 'IBM Plex Mono', monospace;
      }
      .day-calendar-columns { display: flex; gap: 8px; flex: 1; min-width: 0; }
      .day-calendar-col { flex: 0 0 160px; min-width: 160px; }
      .day-calendar-col-header {
        display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; height: 26px;
        margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .day-calendar-col-body {
        position: relative; height: 640px; background: var(--surface); border: 1px solid var(--border);
        border-radius: 10px; overflow: hidden;
      }
      .day-calendar-gridline { position: absolute; left: 0; right: 0; height: 1px; background: var(--border); opacity: 0.7; }
      .day-calendar-empty {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        font-size: 11.5px; color: var(--muted);
      }
      .day-calendar-leave {
        position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 4px; background: repeating-linear-gradient(
          135deg, var(--surface-2), var(--surface-2) 8px, var(--border) 8px, var(--border) 16px
        );
        color: var(--muted); font-size: 11.5px; font-weight: 600;
      }
      .day-calendar-block {
        position: absolute; left: 4px; right: 4px; min-height: 26px; border-radius: 6px;
        background: color-mix(in srgb, var(--block-color) 20%, white); border-left: 3px solid var(--block-color);
        padding: 3px 6px; text-align: left; cursor: pointer; overflow: hidden; display: flex;
        flex-direction: column; gap: 1px; font-family: 'Work Sans', sans-serif;
        transition: transform 0.15s var(--ease), box-shadow 0.2s var(--ease), opacity 0.2s var(--ease);
      }
      .day-calendar-block:active { transform: scale(0.97); }
      @media (hover: hover) {
        .day-calendar-block:hover { box-shadow: 0 2px 8px rgba(58, 53, 48, 0.14); z-index: 2; }
      }
      .day-calendar-block.status-cancelado { opacity: 0.45; text-decoration: line-through; }
      .day-calendar-block.status-completado { background: color-mix(in srgb, var(--block-color) 32%, white); }
      .day-calendar-block-time { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; color: var(--ink); }
      .day-calendar-block-title { font-size: 11px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      @media (max-width: 600px) {
        .day-calendar-col { flex: 0 0 130px; min-width: 130px; }
      }

      .period-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
      .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 18px; }
      .kpi-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;
        transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.25s var(--ease);
      }
      @media (hover: hover) {
        .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(58, 53, 48, 0.09); border-color: var(--sage); }
      }
      .kpi-highlight { border-color: var(--sage); }
      .kpi-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
      .kpi-value { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 600; }
      .kpi-positive { color: var(--money-pos); }
      .kpi-negative { color: var(--money-neg); }
      .kpi-projected { color: var(--clay); }

      .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px; }
      .chart-card h4 { font-size: 14px; }

      .tx-table { display: flex; flex-direction: column; gap: 2px; }
      .tx-row {
        display: grid; grid-template-columns: 90px 1fr auto auto; align-items: center; gap: 10px;
        padding: 8px 4px; border-bottom: 1px solid var(--border); font-size: 13px;
      }
      .tx-date { color: var(--muted); font-size: 12px; }
      .tx-amount { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }

      .two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
      .list-simple { display: flex; flex-direction: column; gap: 4px; }
      .list-row {
        display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 0 -10px; border-bottom: 1px solid var(--border);
        font-size: 13.5px; border-radius: 8px; transition: background-color 0.2s var(--ease);
      }
      @media (hover: hover) {
        .list-row:hover { background: var(--surface-2); }
      }
      .list-row-main { flex: 1; }

      .form-stack { display: flex; flex-direction: column; gap: 4px; }
      .checkbox-list { display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; background: var(--surface-2); border-radius: 8px; padding: 8px 10px; }
      .timeoff-add-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
      .timeoff-add-row .date-input { flex: 1; min-width: 128px; }
      .timeoff-add-row .text-input { flex: 2; min-width: 140px; }
      .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }

      .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
      .color-swatch {
        width: 26px; height: 26px; border-radius: 50%; background: var(--swatch-color); border: 2px solid transparent; cursor: pointer;
        transition: transform 0.18s var(--ease), border-color 0.18s var(--ease);
      }
      .color-swatch:active { transform: scale(0.88); }
      .color-swatch.selected { border-color: var(--ink); }
      @media (hover: hover) {
        .color-swatch:hover { transform: scale(1.15); box-shadow: 0 4px 10px rgba(58, 53, 48, 0.18); }
      }

      .gallery-carousel {
        position: relative; width: 100%; aspect-ratio: 16 / 7; border-radius: 16px; overflow: hidden;
        margin-top: 24px; background: var(--surface-2);
      }
      .gallery-slide {
        position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        opacity: 0; transition: opacity 1s ease;
      }
      .gallery-slide.active { opacity: 1; }
      .gallery-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
      .gallery-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.55); }
      .gallery-dot.active { background: #FFFFFF; width: 16px; border-radius: 3px; transition: width 0.3s ease; }

      .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap: 8px; margin-top: 12px; }

      .breakeven-row {
        display: grid; grid-template-columns: 1fr 110px 90px; align-items: center; gap: 10px; padding: 6px 10px;
        margin: 0 -10px; border-radius: 8px; transition: background-color 0.2s var(--ease);
      }
      @media (hover: hover) {
        .breakeven-row:hover { background: var(--surface-2); }
      }
      .breakeven-name { display: flex; align-items: center; gap: 6px; font-size: 13px; }
      .breakeven-bar-track { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
      .breakeven-bar-fill { height: 100%; background: var(--sage); border-radius: 3px; transition: width 0.3s ease; }
      .breakeven-count { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted); text-align: right; white-space: nowrap; }
      @media (max-width: 480px) {
        .breakeven-row { grid-template-columns: 1fr 70px; }
        .breakeven-count { grid-column: 1 / -1; text-align: left; }
      }
      .gallery-thumb {
        position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1px solid var(--border);
        transition: box-shadow 0.25s var(--ease);
      }
      .gallery-thumb img { transition: transform 0.35s var(--ease); }
      @media (hover: hover) {
        .gallery-thumb:hover img { transform: scale(1.08); }
        .gallery-thumb:hover { box-shadow: 0 6px 16px rgba(58, 53, 48, 0.14); }
      }
      .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .gallery-thumb-remove {
        position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; border: none;
        background: rgba(58,53,48,0.65); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer;
      }

      .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
      .product-card {
        margin-bottom: 0; transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.25s var(--ease);
      }
      @media (hover: hover) {
        .product-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(58, 53, 48, 0.1); border-color: var(--sage); }
      }
      .stock-badge { font-family: 'IBM Plex Mono', monospace; font-size: 12px; margin-top: 6px; color: var(--money-pos); }
      .stock-badge.stock-low { color: var(--sage); }

      .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 10px; color: var(--muted); text-align: center; }
      .empty-title { font-size: 14px; color: var(--ink); margin: 0; }
      .empty-hint { font-size: 12.5px; margin: 0; max-width: 280px; }

      .modal-overlay {
        position: fixed; inset: 0; background: rgba(10, 6, 10, 0.5); display: flex; align-items: center;
        justify-content: center; z-index: 50; padding: 16px; animation: overlayFade 0.2s var(--ease) both;
      }
      .modal-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px;
        width: 100%; max-width: 420px; max-height: 88vh; overflow-y: auto;
        animation: modalPop 0.3s var(--ease) both;
      }
      .modal-wide { max-width: 640px; }
      .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .modal-head h3 { font-family: 'Fraunces', serif; margin: 0; }

      .toast {
        position: fixed; bottom: 20px; left: 50%; z-index: 100;
        background: var(--surface-2); border: 1px solid var(--sage); color: var(--ink); padding: 10px 18px;
        border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 13px;
        animation: toastIn 0.35s var(--ease) both;
      }
      .toast-error { border-color: var(--money-neg); }

      .connection-banner {
        position: sticky; top: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
        gap: 8px; background: var(--money-neg); color: #fff; font-size: 12.5px; padding: 8px 12px; text-align: center;
      }

      @media (max-width: 560px) {
        .glam-header { padding: 14px; }
        .main-area { padding: 14px 14px 50px; }
        .tx-row { grid-template-columns: 70px 1fr auto; }
        .tx-row button { display: none; }
      }
    `}</style>
  );
}
