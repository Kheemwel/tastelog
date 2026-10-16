import { pickBackupText, saveBackupToFolder, shareBackup } from "@/storage/file";
import { router } from "expo-router";
import { useEffect, useState, type ComponentType } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Divider, Portal, Snackbar, Text } from "react-native-paper";
import { buildExportFile, exportFileName, mergeEntries, parseImport, serializeExport } from "../../lib/importExport";
import { toLocalDateString } from "../../lib/keys";
import type { Entry } from "../../lib/types";
import { useEntries } from "../../state/EntriesProvider";
import { entryStore } from "../../storage";

const isWeb = Platform.OS === "web";
// Developer tools exist only while developing. In a release build __DEV__ is false, so this is null
// and the file is not even loaded.
const DevTools: ComponentType | null = __DEV__ ? require("../../components/DevTools").DevTools : null;

export default function SettingsScreen() {
  const { entries, replaceAll } = useEntries();
  const [lastExported, setLastExported] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null); // why an import was rejected
  const [pending, setPending] = useState<Entry[] | null>(null); // validated entries waiting for a choice
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    entryStore.getLastExportedAt().then(setLastExported, () => {});
  }, []);

  const days = lastExported ? Math.floor((Date.now() - Date.parse(lastExported)) / 86400000) : null;
  const needsBackup = entries.length > 0 && (days === null || days > 30);

  const runExport = async (mode: "share" | "folder") => {
    setBusy(true);
    try {
      const now = new Date();
      const text = serializeExport(buildExportFile(entries, now));
      const name = exportFileName(now);
      if (mode === "share") await shareBackup(name, text);
      else await saveBackupToFolder(name, text);
      const iso = now.toISOString();
      await entryStore.setLastExportedAt(iso);
      setLastExported(iso);
      setMessage(isWeb ? "Backup downloaded." : mode === "folder" ? "Backup saved." : "Backup ready.");
    } catch {
      setMessage("The backup was not saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const chooseFile = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text === null) return; // cancelled
      const parsed = parseImport(text);
      if (parsed.ok) setPending(parsed.file.entries);
      else setProblem(parsed.error);
    } catch {
      setProblem("That file could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const closeImport = () => {
    setPending(null);
    setConfirmReplace(false);
  };

  const doMerge = async () => {
    if (!pending) return;
    const result = mergeEntries(entries, pending);
    closeImport();
    setBusy(true);
    try {
      await replaceAll(result.entries);
      setMessage(`${result.added} added, ${result.skipped} skipped.`);
    } catch {
      setMessage("The import failed. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  };

  const doReplace = async () => {
    if (!pending) return;
    const incoming = pending;
    closeImport();
    setBusy(true);
    try {
      await replaceAll(incoming);
      setMessage(`Replaced with ${incoming.length} entries.`);
    } catch {
      setMessage("The import failed. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  };

  const preview = pending ? mergeEntries(entries, pending) : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium">Backup</Text>
        <Text>{lastExported ? `Last exported: ${toLocalDateString(new Date(lastExported))}` : "You have not exported a backup yet."}</Text>
        {needsBackup && <Text>Your data only lives on this device. Export a backup now and then.</Text>}
        {isWeb && <Text>On the web, your data is stored in this browser and the browser can clear it.</Text>}
        <Button mode="contained" icon={isWeb ? "download" : "share-variant"} onPress={() => runExport("share")} disabled={busy || entries.length === 0}>
          {isWeb ? "Download backup" : "Share backup"}
        </Button>
        {!isWeb && (
          <Button mode="outlined" icon="content-save" onPress={() => runExport("folder")} disabled={busy || entries.length === 0}>
            Save backup to device
          </Button>
        )}

        <Divider />

        <Text variant="titleMedium">Restore</Text>
        <Button mode="outlined" icon="file-import" onPress={chooseFile} disabled={busy}>
          Import from file
        </Button>

        <Divider />

        <Text variant="titleMedium">Tidy up</Text>
        <Button mode="outlined" icon="rename-box" onPress={() => router.push("/rename")}>
          Rename a food, place, or tag
        </Button>

        {DevTools && (
          <>
            <Divider />
            <DevTools />
          </>
        )}
      </ScrollView>

      <Snackbar visible={message !== null} onDismiss={() => setMessage(null)} duration={4000}>
        {message}
      </Snackbar>

      <Portal>
        <Dialog visible={problem !== null} onDismiss={() => setProblem(null)}>
          <Dialog.Title>Could not import</Dialog.Title>
          <Dialog.Content>
            <Text>{`${problem ?? ""} Nothing was changed.`}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProblem(null)}>OK</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={pending !== null && !confirmReplace} onDismiss={closeImport}>
          <Dialog.Title>Import this file?</Dialog.Title>
          <Dialog.Content>
            <Text>
              {preview && pending
                ? `The file has ${pending.length} entries: ${preview.added} new, ${preview.skipped} already in your journal.\n\nMerge adds the new ones and keeps everything else. Replace swaps your whole journal for the file.`
                : ""}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeImport}>Cancel</Button>
            <Button onPress={() => setConfirmReplace(true)}>Replace…</Button>
            <Button onPress={doMerge}>Merge</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={pending !== null && confirmReplace} onDismiss={closeImport}>
          <Dialog.Title>Replace everything?</Dialog.Title>
          <Dialog.Content>
            <Text>
              {`Your ${entries.length} current entries will be deleted and replaced with the ${pending?.length ?? 0} from the file. This cannot be undone.`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeImport}>Cancel</Button>
            <Button onPress={doReplace}>Replace</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12 },
});
