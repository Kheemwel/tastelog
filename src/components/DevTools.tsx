import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { generateSampleEntries, isSampleEntry, removeSampleEntries } from "../lib/sampleData";
import { useEntries } from "../state/EntriesProvider";
import { newId } from "../storage/newId";

// Development only. Settings loads this file only when __DEV__ is true, so release builds never show it.
export function DevTools() {
  const { entries, replaceAll } = useEntries();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const sampleCount = entries.filter(isSampleEntry).length;

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(true);
    const started = Date.now();
    try {
      await task();
      setStatus(`${label} (${Date.now() - started} ms)`);
    } catch (e) {
      setStatus(`Failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const add = (count: number) =>
    run(`Added ${count} sample entries`, () => replaceAll([...entries, ...generateSampleEntries(count, new Date(), newId, Date.now() % 1000000)]));

  return (
    <View style={styles.box}>
      <Text variant="titleMedium">Developer tools</Text>
      <Text variant="bodySmall">
        Only visible in development. Sample entries are tagged "sample-data". Do not export a backup while they are mixed with real entries.
      </Text>
      <Text>{`Sample entries now: ${sampleCount} of ${entries.length}`}</Text>
      <Button mode="outlined" onPress={() => add(500)} disabled={busy}>
        Add 500 sample entries
      </Button>
      <Button mode="outlined" onPress={() => add(3000)} disabled={busy}>
        Add 3000 sample entries
      </Button>
      <Button
        mode="outlined"
        onPress={() => run("Removed sample entries", () => replaceAll(removeSampleEntries(entries)))}
        disabled={busy || sampleCount === 0}
      >
        Remove all sample entries
      </Button>
      {status !== "" && <Text variant="bodySmall">{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 12 },
});
