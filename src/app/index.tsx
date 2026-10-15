import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Platform, ScrollView, View, useColorScheme } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { Button, MD3DarkTheme, MD3LightTheme, PaperProvider, Text, useTheme } from "react-native-paper";
import { DatePickerModal, en, registerTranslation } from "react-native-paper-dates";

registerTranslation("en", en);

// Local YYYY-MM-DD (toISOString() would give the UTC date, which can be yesterday).
const toLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const KEY = "tastelog:spike";
const MOODS = "😄 😋 ⚡ 😌 😐 😴 😣 😢 🤢 🤔";

type Entry = { id: string; foodName: string; rating: number; date: string };

// Storage lives behind these two functions so it can be swapped later.
const load = async (): Promise<Entry[]> => JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]");
const save = (entries: Entry[]) => AsyncStorage.setItem(KEY, JSON.stringify(entries));

function Spike() {
  const theme = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [msg, setMsg] = useState("");
  const [date, setDate] = useState(toLocalDate(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    load().then(setEntries);
  }, []);

  const add = async () => {
    const next = [
      ...entries,
      {
        id: Math.random().toString(36).slice(2),
        foodName: "Ramen",
        rating: Math.floor(Math.random() * 11),
        date,
      },
    ];
    setEntries(next);
    await save(next);
    setMsg(`Saved ${next.length} entries. Now close and reopen the app.`);
  };

  const exportJson = async () => {
    const json = JSON.stringify({ version: 1, entries }, null, 2);
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      a.download = "tastelog.json";
      a.click();
    } else {
      const f = new File(Paths.cache, "tastelog.json");
      f.create({ overwrite: true });
      f.write(json);
      await Sharing.shareAsync(f.uri);
    }
  };

  const readImportText = async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      // Plain browser file input: no library, no permission layer.
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.onchange = async () => resolve((await input.files?.[0]?.text()) ?? null);
        input.click();
      });
    }
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: false, // keeps a content:// URI; avoids the Expo Go cache read error
    });
    if (res.canceled) return null;
    return new File(res.assets[0].uri).text();
  };

  const reset = async () => {
    await AsyncStorage.removeItem(KEY);
    setEntries([]);
    setMsg("Data cleared");
  };

  // Native only: user picks a folder, the file is written straight into it.
  const saveToDevice = async () => {
    try {
      const json = JSON.stringify({ version: 1, entries }, null, 2);
      const dir = await Directory.pickDirectoryAsync();
      const file = dir.createFile(`tastelog-${Date.now()}`, "application/json");
      file.write(json);
      setMsg("Saved to the folder you picked.");
    } catch (e) {
      setMsg(`Save failed: ${String(e)}`);
    }
  };

  const importJson = async () => {
    const text = await readImportText();
    if (text === null) return;
    const data = JSON.parse(text);
    const have = new Set(entries.map((e) => e.id));
    const fresh = (data.entries as Entry[]).filter((e) => !have.has(e.id));
    const next = [...entries, ...fresh];
    setEntries(next);
    await save(next);
    setMsg(`${fresh.length} added, ${data.entries.length - fresh.length} skipped`);
  };

  const text = theme.colors.onSurface;
  const bars = entries.map((e, i) => ({ value: e.rating, label: String(i + 1), frontColor: theme.colors.primary }));
  const line = entries.map((e) => ({ value: e.rating }));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingTop: 56, gap: 12 }}>
      <Text variant="headlineSmall">Tastelog spike ({Platform.OS})</Text>
      <Text>1. Emoji (look for empty boxes): {MOODS}</Text>
      <Button mode="outlined" icon="calendar" onPress={() => setPickerOpen(true)}>
        2. Date: {date}
      </Button>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={pickerOpen}
        date={new Date(`${date}T00:00:00`)}
        onDismiss={() => setPickerOpen(false)}
        onConfirm={({ date: d }) => {
          setPickerOpen(false);
          if (d) setDate(toLocalDate(d));
        }}
      />
      <Button mode="contained" onPress={add}>
        3. Add random entry
      </Button>
      <Button mode="outlined" onPress={exportJson}>
        4. Export JSON
      </Button>
      {Platform.OS !== "web" && (
        <Button mode="outlined" onPress={saveToDevice}>
          4b. Save to device (folder)
        </Button>
      )}
      <Button mode="outlined" onPress={importJson}>
        5. Import JSON (merge)
      </Button>
      <Button mode="text" onPress={reset}>
        Reset all data
      </Button>
      <Text>{msg}</Text>
      <Text variant="titleMedium">6. Charts (toggle system dark mode)</Text>
      {entries.length > 0 && (
        <View style={{ gap: 24 }}>
          <BarChart data={bars} xAxisLabelTextStyle={{ color: text }} yAxisTextStyle={{ color: text }} maxValue={10} noOfSections={5} />
          <LineChart data={line} color={theme.colors.primary} yAxisTextStyle={{ color: text }} maxValue={10} noOfSections={5} />
        </View>
      )}
    </ScrollView>
  );
}

export default function App() {
  const dark = useColorScheme() === "dark";
  return (
    <PaperProvider theme={dark ? MD3DarkTheme : MD3LightTheme}>
      <Spike />
    </PaperProvider>
  );
}
