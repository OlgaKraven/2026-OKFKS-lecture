import fs from 'node:fs/promises'
import path from 'node:path'
import { build } from 'vite'
const args=process.argv.slice(2)
const output=path.resolve(args.includes('--output')?args[args.indexOf('--output')+1]:'outputs/reliability-pilot.html')
await build({configFile:'vite.pilot.config.ts'})
const js=await fs.readFile('work/pilot-standalone/pilot.js','utf8')
const css=await fs.readFile('work/pilot-standalone/2026-okfks-lecture.css','utf8')
await fs.mkdir(path.dirname(output),{recursive:true})
await fs.writeFile(output,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Мастерская надёжности · Пилот</title><link rel="icon" href="data:,"><style>body{margin:0}${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`)
console.log(`Автономная мастерская: ${output}`)
