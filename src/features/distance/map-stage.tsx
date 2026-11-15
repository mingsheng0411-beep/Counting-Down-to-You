"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "@/lib/cx";

import { WorldMap, type MapPlace, type MapPoint } from "./world-map";

/**
 * A full-viewport map with content floating over its top and bottom edges.
 * The overlays are measured so the map keeps both places clear of them.
 */
export function MapStage({
  a,
  b,
  top,
  bottom,
  className,
  places,
  onSelectPoint,
  onSelectPlace,
  routeLabel,
  children,
}: {
  a: MapPoint;
  b: MapPoint;
  top?: ReactNode;
  bottom?: ReactNode;
  className?: string;
  places?: MapPlace[];
  onSelectPoint?: (index: 0 | 1) => void;
  onSelectPlace?: (id: string) => void;
  /** Text written under the route, e.g. the distance. */
  routeLabel?: string | null;
  /** Extra layers over the map, such as a side panel. */
  children?: ReactNode;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [insets, setInsets] = useState({ top: 0, bottom: 0 });

  useEffect(() => {
    const measure = () => {
      const next = {
        top: topRef.current?.offsetHeight ?? 0,
        bottom: bottomRef.current?.offsetHeight ?? 0,
      };
      setInsets((current) =>
        current.top === next.top && current.bottom === next.bottom
          ? current
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={cx("relative h-dvh min-h-[40rem] overflow-hidden", className)}
    >
      <WorldMap
        className="absolute inset-0"
        a={a}
        b={b}
        insetTop={insets.top}
        insetBottom={insets.bottom}
        places={places}
        onSelectPoint={onSelectPoint}
        onSelectPlace={onSelectPlace}
        routeLabel={routeLabel}
      />
      {/* Overlays ignore the pointer except on their own cards. */}
      <div
        ref={topRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
      >
        {top}
      </div>
      <div
        ref={bottomRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
      >
        {bottom}
      </div>
      {children}
    </section>
  );
}
