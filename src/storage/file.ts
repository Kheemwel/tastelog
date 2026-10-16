import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// The only place that touches files, the share sheet, and the browser download.

const JSON_MIME = "application/json";

function downloadInBrowser(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: JSON_MIME }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Android: opens the share sheet (email, cloud, chat...). Web: downloads the file. */
export async function shareBackup(fileName: string, text: string): Promise<void> {
  if (Platform.OS === "web") {
    downloadInBrowser(fileName, text);
    return;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(text);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(file.uri, { mimeType: JSON_MIME });
}

/** Android only: the user picks a folder and the file is written straight into it. */
export async function saveBackupToFolder(fileName: string, text: string): Promise<void> {
  const folder = await Directory.pickDirectoryAsync();
  // No ".json" in the name: Android adds the extension from the MIME type.
  const file = folder.createFile(fileName.replace(/\.json$/, ""), JSON_MIME);
  file.write(text);
}

/** Returns the text of the chosen file, or null if the user cancelled. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: JSON_MIME,
    // false keeps a content:// URI. Copying to the cache first made reads fail in Expo Go.
    copyToCacheDirectory: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (Platform.OS === "web" && asset.file) return asset.file.text();
  return new File(asset.uri).text();
}
