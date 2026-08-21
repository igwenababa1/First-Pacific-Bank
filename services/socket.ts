import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1500,
});

socket.on('connect', () => {
    console.log('[WS CLIENT] Connected to banking central hub:', socket.id);
});

socket.on('disconnect', () => {
    console.log('[WS CLIENT] Disconnected from banking central hub');
});

export const registerUserSocket = (email: string) => {
    if (socket.connected) {
        socket.emit('register_user', { email });
    } else {
        socket.once('connect', () => {
            socket.emit('register_user', { email });
        });
    }
};
