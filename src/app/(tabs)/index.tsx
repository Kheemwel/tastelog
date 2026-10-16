import { router } from "expo-router";
import { FlatList, View } from "react-native";
import { ActivityIndicator, FAB, List, Text } from "react-native-paper";
import { getMood } from "../../lib/moods";
import { sortNewestFirst } from "../../lib/query";
import { useEntries } from "../../state/EntriesProvider";

// Temporary Journal: just enough to open the form. The real one (search, filters, cards) comes next.
export default function JournalScreen() {
  const { entries, loading, error } = useEntries();

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} />;

  return (
    <View style={{ flex: 1 }}>
      {error && <Text style={{ padding: 16 }}>{error}</Text>}
      <FlatList
        data={sortNewestFirst(entries)}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No entries yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <List.Item
            title={item.foodName}
            description={`${item.date} · ${item.rating}/10${item.place ? ` · ${item.place}` : ""}`}
            left={() => <Text style={{ fontSize: 24, alignSelf: "center" }}>{getMood(item.mood).emoji}</Text>}
            onPress={() => router.push({ pathname: "/entry", params: { id: item.id } })}
          />
        )}
      />
      <FAB icon="plus" style={{ position: "absolute", right: 16, bottom: 16 }} onPress={() => router.push("/entry")} />
    </View>
  );
}
