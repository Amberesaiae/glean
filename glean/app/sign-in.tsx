import { LogIn, UserPlus } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Input, Label, PressableScale, Text, haptic } from "@/components/ui";
import { EcoImage } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useAuth } from "@/providers/AuthProvider";

type Mode = "signin" | "signup" | "forgot";

/** Inline Google 'G' icon rendered as a coloured letter — avoids SVG dependency. */
function GoogleIcon() {
  return (
    <Text style={googleIconStyle}>G</Text>
  );
}
const googleIconStyle = {
  fontFamily: undefined as undefined,
  fontSize: 17,
  fontWeight: "700" as const,
  color: "#4285F4",
  lineHeight: 20,
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [googleBusy, setGoogleBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  // Basic email format check (must contain @)
  const emailValid = email.trim().length > 3 && email.includes("@");

  const valid = isForgot
    ? emailValid
    : emailValid &&
      password.length >= 6 &&
      (!isSignup || name.trim().length > 1);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isForgot) {
        await resetPassword(email);
        haptic("success");
        setNotice("Password reset email sent — check your inbox.");
        setMode("signin");
      } else if (isSignup) {
        await signUp(email, password, name);
        haptic("success");
        setNotice(
          "Account created. If asked, confirm your email, then sign in.",
        );
        setMode("signin");
      } else {
        await signIn(email, password);
        haptic("success");
      }
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setGoogleBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroArt}>
            <EcoImage name="zeroWaste" size={68} />
          </View>
          <Text style={styles.wordmark}>glean</Text>
          <Text style={styles.tagline}>
            {isForgot
              ? "Enter your email to reset your password"
              : isSignup
              ? "Create your account to join the marketplace"
              : "Welcome back — sign in to continue"}
          </Text>
        </View>

        <View style={styles.form}>
          {isSignup ? (
            <>
              <Label text="Name" />
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
              />
            </>
          ) : null}

          <Label text="Email" />
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          {!isForgot ? (
            <>
              <Label text="Password" />
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <View style={styles.submitWrap}>
            <Button
              label={
                isForgot
                  ? "Send reset email"
                  : isSignup
                  ? "Create account"
                  : "Sign in"
              }
              onPress={submit}
              disabled={!valid}
              loading={busy}
              fullWidth
              icon={
                isSignup ? (
                  <UserPlus color={Colors.white} size={18} />
                ) : isForgot ? null : (
                  <LogIn color={Colors.white} size={18} />
                )
              }
            />
          </View>

          {/* Forgot password link — only shown on sign-in mode */}
          {!isSignup && !isForgot ? (
            <PressableScale
              onPress={() => switchMode("forgot")}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </PressableScale>
          ) : null}

          {!isForgot ? (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <PressableScale
                onPress={google}
                style={styles.googleBtn}
                disabled={googleBusy}
              >
                {googleBusy ? (
                  <ActivityIndicator color={Colors.charcoal} />
                ) : (
                  <>
                    <GoogleIcon />
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                )}
              </PressableScale>
            </>
          ) : null}

          <PressableScale
            onPress={() =>
              switchMode(isForgot ? "signin" : isSignup ? "signin" : "signup")
            }
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {isForgot
                ? "Back to "
                : isSignup
                ? "Already have an account? "
                : "New to Glean? "}
              <Text style={styles.switchLink}>
                {isForgot ? "Sign in" : isSignup ? "Sign in" : "Create one"}
              </Text>
            </Text>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { paddingHorizontal: 24 },
  hero: { alignItems: "center", marginBottom: 28 },
  heroArt: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  wordmark: {
    fontFamily: Fonts.script,
    fontSize: 48,
    color: Colors.sky,
    lineHeight: 54,
  },
  tagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14.5,
    color: Colors.slate,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  form: { gap: 2 },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.danger,
    marginTop: 12,
    lineHeight: 19,
  },
  notice: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.success,
    marginTop: 12,
    lineHeight: 19,
  },
  submitWrap: { marginTop: 18 },
  forgotBtn: { alignItems: "center", marginTop: 14, paddingVertical: 4 },
  forgotText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.sky,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.line },
  dividerText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 14,
    paddingVertical: 15,
  },
  googleText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    color: Colors.charcoal,
  },
  switchBtn: { alignItems: "center", marginTop: 22, paddingVertical: 6 },
  switchText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.slate },
  switchLink: { fontFamily: Fonts.sansSemibold, color: Colors.sky },
});
