import { darkTheme, lightTheme } from "@/theme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { EntriesProvider } from "../state/EntriesProvider";
import { FiltersProvider } from "../state/FiltersProvider";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <EntriesProvider>
        <FiltersProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="entry" options={{ presentation: "modal" }} />
            <Stack.Screen name="filters" options={{ presentation: "modal", title: "Filters" }} />
            <Stack.Screen name="rename" options={{ presentation: "modal", title: "Rename" }} />
          </Stack>
        </FiltersProvider>
      </EntriesProvider>
    </PaperProvider>
  );
}
