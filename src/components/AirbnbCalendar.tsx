import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from "lucide-react";

interface AirbnbCalendarProps {
  startDate: string; // YYYY-MM-DD
  daysCount: number;
  onChange: (startDate: string, daysCount: number) => void;
}

export function AirbnbCalendar({ startDate, daysCount, onChange }: AirbnbCalendarProps) {
  // Current view month/year
  const initialDate = useMemo(() => {
    const d = startDate ? new Date(startDate + "T00:00:00") : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startDate]);

  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [selectionRange, setSelectionRange] = useState<{ start: string; end: string }>(() => {
    const startD = startDate || new Date().toISOString().split("T")[0];
    const endDObj = new Date(startD + "T00:00:00");
    endDObj.setDate(endDObj.getDate() + (daysCount - 1));
    const endD = endDObj.toISOString().split("T")[0];
    return { start: startD, end: endD };
  });

  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Month navigation
  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Days in current month grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function handleDateClick(dateStr: string) {
    if (!selectionRange.start || (selectionRange.start && selectionRange.end)) {
      // First click: select check-in date
      setSelectionRange({ start: dateStr, end: "" });
    } else {
      // Second click: select check-out date
      let start = selectionRange.start;
      let end = dateStr;

      if (new Date(end) < new Date(start)) {
        // Swap if end date is earlier
        const temp = start;
        start = end;
        end = temp;
      }

      const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
      const computedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setSelectionRange({ start, end });
      onChange(start, computedDays);
    }
  }

  function applyPreset(days: number) {
    const start = selectionRange.start || new Date().toISOString().split("T")[0];
    const endDObj = new Date(start + "T00:00:00");
    endDObj.setDate(endDObj.getDate() + (days - 1));
    const end = endDObj.toISOString().split("T")[0];

    setSelectionRange({ start, end });
    onChange(start, days);
  }

  // Helper check for date range styling
  function getDateState(dateStr: string) {
    const isStart = dateStr === selectionRange.start;
    const isEnd = dateStr === selectionRange.end;

    let inRange = false;
    if (selectionRange.start && selectionRange.end) {
      inRange = dateStr > selectionRange.start && dateStr < selectionRange.end;
    } else if (selectionRange.start && hoverDate && hoverDate > selectionRange.start) {
      inRange = dateStr > selectionRange.start && dateStr < hoverDate;
    }

    return { isStart, isEnd, inRange };
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-4">
      {/* Header Info Bar (Airbnb Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">
              Período da Viagem
            </p>
            <p className="text-xs text-muted-foreground">
              {selectionRange.start ? (
                <>
                  <span className="font-bold text-foreground">
                    {new Date(selectionRange.start + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  {selectionRange.end ? (
                    <>
                      {" "}
                      até{" "}
                      <span className="font-bold text-foreground">
                        {new Date(selectionRange.end + "T00:00:00").toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>{" "}
                      (<strong className="text-primary">{daysCount} dias</strong>)
                    </>
                  ) : (
                    " · selecione a data de término"
                  )}
                </>
              ) : (
                "Selecione as datas no calendário"
              )}
            </p>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex gap-1">
          {[
            { label: "2 Dias", days: 2 },
            { label: "3 Dias", days: 3 },
            { label: "5 Dias", days: 5 },
            { label: "7 Dias", days: 7 },
          ].map(({ label, days }) => (
            <button
              key={days}
              type="button"
              onClick={() => applyPreset(days)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold transition ${
                daysCount === days
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-extrabold text-foreground capitalize">{monthName}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground">
        <span>Dom</span>
        <span>Seg</span>
        <span>Ter</span>
        <span>Qua</span>
        <span>Qui</span>
        <span>Sex</span>
        <span>Sáb</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty offsets */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = (currentMonth + 1).toString().padStart(2, "0");
          const dayStr = dayNum.toString().padStart(2, "0");
          const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

          const isPast = dateStr < todayStr;
          const { isStart, isEnd, inRange } = getDateState(dateStr);

          return (
            <div
              key={dateStr}
              onMouseEnter={() => !isPast && setHoverDate(dateStr)}
              className={`relative flex items-center justify-center h-10 ${
                inRange ? "bg-primary/15" : ""
              } ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => handleDateClick(dateStr)}
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  isPast
                    ? "text-muted-foreground/30 line-through cursor-not-allowed"
                    : isStart || isEnd
                      ? "bg-gradient-brand text-white shadow-brand font-black scale-105"
                      : inRange
                        ? "text-primary font-bold"
                        : "text-foreground hover:bg-secondary"
                }`}
              >
                {dayNum}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
