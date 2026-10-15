import { createEntryStore } from "@/lib/entryStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The one place that chooses the storage engine. Swap it here only.
export const entryStore = createEntryStore(AsyncStorage);
