import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { ChartDataItem } from '../selectors/statisticsSelectors';

interface CustomBarChartProps {
  data: ChartDataItem[];
  color?: string;
  type: 'water' | 'habit' | 'mood' | 'sleep';
  maxHeight?: number;
}

export const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data,
  color,
  type,
  maxHeight = 120,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const barColor = color || colors.primary;

  // Find max value for scaling, ensure at least 1 to avoid Division by Zero
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  const screenWidth = Dimensions.get('window').width;
  const isScrollable = data.length > 7;

  // Render a single vertical bar
  const renderBar = (item: ChartDataItem, index: number) => {
    const isCompleted = item.value > 0;
    
    // Scale height
    const scaledHeight = isCompleted ? Math.max(4, (item.value / maxValue) * maxHeight) : 0;
    
    // Determine bar display styles
    const showEmptyBorder = item.isEmpty;
    const barWidth = data.length === 7 ? (screenWidth - 80) / 7 : 14;
    const paddingHorizontal = data.length === 7 ? 4 : 8;

    return (
      <View key={index} style={[styles.barCol, { width: barWidth + paddingHorizontal * 2, paddingHorizontal }]}>
        {/* Value Label above the bar */}
        <Text style={[styles.barValText, { color: colors.textSecondary }]}>
          {item.secondaryLabel || ''}
        </Text>

        {/* The Bar Track */}
        <View style={[styles.barTrack, { height: maxHeight }]}>
          {showEmptyBorder ? (
            <View
              style={[
                styles.emptyBarPlaceholder,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                },
              ]}
            >
              <Text style={[styles.emptyBarSymbol, { color: colors.textSecondary }]}>—</Text>
            </View>
          ) : (
            <View
              style={[
                styles.filledBar,
                {
                  height: scaledHeight,
                  backgroundColor: barColor,
                  borderRadius: 4,
                  opacity: isCompleted ? 1 : 0.15,
                },
              ]}
            />
          )}
        </View>

        {/* Date / Day Label below the bar */}
        <Text style={[styles.barLabelText, { color: colors.text }]}>
          {item.label}
        </Text>
      </View>
    );
  };

  const chartContent = (
    <View style={styles.chartRow}>
      {data.map((item, index) => renderBar(item, index))}
    </View>
  );

  return (
    <View style={styles.container}>
      {isScrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {chartContent}
        </ScrollView>
      ) : (
        <View style={styles.fixedContent}>
          {chartContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xs,
  },
  fixedContent: {
    width: '100%',
    alignItems: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  barCol: {
    alignItems: 'center',
    gap: 4,
  },
  barValText: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    height: 24, // keep spacing unified
    lineHeight: 11,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  filledBar: {
    width: '100%',
  },
  emptyBarPlaceholder: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyBarSymbol: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  barLabelText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
