import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  CHART_CONFIG,
  PATIENT_SERIES_COLOR,
  Y_AXIS_UNIT,
  type ChartKind,
  type GrowthChartPoint,
  type PatientSex,
  type WHOReferenceBySex,
  buildAgeAxisTicks,
  chartDisplayTitle,
  defaultWhoReference,
  formatAxisAgeLabel,
  getMaxAgeMonths,
  interpolateWhoSeries,
  percentileMeta,
} from '@/utils/growth-chart';

type ChartSeries = {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  dashed?: boolean;
  showDots?: boolean;
};

type GrowthLineChartProps = {
  kind: ChartKind;
  patientPoints: GrowthChartPoint[];
  sex: PatientSex;
  showWhoReference: boolean;
  whoReference?: WHOReferenceBySex;
  width?: number;
  height?: number;
};

const CHART_HEIGHT = 300;
const PADDING = { top: 22, right: 14, bottom: 48, left: 52 };
const WHO_MAX_MONTHS = 24;
const MIN_CHART_WIDTH = 280;

function buildReferenceSeries(
  kind: ChartKind,
  sex: PatientSex,
  whoReference: WHOReferenceBySex,
  maxAge: number
): ChartSeries[] {
  const reference = whoReference[sex][kind];
  const cap = Math.min(maxAge, WHO_MAX_MONTHS);

  return percentileMeta.map(item => ({
    points: interpolateWhoSeries(reference[item.key], cap),
    color: item.color,
    strokeWidth: item.key === 'p50' ? 2.5 : 1.5,
    dashed: item.key !== 'p50',
  }));
}

