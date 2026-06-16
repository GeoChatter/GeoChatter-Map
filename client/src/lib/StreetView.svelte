<script lang="ts">
  import { onMount } from 'svelte';
  import type { Target } from '../types.js';

  interface Props {
    location: Target | null | undefined;
    apiKey: string;
    class?: string;
  }

  let { location, apiKey, class: className = '' }: Props = $props();

  let container: HTMLDivElement;
  let panorama: any = null;
  let isFullscreen = $state(false);

  function loadScript(): Promise<void> {
    if ((window as any).__gc_maps_loaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-gc-maps]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.dataset.gcMaps = 'true';
      script.onload = () => {
        (window as any).__gc_maps_loaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  onMount(() => {
    loadScript().then(() => {
      const google = (window as any).google;
      panorama = new google.maps.StreetViewPanorama(container, {
        addressControl: false,
        showRoadLabels: false,
        clickToGo: false,
        linksControl: true,
        panControl: true,
        zoomControl: true,
        fullscreenControl: false,
        motionTracking: false
      });
      updatePosition();
    });
  });

  function updatePosition() {
    if (!panorama || !location) return;
    if (location.panoId) {
      panorama.setPano(location.panoId);
    } else {
      panorama.setPosition({ lat: location.lat, lng: location.lng });
    }
  }

  $effect(() => {
    updatePosition();
  });

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    setTimeout(() => {
      const google = (window as any).google;
      if (panorama && google?.maps?.event) {
        google.maps.event.trigger(panorama, 'resize');
      }
    }, 50);
  }
</script>

<div class="relative h-full w-full {className}" class:fixed={isFullscreen} class:inset-0={isFullscreen} class:z-[600]={isFullscreen}>
  <div bind:this={container} class="h-full w-full"></div>
  <button
    class="btn btn-circle btn-sm absolute right-2 top-2 z-10"
    onclick={toggleFullscreen}
    title="Toggle fullscreen"
  >
    {isFullscreen ? '⤓' : '⤢'}
  </button>
</div>
