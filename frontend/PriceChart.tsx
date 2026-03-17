"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  LineStyle,
} from "lightweight-charts";
import { PriceHistory } from "@/lib/api";

interface PriceChartProps {
  priceHistory: PriceHistory[];
  height?: number;
}

export default function PriceChart({
  priceHistory,
  height = 300,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || priceHistory.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#b0b8c1",
        fontFamily:
          "'Pretendard Variable', -apple-system, system-ui, sans-serif",
        fontSize: 11,
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#f2f3f5", style: LineStyle.Solid },
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
      },
      crosshair: {
        horzLine: {
          color: "#8b95a1",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#191f28",
        },
        vertLine: {
          color: "#8b95a1",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#191f28",
        },
      },
      handleScale: { mouseWheel: false, pinch: false },
      handleScroll: { mouseWheel: false },
    });

    chartRef.current = chart;

    // 가격 추이에 따라 상승/하락 색상 결정
    const prices = priceHistory.map((p) => p.price);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const lineColor =
      last > first ? "#f04452" : last < first ? "#3182f6" : "#8b95a1";
    const areaTopColor =
      last > first
        ? "rgba(240, 68, 82, 0.12)"
        : last < first
          ? "rgba(49, 130, 246, 0.12)"
          : "rgba(139, 149, 161, 0.08)";

    const areaSeries = chart.addAreaSeries({
      topColor: areaTopColor,
      bottomColor: "rgba(255, 255, 255, 0)",
      lineColor,
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: lineColor,
      crosshairMarkerBorderColor: "#ffffff",
      crosshairMarkerBorderWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => price.toLocaleString("ko-KR"),
      },
    });

    const chartData = priceHistory
      .map((item) => ({
        time: (Math.floor(new Date(item.scraped_at).getTime() / 1000)) as any,
        value: item.price,
      }))
      .sort((a: any, b: any) => a.time - b.time);

    // 중복 시간 제거
    const unique = chartData.reduce(
      (acc: any[], curr: any) => {
        if (!acc.find((d: any) => d.time === curr.time)) acc.push(curr);
        return acc;
      },
      [] as typeof chartData
    );

    areaSeries.setData(unique);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [priceHistory, height]);

  if (priceHistory.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-[13px] text-[var(--color-text-tertiary)]">
          가격 데이터가 없습니다
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
