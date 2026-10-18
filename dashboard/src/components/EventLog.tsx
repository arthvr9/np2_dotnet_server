import type { LogEntry } from '../types';

const ROTULOS: Record<LogEntry['kind'], string> = {
  press: 'pressionou',
  release: 'soltou',
  online: 'conectou',
  offline: 'desconectou',
};

function horario(at: Date) {
  return at.toLocaleTimeString('pt-BR', { hour12: false }) +
    '.' + String(at.getMilliseconds()).padStart(3, '0');
}

type Props = { entries: LogEntry[] };

export function EventLog({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="log-empty">Nenhum evento recebido.</p>;
  }

  return (
    <ol className="log">
      {entries.map((e) => (
        <li key={e.key} className="log-row" data-kind={e.kind}>
          <time className="log-time">{horario(e.at)}</time>
          <span className="log-device">{e.deviceId}</span>
          <span className="log-kind">{ROTULOS[e.kind]}</span>
        </li>
      ))}
    </ol>
  );
}
