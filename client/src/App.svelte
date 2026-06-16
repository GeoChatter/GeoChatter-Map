<script lang="ts">
  import { onMount } from 'svelte';
  import { initSocket, disconnectSocket } from './lib/socket.js';
  import Login from './lib/Login.svelte';
  import StreamerView from './lib/StreamerView.svelte';
  import PlayerView from './lib/PlayerView.svelte';
  import Alert from './lib/Alert.svelte';

  type JwtPayload = { sub: string; name: string; pic?: string; iat: number; exp: number };

  let token = $state(localStorage.getItem('gc_token') || '');
  let user = $state<JwtPayload | null>(null);
  let view: 'login' | 'streamer' | 'player' = $state('login');
  let streamerId = $state('');

  onMount(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        user = payload;
        decideView(payload.sub);
        connect(token);
      } catch {
        localStorage.removeItem('gc_token');
      }
    }
  });

  function decideView(userId: string) {
    const path = window.location.pathname.replace(/^\//, '').split('/')[0];
    if (path && decodeURIComponent(path) === userId) {
      view = 'streamer';
      streamerId = userId;
    } else if (path) {
      view = 'player';
      streamerId = decodeURIComponent(path);
    } else {
      view = 'streamer';
      streamerId = userId;
    }
  }

  function connect(jwt: string) {
    disconnectSocket();
    const socket = initSocket(jwt);
    socket.on('connect', () => {
      if (view === 'streamer') {
        socket.emit('streamer:getGame');
      } else {
        socket.emit('player:join', { streamerId });
      }
    });
    socket.on('connect_error', (err) => {
      console.error(err);
      localStorage.removeItem('gc_token');
      view = 'login';
    });
  }

  function handleLogin(event: { token: string; streamer: boolean; streamerName: string }) {
    const jwt = event.token;
    localStorage.setItem('gc_token', jwt);
    token = jwt;
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    user = payload;
    const targetName = event.streamer ? payload.sub : event.streamerName;
    streamerId = targetName;
    window.history.replaceState({}, '', `/${encodeURIComponent(targetName)}`);
    decideView(payload.sub);
    connect(jwt);
  }
</script>

<Alert />

{#if view === 'login' || !user}
  <Login onlogin={handleLogin} />
{:else if view === 'streamer'}
  <StreamerView {user} />
{:else}
  <PlayerView {user} {streamerId} />
{/if}
