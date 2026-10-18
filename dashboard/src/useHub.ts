import { useEffect, useRef, useState } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import type { ConnectionStatus, DeviceState, LogEntry } from './types';

const SERVER = import.meta.env.VITE_SERVER_URL;
const MONITOR_KEY = import.meta.env.VITE_MONITOR_KEY;

async function obterToken(): Promise<string> {
  const resposta = await fetch(`${SERVER}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'monitor', deviceKey: MONITOR_KEY }),
  });
  if (!resposta.ok) throw new Error(`auth retornou ${resposta.status}`);
  const dados = (await resposta.json()) as { token: string };
  return dados.token;
}

export function useHub() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [devices, setDevices] = useState<Record<string, DeviceState>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // O estado anterior fica fora do React: so serve para decidir o que logar.
  const anterior = useRef<Record<string, DeviceState>>({});
  const proximaChave = useRef(0);

  useEffect(() => {
    let conexao: HubConnection | null = null;
    let cancelado = false;

    function registrar(estado: DeviceState) {
      const antes = anterior.current[estado.id];
      anterior.current[estado.id] = estado;

      const eventos: LogEntry['kind'][] = [];
      if (!antes || antes.online !== estado.online) {
        eventos.push(estado.online ? 'online' : 'offline');
      }
      if (antes?.pressed !== estado.pressed && estado.online) {
        eventos.push(estado.pressed ? 'press' : 'release');
      }

      if (eventos.length > 0) {
        setLog((atual) =>
          [
            ...eventos.map((kind) => ({
              key: proximaChave.current++,
              at: new Date(),
              deviceId: estado.id,
              kind,
            })),
            ...atual,
          ].slice(0, 100),
        );
      }

      setDevices((atual) => ({ ...atual, [estado.id]: estado }));
    }

    async function conectar() {
      try {
        conexao = new HubConnectionBuilder()
          .withUrl(`${SERVER}/iot`, { accessTokenFactory: obterToken })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();

        conexao.on('DeviceChanged', registrar);
        conexao.onreconnecting(() => setStatus('reconnecting'));
        conexao.onreconnected(() => setStatus('connected'));
        conexao.onclose(() => setStatus('offline'));

        await conexao.start();
        if (cancelado) return;

        setStatus('connected');
        setErro(null);

        const iniciais = await conexao.invoke<DeviceState[]>('GetDevices');
        iniciais.forEach((estado) => {
          anterior.current[estado.id] = estado;
        });
        setDevices(Object.fromEntries(iniciais.map((d) => [d.id, d])));
      } catch (e) {
        if (cancelado) return;
        setStatus('offline');
        setErro(e instanceof Error ? e.message : String(e));
      }
    }

    void conectar();

    return () => {
      cancelado = true;
      if (conexao && conexao.state !== HubConnectionState.Disconnected) {
        void conexao.stop();
      }
    };
  }, []);

  return { status, devices: Object.values(devices), log, erro };
}
