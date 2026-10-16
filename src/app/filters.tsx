import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, HelperText, Text } from "react-native-paper";
import { DateField } from "../components/DateField";
import { NamePicker } from "../components/NamePicker";
import { MOODS, type MoodKey } from "../lib/moods";
import { NO_FILTERS, type Filters } from "../lib/query";
import { RATING_MAX, RATING_MIN } from "../lib/types";
import { useEntries } from "../state/EntriesProvider";
import { useFilters } from "../state/FiltersProvider";

const RATINGS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);

export default function FiltersScreen() {
  const { entries } = useEntries();
  const { filters, setFilters } = useFilters();
  const [draft, setDraft] = useState<Filters>(filters); // nothing changes until Apply
  const patch = (changes: Partial<Filters>) => setDraft((d) => ({ ...d, ...changes }));

  const toggleMood = (key: MoodKey) => {
    const current = draft.moods ?? [];
    patch({ moods: current.includes(key) ? current.filter((k) => k !== key) : [...current, key] });
  };

  // Tapping the selected number again clears it; the other end is nudged so min <= max.
  const pickMin = (n: number) => {
    if (draft.ratingMin === n) return patch({ ratingMin: undefined });
    patch({
      ratingMin: n,
      ...(draft.ratingMax !== undefined && draft.ratingMax < n ? { ratingMax: n } : {}),
    });
  };
  const pickMax = (n: number) => {
    if (draft.ratingMax === n) return patch({ ratingMax: undefined });
    patch({
      ratingMax: n,
      ...(draft.ratingMin !== undefined && draft.ratingMin > n ? { ratingMin: n } : {}),
    });
  };

  const dateError = draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo ? "The start date is after the end date." : undefined;

  const apply = () => {
    if (dateError) return;
    setFilters(draft);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <NamePicker label="Food" kind="food" value={draft.food} entries={entries} onChange={(food) => patch({ food })} />
      <NamePicker label="Place" kind="place" value={draft.place} entries={entries} onChange={(place) => patch({ place })} />
      <NamePicker label="Tag" kind="tag" value={draft.tag} entries={entries} onChange={(tag) => patch({ tag })} />

      <View>
        <Text variant="labelLarge" style={styles.label}>
          Mood (any of)
        </Text>
        <View style={styles.wrap}>
          {MOODS.map((m) => {
            const on = draft.moods?.includes(m.key) ?? false;
            return (
              <Chip key={m.key} mode={on ? "flat" : "outlined"} selected={on} showSelectedCheck={false} onPress={() => toggleMood(m.key)}>
                {`${m.emoji} ${m.label}`}
              </Chip>
            );
          })}
        </View>
      </View>

      <View>
        <Text variant="labelLarge" style={styles.label}>
          Lowest rating
        </Text>
        <View style={styles.wrap}>
          {RATINGS.map((n) => (
            <Chip
              key={n}
              mode={draft.ratingMin === n ? "flat" : "outlined"}
              selected={draft.ratingMin === n}
              showSelectedCheck={false}
              accessibilityLabel={`Lowest rating ${n}`}
              onPress={() => pickMin(n)}
            >
              {String(n)}
            </Chip>
          ))}
        </View>
      </View>

      <View>
        <Text variant="labelLarge" style={styles.label}>
          Highest rating
        </Text>
        <View style={styles.wrap}>
          {RATINGS.map((n) => (
            <Chip
              key={n}
              mode={draft.ratingMax === n ? "flat" : "outlined"}
              selected={draft.ratingMax === n}
              showSelectedCheck={false}
              accessibilityLabel={`Highest rating ${n}`}
              onPress={() => pickMax(n)}
            >
              {String(n)}
            </Chip>
          ))}
        </View>
      </View>

      <View>
        <DateField label="From" value={draft.dateFrom} onChange={(dateFrom) => patch({ dateFrom })} onClear={() => patch({ dateFrom: undefined })} />
        <DateField label="To" value={draft.dateTo} onChange={(dateTo) => patch({ dateTo })} onClear={() => patch({ dateTo: undefined })} />
        <HelperText type="error" visible={!!dateError}>
          {dateError}
        </HelperText>
      </View>

      <Button mode="contained" onPress={apply} disabled={!!dateError}>
        Apply
      </Button>
      <Button mode="outlined" onPress={() => setDraft(NO_FILTERS)}>
        Clear all
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  label: { marginBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  group: { gap: 8 },
});
