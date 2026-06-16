<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import type { RoundResult, Target } from '../types.js';

  interface Props {
    mapClass?: string;
    onMapClick?: (lat: number, lng: number) => void;
    guessMarker?: { lat: number; lng: number; color?: string; pic?: string } | null;
    targetMarker?: Target | null;
    resultMarkers?: RoundResult[];
    maxZoom?: number;
    interactive?: boolean;
  }

  let {
    mapClass = '',
    onMapClick,
    guessMarker = null,
    targetMarker = null,
    resultMarkers = [],
    maxZoom = 20,
    interactive = true
  }: Props = $props();

  let container: HTMLDivElement;
  let map: L.Map | null = $state(null);
  let tileLayer: L.TileLayer | null = $state(null);
  let guessLayer = L.layerGroup();
  let resultLayer = L.layerGroup();

  const tiles: Record<string, string> = {
    Streets: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    Satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    Terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    OSM: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    OpenTopoMap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  const defaultLayer = localStorage.getItem('gc_map_layer') || 'Streets';

  onMount(() => {
    map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      maxZoom
    }).setView([20, 0], 2);

    tileLayer = L.tileLayer(tiles[defaultLayer], {
      attribution:
        defaultLayer === 'OSM' || defaultLayer === 'OpenTopoMap'
          ? '&copy; OpenStreetMap contributors'
          : '&copy; Google'
    }).addTo(map);

    guessLayer.addTo(map);
    resultLayer.addTo(map);

    (window as any).__switchMapLayer = (name: string) => {
      if (!tileLayer || !map) return;
      const url = tiles[name];
      if (!url) return;
      map.removeLayer(tileLayer);
      tileLayer = L.tileLayer(url, {
        attribution: name === 'OSM' || name === 'OpenTopoMap' ? '&copy; OpenStreetMap contributors' : '&copy; Google'
      }).addTo(map);
      localStorage.setItem('gc_map_layer', name);
    };

    return () => {
      map?.remove();
      map = null;
    };
  });

  $effect(() => {
    if (!map) return;
    map.options.maxZoom = maxZoom;
    if (map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  });

  $effect(() => {
    map?.invalidateSize();
  });

  function onMapClickHandler(e: L.LeafletMouseEvent) {
    onMapClick?.(e.latlng.lat, e.latlng.lng);
  }

  $effect(() => {
    if (!map) return;
    if (interactive && onMapClick) {
      map.on('click', onMapClickHandler);
    } else {
      map.off('click', onMapClickHandler);
    }
    return () => {
      map?.off('click', onMapClickHandler);
    };
  });

  function createAvatarMarker(lat: number, lng: number, color: string, pic?: string) {
    const size = pic ? 28 : 14;
    const html = pic
      ? `<img src="${pic}" class="rounded-full border-2" style="width:${size}px;height:${size}px;border-color:${color}" />`
      : `<div class="rounded-full border-2 border-white" style="width:${size}px;height:${size}px;background:${color}"></div>`;
    return L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'bg-transparent',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
    });
  }

  $effect(() => {
    if (!map) return;
    guessLayer.clearLayers();
    if (guessMarker) {
      const m = createAvatarMarker(guessMarker.lat, guessMarker.lng, guessMarker.color || '#22c55e', guessMarker.pic);
      m.addTo(guessLayer);
    }
  });

  $effect(() => {
    if (!map) return;
    resultLayer.clearLayers();
    if (targetMarker) {
      L.marker([targetMarker.lat, targetMarker.lng], {
        icon: L.divIcon({
          className: 'bg-transparent',
          html: `<div class="rounded-full border-2 border-white bg-red-600" style="width:14px;height:14px"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      })
        .bindTooltip(targetMarker.label)
        .addTo(resultLayer);

      for (const r of resultMarkers) {
        const m = createAvatarMarker(r.lat, r.lng, r.color || '#3b82f6', r.pic)
          .bindTooltip(`${r.displayName} — ${Math.round(r.distance).toLocaleString()} m`)
          .addTo(resultLayer);
        L.polyline(
          [
            [targetMarker.lat, targetMarker.lng],
            [r.lat, r.lng]
          ],
          { dashArray: '6 6', color: r.color || '#3b82f6', weight: 2 }
        ).addTo(resultLayer);
      }

      const group = L.featureGroup(resultLayer.getLayers());
      map.fitBounds(group.getBounds().pad(0.15));
    }
  });
</script>

<div class="h-full w-full {mapClass}">
  <div bind:this={container} class="h-full w-full"></div>
</div>
