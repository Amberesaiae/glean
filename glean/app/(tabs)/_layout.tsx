import { Tabs } from "expo-router";
import {
  BookOpen,
  CalendarHeart,
  Leaf,
  Store,
  UserRound,
} from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.sky,
        tabBarInactiveTintColor: Colors.mist,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.line,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sansMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <CalendarHeart color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
