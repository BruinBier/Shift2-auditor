// Gebruik: node bewaar-run.js <kenmerk> <runNr> <wfRunId> <taskOutputFile> <doelmap>
const fs = require('fs')
const path = require('path')
const [kenmerk, runNr, wfRunId, outFile, doelmap] = process.argv.slice(2)
const wfDir = `C:/Users/ellen/.claude/projects/C--Users-ellen-IdeaProjects-Shift2-auditor/60d5a785-e6cb-4357-99dd-050d982fa49b/subagents/workflows/${wfRunId}`
const regels = fs.readFileSync(path.join(wfDir, 'journal.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
const label = {}
for (const r of regels) if (r.type === 'started') label[r.key] = r.label
const perLabel = {}
for (const r of regels) if (r.type === 'result') perLabel[label[r.key]] = r.result
const uit = JSON.parse(fs.readFileSync(outFile, 'utf8'))
const paginas = Object.keys(perLabel)
  .filter((l) => l && l.startsWith('bekijk:'))
  .sort((a, b) => +a.split(':')[1] - +b.split(':')[1])
  .map((l) => perLabel[l])
const eind = uit.result ?? uit.output ?? uit
const doc = {
  kenmerk,
  run: Number(runNr),
  workflowRunId: wfRunId,
  bewaardOp: new Date().toISOString(),
  planning: perLabel.planning,
  kandidaten: perLabel.kandidaten,
  paginasBekeken: paginas,
  keuze: perLabel.kiezen,
  eindresultaat: eind,
  logs: uit.logs,
  gebruik: { agents: uit.agentCount, tokens: uit.totalTokens, toolCalls: uit.totalToolCalls },
}
const bestand = path.join(doelmap, `${kenmerk}-v1-run${runNr}.json`)
fs.writeFileSync(bestand, JSON.stringify(doc, null, 1), 'utf8')
console.log(bestand, '| bekeken:', paginas.length, '| gekozen:', (perLabel.kiezen?.samples || []).length)
