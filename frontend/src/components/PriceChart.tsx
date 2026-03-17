"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";
import type { PriceHistory } from "@/lib/api";

export default function PriceChart({
  data,
  height = 240,
}: {
  data: PriceHistory[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#b0b8c1",
        fontFamily: "'Pretendard Variable', system-ui, sans-serif",
        fontSize: 11,
      },
      width: ref.current.clientWidth,
      height,
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#f2f4f6" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return `${d.getDate()}일 ${d.getHours()}시`;
        },
      },
      crosshair: {
        horzLine: {
          color: "#d1d6db",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#191f28",
        },
        vertLine: {
          color: "#d1d6db",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#191f28",
        },
      },
      handleScale: false,
      handleScroll: false,
    });

    // TradingView 로고 숨기기
    const logoElements = ref.current.querySelectorAll('a[href*="tradingview"]');
    logoElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // 추가 방어 — 로고가 늦게 렌더링될 수 있으므로 MutationObserver 사용
    const observer = new MutationObserver(() => {
      const logos = ref.current?.querySelectorAll('a[href*="tradingview"]');
      logos?.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    });
    observer.observe(ref.current, { childList: true, subtree: true });

    const prices = data.map((d) => d.price);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const color =
      last > first ? "#f04452" : last < first ? "#3182f6" : "#8b95a1";
    const areaTop =
      last > first
        ? "rgba(240,68,82,0.08)"
        : last < first
          ? "rgba(49,130,246,0.08)"
          : "rgba(139,149,161,0.05)";

    const series = chart.addAreaSeries({
      topColor: areaTop,
      bottomColor: "transparent",
      lineColor: color,
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: color,
      crosshairMarkerBorderColor: "#fff",
      crosshairMarkerBorderWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (p: number) => p.toLocaleString("ko-KR"),
      },
    });

    const mapped = data
      .map((item) => ({
        time: Math.floor(
          new Date(item.scraped_at).getTime() / 1000
        ) as number,
        value: item.price,
      }))
      .sort((a, b) => a.time - b.time);

    const unique = mapped.filter(
      (v, i, arr) => i === 0 || v.time !== arr[i - 1].time
    );

    series.setData(unique as any);
    chart.timeScale().fitContent();

    const onResize = () => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      chart.remove();
    };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b0b8c1",
          fontSize: 13,
        }}
      >
        가격 데이터 없음
      </div>
    );
  }

  return <div ref={ref} />;
}
