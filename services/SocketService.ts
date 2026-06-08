import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants';

class SocketService {
    private socket: Socket | null = null;
    private lastCircleId: string | null = null;

    private get baseUrl(): string {
        return API_BASE_URL.replace('/api', '').replace('/tester', '');
    }

    constructor() {
        // We don't call init in constructor anymore because it needs to be async
    }

    public async init() {
        if (this.socket?.connected) return;
        
        try {
            const token = await AsyncStorage.getItem('authToken');
            console.log('[SocketService] Initializing socket at:', this.baseUrl, token ? '(with token)' : '(no token)');
            
            if (this.socket) {
                this.socket.disconnect();
            }

            this.socket = io(this.baseUrl, {
                transports: ['polling', 'websocket'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                auth: {
                    token: token ? `Bearer ${token}` : undefined
                }
            });

            this.socket.on('connect', () => {
                console.log('[SocketService] Connected. ID:', this.socket?.id);
                // Auto-rejoin last circle if it exists
                if (this.lastCircleId) {
                    console.log('[SocketService] Auto-rejoining circle:', this.lastCircleId);
                    this.socket?.emit('join_circle', this.lastCircleId);
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[SocketService] Disconnected:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[SocketService] Connection error:', error);
            });
        } catch (error) {
            console.error('[SocketService] Initialization error:', error);
        }
    }

    public async heartbeat(circleId: string, userId: string | null) {
        if (!this.socket || !this.socket.connected) await this.init();
        if (this.socket) {
            console.log('[SocketService] Sending heartbeat for circle:', circleId);
            this.socket.emit('heartbeat', { circleId, userId, timestamp: Date.now() });
        }
    }

    public async reconnect() {
        console.log('[SocketService] Forcing reconnection...');
        this.disconnect();
        await this.init();
    }

    public async joinCircle(circleId: string) {
        this.lastCircleId = circleId;
        if (!this.socket || !this.socket.connected) await this.init();
        if (this.socket) {
            console.log('[SocketService] Joining circle room:', circleId);
            this.socket.emit('join_circle', circleId);
        }
    }

    private debugCallback: ((event: string, data: any) => void) | null = null;

    public setDebugCallback(callback: ((event: string, data: any) => void) | null) {
        this.debugCallback = callback;
    }

    public async emitLocationUpdate(circleId: string, data: any) {
        if (!this.socket || !this.socket.connected) await this.init();
        if (this.socket) {
            const payload = { circleId, ...data };
            console.log('[SocketService] Emitting send_location for circle:', circleId, 'with speed:', data.speed);
            this.socket.emit('send_location', payload);
            if (this.debugCallback) {
                this.debugCallback('send_location', payload);
            }
        }
    }

    public async on(event: string, callback: (data: any) => void) {
        if (!this.socket) await this.init();
        this.socket?.on(event, callback);
    }

    public off(event: string, callback: (data: any) => void) {
        this.socket?.off(event, callback);
    }

    public async emit(event: string, data: any) {
        if (!this.socket || !this.socket.connected) await this.init();
        this.socket?.emit(event, data);
        if (this.debugCallback) {
            this.debugCallback(event, data);
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();