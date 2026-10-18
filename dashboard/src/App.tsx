import { DeviceCard } from './components/DeviceCard';
import { EventLog } from './components/EventLog';
import { WaveMark } from './components/WaveMark';
import { useHub } from './useHub';

export function App() {
  const { devices, log, erro } = useHub();
  const ordenados = [...devices].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="page">
      <header className="top">
        <h1 className="title">
          <WaveMark />
          Monitor IoT
        </h1>
      </header>

      {erro && <p className="erro">{erro}</p>}

      <section className="section">
        <h2 className="section-title">Dispositivos</h2>
        {ordenados.length === 0 ? (
          <p className="log-empty">Nenhum dispositivo registrado.</p>
        ) : (
          <div className="devices">
            {ordenados.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Eventos</h2>
        <EventLog entries={log} />
      </section>
    </div>
  );
}
