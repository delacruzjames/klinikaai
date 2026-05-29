import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { PatientUI } from '@/components/patients/patient-ui';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  CHART_CONFIG,
  PATIENT_SERIES_COLOR,
  type ChartKind,
  type GrowthChartPoint,
  type PatientSex,
  type WHOReferenceBySex,
  defaultWhoReference,
  getMaxAgeMonths,
  percentileMeta,
  whoSeriesToPoints,
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
  compact?: boolean;
};

const CHART_HEIGHT = 220;
const PADDING = { top: 12, right: 12, bottom: 32, left: 40 };

function buildReferenceSeries(
  kind: ChartKind,
  sex: PatientSex,
  whoReference: WHOReferenceBySex
): ChartSeries[] {
  if (kind === 'bmi') return [];

  const reference = whoReference[sex][kind];
  return percentileMeta.map(item => ({
    points: whoSeriesToPoints(reference[item.key]),
    color: item.color,
    strokeWidth: 1.5,
    dashed: item.key !== 'p50',
  }));
}

function computeYDomain(allSeries: ChartSeries[]): { min: number; max: number } {
  const values = allSeries.flatMap(s => s.points.map(p => p.y));
  if (!values.length) return { min: 0, max: 10 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.12 || 1;
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
  compact = false,
}: GrowthLineChartProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth =
    widthProp ?? Math.min(screenWidth - Spacing.three * 2 - Spacing.four * 2, 480);

  const config = CHART_CONFIG[kind];
  const plotWidth = chartWidth - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const allSeries = useMemo(() => {
    const patientSeries: ChartSeries = {
      points: patientPoints.map(p => ({ x: p.x, y: p.y })),
      color: PATIENT_SERIES_COLOR,
      strokeWidth: 3,
      showDots: true,
    };

    const reference =
      showWhoReference && kind !== 'bmi' ? buildReferenceSeries(kind, sex, whoReference) : [];

    return [patientSeries, ...reference];
  }, [kind, patientPoints, sex, showWhoReference, whoReference]);

  const xMax = useMemo(
    () => Math.ceil(getMaxAgeMonths(patientPoints)) + 2,
    [patientPoints]
  );
  const xMin = 0;
  const { min: yMin, max: yMax } = useMemo(() => computeYDomain(allSeries), [allSeries]);

  const gridColor = isDark ? theme.backgroundSelected : '#e2e8f0';
  const axisColor = theme.textSecondary;
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = xMax <= 24 ? 3 : Math.ceil(xMax / 6);
    for (let v = 0; v <= xMax; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== xMax) ticks.push(xMax);
    return ticks;
  }, [xMax]);

  const yTicks = useMemo(() => {
    const count = 4;
    const step = (yMax - yMin) / count;
    return Array.from({ length: count + 1 }, (_, i) => yMin + step * i);
  }, [yMin, yMax]);

  if (!patientPoints.length) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          No {kind} measurements recorded yet.
        </ThemedText>
      </View>
    );
  }

  const patientLine = allSeries[0];

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" style={styles.title}>
        {config.title}
      </ThemedText>
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

        {yTicks.map(tick => {
          const { y } = toPoint({ x: xMin, y: tick }, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
          return (
            <SvgText
              key={`ylabel-${tick}`}
              x={PADDING.left - 6}
              y={y + 4}
              fontSize={10}
              fill={axisColor}
              textAnchor="end">
              {tick.toFixed(config.yDecimals)}
            </SvgText>
          );
        })}

        {xTicks.map(tick => {
          const { x } = toPoint({ x: tick, y: yMin }, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
          const label = tick < 24 ? `${tick}m` : `${Math.round(tick / 12)}y`;
          return (
            <SvgText
              key={`xlabel-${tick}`}
              x={x}
              y={PADDING.top + plotHeight + 18}
              fontSize={10}
              fill={axisColor}
              textAnchor="middle">
              {label}
            </SvgText>
          );
        })}

        <SvgText
          x={PADDING.left + plotWidth / 2}
          y={height - 4}
          fontSize={10}
          fill={axisColor}
          textAnchor="middle">
          Age (months)
        </SvgText>

        {allSeries.slice(1).map((series, index) => (
          <Polyline
            key={`ref-${index}`}
            points={toPolyline(series.points, xMin, xMax, yMin, yMax, plotWidth, plotHeight)}
            fill="none"
            stroke={series.color}
            strokeWidth={series.strokeWidth}
            strokeDasharray={series.dashed ? '4,4' : undefined}
            opacity={0.85}
          />
        ))}

        {patientLine.points.length >= 2 ? (
          <Polyline
            points={toPolyline(patientLine.points, xMin, xMax, yMin, yMax, plotWidth, plotHeight)}
            fill="none"
            stroke={patientLine.color}
            strokeWidth={patientLine.strokeWidth}
          />
        ) : null}

        {patientLine.showDots
          ? patientLine.points.map((p, i) => {
              const pt = toPoint(p, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
              return (
                <Circle
                  key={`dot-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill={patientLine.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })
          : null}
      </Svg>

      {showWhoReference && kind !== 'bmi' && !compact ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: PATIENT_SERIES_COLOR }]} />
            <ThemedText type="small" themeColor="textSecondary">
              Patient
            </ThemedText>
          </View>
          {percentileMeta.map(item => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {item.label}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 14,
  },
  empty: {
    minHeight: 160,
    borderRadius: PatientUI.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
