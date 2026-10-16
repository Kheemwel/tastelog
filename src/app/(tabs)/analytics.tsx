import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { ActivityIndicator, Card, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { BarList, type BarItem } from "../../components/BarList";
import { NamePicker } from "../../components/NamePicker";
import { formatAverage, formatMonth, pluralEntries } from "../../lib/format";
import { averageRatingBy, averageRatingByMonth, foodAcrossPlaces, moodDistribution, topFoods } from "../../lib/stats";
import { RATING_MAX, type Entry } from "../../lib/types";
import { useEntries } from "../../state/EntriesProvider";

const MAX_WIDTH = 720; // keeps the charts readable on a wide browser window

export default function AnalyticsScreen() {
  const { entries, loading } = useEntries();

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} />;
  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Add a few entries to see your stats.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="bodySmall">{`Based on all ${pluralEntries(entries.length)}. Journal search and filters do not apply here.`}</Text>
      <MonthlyTrend entries={entries} />
      <MoodChart entries={entries} />
      <TopFoodsChart entries={entries} />
      <AverageByChart entries={entries} />
      <FoodAcrossPlacesChart entries={entries} />
    </ScrollView>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card mode="outlined">
      <Card.Title title={title} titleVariant="titleMedium" />
      <Card.Content style={styles.cardContent}>{children}</Card.Content>
    </Card>
  );
}

// Chart 1: average rating per month (line)
function MonthlyTrend({ entries }: { entries: Entry[] }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const months = averageRatingByMonth(entries);
  const chartWidth = Math.min(width, MAX_WIDTH) - 32 - 32 - 40; // screen padding, card padding, y-axis labels
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 11 };

  return (
    <ChartCard title="Average rating per month">
      {months.length < 2 ? (
        <Text>Entries from at least two different months are needed to show a trend.</Text>
      ) : (
        <LineChart
          data={months.map((m) => ({
            value: m.average,
            label: formatMonth(m.month),
            dataPointText: formatAverage(m.average),
          }))}
          width={chartWidth}
          height={180}
          maxValue={RATING_MAX}
          noOfSections={5}
          spacing={56}
          initialSpacing={16}
          endSpacing={16}
          scrollToEnd
          color={theme.colors.primary}
          thickness={3}
          dataPointsColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          textFontSize={11}
          yAxisTextStyle={axisText}
          xAxisLabelTextStyle={axisText}
          rulesColor={theme.colors.outlineVariant}
          yAxisColor={theme.colors.outlineVariant}
          xAxisColor={theme.colors.outlineVariant}
          isAnimated={false}
        />
      )}
      <Text variant="bodySmall">Entries per month (a month with only a few is a shaky average):</Text>
      <View style={styles.wrap}>
        {months.slice(-12).map((m) => (
          <Text key={m.month} variant="bodySmall">
            {`${formatMonth(m.month)}: ${m.count}`}
          </Text>
        ))}
      </View>
    </ChartCard>
  );
}

// Chart 2: mood distribution
function MoodChart({ entries }: { entries: Entry[] }) {
  const moods = moodDistribution(entries);
  const max = moods[0]?.count ?? 1;
  const items: BarItem[] = moods.map((m) => ({
    key: m.key,
    label: `${m.emoji} ${m.label}`,
    fraction: m.count / max,
    valueText: String(m.count),
  }));
  return (
    <ChartCard title="Mood distribution">
      <BarList items={items} />
    </ChartCard>
  );
}

// Chart 3: most-eaten foods
function TopFoodsChart({ entries }: { entries: Entry[] }) {
  const foods = topFoods(entries, 10);
  const max = foods[0]?.count ?? 1;
  const items: BarItem[] = foods.map((f) => ({
    key: f.key,
    label: f.name,
    fraction: f.count / max,
    valueText: String(f.count),
  }));
  return (
    <ChartCard title="Most eaten foods">
      <BarList items={items} />
    </ChartCard>
  );
}

// Chart 4: average rating per place or per food
function AverageByChart({ entries }: { entries: Entry[] }) {
  const [by, setBy] = useState<"place" | "food">("place");
  const { items, fallback } = averageRatingBy(entries, by);
  const bars: BarItem[] = items.map((i) => ({
    key: i.key,
    label: i.name,
    fraction: i.average / RATING_MAX,
    valueText: `${formatAverage(i.average)} (${i.count})`,
  }));

  return (
    <ChartCard title="Average rating">
      <SegmentedButtons
        value={by}
        onValueChange={(value) => setBy(value as "place" | "food")}
        buttons={[
          { value: "place", label: "By place" },
          { value: "food", label: "By food" },
        ]}
      />
      {bars.length === 0 ? <Text>No places yet. Add a place to your entries to see this.</Text> : <BarList items={bars} />}
      <Text variant="bodySmall">
        {fallback && bars.length > 0 ? "Showing everything, because nothing has 2 or more entries yet. " : "Only items with 2 or more entries are ranked. "}
        Rating is out of 10, and the number in brackets is how many entries it is based on.
      </Text>
    </ChartCard>
  );
}

// Chart 5: one food, average rating at each place
function FoodAcrossPlacesChart({ entries }: { entries: Entry[] }) {
  const [food, setFood] = useState<string | undefined>(() => topFoods(entries, 1)[0]?.name);
  const rows = food ? foodAcrossPlaces(entries, food) : [];
  const bars: BarItem[] = rows.map((r) => ({
    key: r.key,
    label: r.name,
    fraction: r.average / RATING_MAX,
    valueText: `${formatAverage(r.average)} (${r.count})`,
  }));

  return (
    <ChartCard title="Same food, different places">
      <NamePicker label="Food" kind="food" value={food} entries={entries} onChange={setFood} />
      {!food ? <Text>Pick a food to see where it tasted best.</Text> : <BarList items={bars} />}
      {food && rows.length === 1 && <Text variant="bodySmall">You have only logged this food in one place so far.</Text>}
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  cardContent: { gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 4 },
});
