import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Chip, Dialog, HelperText, Portal, Text, TextInput } from "react-native-paper";
import { DateField } from "../components/DateField";
import { SuggestionChips } from "../components/SuggestionChips";
import { matchKey, toLocalDateString } from "../lib/keys";
import { DEFAULT_MOOD, MOODS, type MoodKey } from "../lib/moods";
import { RATING_MAX, RATING_MIN, type Entry } from "../lib/types";
import { validateEntry } from "../lib/validation";
import { useEntries } from "../state/EntriesProvider";
import { newId } from "../storage/newId";

const RATINGS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);
const KNOWN_FIELDS = ["foodName", "rating", "date"];

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { entries, loading } = useEntries();

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} />;

  const existing = id ? entries.find((e) => e.id === id) : undefined;
  if (id && !existing) {
    return (
      <View style={styles.center}>
        <Text>This entry no longer exists.</Text>
      </View>
    );
  }
  return <EntryForm key={existing?.id ?? "new"} initial={existing} />;
}

function EntryForm({ initial }: { initial?: Entry }) {
  const { entries, saveEntry, deleteEntry } = useEntries();
  const [newEntryId] = useState(() => newId()); // created once, so a double tap cannot add two entries
  const [foodName, setFoodName] = useState(initial?.foodName ?? "");
  const [rating, setRating] = useState<number | null>(initial ? initial.rating : null);
  const [mood, setMood] = useState<MoodKey>(initial?.mood ?? DEFAULT_MOOD);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagText, setTagText] = useState("");
  const [date, setDate] = useState(initial?.date ?? toLocalDateString(new Date()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addTag = (text: string) => {
    const tag = text.trim();
    if (tag && !tags.some((t) => matchKey(t) === matchKey(tag))) setTags([...tags, tag]);
    setTagText("");
  };

  const onSave = async () => {
    setSaving(true);
    const pendingTag = tagText.trim(); // typed but not added yet
    const result = validateEntry({
      id: initial?.id ?? newEntryId,
      foodName,
      rating,
      mood,
      comment,
      place,
      date,
      tags: pendingTag ? [...tags, pendingTag] : tags,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    if (!result.ok) {
      setErrors(Object.fromEntries(result.errors.map((e) => [e.field, e.message])));
      setSaving(false);
      return;
    }
    try {
      await saveEntry(result.entry);
      router.back();
    } catch {
      setErrors({ form: "Could not save. Please try again." });
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    try {
      await deleteEntry(initial.id);
      router.back();
    } catch {
      setConfirmDelete(false);
      setErrors({ form: "Could not delete. Please try again." });
    }
  };

  const otherErrors = Object.entries(errors)
    .filter(([field]) => !KNOWN_FIELDS.includes(field))
    .map(([, message]) => message);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled" // lets chips be tapped while the keyboard is open
    >
      <Stack.Screen options={{ title: initial ? "Edit entry" : "New entry" }} />

      <View>
        <TextInput mode="outlined" label="Food *" value={foodName} onChangeText={setFoodName} autoCapitalize="words" error={!!errors.foodName} />
        <HelperText type="error" visible={!!errors.foodName}>
          {errors.foodName}
        </HelperText>
        <SuggestionChips entries={entries} kind="food" typed={foodName} onPick={setFoodName} />
      </View>

      <View>
        <Text variant="labelLarge" style={styles.label}>
          Rating * (0 to 10)
        </Text>
        <View style={styles.wrap}>
          {RATINGS.map((n) => (
            <Chip
              key={n}
              mode={rating === n ? "flat" : "outlined"}
              selected={rating === n}
              showSelectedCheck={false}
              accessibilityLabel={`Rating ${n} out of 10`}
              onPress={() => setRating(n)}
            >
              {String(n)}
            </Chip>
          ))}
        </View>
        <HelperText type="error" visible={!!errors.rating}>
          {errors.rating}
        </HelperText>
      </View>

      <View>
        <Text variant="labelLarge" style={styles.label}>
          How did it make you feel?
        </Text>
        <View style={styles.wrap}>
          {MOODS.map((m) => (
            <Chip key={m.key} mode={mood === m.key ? "flat" : "outlined"} selected={mood === m.key} showSelectedCheck={false} onPress={() => setMood(m.key)}>
              {`${m.emoji} ${m.label}`}
            </Chip>
          ))}
        </View>
      </View>

      <TextInput mode="outlined" label="Comment" value={comment} onChangeText={setComment} multiline numberOfLines={3} />

      <View style={styles.group}>
        <TextInput mode="outlined" label="Place" value={place} onChangeText={setPlace} autoCapitalize="words" />
        <SuggestionChips entries={entries} kind="place" typed={place} onPick={setPlace} showWhenEmpty />
      </View>

      <View style={styles.group}>
        <TextInput
          mode="outlined"
          label="Add a tag"
          value={tagText}
          onChangeText={setTagText}
          onSubmitEditing={() => addTag(tagText)}
          returnKeyType="done"
          right={<TextInput.Icon icon="plus" accessibilityLabel="Add tag" onPress={() => addTag(tagText)} />}
        />
        {tags.length > 0 && (
          <View style={styles.wrap}>
            {tags.map((t) => (
              <Chip key={t} closeIconAccessibilityLabel={`Remove tag ${t}`} onClose={() => setTags(tags.filter((x) => x !== t))}>
                {t}
              </Chip>
            ))}
          </View>
        )}
        <SuggestionChips entries={entries} kind="tag" typed={tagText} onPick={addTag} exclude={tags} showWhenEmpty />
      </View>

      <DateField value={date} onChange={setDate} error={errors.date} />

      {otherErrors.length > 0 && (
        <HelperText type="error" visible>
          {otherErrors.join(" ")}
        </HelperText>
      )}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving}>
        Save
      </Button>
      {initial && (
        <Button mode="outlined" onPress={() => setConfirmDelete(true)} disabled={saving}>
          Delete
        </Button>
      )}

      {initial && (
        <Portal>
          <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
            <Dialog.Title>Delete this entry?</Dialog.Title>
            <Dialog.Content>
              <Text>{`"${initial.foodName}" will be removed. This cannot be undone.`}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDelete(false)}>Cancel</Button>
              <Button onPress={onDelete}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { marginBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  group: { gap: 8 },
});