function computeYDomain(allSeries: ChartSeries[]): { min: number; max: number } {
  const values = allSeries.flatMap(s => s.points.map(p => p.y));
  if (!values.length) return { min: 0, max: 10 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;
  return { min: Math.max(0, min - padding), max: max + padding };
}

function toPolyline(
  points: { x: number; y: number }[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  plotWidth: number,
  plotHeight: number
): string {
  return points
    .map(p => {
      const x = PADDING.left + ((p.x - xMin) / (xMax - xMin || 1)) * plotWidth;
      const y = PADDING.top + plotHeight - ((p.y - yMin) / (yMax - yMin || 1)) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

function toPoint(
  p: { x: number; y: number },
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  plotWidth: number,
  plotHeight: number
) {
  return {
    x: PADDING.left + ((p.x - xMin) / (xMax - xMin || 1)) * plotWidth,
    y: PADDING.top + plotHeight - ((p.y - yMin) / (yMax - yMin || 1)) * plotHeight,
  };
}

export function GrowthLineChart({
  kind,
  patientPoints,
  sex,
  showWhoReference,
  whoReference = defaultWhoReference,
  width: widthProp,
  height = CHART_HEIGHT,
}: GrowthLineChartProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - measuredWidth) > 1) {
      setMeasuredWidth(w);
    }
  };

  const chartWidth = Math.max(
    MIN_CHART_WIDTH,
    widthProp ?? (measuredWidth > 0 ? measuredWidth : Math.min(screenWidth - 32, 520))
  );

  const config = CHART_CONFIG[kind];
  const plotWidth = chartWidth - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const xMax = useMemo(
    () => Math.max(8, Math.ceil(getMaxAgeMonths(patientPoints)) + 2),
    [patientPoints]
  );
  const xMin = 0;

  const allSeries = useMemo(() => {
    const patientSeries: ChartSeries = {
      points: patientPoints.map(p => ({ x: p.x, y: p.y })),
      color: PATIENT_SERIES_COLOR,
      strokeWidth: 3,
      showDots: true,
    };

    const reference = showWhoReference
      ? buildReferenceSeries(kind, sex, whoReference, xMax)
      : [];

    return [patientSeries, ...reference];
  }, [kind, patientPoints, sex, showWhoReference, whoReference, xMax]);

  const { min: yMin, max: yMax } = useMemo(() => computeYDomain(allSeries), [allSeries]);

  const gridColor = isDark ? '#3f3f46' : '#e2e8f0';
  const axisColor = isDark ? '#a1a1aa' : '#64748b';
  const xTicks = useMemo(() => buildAgeAxisTicks(xMax, 9), [xMax]);

  const yTicks = useMemo(() => {
    const count = 5;
    const step = (yMax - yMin) / count;
    return Array.from({ length: count + 1 }, (_, i) => yMin + step * i);
  }, [yMin, yMax]);

  if (!patientPoints.length) {
    return (
      <View
        style={[styles.empty, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
        onLayout={onLayout}>
        <ThemedText type="smallBold" style={styles.emptyTitle}>
          {chartDisplayTitle(kind)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          No measurements recorded yet.
        </ThemedText>
      </View>
    );
  }

  const patientLine = allSeries[0];
  const lastPatientIndex = patientLine.points.length - 1;
  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <ThemedText style={[styles.title, { color: theme.text }]}>
        {chartDisplayTitle(kind)}
      </ThemedText>

      <View
        style={[
          styles.chartSurface,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}>
        <Svg width={chartWidth} height={height}>
          {yTicks.map(tick => {
            const { y } = toPoint({ x: xMin, y: tick }, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
            return (
              <Line
                key={`grid-y-${tick}`}
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + plotWidth}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          })}

          <Line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + plotHeight}
            stroke={axisColor}
            strokeWidth={1}
          />
          <Line
            x1={PADDING.left}
            y1={PADDING.top + plotHeight}
            x2={PADDING.left + plotWidth}
            y2={PADDING.top + plotHeight}
            stroke={axisColor}
            strokeWidth={1}
          />

          <G rotation={-90} originX={16} originY={PADDING.top + plotHeight / 2}>
            <SvgText
              x={16}
              y={PADDING.top + plotHeight / 2}
              fontSize={10}
              fill={axisColor}
              textAnchor="middle"
              fontWeight="600">
              {Y_AXIS_UNIT[kind]}
            </SvgText>
          </G>

          {yTicks.map(tick => (
            <SvgText
              key={`ylabel-${tick}`}
              x={PADDING.left - 8}
              y={
                toPoint({ x: xMin, y: tick }, xMin, xMax, yMin, yMax, plotWidth, plotHeight).y + 4
              }
              fontSize={10}
              fill={axisColor}
              textAnchor="end">
              {tick.toFixed(config.yDecimals)}
            </SvgText>
          ))}

          {xTicks.map(tick => {
            const { x } = toPoint({ x: tick, y: yMin }, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
            return (
              <SvgText
                key={`xlabel-${tick}`}
                x={x}
                y={PADDING.top + plotHeight + 18}
                fontSize={9}
                fill={axisColor}
                textAnchor="middle">
                {formatAxisAgeLabel(tick)}
              </SvgText>
            );
          })}

          <SvgText
            x={PADDING.left + plotWidth / 2}
            y={height - 8}
            fontSize={10}
            fill={axisColor}
            textAnchor="middle"
            fontWeight="600">
            AGE (MONTHS)
          </SvgText>

          {allSeries.slice(1).map((series, index) => (
            <Polyline
              key={`ref-${index}`}
              points={toPolyline(series.points, xMin, xMax, yMin, yMax, plotWidth, plotHeight)}
              fill="none"
              stroke={series.color}
              strokeWidth={series.strokeWidth}
              strokeDasharray={series.dashed ? '5,5' : undefined}
              opacity={0.95}
            />
          ))}

          {patientLine.points.length >= 2 ? (
            <Polyline
              points={toPolyline(patientLine.points, xMin, xMax, yMin, yMax, plotWidth, plotHeight)}
              fill="none"
              stroke={patientLine.color}
              strokeWidth={patientLine.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {patientLine.points.length === 1 ? (
            <Line
              x1={toPoint(patientLine.points[0], xMin, xMax, yMin, yMax, plotWidth, plotHeight).x}
              y1={toPoint(patientLine.points[0], xMin, xMax, yMin, yMax, plotWidth, plotHeight).y}
              x2={toPoint(patientLine.points[0], xMin, xMax, yMin, yMax, plotWidth, plotHeight).x}
              y2={PADDING.top + plotHeight}
              stroke={patientLine.color}
              strokeWidth={2}
            />
          ) : null}

          {patientLine.showDots
            ? patientLine.points.map((p, i) => {
                const pt = toPoint(p, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
                const isLast = i === lastPatientIndex;
                return (
                  <Circle
                    key={`dot-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isLast ? 7 : 4}
                    fill={patientLine.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              })
            : null}
        </Svg>
      </View>

      <View style={styles.legend}>
        <LegendItem color={PATIENT_SERIES_COLOR} label="Patient" />
        {showWhoReference
          ? percentileMeta.map(item => (
              <LegendItem key={item.key} color={item.color} label={`${item.label} percentile`} />
            ))
          : null}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <ThemedText style={styles.legendLabel}>{label.toUpperCase()}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chartSurface: {
    width: '100%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  empty: {
    width: '100%',
    minHeight: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
});
