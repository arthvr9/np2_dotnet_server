import type { DeviceState } from '../types';

type Props = { device: DeviceState };

export function DeviceCard({ device }: Props) {
  const estado = !device.online ? 'offline' : device.pressed ? 'pressed' : 'idle';
  const rotulo = !device.online ? 'desconectado' : device.pressed ? 'transmitindo' : 'em repouso';

  return (
    <article className="device" data-state={estado}>
      <header className="device-head">
        <span className="device-id">{device.id}</span>
        <span className="device-dot" aria-hidden="true" />
      </header>

      <div className="device-level" role="img" aria-label={rotulo}>
        <span className="device-level-fill" />
      </div>

      <footer className="device-foot">
        <span className="device-label">{rotulo}</span>
        <time className="device-time" dateTime={device.lastSeen}>
          {new Date(device.lastSeen).toLocaleTimeString('pt-BR')}
        </time>
      </footer>
    </article>
  );
}
