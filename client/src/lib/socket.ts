import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
	if (!socket) {
		throw new Error('Socket not initialized');
	}
	return socket;
}

export function initSocket(token: string): Socket {
	if (socket) {
		socket.disconnect();
	}
	socket = io({
		auth: { token },
		transports: ['websocket', 'polling']
	});
	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}
