import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, FAB, Searchbar, Text } from "react-native-paper";
import { EntryCard } from "../../components/EntryCard";
import { countActiveFilters, NO_FILTERS, queryEntries } from "../../lib/query";
import { useEntries } from "../../state/EntriesProvider";
import { useFilters } from "../../state/FiltersProvider";

export default function JournalScreen() {
  const { entries, loading, error } = useEntries();
  const { filters, setFilters } = useFilters();
  const [search, setSearch] = useState("");

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} />;

  const activeFilters = countActiveFilters(filters);
  const shown = queryEntries(entries, search, filters);
  const narrowed = search.trim() !== "" || activeFilters > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Searchbar placeholder="Search food, comment, place, tags" value={search} onChangeText={setSearch} />
        <View style={styles.row}>
          <Button mode="outlined" icon="filter-variant" onPress={() => router.push("/filters")}>
            {activeFilters > 0 ? `Filters (${activeFilters})` : "Filters"}
          </Button>
          {activeFilters > 0 && <Button onPress={() => setFilters(NO_FILTERS)}>Clear</Button>}
          <Text style={styles.count}>{narrowed ? `${shown.length} of ${entries.length}` : `${entries.length} entries`}</Text>
        </View>
        {error && <Text>{error}</Text>}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryCard entry={item} onPress={() => router.push({ pathname: "/entry", params: { id: item.id } })} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 96 }} // room for the add button
        ListEmptyComponent={
          entries.length === 0 ? (
            <Text style={styles.empty}>No entries yet. Tap + to log your first meal.</Text>
          ) : (
            <View style={styles.empty}>
              <Text>Nothing matches your search or filters.</Text>
              <Button
                onPress={() => {
                  setSearch("");
                  setFilters(NO_FILTERS);
                }}
              >
                Clear search and filters
              </Button>
            </View>
          )
        }
      />

      <FAB icon="plus" accessibilityLabel="Add entry" style={styles.fab} onPress={() => router.push("/entry")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { padding: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  count: { marginLeft: "auto" },
  empty: { padding: 16, alignItems: "center", gap: 8 },
  fab: { position: "absolute", right: 16, bottom: 16 },
});
