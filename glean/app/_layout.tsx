import { DancingScript_700Bold } from "@expo-google-fonts/dancing-script";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from "@expo-google-fonts/space-mono";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { SplashOverlay } from "@/components/splash-overlay";
import { AppProvider, useApp } from "@/providers/AppProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

/**
 * Silence a benign React 19 deprecation log emitted from inside
 * react-native-gesture-handler's internal `Wrap` component (used by
 * @gorhom/bottom-sheet). It calls `React.cloneElement`, which trips React 19's
 * "Accessing element.ref was removed" warning. It is an upstream library issue,
 * not app code, and is harmless — we filter just this one message so it stops
 * surfacing as a runtime error overlay.
 */
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("Accessing element.ref was removed in React 19")) {
    return;
  }
  originalConsoleError(...args);
};

const queryClient = new QueryClient();

const headerStyle = {
  headerStyle: { backgroundColor: Colors.paper },
  headerShadowVisible: false,
  headerTintColor: Colors.charcoal,
  headerTitleStyle: { fontFamily: Fonts.serif, fontSize: 18 },
  headerBackTitle: "Back",
} as const;

function NavigationGate() {
  const { onboarded, rolePicked, me } = useApp();
  const { isAuthenticated, initializing } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (onboarded === null || rolePicked === null || initializing) return;

    SplashScreen.hideAsync().catch(() => {});

    if (onboarded === false) {
      if (pathname !== "/welcome") router.replace("/welcome");
      return;
    }

    if (!isAuthenticated) {
      if (pathname !== "/sign-in" && pathname !== "/welcome") {
        router.replace("/sign-in");
      }
      return;
    }

    // Signed in but hasn't chosen a role yet — guide them through it once.
    // Cross-check: if they already have a valid role in their DB profile, consider it picked.
    if (rolePicked === false && !me?.role) {
      if (pathname !== "/role-setup") router.replace("/role-setup");
      return;
    }

    if (pathname === "/sign-in" || pathname === "/welcome" || pathname === "/role-setup") {
      router.replace("/(tabs)");
    }
  }, [onboarded, rolePicked, me?.role, isAuthenticated, initializing, pathname]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={headerStyle}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="welcome"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="role-setup"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="drives" options={{ title: "Collection drives" }} />
      <Stack.Screen
        name="start-drive"
        options={{ title: "Start a drive", presentation: "modal" }}
      />
      <Stack.Screen
        name="listing/[id]"
        options={{ title: "Listing", presentation: "card" }}
      />
      <Stack.Screen
        name="post-listing"
        options={{ title: "Post a listing", presentation: "modal" }}
      />
      <Stack.Screen
        name="compose"
        options={{ title: "Share an update", presentation: "modal" }}
      />
      <Stack.Screen name="event/[id]" options={{ title: "Event" }} />
      <Stack.Screen
        name="submit-event"
        options={{ title: "Submit an event", presentation: "modal" }}
      />
      <Stack.Screen name="guide/[id]" options={{ title: "Guide" }} />
      <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
      <Stack.Screen name="ecoforge" options={{ title: "EcoForge" }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Profile" }} />
      <Stack.Screen
        name="edit-profile"
        options={{ title: "Edit profile", presentation: "modal" }}
      />
      <Stack.Screen name="inbox" options={{ title: "Messages" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    [Fonts.script]: DancingScript_700Bold,
    [Fonts.serif]: PlayfairDisplay_600SemiBold,
    [Fonts.serifBold]: PlayfairDisplay_700Bold,
    [Fonts.sans]: Inter_400Regular,
    [Fonts.sansMedium]: Inter_500Medium,
    [Fonts.sansSemibold]: Inter_600SemiBold,
    [Fonts.sansBold]: Inter_700Bold,
    [Fonts.mono]: SpaceMono_400Regular,
    [Fonts.monoBold]: SpaceMono_700Bold,
  });



  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <GestureHandlerRootView style={styles.flex1}>
            <NavigationGate />
            <RootLayoutNav />
            <SplashOverlay />
          </GestureHandlerRootView>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { ErrorBoundaryProps } from "expo-router";
import { View as RNView, Button as RNButton } from "react-native";
import { Text as RNText } from "@/components/ui";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <RNView style={fallbackStyles.container}>
      <RNText style={fallbackStyles.title}>Something went wrong</RNText>
      <RNText style={fallbackStyles.message}>{error.message}</RNText>
      <RNButton title="Try Again" onPress={retry} color={Colors.skyDeep} />
    </RNView>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 22,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.slate,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
