import { View } from "react-native";
import { Chip } from "react-native-paper";
import { matchKey } from "../lib/keys";
import { suggest, type NameKind } from "../lib/names";
import type { Entry } from "../lib/types";

type Props = {
  entries: Entry[];
  kind: NameKind;
  typed: string;
  onPick: (name: string) => void;
  exclude?: string[]; // names to hide, e.g. tags already added
  showWhenEmpty?: boolean; // show the most-used names before anything is typed
};

export function SuggestionChips({ entries, kind, typed, onPick, exclude = [], showWhenEmpty }: Props) {
  const typedKey = matchKey(typed);
  if (typedKey === "" && !showWhenEmpty) return null;

  const hidden = new Set(exclude.map(matchKey));
  const items = suggest(entries, kind, typed, 12)
    .filter((n) => n.key !== typedKey && !hidden.has(n.key))
    .slice(0, 5);
  if (items.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((n) => (
        <Chip key={n.key} compact onPress={() => onPick(n.name)}>
          {n.name}
        </Chip>
      ))}
    </View>
  );
}
