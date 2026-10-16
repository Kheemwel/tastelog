import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import { darkColors, lightColors } from "./colors";

// Paper's built-in themes with every color replaced by the generated sky-blue palette.
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...lightColors },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...darkColors },
};
