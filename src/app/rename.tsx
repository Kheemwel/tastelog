import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, HelperText, Portal, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { NamePicker } from "../components/NamePicker";
import { matchKey } from "../lib/keys";
import { deriveNames, type NameKind } from "../lib/names";
import { renameValue } from "../lib/rename";
import { useEntries } from "../state/EntriesProvider";

const LABELS: Record<NameKind, string> = { food: "Food", place: "Place", tag: "Tag" };

export default function RenameScreen() {
  const { entries, replaceAll } = useEntries();
  const [kind, setKind] = useState<NameKind>("place");
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = from ? renameValue(entries, kind, from, to) : null;
  const changed = preview && preview.ok ? preview.changed : 0;
  const mergeTarget = from && to.trim() ? deriveNames(entries, kind).find((n) => n.key === matchKey(to) && n.key !== matchKey(from)) : undefined;

  const onRename = async () => {
    if (!from) return;
    const result = renameValue(entries, kind, from, to);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBusy(true);
    try {
      await replaceAll(result.entries);
      setDone(`Renamed in ${result.changed} ${result.changed === 1 ? "entry" : "entries"}.`);
    } catch {
      setError("Could not save the change. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text>Fix a spelling everywhere at once. If the new name matches another one, the two become one.</Text>

      <SegmentedButtons
        value={kind}
        onValueChange={(value) => {
          setKind(value as NameKind);
          setFrom(undefined);
          setTo("");
          setError(null);
        }}
        buttons={(Object.keys(LABELS) as NameKind[]).map((k) => ({ value: k, label: LABELS[k] }))}
      />

      <NamePicker
        key={kind}
        label={LABELS[kind]}
        kind={kind}
        value={from}
        entries={entries}
        onChange={(name) => {
          setFrom(name);
          setTo(name ?? "");
          setError(null);
        }}
      />

      {from && (
        <View>
          <TextInput mode="outlined" label="New name" value={to} onChangeText={setTo} />
          <HelperText type="info" visible>
            {`${changed} ${changed === 1 ? "entry" : "entries"} will change.`}
          </HelperText>
          {mergeTarget && (
            <HelperText type="info" visible>
              {`This will merge with the existing "${mergeTarget.name}".`}
            </HelperText>
          )}
        </View>
      )}

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <Button mode="contained" onPress={onRename} loading={busy} disabled={busy || !from || to.trim() === "" || changed === 0}>
        Rename
      </Button>

      <Portal>
        <Dialog visible={done !== null} onDismiss={() => router.back()}>
          <Dialog.Title>Done</Dialog.Title>
          <Dialog.Content>
            <Text>{done}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => router.back()}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
