import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const months = [
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
const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const HEADER_TODAY_MIN_WIDTH = 312;
const MIN_RESPONSIVE_HEIGHT = 322;
const MIN_FOOTER_HEIGHT = 378;
const MULTI_VIEW_WIDTH_WITH_WEEKS = 596;
const MULTI_VIEW_WIDTH_WITHOUT_WEEKS = 548;
const MULTI_VIEW_HEIGHT = 378;
type CalendarBodyMode = "days" | "months" | "years";

function isoWeek(date: Date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const start = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil(((value.getTime() - start.getTime()) / 86400000 + 1) / 7);
}

function MonthGrid({
  view,
  selected,
  showWeekNumbers,
  responsive = false,
  onChooseDate,
}: {
  view: Date;
  selected: Date;
  showWeekNumbers: boolean;
  responsive?: boolean;
  onChooseDate: (date: Date) => void;
}) {
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1) {
      const outsideDay = daysInPreviousMonth + day;
      return { day: outsideDay, date: new Date(year, month - 1, outsideDay), outsideMonth: true };
    }
    if (day <= daysInMonth) return { day, date: new Date(year, month, day), outsideMonth: false };
    const outsideDay = day - daysInMonth;
    return { day: outsideDay, date: new Date(year, month + 1, outsideDay), outsideMonth: true };
  });

  return (
    <div
      className={[
        "calendar-grid",
        !showWeekNumbers && "grid-without-weeks",
        responsive && "responsive-grid",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showWeekNumbers && <div className="week-spacer" />}
      {weekdays.map((day) => (
        <div className="weekday" key={day}>
          {day}
        </div>
      ))}
      {Array.from({ length: 6 }, (_, row) => (
        <div className="contents" key={row}>
          {showWeekNumbers && (
            <div className="week-number">
              {isoWeek(new Date(year, month, row * 7 - firstDay + 1))}
            </div>
          )}
          {cells.slice(row * 7, row * 7 + 7).map((cell) => (
            <button
              className={[
                "day",
                cell.outsideMonth && "outside-month",
                selected.getFullYear() === cell.date.getFullYear() &&
                  selected.getMonth() === cell.date.getMonth() &&
                  selected.getDate() === cell.date.getDate() &&
                  "selected",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              key={cell.date.getTime()}
              onClick={() => onChooseDate(cell.date)}
              aria-label={`${months[cell.date.getMonth()]} ${cell.day}, ${cell.date.getFullYear()}`}
              aria-pressed={
                selected.getFullYear() === cell.date.getFullYear() &&
                selected.getMonth() === cell.date.getMonth() &&
                selected.getDate() === cell.date.getDate()
              }
            >
              <span className="day-inner">{cell.day}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function Calendar({
  centered = false,
  showWeekNumbers = true,
  responsive = false,
  drilldown = false,
  fluidTodayPlacement = false,
  currentView,
  currentSelected,
  showNavigation = true,
  showFooter = true,
  reserveFooterSpace = false,
  currentBodyMode,
  onViewChange,
  onSelectedChange,
  onBodyModeChange,
  onToday,
  onTodayPlacementChange,
}: {
  centered?: boolean;
  showWeekNumbers?: boolean;
  responsive?: boolean;
  drilldown?: boolean;
  fluidTodayPlacement?: boolean;
  currentView?: Date;
  currentSelected?: Date;
  showNavigation?: boolean;
  showFooter?: boolean;
  reserveFooterSpace?: boolean;
  currentBodyMode?: CalendarBodyMode;
  onViewChange?: (date: Date) => void;
  onSelectedChange?: (date: Date) => void;
  onBodyModeChange?: (bodyMode: CalendarBodyMode) => void;
  onToday?: (date: Date) => void;
  onTodayPlacementChange?: (todayInHeader: boolean) => void;
}) {
  const [uncontrolledView, setUncontrolledView] = useState(() => new Date(2021, 8, 1));
  const [uncontrolledSelected, setUncontrolledSelected] = useState(() => new Date(2021, 8, 1));
  const [openMenu, setOpenMenu] = useState<"month" | "year" | null>(null);
  const [uncontrolledBodyMode, setUncontrolledBodyMode] = useState<CalendarBodyMode>("days");
  const [showTodayInHeader, setShowTodayInHeader] = useState(false);
  const calendarRef = useRef<HTMLElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const view = currentView ?? uncontrolledView;
  const selected = currentSelected ?? uncontrolledSelected;
  const bodyMode = currentBodyMode ?? uncontrolledBodyMode;
  const todayInHeader = fluidTodayPlacement && showTodayInHeader && !centered;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (openMenu === "year" || bodyMode === "years") {
      selectedYearRef.current?.scrollIntoView({ block: "center" });
    }
  }, [openMenu, bodyMode, view]);

  useEffect(() => {
    const calendar = calendarRef.current;
    if (!calendar) return;

    const updateTodayPlacement = () => {
      setShowTodayInHeader(calendar.getBoundingClientRect().width >= HEADER_TODAY_MIN_WIDTH);
    };
    const observer = new ResizeObserver(updateTodayPlacement);
    observer.observe(calendar);
    updateTodayPlacement();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    onTodayPlacementChange?.(todayInHeader);
  }, [onTodayPlacementChange, todayInHeader]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const years = Array.from({ length: 201 }, (_, index) => 1900 + index);

  function setCalendarView(date: Date) {
    if (currentView) onViewChange?.(date);
    else setUncontrolledView(date);
  }

  function setCalendarSelected(date: Date) {
    if (currentSelected) onSelectedChange?.(date);
    else setUncontrolledSelected(date);
  }

  function setCalendarBodyMode(mode: CalendarBodyMode) {
    if (currentBodyMode) onBodyModeChange?.(mode);
    else setUncontrolledBodyMode(mode);
  }

  function moveMonth(offset: number) {
    if (bodyMode === "years") {
      setCalendarView(new Date(year + offset * 21, month, 1));
    } else if (bodyMode === "months") {
      setCalendarView(new Date(year + offset, month, 1));
    } else {
      setCalendarView(new Date(year, month + offset, 1));
    }
    setOpenMenu(null);
  }

  function chooseDate(date: Date) {
    setCalendarSelected(date);
    setCalendarView(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function goToday() {
    const today = new Date();
    if (onToday) onToday(today);
    else {
      setCalendarView(new Date(today.getFullYear(), today.getMonth(), 1));
      setCalendarSelected(today);
    }
    setOpenMenu(null);
    setCalendarBodyMode("days");
  }

  const previousButton = (
    <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m10 3-5 5 5 5" />
      </svg>
    </button>
  );
  const nextButton = (
    <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m6 3 5 5-5 5" />
      </svg>
    </button>
  );
  const todayButton = (
    <button
      type="button"
      className={todayInHeader ? "today-button today-button--header" : "today-button"}
      onClick={goToday}
    >
      Today
    </button>
  );

  return (
      <section
        ref={calendarRef}
        className={[
          "calendar",
          centered && "calendar--centered",
          !showWeekNumbers && "calendar--without-weeks",
          responsive && "calendar--responsive",
          !showFooter && "calendar--without-footer",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={centered ? "Centered calendar" : "Calendar"}
      >
        <header className="calendar-header">
          {centered && showNavigation && <nav className="arrows" aria-label="Previous month">{previousButton}</nav>}
          <div className="date-nav">
            <button
              className="label-button"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={drilldown ? bodyMode === "months" : openMenu === "month"}
              onClick={() =>
                drilldown
                  ? setCalendarBodyMode(bodyMode === "months" ? "days" : "months")
                  : setOpenMenu(openMenu === "month" ? null : "month")
              }
            >
              {months[month]}
            </button>
            <button
              className="label-button"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={drilldown ? bodyMode === "years" : openMenu === "year"}
              onClick={() =>
                drilldown
                  ? setCalendarBodyMode(bodyMode === "years" ? "days" : "years")
                  : setOpenMenu(openMenu === "year" ? null : "year")
              }
            >
              {year}
            </button>
          </div>
          <nav className="arrows" aria-label={centered ? "Next month" : "Month navigation"}>
            {!centered && showNavigation && previousButton}
            {todayInHeader && todayButton}
            {showNavigation && nextButton}
          </nav>
        </header>

        {bodyMode === "days" && (
          <MonthGrid
            view={view}
            selected={selected}
            showWeekNumbers={showWeekNumbers}
            responsive={responsive}
            onChooseDate={chooseDate}
          />
        )}

        {bodyMode === "months" && (
          <div className="calendar-choice-grid month-choice-grid" role="listbox" aria-label="Choose month">
            {months.map((name, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === month}
                key={name}
                onClick={() => {
                  setCalendarView(new Date(year, index, 1));
                  setCalendarBodyMode("days");
                }}
              >
                <span>{name.slice(0, 3)}</span>
              </button>
            ))}
          </div>
        )}

        {bodyMode === "years" && (
          <div className="year-choice-view">
            <div className="calendar-choice-grid year-choice-grid" role="listbox" aria-label="Choose year">
              {years.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={item === year}
                  ref={item === year ? selectedYearRef : undefined}
                  key={item}
                  onClick={() => {
                    setCalendarView(new Date(item, month, 1));
                    setCalendarBodyMode("days");
                  }}
                >
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(showFooter || reserveFooterSpace) && !todayInHeader && (
          <footer className={centered ? "centered-footer" : undefined}>{showFooter && todayButton}</footer>
        )}

        {!drilldown && openMenu === "month" && (
          <div className="menu month-menu" role="listbox" aria-label="Choose month">
            {months.map((name, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === month}
                key={name}
                onClick={() => {
                  setCalendarView(new Date(year, index, 1));
                  setOpenMenu(null);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {!drilldown && openMenu === "year" && (
          <div className="menu year-menu" role="listbox" aria-label="Choose year">
            {years.map((item) => (
              <button
                type="button"
                role="option"
                aria-selected={item === year}
                ref={item === year ? selectedYearRef : undefined}
                key={item}
                onClick={() => {
                  setCalendarView(new Date(item, month, 1));
                  setOpenMenu(null);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>
  );
}

function MultiViewCalendar({
  showWeekNumbers,
  fluidTodayPlacement,
  onTodayPlacementChange,
}: {
  showWeekNumbers: boolean;
  fluidTodayPlacement: boolean;
  onTodayPlacementChange: (todayInHeader: boolean) => void;
}) {
  const [view, setView] = useState(() => new Date(2021, 8, 1));
  const [selected, setSelected] = useState(() => new Date(2021, 9, 1));
  const [bodyMode, setBodyMode] = useState<CalendarBodyMode>("days");
  const [todayInHeader, setTodayInHeader] = useState(false);
  const nextView = new Date(view.getFullYear(), view.getMonth() + 1, 1);

  function updateTodayPlacement(value: boolean) {
    setTodayInHeader(value);
    onTodayPlacementChange(value);
  }

  return (
    <section className="multi-calendar" aria-label="Two-month calendar">
      <Calendar
        responsive
        drilldown
        showWeekNumbers={showWeekNumbers}
        currentView={view}
        currentSelected={selected}
        currentBodyMode={bodyMode}
        showNavigation={false}
        showFooter={false}
        reserveFooterSpace={!todayInHeader}
        onViewChange={setView}
        onSelectedChange={setSelected}
        onBodyModeChange={setBodyMode}
      />
      <Calendar
        responsive
        drilldown
        showWeekNumbers={showWeekNumbers}
        currentView={nextView}
        currentSelected={selected}
        currentBodyMode={bodyMode}
        fluidTodayPlacement={fluidTodayPlacement}
        onViewChange={(date) => setView(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        onSelectedChange={setSelected}
        onBodyModeChange={setBodyMode}
        onTodayPlacementChange={updateTodayPlacement}
        onToday={(today) => {
          setView(new Date(today.getFullYear(), today.getMonth(), 1));
          setSelected(today);
        }}
      />
    </section>
  );
}

export default function App() {
  const [showWeekNumbers, setShowWeekNumbers] = useState(true);
  const [fluidTodayPlacement, setFluidTodayPlacement] = useState(false);
  const [multiView, setMultiView] = useState(false);
  const [responsiveWidth, setResponsiveWidth] = useState(298);
  const [responsiveHeight, setResponsiveHeight] = useState(MIN_RESPONSIVE_HEIGHT);
  const [todayInHeader, setTodayInHeader] = useState(false);
  const responsiveFrameRef = useRef<HTMLDivElement>(null);
  const previousTodayInHeader = useRef<boolean | null>(null);

  function minimumWidth(weekNumbers = showWeekNumbers) {
    if (multiView) return weekNumbers ? MULTI_VIEW_WIDTH_WITH_WEEKS : MULTI_VIEW_WIDTH_WITHOUT_WEEKS;
    return weekNumbers ? 298 : 274;
  }

  useEffect(() => {
    const previous = previousTodayInHeader.current;
    previousTodayInHeader.current = todayInHeader;

    if (previous === todayInHeader) return;

    const footerHeight = MIN_FOOTER_HEIGHT - MIN_RESPONSIVE_HEIGHT;
    setResponsiveHeight((height) =>
      todayInHeader
        ? Math.max(MIN_RESPONSIVE_HEIGHT, height - footerHeight)
        : Math.min(720, Math.max(MIN_FOOTER_HEIGHT, height + footerHeight)),
    );
  }, [multiView, todayInHeader]);

  useEffect(() => {
    if (multiView) {
      previousTodayInHeader.current = false;
      setTodayInHeader(false);
      setResponsiveWidth((width) => Math.max(minimumWidth(), width));
    }
  }, [multiView, showWeekNumbers]);

  function startResize(direction: -1 | 1) {
    return (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = responsiveWidth;

      const resize = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + (moveEvent.clientX - startX) * direction;
        setResponsiveWidth(Math.min(1000, Math.max(minimumWidth(), nextWidth)));
      };
      const stop = () => {
        window.removeEventListener("pointermove", resize);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", resize);
      window.addEventListener("pointerup", stop);
    };
  }

  function startVerticalResize(direction: -1 | 1) {
    return (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = responsiveFrameRef.current?.getBoundingClientRect().height ?? 370;
      const minimumHeight = todayInHeader ? MIN_RESPONSIVE_HEIGHT : MIN_FOOTER_HEIGHT;

      const resize = (moveEvent: PointerEvent) => {
        const nextHeight = startHeight + (moveEvent.clientY - startY) * direction;
        setResponsiveHeight(Math.min(720, Math.max(minimumHeight, nextHeight)));
      };
      const stop = () => {
        window.removeEventListener("pointermove", resize);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", resize);
      window.addEventListener("pointerup", stop);
    };
  }

  function startCornerResize(horizontalDirection: -1 | 1, verticalDirection: -1 | 1) {
    return (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = responsiveWidth;
      const startHeight = responsiveFrameRef.current?.getBoundingClientRect().height ?? 370;
      const minimumHeight = todayInHeader ? MIN_RESPONSIVE_HEIGHT : MIN_FOOTER_HEIGHT;

      const resize = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + (moveEvent.clientX - startX) * horizontalDirection;
        const nextHeight = startHeight + (moveEvent.clientY - startY) * verticalDirection;
        setResponsiveWidth(Math.min(1000, Math.max(minimumWidth(), nextWidth)));
        setResponsiveHeight(Math.min(720, Math.max(minimumHeight, nextHeight)));
      };
      const stop = () => {
        window.removeEventListener("pointermove", resize);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", resize);
      window.addEventListener("pointerup", stop);
    };
  }

  return (
    <main className="calendar-page">
      <div className="demo-intro">
        <h1 className="demo-title">Calendar Revamp Demo</h1>
        <p className="demo-instructions">
          Drag an edge or corner handle to explore horizontal, vertical, and combined resizing.
          <br />
          Select the month or year in the header to switch to its selection view.
          <br />
          Enable Multi-view calendar to compare two consecutive months.
        </p>
        <div className="demo-controls">
          <span>Show week numbers</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={showWeekNumbers}
              onChange={(event) => {
                const currentFrameWidth =
                  responsiveFrameRef.current?.getBoundingClientRect().width ?? responsiveWidth;
                const widthDelta = (event.target.checked ? 1 : -1) * (multiView ? 48 : 24);
                const nextMinimumWidth = minimumWidth(event.target.checked);

                setResponsiveWidth(Math.min(1000, Math.max(nextMinimumWidth, currentFrameWidth + widthDelta)));
                setShowWeekNumbers(event.target.checked);
              }}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="sr-only">Toggle week number columns</span>
          </label>
        </div>
        <div className="demo-controls">
          <span>Fluid Today placement</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={fluidTodayPlacement}
              onChange={(event) => setFluidTodayPlacement(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="sr-only">Toggle fluid Today button placement</span>
          </label>
        </div>
        <div className="demo-controls">
          <span>Multi-view calendar</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={multiView}
              onChange={(event) => {
                setMultiView(event.target.checked);
                if (event.target.checked) {
                  setResponsiveWidth(
                    showWeekNumbers ? MULTI_VIEW_WIDTH_WITH_WEEKS : MULTI_VIEW_WIDTH_WITHOUT_WEEKS,
                  );
                  setResponsiveHeight(MULTI_VIEW_HEIGHT);
                } else {
                  setResponsiveHeight(MIN_FOOTER_HEIGHT);
                }
              }}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="sr-only">Toggle two-month calendar view</span>
          </label>
        </div>
      </div>
      <div className="responsive-demo">
        <div
          ref={responsiveFrameRef}
          className="responsive-frame"
          style={{ width: responsiveWidth, height: responsiveHeight }}
        >
          <button
            className="resize-handle resize-handle--top-left"
            type="button"
            aria-label="Resize calendar from top left"
            onPointerDown={startCornerResize(-1, -1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--top"
            type="button"
            aria-label="Resize calendar from top"
            onPointerDown={startVerticalResize(-1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--top-right"
            type="button"
            aria-label="Resize calendar from top right"
            onPointerDown={startCornerResize(1, -1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--left"
            type="button"
            aria-label="Resize calendar from left"
            onPointerDown={startResize(-1)}
          >
            <span />
          </button>
          {multiView ? (
            <MultiViewCalendar
              showWeekNumbers={showWeekNumbers}
              fluidTodayPlacement={fluidTodayPlacement}
              onTodayPlacementChange={setTodayInHeader}
            />
          ) : (
            <Calendar
              drilldown
              responsive
              showWeekNumbers={showWeekNumbers}
              fluidTodayPlacement={fluidTodayPlacement}
              onTodayPlacementChange={setTodayInHeader}
            />
          )}
          <button
            className="resize-handle resize-handle--bottom-left"
            type="button"
            aria-label="Resize calendar from bottom left"
            onPointerDown={startCornerResize(-1, 1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--bottom"
            type="button"
            aria-label="Resize calendar from bottom"
            onPointerDown={startVerticalResize(1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--bottom-right"
            type="button"
            aria-label="Resize calendar from bottom right"
            onPointerDown={startCornerResize(1, 1)}
          >
            <span />
          </button>
          <button
            className="resize-handle resize-handle--right"
            type="button"
            aria-label="Resize calendar from right"
            onPointerDown={startResize(1)}
          >
            <span />
          </button>
        </div>
      </div>
    </main>
  );
}
