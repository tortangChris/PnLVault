import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  BarChart2,
  ClipboardList,
  Target,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Check,
  Camera,
  TrendingUp,
  TrendingDown,
  Zap,
  Bitcoin,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// ─── Storage ────────────────────────────────────────────────────────────────
const SK = "pnl_v3",
  TK = "pnl_targets_v3",
  THK = "pnl_theme_v3";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(SK)) || {};
  } catch {
    return {};
  }
};
const loadT = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(TK)) || { weekly: 1000, monthly: 4000 }
    );
  } catch {
    return { weekly: 1000, monthly: 4000 };
  }
};

// ─── Utils ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MSHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAYSFULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fmt = (n) => {
  const a = Math.abs(n);
  const s =
    a >= 10000
      ? `$${(a / 1000).toFixed(0)}k`
      : a >= 1000
        ? `$${(a / 1000).toFixed(1)}k`
        : `$${a}`;
  return (n >= 0 ? "+" : "−") + s;
};
const fmtFull = (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toLocaleString()}`;
const pnlText = (p, d) =>
  p > 0
    ? d
      ? "text-emerald-400"
      : "text-emerald-600"
    : p < 0
      ? d
        ? "text-red-400"
        : "text-red-500"
      : d
        ? "text-slate-400"
        : "text-slate-500";
const pnlBg = (p, d) => {
  if (p > 1500)
    return d
      ? "bg-emerald-400/25 border-emerald-400/50"
      : "bg-emerald-100 border-emerald-400";
  if (p > 0)
    return d
      ? "bg-emerald-500/15 border-emerald-500/30"
      : "bg-emerald-50 border-emerald-200";
  if (p < -1000)
    return d ? "bg-red-400/25 border-red-400/50" : "bg-red-100 border-red-400";
  if (p < 0)
    return d ? "bg-red-500/15 border-red-500/30" : "bg-red-50 border-red-200";
  return d
    ? "bg-slate-700/20 border-slate-600/20"
    : "bg-slate-100 border-slate-200";
};

function useWindowSize() {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── TradeModal ─────────────────────────────────────────────────────────────
function TradeModal({ dark, dateKey, dayData, onSave, onClose }) {
  const [trades, setTrades] = useState(dayData?.trades || []);
  const [note, setNote] = useState(dayData?.note || "");
  const [pnlInput, setPnlInput] = useState("");
  const [result, setResult] = useState("win");
  const [img, setImg] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const winW = useWindowSize();
  const isMobile = winW < 640;

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      setImg(ev.target.result);
      setImgPrev(ev.target.result);
    };
    r.readAsDataURL(f);
  };

  const addTrade = () => {
    const n = parseFloat(pnlInput);
    if (!pnlInput || isNaN(n)) return;
    const finalPnl = result === "win" ? Math.abs(n) : -Math.abs(n);
    setTrades((p) => [...p, { id: Date.now(), pnl: finalPnl, result, img }]);
    setPnlInput("");
    setImg(null);
    setImgPrev(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const wr = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  const d = dark;
  const base = d
    ? "bg-slate-900 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-800";
  const inp = d
    ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-400"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500";
  const sub = d ? "text-slate-400" : "text-slate-500";
  const rowBg = d
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";
  const dateObj = new Date(dateKey + "T12:00:00");
  const dateStr = isMobile
    ? `${MSHORT[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
    : dateObj.toDateString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
    >
      {lightbox && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 cursor-pointer"
          style={{ background: "rgba(0,0,0,0.95)", zIndex: 60 }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="trade"
            className="max-h-screen max-w-full rounded-xl shadow-2xl"
            style={{ maxHeight: "88vh" }}
          />
          <button className="absolute top-4 right-4 text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/50">
            <X size={18} />
          </button>
        </div>
      )}
      <div
        className={`w-full sm:max-w-xl border shadow-2xl flex flex-col rounded-t-2xl sm:rounded-2xl ${base}`}
        style={{ maxHeight: isMobile ? "92vh" : "90vh" }}
      >
        {isMobile && (
          <div
            className={`mx-auto mt-3 mb-1 w-10 h-1 rounded-full ${d ? "bg-slate-600" : "bg-slate-300"}`}
          />
        )}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0 ${d ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}
        >
          <div>
            <p className={`text-xs font-bold tracking-widest uppercase ${sub}`}>
              Log Trades
            </p>
            <p className="text-base sm:text-lg font-bold">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-xs tracking-widest uppercase ${sub}`}>
                Total
              </p>
              <p className={`text-lg font-black ${pnlText(totalPnl, d)}`}>
                {fmtFull(totalPnl)}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${d ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {trades.length > 0 && (
            <div
              className={`grid grid-cols-4 gap-2 p-3 rounded-xl ${d ? "bg-slate-800" : "bg-slate-100"}`}
            >
              {[
                {
                  l: "Trades",
                  v: trades.length,
                  c: d ? "text-slate-200" : "text-slate-700",
                },
                {
                  l: "Wins",
                  v: wins,
                  c: d ? "text-emerald-400" : "text-emerald-600",
                },
                {
                  l: "Losses",
                  v: losses,
                  c: d ? "text-red-400" : "text-red-500",
                },
                {
                  l: "W.Rate",
                  v: `${wr}%`,
                  c: d ? "text-sky-400" : "text-sky-600",
                },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p className={`text-xs uppercase tracking-wider ${sub}`}>
                    {s.l}
                  </p>
                  <p className={`text-base font-black ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
          )}
          {trades.length > 0 && (
            <div className="space-y-2">
              <p
                className={`text-xs font-bold uppercase tracking-widest ${sub}`}
              >
                Trades ({trades.length})
              </p>
              {trades.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${rowBg}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${t.result === "win" ? (d ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600") : d ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 flex items-center gap-1 ${t.result === "win" ? (d ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-600") : d ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-500"}`}
                  >
                    {t.result === "win" ? (
                      <>
                        <Check size={9} />W
                      </>
                    ) : (
                      <>
                        <X size={9} />L
                      </>
                    )}
                  </span>
                  <span
                    className={`font-black text-sm flex-1 min-w-0 ${pnlText(t.pnl, d)}`}
                  >
                    {fmtFull(t.pnl)}
                  </span>
                  {t.img && (
                    <button
                      onClick={() => setLightbox(t.img)}
                      className={`p-1.5 rounded-lg flex-shrink-0 ${d ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}
                    >
                      <Camera size={12} />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setTrades((p) => p.filter((x) => x.id !== t.id))
                    }
                    className={`p-1.5 rounded-lg flex-shrink-0 ${d ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className={`p-3 rounded-xl border-2 border-dashed ${d ? "border-slate-600 bg-slate-800/40" : "border-slate-300 bg-slate-50"}`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1 ${sub}`}
            >
              <Plus size={11} /> Add Trade
            </p>
            <div
              className={`flex rounded-xl overflow-hidden border mb-3 ${d ? "border-slate-600" : "border-slate-300"}`}
            >
              <button
                onClick={() => setResult("win")}
                className={`flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${result === "win" ? "bg-emerald-500 text-white" : d ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500"}`}
              >
                <Check size={14} /> WIN
              </button>
              <button
                onClick={() => setResult("loss")}
                className={`flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${result === "loss" ? "bg-red-500 text-white" : d ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500"}`}
              >
                <X size={14} /> LOSS
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                inputMode="decimal"
                placeholder="PNL amount..."
                value={pnlInput}
                onChange={(e) => setPnlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTrade()}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition-all min-w-0 ${inp}`}
              />
              <button
                onClick={addTrade}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black text-sm transition-all flex-shrink-0 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs cursor-pointer border transition-all ${d ? "border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-600"}`}
              >
                <Camera size={12} /> Screenshot
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImg}
                />
              </label>
              {imgPrev && (
                <div className="flex items-center gap-2">
                  <img
                    src={imgPrev}
                    alt="preview"
                    className="w-9 h-9 rounded-lg object-cover border-2 border-emerald-500/50"
                  />
                  <button
                    onClick={() => {
                      setImg(null);
                      setImgPrev(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className={d ? "text-red-400" : "text-red-500"}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-widest mb-2 ${sub}`}
            >
              📝 Notes
            </p>
            <textarea
              rows={3}
              placeholder="Market conditions, lessons, setup notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none transition-all ${inp}`}
            />
          </div>
        </div>
        <div
          className={`flex gap-2 px-4 sm:px-6 py-3 border-t flex-shrink-0 ${d ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${d ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(dateKey, { trades, note });
              onClose();
            }}
            className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Save Day
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Target Modal ─────────────────────────────────────────────────────────────
function TargetModal({ dark, targets, onSave, onClose }) {
  const [w, setW] = useState(String(targets.weekly));
  const [m, setM] = useState(String(targets.monthly));
  const winW = useWindowSize();
  const isMobile = winW < 640;
  const d = dark;
  const inp = d
    ? "bg-slate-800 border-slate-600 text-white focus:border-emerald-400 placeholder-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500";
  const sub = d ? "text-slate-400" : "text-slate-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
    >
      <div
        className={`w-full sm:max-w-sm border shadow-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl ${d ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}
      >
        {isMobile && (
          <div
            className={`mx-auto mt-3 mb-1 w-10 h-1 rounded-full ${d ? "bg-slate-600" : "bg-slate-300"}`}
          />
        )}
        <div
          className={`px-5 py-4 border-b flex items-center gap-3 ${d ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${d ? "bg-amber-500/15" : "bg-amber-50"}`}
          >
            <Target size={18} className="text-amber-500" />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${sub}`}>
              Set Goals
            </p>
            <p className="text-lg font-black">PNL Targets</p>
          </div>
          <button
            onClick={onClose}
            className={`ml-auto w-8 h-8 rounded-full flex items-center justify-center ${d ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-500"}`}
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Weekly Target ($)", val: w, set: setW },
            { label: "Monthly Target ($)", val: m, set: setM },
          ].map((f) => (
            <div key={f.label}>
              <label
                className={`text-xs font-bold uppercase tracking-widest block mb-2 ${sub}`}
              >
                {f.label}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition-all font-bold ${inp}`}
              />
            </div>
          ))}
        </div>
        <div
          className={`flex gap-2 px-5 py-4 border-t ${d ? "border-slate-700" : "border-slate-200"}`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${d ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ weekly: Number(w) || 0, monthly: Number(m) || 0 });
              onClose();
            }}
            className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm transition-all flex items-center justify-center gap-2"
          >
            <Target size={14} /> Save Goals
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Yearly Calendar View ─────────────────────────────────────────────────────
function YearlyCalendar({ dark, data, year, onMonthClick }) {
  const d = dark;
  const sub = d ? "text-slate-400" : "text-slate-500";
  const card = d
    ? "bg-slate-800/60 border-slate-700/60"
    : "bg-slate-50 border-slate-200";
  const today = new Date();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {MONTHS.map((_, mIdx) => {
        const firstDay = new Date(year, mIdx, 1).getDay();
        const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let dd = 1; dd <= daysInMonth; dd++) cells.push(dd);

        const monthPnl = Object.entries(data)
          .filter(([k]) => {
            const dt = new Date(k + "T12:00:00");
            return dt.getFullYear() === year && dt.getMonth() === mIdx;
          })
          .reduce(
            (s, [, v]) => s + v.trades.reduce((ss, t) => ss + t.pnl, 0),
            0,
          );

        const isCurrentMonth =
          today.getFullYear() === year && today.getMonth() === mIdx;

        return (
          <div
            key={mIdx}
            onClick={() => onMonthClick(mIdx)}
            className={`border rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${card} ${isCurrentMonth ? (d ? "ring-2 ring-emerald-500/50" : "ring-2 ring-emerald-400/60") : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p
                className={`text-xs font-black uppercase tracking-wider ${isCurrentMonth ? (d ? "text-emerald-400" : "text-emerald-600") : ""}`}
              >
                {MSHORT[mIdx]}
              </p>
              {monthPnl !== 0 && (
                <p className={`text-xs font-black ${pnlText(monthPnl, d)}`}>
                  {fmt(monthPnl)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((dd, i) => (
                <div
                  key={i}
                  className={`text-center text-[8px] font-bold ${sub}`}
                >
                  {dd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const key = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayData = data[key];
                const dayPnl = dayData
                  ? dayData.trades.reduce((s, t) => s + t.pnl, 0)
                  : 0;
                const hasTrades = dayData && dayData.trades.length > 0;
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === mIdx &&
                  today.getFullYear() === year;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center"
                    style={{ aspectRatio: "1" }}
                  >
                    {isToday ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span
                          className="text-white font-black"
                          style={{ fontSize: "7px" }}
                        >
                          {day}
                        </span>
                      </div>
                    ) : hasTrades ? (
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${dayPnl >= 0 ? (d ? "bg-emerald-500/30" : "bg-emerald-100") : d ? "bg-red-500/30" : "bg-red-100"}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${dayPnl >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                      </div>
                    ) : (
                      <span
                        className={`font-medium leading-none ${sub}`}
                        style={{ fontSize: "8px" }}
                      >
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StatsPanel ───────────────────────────────────────────────────────────────
function StatsPanel({ dark, data, month, year }) {
  const [chartTab, setChartTab] = useState("monthly");
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef();
  const d = dark;
  const card = d
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";
  const sub = d ? "text-slate-400" : "text-slate-500";

  // ── Build data points per tab ──
  const today = new Date();

  const buildPoints = () => {
    const allEntries = Object.entries(data).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    if (chartTab === "daily") {
      // Current month's days
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const pts = [];
      for (let dd = 1; dd <= daysInMonth; dd++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        const v = data[key];
        const pnl = v ? v.trades.reduce((s, t) => s + t.pnl, 0) : 0;
        pts.push({ label: `${dd}`, pnl, key });
      }
      return pts;
    }

    if (chartTab === "weekly") {
      // Current month's weeks
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay; i++) cells.push(null);
      for (let dd = 1; dd <= daysInMonth; dd++) cells.push(dd);
      const pts = [];
      for (let w = 0; w < Math.ceil(cells.length / 7); w++) {
        let wp = 0;
        for (let dd = 0; dd < 7; dd++) {
          const day = cells[w * 7 + dd];
          if (day) {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            if (data[key])
              wp += data[key].trades.reduce((s, t) => s + t.pnl, 0);
          }
        }
        pts.push({ label: `W${w + 1}`, pnl: wp });
      }
      return pts;
    }

    if (chartTab === "monthly") {
      // All 12 months of current year
      const pts = [];
      for (let m = 0; m < 12; m++) {
        const mp = Object.entries(data)
          .filter(([k]) => {
            const dt = new Date(k + "T12:00:00");
            return dt.getFullYear() === year && dt.getMonth() === m;
          })
          .reduce(
            (s, [, v]) => s + v.trades.reduce((ss, t) => ss + t.pnl, 0),
            0,
          );
        pts.push({ label: MSHORT[m], pnl: mp });
      }
      return pts;
    }

    if (chartTab === "alltime") {
      if (!allEntries.length) return [];
      // Group by month across all data
      const map = {};
      allEntries.forEach(([key, v]) => {
        const dt = new Date(key + "T12:00:00");
        const mk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        if (!map[mk]) map[mk] = 0;
        map[mk] += v.trades.reduce((s, t) => s + t.pnl, 0);
      });
      return Object.entries(map)
        .sort()
        .map(([mk, pnl]) => {
          const [y, m] = mk.split("-");
          return { label: `${MSHORT[Number(m) - 1]} ${y.slice(2)}`, pnl };
        });
    }

    return [];
  };

  const pts = buildPoints();

  // Build cumulative PnL curve (equity curve / drawdown style)
  const cumPts = pts.reduce((acc, pt, i) => {
    const prev = acc[i - 1]?.cum ?? 0;
    return [...acc, { ...pt, cum: prev + pt.pnl, idx: i }];
  }, []);

  const totalPnl = cumPts.length ? cumPts[cumPts.length - 1].cum : 0;
  const maxCum = cumPts.length ? Math.max(...cumPts.map((p) => p.cum), 0) : 0;
  const minCum = cumPts.length ? Math.min(...cumPts.map((p) => p.cum), 0) : 0;

  // Stats for the period
  const periodEntries = (() => {
    if (chartTab === "daily" || chartTab === "weekly") {
      return Object.entries(data).filter(([k]) => {
        const dt = new Date(k + "T12:00:00");
        return dt.getFullYear() === year && dt.getMonth() === month;
      });
    }
    if (chartTab === "monthly") {
      return Object.entries(data).filter(([k]) => {
        const dt = new Date(k + "T12:00:00");
        return dt.getFullYear() === year;
      });
    }
    return Object.entries(data);
  })();

  const totalTrades = periodEntries.reduce(
    (s, [, v]) => s + v.trades.length,
    0,
  );
  const totalWins = periodEntries.reduce(
    (s, [, v]) => s + v.trades.filter((t) => t.result === "win").length,
    0,
  );
  const totalLosses = periodEntries.reduce(
    (s, [, v]) => s + v.trades.filter((t) => t.result === "loss").length,
    0,
  );
  const wr = totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0;
  const bestDay = periodEntries.length
    ? Math.max(
        ...periodEntries.map(([, v]) =>
          v.trades.reduce((s, t) => s + t.pnl, 0),
        ),
      )
    : 0;
  const worstDay = periodEntries.length
    ? Math.min(
        ...periodEntries.map(([, v]) =>
          v.trades.reduce((s, t) => s + t.pnl, 0),
        ),
      )
    : 0;

  // Max drawdown from peak
  let peak = 0,
    maxDrawdown = 0;
  cumPts.forEach((p) => {
    if (p.cum > peak) peak = p.cum;
    const dd = peak - p.cum;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  // SVG chart
  const W = 600,
    H = 180,
    PAD = { t: 20, b: 28, l: 52, r: 16 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const range = Math.max(maxCum - minCum, 1);
  const toY = (v) => PAD.t + chartH - ((v - minCum) / range) * chartH;
  const toX = (i) => {
    if (cumPts.length === 1) return PAD.l + chartW / 2;
    return PAD.l + (i / (cumPts.length - 1)) * chartW;
  };

  const zeroY = toY(0);

  // Build SVG polyline points
  const linePoints = cumPts.map((p, i) => `${toX(i)},${toY(p.cum)}`).join(" ");

  // Fill area above/below zero
  const buildFillPath = (above) => {
    if (!cumPts.length) return "";
    const pts2 = cumPts.map((p, i) => ({ x: toX(i), y: toY(p.cum) }));
    let d2 = `M ${pts2[0].x} ${zeroY}`;
    pts2.forEach((pt) => {
      d2 += ` L ${pt.x} ${pt.y}`;
    });
    d2 += ` L ${pts2[pts2.length - 1].x} ${zeroY} Z`;
    return d2;
  };

  // Y-axis labels
  const yLabels = (() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const v = minCum + (range / steps) * i;
      return { v, y: toY(v) };
    });
  })();

  // Positive or negative overall
  const isPositive = totalPnl >= 0;

  const tabItems = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "alltime", label: "All Time" },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Chart card */}
      <div
        className={`border rounded-xl sm:rounded-2xl overflow-hidden ${card}`}
      >
        {/* Tab bar */}
        <div
          className={`flex border-b ${d ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}
        >
          {tabItems.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setChartTab(t.id);
                setTooltip(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2
                ${
                  chartTab === t.id
                    ? d
                      ? "border-emerald-400 text-emerald-400"
                      : "border-emerald-500 text-emerald-600"
                    : `border-transparent ${sub} hover:${d ? "text-slate-200" : "text-slate-700"}`
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Hero number */}
        <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-4">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-widest mb-1 ${sub}`}
            >
              Cumulative PNL
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black ${isPositive ? (d ? "text-emerald-400" : "text-emerald-600") : d ? "text-red-400" : "text-red-500"}`}
            >
              {fmtFull(totalPnl)}
            </p>
          </div>
          {maxDrawdown > 0 && (
            <div className="text-right">
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-1 ${sub}`}
              >
                Max Drawdown
              </p>
              <p
                className={`text-lg font-black ${d ? "text-red-400" : "text-red-500"}`}
              >
                −${maxDrawdown.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* SVG equity curve */}
        <div className="px-2 pb-3 relative">
          {cumPts.length < 2 ? (
            <div
              className={`flex flex-col items-center justify-center py-12 ${sub}`}
            >
              <BarChart2 size={32} className="opacity-20 mb-2" />
              <p className="text-xs">Not enough data for this period</p>
            </div>
          ) : (
            <div
              className="relative"
              style={{ userSelect: "none" }}
              onMouseLeave={() => setTooltip(null)}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ height: 200 }}
                ref={svgRef}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mx = ((e.clientX - rect.left) / rect.width) * W;
                  const inner = mx - PAD.l;
                  const frac = Math.max(0, Math.min(1, inner / chartW));
                  const idx = Math.round(frac * (cumPts.length - 1));
                  setTooltip({
                    idx,
                    x: toX(idx),
                    y: toY(cumPts[idx].cum),
                    pt: cumPts[idx],
                  });
                }}
              >
                <defs>
                  <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={d ? "#34d399" : "#10b981"}
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor={d ? "#34d399" : "#10b981"}
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                  <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
                  </linearGradient>
                  <clipPath id="aboveZero">
                    <rect
                      x={PAD.l}
                      y={PAD.t}
                      width={chartW}
                      height={Math.max(0, zeroY - PAD.t)}
                    />
                  </clipPath>
                  <clipPath id="belowZero">
                    <rect
                      x={PAD.l}
                      y={zeroY}
                      width={chartW}
                      height={Math.max(0, PAD.t + chartH - zeroY)}
                    />
                  </clipPath>
                </defs>

                {/* Grid lines */}
                {yLabels.map((yl, i) => (
                  <g key={i}>
                    <line
                      x1={PAD.l}
                      y1={yl.y}
                      x2={W - PAD.r}
                      y2={yl.y}
                      stroke={d ? "#1e293b" : "#e2e8f0"}
                      strokeWidth="1"
                      strokeDasharray={yl.v === 0 ? "0" : "3,3"}
                    />
                    <text
                      x={PAD.l - 6}
                      y={yl.y + 4}
                      textAnchor="end"
                      fontSize="9"
                      fill={
                        yl.v === 0
                          ? d
                            ? "#94a3b8"
                            : "#64748b"
                          : d
                            ? "#475569"
                            : "#94a3b8"
                      }
                      fontFamily="DM Mono,monospace"
                      fontWeight={yl.v === 0 ? "700" : "400"}
                    >
                      {yl.v === 0 ? "0" : fmt(yl.v)}
                    </text>
                  </g>
                ))}

                {/* Zero line (solid) */}
                <line
                  x1={PAD.l}
                  y1={zeroY}
                  x2={W - PAD.r}
                  y2={zeroY}
                  stroke={d ? "#334155" : "#cbd5e1"}
                  strokeWidth="1.5"
                />

                {/* Fill above zero */}
                <path
                  d={buildFillPath(true)}
                  fill="url(#fillGreen)"
                  clipPath="url(#aboveZero)"
                />
                {/* Fill below zero */}
                <path
                  d={buildFillPath(false)}
                  fill="url(#fillRed)"
                  clipPath="url(#belowZero)"
                />

                {/* Main line */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={isPositive ? (d ? "#34d399" : "#10b981") : "#ef4444"}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Dots on data points */}
                {cumPts.map((p, i) => (
                  <circle
                    key={i}
                    cx={toX(i)}
                    cy={toY(p.cum)}
                    r="2.5"
                    fill={p.cum >= 0 ? (d ? "#34d399" : "#10b981") : "#ef4444"}
                    stroke={d ? "#0f172a" : "#fff"}
                    strokeWidth="1.5"
                  />
                ))}

                {/* Tooltip vertical line */}
                {tooltip && (
                  <g>
                    <line
                      x1={tooltip.x}
                      y1={PAD.t}
                      x2={tooltip.x}
                      y2={PAD.t + chartH}
                      stroke={d ? "#94a3b8" : "#64748b"}
                      strokeWidth="1"
                      strokeDasharray="3,2"
                    />
                    <circle
                      cx={tooltip.x}
                      cy={tooltip.y}
                      r="5"
                      fill={
                        tooltip.pt.cum >= 0
                          ? d
                            ? "#34d399"
                            : "#10b981"
                          : "#ef4444"
                      }
                      stroke={d ? "#0f172a" : "#fff"}
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* X axis labels — sample every nth */}
                {cumPts.map((p, i) => {
                  const step = Math.max(1, Math.floor(cumPts.length / 8));
                  if (i % step !== 0 && i !== cumPts.length - 1) return null;
                  return (
                    <text
                      key={i}
                      x={toX(i)}
                      y={H - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill={d ? "#475569" : "#94a3b8"}
                      fontFamily="DM Mono,monospace"
                    >
                      {p.label}
                    </text>
                  );
                })}
              </svg>

              {/* Tooltip box */}
              {tooltip && (
                <div
                  className={`absolute top-2 pointer-events-none px-3 py-2 rounded-xl border shadow-xl text-xs font-bold z-10
                  ${d ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
                  ${tooltip.x / W > 0.6 ? "right-2" : "left-2"}`}
                  style={{ minWidth: 120 }}
                >
                  <p className={`text-xs font-bold uppercase mb-1 ${sub}`}>
                    {tooltip.pt.label}
                  </p>
                  <p
                    className={`font-black text-sm ${tooltip.pt.cum >= 0 ? (d ? "text-emerald-400" : "text-emerald-600") : d ? "text-red-400" : "text-red-500"}`}
                  >
                    {fmtFull(tooltip.pt.cum)}
                  </p>
                  <p
                    className={`text-xs ${tooltip.pt.pnl >= 0 ? (d ? "text-emerald-400/70" : "text-emerald-500/70") : d ? "text-red-400/70" : "text-red-500/70"}`}
                  >
                    Period: {tooltip.pt.pnl >= 0 ? "+" : ""}$
                    {tooltip.pt.pnl.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3`}>
        {[
          {
            label: "Total Trades",
            value: totalTrades,
            Icon: BarChart2,
            color: d ? "text-slate-200" : "text-slate-700",
          },
          {
            label: "Win Rate",
            value: `${wr}%`,
            Icon: Zap,
            color:
              wr >= 50
                ? d
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : d
                  ? "text-red-400"
                  : "text-red-500",
          },
          {
            label: "Best Day",
            value: bestDay !== 0 ? fmtFull(bestDay) : "—",
            Icon: TrendingUp,
            color: d ? "text-emerald-400" : "text-emerald-600",
          },
          {
            label: "Worst Day",
            value: worstDay !== 0 ? fmtFull(worstDay) : "—",
            Icon: TrendingDown,
            color: d ? "text-red-400" : "text-red-500",
          },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3 sm:p-4 ${card}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.Icon size={13} className={sub} />
              <p
                className={`text-xs font-bold uppercase tracking-widest ${sub}`}
              >
                {s.label}
              </p>
            </div>
            <p className={`text-xl sm:text-2xl font-black ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* W/L split */}
      <div className={`border rounded-xl sm:rounded-2xl p-4 ${card}`}>
        <p
          className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${sub}`}
        >
          <Zap size={13} /> Win / Loss Breakdown
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div
              className={`h-3 rounded-full overflow-hidden ${d ? "bg-slate-800" : "bg-slate-200"}`}
            >
              <div className="h-full flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-700 rounded-l-full"
                  style={{ width: `${wr}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all duration-700 rounded-r-full"
                  style={{ width: `${100 - wr}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span
                className={`text-xs font-bold flex items-center gap-1 ${d ? "text-emerald-400" : "text-emerald-600"}`}
              >
                <Check size={10} />
                {totalWins} Wins
              </span>
              <span
                className={`text-xs font-bold flex items-center gap-1 ${d ? "text-red-400" : "text-red-500"}`}
              >
                <X size={10} />
                {totalLosses} Losses
              </span>
            </div>
          </div>
          <div
            className={`text-3xl sm:text-4xl font-black ${wr >= 50 ? (d ? "text-emerald-400" : "text-emerald-600") : d ? "text-red-400" : "text-red-500"}`}
          >
            {wr}%
          </div>
        </div>
      </div>

      {/* Best/worst days ranked */}
      <div className={`border rounded-xl sm:rounded-2xl p-4 ${card}`}>
        <p
          className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5 ${sub}`}
        >
          <TrendingUp size={13} /> Day Performance
        </p>
        {periodEntries.length === 0 ? (
          <p className={`text-sm text-center py-4 ${sub}`}>
            No trades logged yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {periodEntries
              .map(([k, v]) => ({
                key: k,
                pnl: v.trades.reduce((s, t) => s + t.pnl, 0),
              }))
              .sort((a, b) => b.pnl - a.pnl)
              .map(({ key, pnl }) => {
                const dObj = new Date(key + "T12:00:00");
                const maxA = Math.max(
                  ...periodEntries.map(([, v]) =>
                    Math.abs(v.trades.reduce((s, t) => s + t.pnl, 0)),
                  ),
                  1,
                );
                const pct = (Math.abs(pnl) / maxA) * 100;
                return (
                  <div key={key} className="flex items-center gap-2 sm:gap-3">
                    <p className={`text-xs w-14 sm:w-16 flex-shrink-0 ${sub}`}>
                      {MSHORT[dObj.getMonth()]} {dObj.getDate()}
                    </p>
                    <div
                      className={`flex-1 h-2 rounded-full overflow-hidden ${d ? "bg-slate-800" : "bg-slate-200"}`}
                    >
                      <div
                        className={`h-full rounded-full ${pnl >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p
                      className={`text-xs font-black w-16 sm:w-20 text-right flex-shrink-0 ${pnlText(pnl, dark)}`}
                    >
                      {fmt(pnl)}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  dark,
  tab,
  setTab,
  collapsed,
  setCollapsed,
  setShowTargets,
  toggleTheme,
}) {
  const d = dark;
  const bg = d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const sub = d ? "text-slate-500" : "text-slate-400";

  const navItems = [
    { id: "calendar", Icon: CalendarDays, label: "Calendar" },
    { id: "stats", Icon: BarChart2, label: "Stats" },
    { id: "log", Icon: ClipboardList, label: "Trade Log" },
  ];

  const active = d
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const inactive = d
    ? "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
    : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700";

  return (
    <aside
      className={`hidden lg:flex flex-col border-r h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ${bg} ${collapsed ? "w-[68px]" : "w-56"}`}
      style={{ fontFamily: "'DM Mono','Courier New',monospace" }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-3 py-[14px] border-b ${d ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 flex-shrink-0">
          <Bitcoin size={19} />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black tracking-widest uppercase leading-none truncate">
              TradeTrack
            </p>
            <p
              className={`text-[10px] tracking-widest uppercase leading-none mt-0.5 ${sub}`}
            >
              PNL Journal
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${d ? "hover:bg-slate-800 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"} ${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {!collapsed && (
          <p
            className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 ${sub}`}
          >
            Navigation
          </p>
        )}
        {navItems.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl border text-sm font-bold transition-all ${tab === id ? active : inactive} ${collapsed ? "justify-center" : ""}`}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div
        className={`px-2 py-3 border-t space-y-1 ${d ? "border-slate-800" : "border-slate-200"}`}
      >
        <button
          onClick={() => setShowTargets(true)}
          title={collapsed ? "Goals" : undefined}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl border text-sm font-bold transition-all ${inactive} ${collapsed ? "justify-center" : ""}`}
        >
          <Target size={18} className="flex-shrink-0 text-amber-500" />
          {!collapsed && <span>Goals</span>}
        </button>
        <button
          onClick={toggleTheme}
          title={collapsed ? (d ? "Light mode" : "Dark mode") : undefined}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl border text-sm font-bold transition-all ${inactive} ${collapsed ? "justify-center" : ""}`}
        >
          {d ? (
            <Sun size={18} className="flex-shrink-0 text-amber-400" />
          ) : (
            <Moon size={18} className="flex-shrink-0 text-indigo-400" />
          )}
          {!collapsed && <span>{d ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function PNLCalendar() {
  const winW = useWindowSize();
  const isMobile = winW < 640;

  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THK) !== "light";
    } catch {
      return true;
    }
  });
  const [data, setData] = useState(load);
  const [targets, setTargets] = useState(loadT);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [modal, setModal] = useState(null);
  const [showTargets, setShowTargets] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [calView, setCalView] = useState("monthly");
  const [expanded, setExpanded] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const today = new Date();

  const toggleTheme = () =>
    setDark((p) => {
      const n = !p;
      try {
        localStorage.setItem(THK, n ? "dark" : "light");
      } catch {}
      return n;
    });

  const saveDay = (dateKey, dayData) => {
    const next = { ...data };
    if (!dayData.trades.length && !dayData.note) delete next[dateKey];
    else next[dateKey] = dayData;
    setData(next);
    try {
      localStorage.setItem(SK, JSON.stringify(next));
    } catch {}
  };
  const saveTargetsH = (t) => {
    setTargets(t);
    try {
      localStorage.setItem(TK, JSON.stringify(t));
    } catch {}
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevM = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setExpanded(null);
  };
  const nextM = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setExpanded(null);
  };
  const prevY = () => {
    setYear((y) => y - 1);
    setExpanded(null);
  };
  const nextY = () => {
    setYear((y) => y + 1);
    setExpanded(null);
  };
  const getKey = (dd) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

  const monthEntries = Object.entries(data).filter(([k]) => {
    const dd = new Date(k + "T12:00:00");
    return dd.getFullYear() === year && dd.getMonth() === month;
  });

  const monthPnl = monthEntries.reduce(
    (s, [, v]) => s + v.trades.reduce((ss, t) => ss + t.pnl, 0),
    0,
  );
  const monthTrades = monthEntries.reduce((s, [, v]) => s + v.trades.length, 0);
  const monthWins = monthEntries.reduce(
    (s, [, v]) => s + v.trades.filter((t) => t.result === "win").length,
    0,
  );
  const monthLosses = monthEntries.reduce(
    (s, [, v]) => s + v.trades.filter((t) => t.result === "loss").length,
    0,
  );
  const monthWr = monthTrades ? Math.round((monthWins / monthTrades) * 100) : 0;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push(dd);

  const weeks = [];
  for (let w = 0; w < Math.ceil(cells.length / 7); w++) {
    let wp = 0;
    for (let dd = 0; dd < 7; dd++) {
      const day = cells[w * 7 + dd];
      if (day) {
        const k = getKey(day);
        if (data[k]) wp += data[k].trades.reduce((s, t) => s + t.pnl, 0);
      }
    }
    weeks.push(wp);
  }
  const curWeek = Math.floor((firstDay + today.getDate() - 1) / 7);
  const weekPnl =
    month === today.getMonth() && year === today.getFullYear()
      ? weeks[curWeek] || 0
      : 0;

  const getWeekDays = () => {
    const weekStart = today.getDate() - today.getDay();
    return Array.from(
      { length: 7 },
      (_, i) => new Date(today.getFullYear(), today.getMonth(), weekStart + i),
    );
  };

  const d = dark;
  const bg = d ? "bg-slate-950 text-slate-100" : "bg-gray-100 text-slate-800";
  const card = d
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";
  const sub = d ? "text-slate-400" : "text-slate-500";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex ${bg}`}
      style={{ fontFamily: "'DM Mono','Courier New',monospace" }}
    >
      {modal && (
        <TradeModal
          dark={dark}
          dateKey={modal}
          dayData={data[modal]}
          onSave={saveDay}
          onClose={() => setModal(null)}
        />
      )}
      {showTargets && (
        <TargetModal
          dark={dark}
          targets={targets}
          onSave={saveTargetsH}
          onClose={() => setShowTargets(false)}
        />
      )}

      {/* ── Desktop Sidebar ── */}
      <Sidebar
        dark={dark}
        tab={tab}
        setTab={setTab}
        collapsed={sideCollapsed}
        setCollapsed={setSideCollapsed}
        setShowTargets={setShowTargets}
        toggleTheme={toggleTheme}
      />

      {/* ── Main Area ── */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ paddingBottom: isMobile ? 72 : 0 }}
      >
        {/* Mobile topbar */}
        <header
          className={`lg:hidden sticky top-0 z-40 border-b ${d ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"}`}
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Bitcoin size={16} className="text-white" />
              </div>
              <span className="text-sm font-black tracking-widest uppercase">
                TradeTrack
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowTargets(true)}
                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300" : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
              >
                <Target size={15} className="text-amber-500" />
              </button>
              <button
                onClick={toggleTheme}
                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-300 bg-slate-100 hover:bg-slate-200"}`}
              >
                {d ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-indigo-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-5 py-3 sm:py-5 space-y-3 sm:space-y-4">
          {/* Month/Year nav */}
          {!(tab === "calendar" && calView === "yearly") && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevM}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center min-w-[80px] sm:min-w-[130px]">
                  <p className="text-base sm:text-2xl font-black tracking-wider uppercase">
                    {isMobile ? MSHORT[month] : MONTHS[month]}
                  </p>
                  <p
                    className={`text-xs tracking-widest uppercase leading-none ${sub}`}
                  >
                    {year}
                  </p>
                </div>
                <button
                  onClick={nextM}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div
                className="flex gap-1.5 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {[
                  {
                    l: "PNL",
                    v: fmt(monthPnl),
                    c:
                      monthPnl >= 0
                        ? d
                          ? "text-emerald-400"
                          : "text-emerald-600"
                        : d
                          ? "text-red-400"
                          : "text-red-500",
                    Icon: monthPnl >= 0 ? TrendingUp : TrendingDown,
                  },
                  {
                    l: "W%",
                    v: `${monthWr}%`,
                    c: d ? "text-sky-400" : "text-sky-600",
                    Icon: Zap,
                  },
                  {
                    l: "T",
                    v: monthTrades,
                    c: d ? "text-amber-400" : "text-amber-600",
                    Icon: BarChart2,
                  },
                ].map((chip) => (
                  <div
                    key={chip.l}
                    className={`border rounded-xl px-2.5 py-1.5 flex-shrink-0 text-center ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                  >
                    <p
                      className={`text-xs uppercase leading-none flex items-center justify-center gap-0.5 ${sub}`}
                    >
                      <chip.Icon size={9} />
                      {chip.l}
                    </p>
                    <p className={`text-sm font-black ${chip.c}`}>{chip.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yearly nav */}
          {tab === "calendar" && calView === "yearly" && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevY}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center min-w-[60px]">
                  <p className="text-base sm:text-2xl font-black tracking-wider">
                    {year}
                  </p>
                  <p
                    className={`text-xs tracking-widest uppercase leading-none ${sub}`}
                  >
                    Overview
                  </p>
                </div>
                <button
                  onClick={nextY}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${d ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <p className={`text-xs ${sub}`}>Tap a month to open it</p>
            </div>
          )}

          {/* Target progress bars */}
          <div className={`border rounded-xl p-3 sm:p-4 ${card}`}>
            <div
              className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}
            >
              {[
                { label: "Weekly", cur: weekPnl, goal: targets.weekly },
                { label: "Monthly", cur: monthPnl, goal: targets.monthly },
              ].map((t) => {
                const pct = Math.min(
                  100,
                  Math.max(0, t.goal > 0 ? (t.cur / t.goal) * 100 : 0),
                );
                const hit = t.cur >= t.goal;
                return (
                  <div key={t.label}>
                    <div className="flex justify-between mb-1 gap-1">
                      <p
                        className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 flex-shrink-0 ${sub}`}
                      >
                        <Target size={10} />
                        {t.label}
                      </p>
                      <p
                        className={`text-xs font-black text-right truncate ${hit ? (d ? "text-emerald-400" : "text-emerald-600") : d ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {fmt(t.cur)}
                        <span className={`font-normal ${sub}`}>
                          {" "}
                          / ${t.goal.toLocaleString()}
                        </span>{" "}
                        {hit && "🎉"}
                      </p>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${d ? "bg-slate-800" : "bg-slate-200"}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${hit ? "bg-emerald-400" : t.cur < 0 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CALENDAR TAB ── */}
          {tab === "calendar" && (
            <>
              {/* View toggle */}
              <div
                className={`flex rounded-xl overflow-hidden border ${d ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
              >
                {[
                  { id: "weekly", Icon: CalendarDays, label: "Weekly" },
                  { id: "monthly", Icon: CalendarDays, label: "Monthly" },
                  { id: "yearly", Icon: BarChart2, label: "Yearly" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setCalView(v.id);
                      setExpanded(null);
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                      ${calView === v.id ? "bg-emerald-500 text-white" : d ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <v.Icon size={12} />
                    {v.label}
                  </button>
                ))}
              </div>

              {/* YEARLY */}
              {calView === "yearly" && (
                <YearlyCalendar
                  dark={dark}
                  data={data}
                  year={year}
                  onMonthClick={(mIdx) => {
                    setMonth(mIdx);
                    setCalView("monthly");
                    setExpanded(null);
                  }}
                />
              )}

              {/* MONTHLY */}
              {calView === "monthly" && (
                <div
                  className={`border rounded-xl sm:rounded-2xl overflow-hidden ${card}`}
                >
                  <div className="grid grid-cols-7">
                    {(isMobile ? DAYS : DAYSFULL).map((dd, i) => (
                      <div
                        key={i}
                        className={`py-2 text-center text-xs font-bold uppercase tracking-widest border-b ${d ? "border-slate-800 text-slate-500 bg-slate-900/60" : "border-slate-200 text-slate-400 bg-slate-50"}`}
                      >
                        {dd}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {cells.map((day, i) => {
                      const key = day ? getKey(day) : null;
                      const dayData = key ? data[key] : null;
                      const dayPnl = dayData
                        ? dayData.trades.reduce((s, t) => s + t.pnl, 0)
                        : 0;
                      const isToday =
                        day &&
                        today.getDate() === day &&
                        today.getMonth() === month &&
                        today.getFullYear() === year;
                      const isExp = !isMobile && expanded === day;
                      const hasTrades = dayData && dayData.trades.length > 0;
                      const dWins = hasTrades
                        ? dayData.trades.filter((t) => t.result === "win")
                            .length
                        : 0;
                      const dLosses = hasTrades
                        ? dayData.trades.filter((t) => t.result === "loss")
                            .length
                        : 0;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!day) return;
                            if (isMobile) {
                              // On mobile: tap always opens modal directly
                              setModal(getKey(day));
                            } else {
                              setExpanded(isExp ? null : day);
                            }
                          }}
                          className={`border-r border-b relative transition-all duration-150 select-none
                            ${d ? "border-slate-800/60" : "border-slate-200"}
                            ${day ? "cursor-pointer active:opacity-75" : "opacity-0 pointer-events-none"}
                            ${isMobile ? "min-h-[52px]" : "min-h-[88px] sm:min-h-[96px]"}
                            ${isExp ? (d ? "ring-2 ring-inset ring-emerald-500/50 bg-slate-800/70" : "ring-2 ring-inset ring-emerald-400/50 bg-emerald-50/60") : ""}
                            ${!isExp && hasTrades && !isMobile ? (d ? "hover:bg-slate-800/40" : "hover:bg-slate-50") : ""}
                            ${!isExp && isMobile ? (d ? "hover:bg-slate-800/30" : "hover:bg-slate-50/80") : ""}
                          `}
                        >
                          {day && (
                            <div className="p-1 sm:p-2 h-full flex flex-col overflow-hidden">
                              {/* Day number */}
                              <div className="flex items-start justify-between mb-0.5">
                                {isToday ? (
                                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                    {day}
                                  </span>
                                ) : (
                                  <span
                                    className={`text-xs font-bold leading-none flex-shrink-0 ${hasTrades ? (d ? "text-slate-200" : "text-slate-700") : d ? "text-slate-600" : "text-slate-400"}`}
                                  >
                                    {day}
                                  </span>
                                )}
                                {hasTrades && !isMobile && (
                                  <span className={`text-xs ${sub}`}>
                                    {dayData.trades.length}T
                                  </span>
                                )}
                              </div>

                              {/* Mobile: just PnL chip, no dots, no overflow */}
                              {isMobile && hasTrades && (
                                <div
                                  className={`rounded border px-1 py-0.5 mt-0.5 ${pnlBg(dayPnl, dark)}`}
                                >
                                  <p
                                    className={`text-xs font-black leading-none truncate ${pnlText(dayPnl, dark)}`}
                                    style={{ fontSize: "10px" }}
                                  >
                                    {fmt(dayPnl)}
                                  </p>
                                </div>
                              )}

                              {/* Desktop: PnL chip + dots */}
                              {!isMobile && hasTrades && (
                                <>
                                  <div
                                    className={`rounded-md border px-1 py-0.5 mb-1 ${pnlBg(dayPnl, dark)}`}
                                  >
                                    <p
                                      className={`text-xs font-black leading-none ${pnlText(dayPnl, dark)}`}
                                    >
                                      {fmt(dayPnl)}
                                    </p>
                                  </div>
                                  <div className="flex gap-0.5 flex-wrap">
                                    {dayData.trades.slice(0, 9).map((t, ti) => (
                                      <div
                                        key={ti}
                                        className={`rounded-full flex-shrink-0 w-1.5 h-1.5 ${t.result === "win" ? "bg-emerald-500" : "bg-red-500"}`}
                                      />
                                    ))}
                                    {dayData.trades.length > 9 && (
                                      <span className={`text-xs ${sub}`}>
                                        +{dayData.trades.length - 9}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}

                              {dayData?.note && !isMobile && (
                                <div className="absolute top-1 right-1 text-xs">
                                  📝
                                </div>
                              )}

                              {/* Desktop expanded */}
                              {isExp && hasTrades && (
                                <div
                                  className={`mt-1.5 pt-1.5 border-t flex-1 ${d ? "border-slate-700" : "border-slate-200"}`}
                                >
                                  <div className="flex gap-1 mb-1">
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded font-bold ${d ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}
                                    >
                                      {dWins}W
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded font-bold ${d ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}
                                    >
                                      {dLosses}L
                                    </span>
                                  </div>
                                  {dayData.trades.slice(0, 3).map((t, ti) => (
                                    <p
                                      key={ti}
                                      className={`text-xs ${pnlText(t.pnl, dark)}`}
                                    >
                                      #{ti + 1} {fmtFull(t.pnl)}
                                    </p>
                                  ))}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModal(getKey(day));
                                    }}
                                    className={`mt-1.5 w-full text-xs py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1
                                      ${d ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                                  >
                                    <Check size={10} /> Edit
                                  </button>
                                </div>
                              )}

                              {/* Desktop empty day hover add */}
                              {!hasTrades && !isMobile && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModal(getKey(day));
                                  }}
                                  className={`mt-auto w-full text-xs py-1 rounded border border-dashed opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-0.5
                                    ${d ? "border-slate-600 text-slate-500 hover:border-emerald-500 hover:text-emerald-500" : "border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-500"}`}
                                >
                                  <Plus size={10} /> Add
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile hint */}
                  {isMobile && (
                    <div
                      className={`px-4 py-2 text-center text-xs border-t ${d ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}
                    >
                      Tap any day to log trades
                    </div>
                  )}

                  {/* Desktop expanded bottom bar */}
                  {!isMobile && expanded && (
                    <div
                      className={`px-4 py-3 border-t ${d ? "border-slate-800 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}
                    >
                      {(() => {
                        const key = getKey(expanded);
                        const dd = data[key];
                        const dp = dd
                          ? dd.trades.reduce((s, t) => s + t.pnl, 0)
                          : 0;
                        const dw = dd
                          ? dd.trades.filter((t) => t.result === "win").length
                          : 0;
                        const dl = dd
                          ? dd.trades.filter((t) => t.result === "loss").length
                          : 0;
                        return (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-xs ${sub}`}>
                                {MSHORT[month]} {expanded}, {year}
                              </p>
                              {dd ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p
                                    className={`font-black text-lg leading-tight ${pnlText(dp, dark)}`}
                                  >
                                    {fmtFull(dp)}
                                  </p>
                                  <span
                                    className={`text-xs font-bold ${d ? "text-emerald-400" : "text-emerald-600"}`}
                                  >
                                    {dw}W
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${d ? "text-red-400" : "text-red-500"}`}
                                  >
                                    {dl}L
                                  </span>
                                </div>
                              ) : (
                                <p className={`text-sm ${sub}`}>
                                  No trades yet
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setModal(getKey(expanded))}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0 flex items-center gap-1.5"
                            >
                              {dd ? (
                                <>
                                  <Check size={14} /> Edit
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* WEEKLY */}
              {calView === "weekly" && (
                <div
                  className={`border rounded-xl sm:rounded-2xl overflow-hidden ${card}`}
                >
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between ${d ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${sub}`}
                    >
                      <CalendarDays size={13} /> Week of {MSHORT[month]} {year}
                    </p>
                    <p
                      className={`text-sm font-black flex items-center gap-1 ${pnlText(weekPnl, d)}`}
                    >
                      {weekPnl >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {fmtFull(weekPnl)}
                    </p>
                  </div>
                  <div
                    className={`divide-y ${d ? "divide-slate-800/60" : "divide-slate-100"}`}
                  >
                    {getWeekDays().map((dateObj, i) => {
                      const k = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
                      const dd = data[k];
                      const dp = dd
                        ? dd.trades.reduce((s, t) => s + t.pnl, 0)
                        : 0;
                      const dw = dd
                        ? dd.trades.filter((t) => t.result === "win").length
                        : 0;
                      const dl = dd
                        ? dd.trades.filter((t) => t.result === "loss").length
                        : 0;
                      const isToday2 =
                        dateObj.toDateString() === today.toDateString();
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-4 py-3 transition-all ${d ? "hover:bg-slate-800/40" : "hover:bg-slate-50"} ${isToday2 ? (d ? "bg-emerald-500/5" : "bg-emerald-50/40") : ""}`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${isToday2 ? "bg-emerald-500 border-emerald-400" : d ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                          >
                            <p
                              className={`text-xs font-black leading-none ${isToday2 ? "text-white" : ""}`}
                            >
                              {dateObj.getDate()}
                            </p>
                            <p
                              className={`text-[10px] leading-none ${isToday2 ? "text-emerald-100" : sub}`}
                            >
                              {DAYSFULL[dateObj.getDay()]}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            {dd ? (
                              <>
                                <p
                                  className={`font-black text-base leading-tight ${pnlText(dp, dark)}`}
                                >
                                  {fmtFull(dp)}
                                </p>
                                <div className="flex gap-2 items-center flex-wrap mt-0.5">
                                  <span className={`text-xs ${sub}`}>
                                    {dd.trades.length}T
                                  </span>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-0.5 ${d ? "text-emerald-400" : "text-emerald-600"}`}
                                  >
                                    <Check size={9} />
                                    {dw}
                                  </span>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-0.5 ${d ? "text-red-400" : "text-red-500"}`}
                                  >
                                    <X size={9} />
                                    {dl}
                                  </span>
                                  <div className="flex gap-0.5">
                                    {dd.trades.slice(0, 8).map((t, ti) => (
                                      <div
                                        key={ti}
                                        className={`w-1.5 h-1.5 rounded-full ${t.result === "win" ? "bg-emerald-500" : "bg-red-500"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className={`text-sm ${sub}`}>No trades</p>
                            )}
                          </div>
                          <button
                            onClick={() => setModal(k)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold border flex-shrink-0 transition-all flex items-center gap-1 ${d ? "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400" : "border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"}`}
                          >
                            {dd ? (
                              <>
                                <Check size={11} /> Edit
                              </>
                            ) : (
                              <>
                                <Plus size={11} /> Add
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            <StatsPanel dark={dark} data={data} month={month} year={year} />
          )}

          {/* ── LOG TAB ── */}
          {tab === "log" && (
            <div
              className={`border rounded-xl sm:rounded-2xl overflow-hidden ${card}`}
            >
              <div
                className={`px-4 py-3 border-b flex items-center gap-2 ${d ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}
              >
                <ClipboardList size={14} className={sub} />
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${sub}`}
                >
                  Trade Log — {MONTHS[month]} {year}
                </p>
              </div>
              {monthEntries.length === 0 ? (
                <div className="p-8 sm:p-10 text-center">
                  <ClipboardList
                    size={40}
                    className={`mx-auto mb-3 opacity-30 ${sub}`}
                  />
                  <p className={`text-sm ${sub}`}>
                    No trades logged yet.
                    <br />
                    {isMobile ? "Tap" : "Click"} any day on the calendar to
                    start!
                  </p>
                </div>
              ) : (
                <div
                  className={`divide-y ${d ? "divide-slate-800" : "divide-slate-100"}`}
                >
                  {monthEntries
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([key, v]) => {
                      const dayPnl = v.trades.reduce((s, t) => s + t.pnl, 0);
                      const dw = v.trades.filter(
                        (t) => t.result === "win",
                      ).length;
                      const dl = v.trades.filter(
                        (t) => t.result === "loss",
                      ).length;
                      const wr2 = v.trades.length
                        ? Math.round((dw / v.trades.length) * 100)
                        : 0;
                      const dObj = new Date(key + "T12:00:00");
                      return (
                        <div
                          key={key}
                          className={`px-4 py-3 sm:py-4 transition-all ${d ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center border flex-shrink-0 ${d ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
                              >
                                <p className="text-xs font-black leading-none">
                                  {dObj.getDate()}
                                </p>
                                <p
                                  className={`text-[10px] leading-none ${sub}`}
                                >
                                  {MSHORT[dObj.getMonth()]}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-lg sm:text-xl font-black leading-tight ${pnlText(dayPnl, dark)}`}
                                >
                                  {fmtFull(dayPnl)}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  <span className={`text-xs ${sub}`}>
                                    {v.trades.length}T
                                  </span>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-0.5 ${d ? "text-emerald-400" : "text-emerald-600"}`}
                                  >
                                    <Check size={9} />
                                    {dw}
                                  </span>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-0.5 ${d ? "text-red-400" : "text-red-500"}`}
                                  >
                                    <X size={9} />
                                    {dl}
                                  </span>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-0.5 ${d ? "text-sky-400" : "text-sky-600"}`}
                                  >
                                    <Zap size={9} />
                                    {wr2}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setModal(key)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-bold border flex-shrink-0 transition-all flex items-center gap-1 ${d ? "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400" : "border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"}`}
                            >
                              <Check size={11} /> Edit
                            </button>
                          </div>
                          <div className="mt-2 flex gap-1.5 flex-wrap">
                            {v.trades.map((t, ti) => (
                              <div
                                key={ti}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border ${t.result === "win" ? (d ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700") : d ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
                              >
                                {t.result === "win" ? (
                                  <Check size={9} />
                                ) : (
                                  <X size={9} />
                                )}
                                <span className="font-bold">{fmt(t.pnl)}</span>
                                {t.img && <Camera size={9} />}
                              </div>
                            ))}
                          </div>
                          {v.note && (
                            <p
                              className={`mt-2 text-xs italic px-3 py-1.5 rounded-lg ${d ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                            >
                              📝 {v.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && (
        <nav
          className={`fixed bottom-0 left-0 right-0 z-40 border-t flex ${d ? "bg-slate-900/98 border-slate-800" : "bg-white/98 border-slate-200"}`}
          style={{
            backdropFilter: "blur(20px)",
            paddingBottom: "env(safe-area-inset-bottom,0px)",
          }}
        >
          {[
            { id: "calendar", Icon: CalendarDays, label: "Calendar" },
            { id: "stats", Icon: BarChart2, label: "Stats" },
            { id: "log", Icon: ClipboardList, label: "Log" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setExpanded(null);
              }}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all active:scale-95
                ${tab === item.id ? (d ? "text-emerald-400" : "text-emerald-600") : d ? "text-slate-500" : "text-slate-400"}`}
            >
              <item.Icon size={21} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {item.label}
              </span>
              {tab === item.id && (
                <div
                  className={`w-1 h-1 rounded-full ${d ? "bg-emerald-400" : "bg-emerald-500"}`}
                />
              )}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
