import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, IconButton } from "react-native-paper";
import { DatePickerModal, en, registerTranslation } from "react-native-paper-dates";
import { toLocalDateString } from "../lib/keys";

registerTranslation("en", en);

type Props = {
  label?: string; // default "Date"
  value?: string; // "YYYY-MM-DD"; undefined shows "any"
  onChange: (date: string) => void;
  onClear?: () => void; // when given, a clear button appears once a date is set
  error?: string;
};

export function DateField({ label = "Date", value, onChange, onClear, error }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <View style={styles.row}>
        <Button mode="outlined" icon="calendar" onPress={() => setOpen(true)} style={styles.button}>
          {`${label}: ${value ?? "any"}`}
        </Button>
        {onClear && value ? <IconButton icon="close" onPress={onClear} /> : null}
      </View>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={open}
        date={new Date(`${value ?? toLocalDateString(new Date())}T00:00:00`)}
        onDismiss={() => setOpen(false)}
        onConfirm={({ date }) => {
          setOpen(false);
          if (date) onChange(toLocalDateString(date));
        }}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  button: { flex: 1 },
});
