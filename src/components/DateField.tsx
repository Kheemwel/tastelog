import { useState } from "react";
import { View } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { DatePickerModal, en, registerTranslation } from "react-native-paper-dates";
import { toLocalDateString } from "../lib/keys";

registerTranslation("en", en);

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  error?: string;
};

export function DateField({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Button mode="outlined" icon="calendar" onPress={() => setOpen(true)}>
        Date: {value}
      </Button>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={open}
        date={new Date(`${value}T00:00:00`)}
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
