import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export type BarItem = {
  key: string;
  label: string;
  fraction: number; // 0 to 1, how full the bar is
  valueText: string;
};

// Horizontal bars drawn with plain views: long names wrap, and it looks the same on Android and web.
export function BarList({ items }: { items: BarItem[] }) {
  const theme = useTheme();

  return (
    <View style={styles.list}>
      {items.map((item) => {
        // a tiny bar is still visible, an empty one is not drawn
        const clamped = Math.max(0, Math.min(1, item.fraction));
        const percent = clamped === 0 ? 0 : Math.max(clamped, 0.02) * 100;
        return (
          <View key={item.key} style={styles.row}>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.fill, { width: `${percent}%` as `${number}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={styles.value}>{item.valueText}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 112 },
  track: { flex: 1, height: 16, borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 },
  value: { width: 64, textAlign: "right" },
});
