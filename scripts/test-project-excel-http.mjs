import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
const port = 3101;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], { detached: process.platform !== 'win32', stdio: ['ignore','pipe','pipe'], env: {...process.env, NEXT_TELEMETRY_DISABLED:'1'} });
let output = ''; server.stdout.on('data', d => output += d); server.stderr.on('data', d => output += d);
try {
  let response;
  for (let i = 0; i < 100; i++) {
    try { response = await fetch(`${base}/admin/projecten/excel`); break; } catch { await delay(200); }
  }
  assert.ok(response, `Server failed to start: ${output}`);
  assert.equal(response.status,200);
  const html = await response.text();
  for (const text of ['Projectgegevens via Excel','Excel exporteren','Controlevoorbeeld tonen']) assert.ok(html.includes(text));
  console.log('PASS: Excelpagina compileert en geeft HTTP 200 met export/upload-flow.');
  const cases = [
    ['externe origin', {'Content-Type':'application/json',Origin:'https://example.com'}, '{}',403],
    ['ongeldig token', {'Content-Type':'application/json',Origin:base}, '{"action":"apply","token":"invalid"}',400],
    ['ontbrekend controlevoorbeeld', {'Content-Type':'application/json',Origin:base}, '{}',400],
    ['JSON null', {'Content-Type':'application/json',Origin:base}, 'null',400],
    ['kapotte JSON', {'Content-Type':'application/json',Origin:base}, '{',400],
    ['te groot verzoek', {'Content-Type':'application/json',Origin:base}, 'x'.repeat(2*1024*1024+101),413],
    ['verkeerd content-type', {'Content-Type':'text/plain',Origin:base}, 'x',400],
  ];
  for (const [name,headers,body,status] of cases) {
    const result=await fetch(`${base}/api/client-projects/excel`, {method:'POST',headers,body});
    assert.equal(result.status,status,name);
    assert.ok((await result.json()).error,name);
    console.log(`PASS: ${name} geweigerd met HTTP ${status}.`);
  }
  const form=new FormData();form.append('file',new Blob(['bad']),'bad.xlsx');
  const result=await fetch(`${base}/api/client-projects/excel`,{method:'POST',headers:{Origin:base},body:form});
  assert.equal(result.status,400); assert.match((await result.json()).error,/geen geldig/);
  console.log('PASS: corrupte .xlsx upload geweigerd vóór databasetoegang.');
} finally {
  if (process.platform === 'win32') server.kill(); else { try {process.kill(-server.pid,'SIGTERM');} catch {} }
}
