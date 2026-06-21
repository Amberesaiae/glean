import { Layers } from "lucide-react-native";
import React, { useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import type { SupplyCluster } from "@/utils/clusters";

interface Props {
  clusters: SupplyCluster[];
  onSelect: (cluster: SupplyCluster) => void;
  /** Key of the currently selected cluster, or null. Drives pin highlight. */
  selectedKey?: string | null;
}

interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  area: string;
  count: number;
  /** Relative weight 0..1 used to scale pin size by supply volume. */
  weight: number;
}

/** Builds a self-contained Leaflet page with OpenStreetMap tiles and a minimal
 * count pin per supply cluster. Pins manage their own selected state in-page;
 * taps (and background taps) are posted back to React Native. */
function buildHtml(points: MapPoint[]): string {
  const data = JSON.stringify(points);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EEF3EC; }
  .glean-pin {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${Colors.sky};
    color: #fff;
    border-radius: 999px;
    font-family: -apple-system, system-ui, sans-serif;
    font-weight: 700;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(21,92,171,0.30);
    transition: transform .15s ease, background .15s ease;
  }
  .glean-pin.selected {
    background: ${Colors.skyDeep};
    transform: scale(1.18);
    box-shadow: 0 4px 12px rgba(21,92,171,0.45);
    z-index: 600;
  }
  .glean-label {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 100%;
    margin-bottom: 6px;
    background: #fff;
    color: ${Colors.charcoal};
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 8px;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var points = ${data};
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([7.95, -1.02], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  function send(type, key) {
    var msg = JSON.stringify({ type: type, key: key });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    else if (window.parent) window.parent.postMessage(msg, '*');
  }

  var markers = {};
  var selectedKey = null;

  function pinHtml(p, size, sel) {
    var label = sel ? '<span class="glean-label">' + p.area + '</span>' : '';
    return '<div class="glean-pin' + (sel ? ' selected' : '') + '" data-key="' + p.key +
      '" style="width:' + size + 'px;height:' + size + 'px;font-size:' +
      (p.count > 99 ? 12 : 14) + 'px">' + label + p.count + '</div>';
  }

  function rerenderSelection() {
    Object.keys(markers).forEach(function (k) {
      var entry = markers[k];
      entry.marker.setIcon(L.divIcon({
        html: pinHtml(entry.point, entry.size, k === selectedKey),
        className: '',
        iconSize: [entry.size, entry.size],
        iconAnchor: [entry.size / 2, entry.size / 2],
      }));
    });
  }

  var bounds = [];
  points.forEach(function (p) {
    var size = Math.round(30 + p.weight * 18);
    var icon = L.divIcon({
      html: pinHtml(p, size, false),
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
    m.on('click', function (ev) {
      L.DomEvent.stopPropagation(ev);
      selectedKey = (selectedKey === p.key) ? null : p.key;
      rerenderSelection();
      send(selectedKey ? 'select' : 'deselect', p.key);
    });
    markers[p.key] = { point: p, size: size, marker: m };
    bounds.push([p.lat, p.lng]);
  });

  map.on('click', function () {
    if (selectedKey) {
      selectedKey = null;
      rerenderSelection();
      send('deselect', null);
    }
  });

  // Allow React Native to drive selection (e.g. when the sheet is closed).
  window.__gleanSetSelected = function (key) {
    if (selectedKey === key) return;
    selectedKey = key;
    rerenderSelection();
  };
  window.addEventListener('message', function (e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && d.type === 'setSelected') window.__gleanSetSelected(d.key || null);
    } catch (err) {}
  });

  if (bounds.length === 1) map.setView(bounds[0], 12);
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13 });
</script>
</body>
</html>`;
}

export function MarketMap({ clusters, onSelect, selectedKey = null }: Props) {
  const byKey = useRef<Map<string, SupplyCluster>>(new Map());
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const points = useMemo<MapPoint[]>(() => {
    byKey.current = new Map(clusters.map((c) => [c.key, c]));
    const maxVendors = Math.max(1, ...clusters.map((c) => c.vendorCount));
    return clusters.map((c) => ({
      key: c.key,
      lat: c.lat,
      lng: c.lng,
      area: c.area,
      count: c.vendorCount,
      weight: Math.min(1, Math.max(0, (c.vendorCount - 1) / Math.max(1, maxVendors - 1))),
    }));
  }, [clusters]);

  const html = useMemo(() => buildHtml(points), [points]);

  const handleMessage = (raw: string) => {
    try {
      const msg = JSON.parse(raw) as { type?: string; key?: string };
      if (msg.type === "select" && msg.key) {
        const cluster = byKey.current.get(msg.key);
        if (cluster) onSelect(cluster);
      }
    } catch {
      // ignore malformed messages
    }
  };

  // Push selection changes (e.g. sheet closed in RN) back into the map page.
  React.useEffect(() => {
    const payload = JSON.stringify({ type: "setSelected", key: selectedKey });
    const js = `window.__gleanSetSelected && window.__gleanSetSelected(${JSON.stringify(selectedKey)}); true;`;
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(payload, "*");
    } else {
      webRef.current?.injectJavaScript(js);
    }
  }, [selectedKey]);

  if (clusters.length === 0) {
    return (
      <View style={[styles.wrap, styles.empty]}>
        <Layers color={Colors.mist} size={28} />
        <Text style={styles.emptyText}>No supply to map with these filters yet.</Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    // On web, render Leaflet inside a sandboxed iframe and listen for marker taps.
    return (
      <View style={styles.wrap}>
        <WebIframe ref={iframeRef} html={html} onMessage={handleMessage} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.web}
        onMessage={(e) => handleMessage(e.nativeEvent.data)}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

/** Web-only iframe wrapper that bridges postMessage from the Leaflet page. */
const WebIframe = React.forwardRef<
  HTMLIFrameElement,
  { html: string; onMessage: (data: string) => void }
>(function WebIframe({ html, onMessage }, ref) {
  React.useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (typeof e.data === "string") onMessage(e.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onMessage]);

  return React.createElement("iframe", {
    ref,
    srcDoc: html,
    style: {
      border: "none",
      width: "100%",
      height: "100%",
    },
  });
});

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#E9F1E4", overflow: "hidden" },
  web: { flex: 1, backgroundColor: "#E9F1E4" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.slate,
    textAlign: "center",
  },
});
