export type DeviceState = {
  id: string;
  online: boolean;
  pressed: boolean;
  lastSeen: string;
};

export type LogEntry = {
  key: number;
  at: Date;
  deviceId: string;
  kind: 'press' | 'release' | 'online' | 'offline';
};

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';
