import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MaterialKey, Region } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/providers/AppProvider";
import type { Listing, ListingKind } from "@/types";
import { clusterSupply, type SupplyCluster } from "@/utils/clusters";

interface ListingRow {
  id: string;
  kind: string;
  title: string;
  material: string;
  quantity: number;
  unit: string;
  region: string;
  area: string;
  description: string;
  photo: string | null;
  author_id: string;
  created_at: string;
  price_per_unit: number | null;
  recurring: boolean;
  frequency: string | null;
  lat: number | null;
  lng: number | null;
  status: string | null;
}

export type KindFilter = "all" | ListingKind;
export type ViewMode = "list" | "map";

/** Owns all Market home filter state and the listing/cluster/pool derivations
 * computed from it, keeping the screen component a thin orchestrator. */
export function useMarket() {
  const {
    liveListings,
    loading,
    refreshing,
    refresh,
    marketQuery: query,
    setMarketQuery: setQuery,
    marketKind: kind,
    setMarketKind: setKind,
    marketMaterial: material,
    setMarketMaterial: setMaterial,
    marketRegion: region,
    setMarketRegion: setRegion,
    marketShowRegions: showRegions,
    setMarketShowRegions: setShowRegions,
    marketView: view,
    setMarketView: setView,
    marketRadius: radius,
    setMarketRadius: setRadius,
  } = useApp();

  const [selected, setSelected] = useState<SupplyCluster | null>(null);

  // Radial search state (location specific states remain local to instance)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearListings, setNearListings] = useState<Listing[]>([]);
  const [fetchingNear, setFetchingNear] = useState<boolean>(false);

  const requestLocation = useCallback(async () => {
    setLocationError(null);
    setRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied.");
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coord = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setUserLocation(coord);
      return coord;
    } catch (err) {
      setLocationError("Could not retrieve current location.");
      return null;
    } finally {
      setRequestingLocation(false);
    }
  }, []);

  const changeRadius = useCallback(async (r: "all" | number) => {
    setRadius(r);
    if (r !== "all" && !userLocation) {
      await requestLocation();
    }
  }, [userLocation, requestLocation]);

  // Fetch near listings whenever radius, userLocation, or liveListings change
  useEffect(() => {
    if (radius === "all" || !userLocation) {
      setNearListings([]);
      return;
    }

    const loc = userLocation;

    let active = true;
    async function fetchNear() {
      setFetchingNear(true);
      try {
        const { data, error } = await supabase.rpc("search_listings_near" as any, {
          latitude: loc.lat,
          longitude: loc.lng,
          radius_meters: radius * 1000,
        });
        if (error) throw error;
        if (!active) return;

        const mapped: Listing[] = ((data ?? []) as ListingRow[]).map((row) => ({
          id: row.id,
          kind: row.kind as ListingKind,
          title: row.title,
          material: row.material as MaterialKey,
          quantity: Number(row.quantity) || 0,
          unit: row.unit,
          region: row.region as any,
          area: row.area,
          description: row.description,
          photo: row.photo ?? undefined,
          authorId: row.author_id,
          createdAt: new Date(row.created_at).getTime(),
          pricePerUnit: row.price_per_unit != null ? Number(row.price_per_unit) : undefined,
          recurring: !!row.recurring,
          frequency: row.frequency as any,
          lat: row.lat != null ? Number(row.lat) : undefined,
          lng: row.lng != null ? Number(row.lng) : undefined,
          status: (row.status as any) ?? "active",
        }));
        setNearListings(mapped);
      } catch (err) {
        console.error("Error fetching near listings:", err);
      } finally {
        if (active) {
          setFetchingNear(false);
        }
      }
    }

    fetchNear();
    return () => {
      active = false;
    };
  }, [radius, userLocation, liveListings]);

  const sourceListings = radius !== "all" && userLocation ? nearListings : liveListings;

  const filtered = useMemo<Listing[]>(() => {
    return sourceListings
      .filter((l) => (kind === "all" ? true : l.kind === kind))
      .filter((l) => (material === "all" ? true : l.material === material))
      .filter((l) => (region === "all" ? true : l.region === region))
      .filter((l) =>
        query.trim().length === 0
          ? true
          : (l.title + l.description + l.area)
              .toLowerCase()
              .includes(query.toLowerCase()),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [sourceListings, kind, material, region, query]);

  const clusters = useMemo<SupplyCluster[]>(
    () => clusterSupply(sourceListings, { material: material as MaterialKey | "all", region }),
    [sourceListings, material, region],
  );

  const pools = useMemo<SupplyCluster[]>(
    () =>
      clusters
        .filter((c) => c.listings.length >= 2)
        .sort((a, b) => b.totalKg - a.totalKg),
    [clusters],
  );

  return {
    loading: loading || fetchingNear,
    refreshing,
    refresh,
    query,
    setQuery,
    kind,
    setKind,
    material,
    setMaterial,
    region,
    setRegion,
    showRegions,
    setShowRegions,
    view,
    setView,
    selected,
    setSelected,
    filtered,
    clusters,
    pools,
    // Radius search properties
    radius,
    changeRadius,
    userLocation,
    requestLocation,
    requestingLocation,
    locationError,
  };
}
