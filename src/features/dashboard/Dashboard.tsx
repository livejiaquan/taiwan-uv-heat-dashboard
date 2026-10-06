import { useCallback, useEffect, useRef, useState } from "react";
import type { Audience } from "../../lib/guidance";
import { SKIN_TYPES } from "../../lib/levels";
import { storage } from "../../lib/storage";
import { taipeiHour } from "../../lib/time";
import type { DashboardData } from "../../lib/types";
import { Advice } from "./components/Advice";
import { Footer } from "./components/Footer";
import { National, type Metric } from "./components/National";
import { StatusLine } from "./components/StatusLine";
import { Timeline } from "./components/Timeline";
import { TopBar } from "./components/TopBar";
import { Verdict } from "./components/Verdict";
import { useNow } from "./useNow";

interface DashboardProps {
  data: DashboardData;
  refreshing: boolean;
  onRefresh: () => void;
}

const DEFAULT_COUNTY = "臺南市";

const initialSkin = () => {
  const stored = Number(storage.get("skin") ?? 1);
  return Number.isInteger(stored) && stored >= 0 && stored < SKIN_TYPES.length ? stored : 1;
};

export function Dashboard({ data, refreshing, onRefresh }: DashboardProps) {
  const now = useNow();
  const nowHour = taipeiHour(now);

  const [countyName, setCountyName] = useState(() => storage.get("county") ?? DEFAULT_COUNTY);
  const [dayIndex, setDayIndex] = useState<0 | 1>(0);
  // null follows the clock on today; a number is an hour the reader picked.
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [audience, setAudience] = useState<Audience>("general");
  const [skin, setSkin] = useState(initialSkin);
  const [metric, setMetric] = useState<Metric>("uv");
  const [centerKey, setCenterKey] = useState(0);
  const [compactHeader, setCompactHeader] = useState(false);
  const verdictRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const county = data.counties.find((c) => c.county === countyName) ?? data.counties.find((c) => c.county === DEFAULT_COUNTY)!;
  const day = county.days[dayIndex];
  const hour = pickedHour ?? (dayIndex === 0 ? nowHour : 12);
  const isNow = dayIndex === 0 && hour === nowHour;
  const dayWord = dayIndex === 0 ? "今天" : "明天";

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const observer = new IntersectionObserver(([entry]) => setCompactHeader(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  const selectHour = useCallback(
    (next: number, center = false) => {
      setPickedHour(dayIndex === 0 && next === nowHour ? null : next);
      if (center) setCenterKey((k) => k + 1);
    },
    [dayIndex, nowHour],
  );

  const goNow = () => {
    setDayIndex(0);
    setPickedHour(null);
    setCenterKey((k) => k + 1);
  };

  const changeDay = (next: 0 | 1) => {
    if (next === dayIndex) return;
    setDayIndex(next);
    // Tomorrow opens on the daytime picture; today goes back to the clock.
    setPickedHour(next === 0 ? null : hour < 7 || hour > 18 ? 12 : hour);
    setCenterKey((k) => k + 1);
  };

  const selectCounty = (name: string, revealVerdict = false) => {
    setCountyName(name);
    storage.set("county", name);
    if (revealVerdict && verdictRef.current && verdictRef.current.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      verdictRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const changeSkin = (next: number) => {
    setSkin(next);
    storage.set("skin", String(next));
  };

  return (
    <>
      <TopBar
        counties={data.counties}
        county={county}
        day={day}
        hour={hour}
        mode={data.mode}
        compact={compactHeader}
        onSelectCounty={selectCounty}
      />
      <div className="wrap">
        <StatusLine data={data} now={now} refreshing={refreshing} onRefresh={onRefresh} />
        <main>
          <Verdict
            sectionRef={verdictRef}
            titleRef={titleRef}
            county={county}
            day={day}
            dayIndex={dayIndex}
            dayWord={dayWord}
            hour={hour}
            isNow={isNow}
            skin={skin}
            demo={data.mode === "demo"}
            onSkin={changeSkin}
            onDay={changeDay}
          />
          <Timeline
            day={day}
            dayWord={dayWord}
            hour={hour}
            nowHour={dayIndex === 0 ? nowHour : null}
            isNow={isNow}
            centerKey={centerKey}
            demo={data.mode === "demo"}
            onSelect={selectHour}
            onNow={goNow}
          />
          <Advice county={county.county} day={day} dayWord={dayWord} audience={audience} onAudience={setAudience} />
          <National
            counties={data.counties}
            dayIndex={dayIndex}
            dayWord={dayWord}
            selected={county.county}
            metric={metric}
            onMetric={setMetric}
            onSelect={(name) => selectCounty(name, true)}
          />
        </main>
        <Footer />
      </div>
    </>
  );
}
