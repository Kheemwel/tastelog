import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { getMood } from "../lib/moods";
import type { Entry } from "../lib/types";

export function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const theme = useTheme();
  const mood = getMood(entry.mood);
  const meta = [entry.place, entry.date].filter(Boolean).join(" · ");
  const spoken = [entry.foodName, `rated ${entry.rating} out of 10`, `felt ${mood.label.toLowerCase()}`, entry.place ? `at ${entry.place}` : null, entry.date]
    .filter(Boolean)
    .join(", ");
  const subdued = { color: theme.colors.onSurfaceVariant };

  return (
    <Card mode="outlined" style={styles.card} onPress={onPress} accessibilityLabel={spoken} accessibilityHint="Opens this entry for editing">
      <Card.Content style={styles.content}>
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <View style={styles.body}>
          <Text variant="titleMedium">{entry.foodName}</Text>
          <Text variant="bodySmall" style={subdued}>
            {meta}
          </Text>
          {entry.comment ? (
            <Text variant="bodyMedium" numberOfLines={2}>
              {entry.comment}
            </Text>
          ) : null}
          {entry.tags.length > 0 ? (
            <Text variant="labelSmall" style={subdued}>
              {entry.tags.map((t) => `#${t}`).join("  ")}
            </Text>
          ) : null}
        </View>
        <Text variant="titleLarge">
          {entry.rating}
          <Text variant="bodySmall" style={subdued}>
            /10
          </Text>
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  content: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 28 },
  body: { flex: 1, gap: 2 },
});
