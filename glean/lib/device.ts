import * as Calendar from "expo-calendar";
import * as Contacts from "expo-contacts";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Linking, Platform, Share } from "react-native";

/** Result of a device action — `ok` plus an optional friendly message to surface. */
export interface DeviceResult {
  ok: boolean;
  message?: string;
}

/* ------------------------------- Calendar ------------------------------- */

async function getWritableCalendarId(): Promise<string | null> {
  try {
    if (Platform.OS === "ios") {
      const def = await Calendar.getDefaultCalendarAsync();
      if (def?.id) return def.id;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications);
    return writable?.id ?? calendars[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** Drops an event into the phone's calendar with a one-hour-before alarm. */
export async function addToCalendar(input: {
  title: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  notes?: string;
}): Promise<DeviceResult> {
  if (Platform.OS === "web") {
    return { ok: false, message: "Calendar isn't available on web." };
  }
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      return { ok: false, message: "Calendar access was denied." };
    }
    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      return { ok: false, message: "No calendar available to add to." };
    }
    const end = input.endDate ?? new Date(input.startDate.getTime() + 60 * 60 * 1000);
    await Calendar.createEventAsync(calendarId, {
      title: input.title,
      startDate: input.startDate,
      endDate: end,
      location: input.location,
      notes: input.notes,
      alarms: [{ relativeOffset: -60 }],
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't add to your calendar." };
  }
}

/* ----------------------------- Notifications ---------------------------- */

/** Schedules a one-off local reminder. Silently no-ops if the date is in the past. */
export async function scheduleReminder(input: {
  title: string;
  body: string;
  date: Date;
}): Promise<DeviceResult> {
  if (Platform.OS === "web") return { ok: false };
  if (input.date.getTime() <= Date.now() + 60_000) {
    return { ok: false, message: "That's too soon to set a reminder." };
  }
  try {
    let settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      settings = await Notifications.requestPermissionsAsync();
    }
    if (!settings.granted) {
      return { ok: false, message: "Notifications were turned off." };
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: input.title, body: input.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.date,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't set a reminder." };
  }
}

/* ------------------------------- Sharing -------------------------------- */

/** Opens the native share sheet with a message (and optional url). */
export async function shareText(message: string, url?: string): Promise<void> {
  try {
    await Share.share(url ? { message, url } : { message });
  } catch {
    // user dismissed or sharing unavailable — ignore
  }
}

/* --------------------------- Save to gallery ---------------------------- */

/** Downloads a remote image and saves it to the phone's photo library. */
export async function saveImageToGallery(url: string): Promise<DeviceResult> {
  if (Platform.OS === "web") {
    return { ok: false, message: "Saving to gallery isn't available on web." };
  }
  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, message: "Photos access was denied." };
    }
    const ext = (url.split("?")[0].split(".").pop() ?? "jpg").slice(0, 4);
    const target = `${LegacyFileSystem.cacheDirectory}glean-${Date.now()}.${ext}`;
    const downloaded = await LegacyFileSystem.downloadAsync(url, target);
    await MediaLibrary.saveToLibraryAsync(downloaded.uri);
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't save the photo." };
  }
}

/* ------------------------------- Contacts ------------------------------- */

/** Lets the user invite a phone contact — opens a prefilled SMS, or the share sheet. */
export async function inviteContact(message: string): Promise<DeviceResult> {
  if (Platform.OS === "web") {
    await shareText(message);
    return { ok: true };
  }
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      await shareText(message);
      return { ok: true };
    }
    const contact = await Contacts.presentContactPickerAsync();
    const phone = contact?.phoneNumbers?.[0]?.number?.replace(/\s+/g, "");
    if (phone) {
      const sep = Platform.OS === "ios" ? "&" : "?";
      const url = `sms:${phone}${sep}body=${encodeURIComponent(message)}`;
      await Linking.openURL(url).catch(() => shareText(message));
      return { ok: true };
    }
    await shareText(message);
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't open contacts." };
  }
}
