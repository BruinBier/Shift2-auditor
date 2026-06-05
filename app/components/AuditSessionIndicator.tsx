'use client';

import { useEffect, useState } from 'react';

type Status = 'unknown' | 'running' | 'stopped' | 'starting' | 'error';

export default function AuditSessionIndicator() {
  const [status, setStatus] = useState<Status>('unknown');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function checkStatus() {
    try {
      const res = await fetch('/api/audit-session/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data.running ? 'running' : 'stopped');
    } catch {
      setStatus('stopped');
    }
  }

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10_000);
    return () => clearInterval(interval);
  }, []);

  async function handleStart() {
    if (status === 'starting' || status === 'running') return;
    setErrorMsg(null);
    setStatus('starting');
    try {
      const res = await fetch('/api/audit-session/start', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setStatus('running');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Onbekende fout bij starten.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Netwerkfout bij starten.');
    }
  }

  const dotColor =
    status === 'running'
      ? 'bg-green-400'
      : status === 'starting'
      ? 'bg-yellow-400 animate-pulse'
      : status === 'error'
      ? 'bg-red-500'
      : 'bg-gray-400';

  const label =
    status === 'running'
      ? 'Audit-sessie actief'
      : status === 'starting'
      ? 'Chrome wordt gestart...'
      : status === 'error'
      ? 'Audit-sessie: fout'
      : 'Audit-sessie starten';

  const disabled = status === 'running' || status === 'starting';

  const title =
    status === 'running'
      ? 'Chrome draait op poort 9222. De audit-CLI gebruikt deze sessie voor HTML- en screenshot-ophalen.'
      : status === 'starting'
      ? 'Bezig met starten...'
      : status === 'error'
      ? errorMsg ?? 'Er ging iets mis.'
      : 'Klik om Chrome met debug-poort 9222 te starten.';

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-2 text-sm text-white hover:text-gray-300 ${
        disabled ? 'cursor-default opacity-90' : 'cursor-pointer'
      }`}
    >
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
