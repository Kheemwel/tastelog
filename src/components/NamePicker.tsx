import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Chip, Text, TextInput } from "react-native-paper";
import type { NameKind } from "../lib/names";
import type { Entry } from "../lib/types";
import { SuggestionChips } from "./SuggestionChips";

type Props = {
  label: string;
  kind: NameKind;
  value: string | undefined;
  entries: Entry[];
  onChange: (name: string | undefined) => void;
};

// Picks one existing name: type to narrow the suggestions, then tap one.
export function NamePicker({ label, kind, value, entries, onChange }: Props) {
  const [typed, setTyped] = useState("");

  if (value) {
    return (
      <View style={styles.group}>
        <Text variant="labelLarge">{label}</Text>
        <View style={styles.wrap}>
          <Chip onClose={() => onChange(undefined)}>{value}</Chip>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <TextInput mode="outlined" label={`${label} (type to find, then tap a name)`} value={typed} onChangeText={setTyped} />
      <SuggestionChips
        entries={entries}
        kind={kind}
        typed={typed}
        showWhenEmpty
        hideExactMatch={false}
        onPick={(name) => {
          onChange(name);
          setTyped("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
