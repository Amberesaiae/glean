import { router, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, Text } from "@/components/ui";
import Colors from "@/constants/colors";
import { spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text variant="title" align="center">
          This page doesn&apos;t exist.
        </Text>
        <Text variant="caption" align="center" style={styles.subtitle}>
          The link may be broken or the page may have moved.
        </Text>
        <Button
          label="Back to the Market"
          onPress={() => router.replace("/")}
          style={styles.button}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: Colors.paper,
  },
  subtitle: { marginTop: spacing.sm, maxWidth: 260 },
  button: { marginTop: spacing.xl },
});
