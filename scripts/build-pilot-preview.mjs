import fs from 'node:fs/promises'
import path from 'node:path'
import { build } from 'vite'
const args=process.argv.slice(2)
const output=path.resolve(args.includes('--output')?args[args.indexOf('--output')+1]:'outputs/reliability-pilot.html')
await build({configFile:'vite.pilot.config.ts'})
let js=await fs.readFile('work/pilot-standalone/pilot.js','utf8')
let css=await fs.readFile('work/pilot-standalone/2026-okfks-lecture.css','utf8')
const dataUrl=async(file,mime)=>`data:${mime};base64,${(await fs.readFile(file)).toString('base64')}`
js=js.replaceAll('__OKFKS_PILOT_LOGO__',await dataUrl('public/brand/synergy-logo.png','image/png'))
  .replaceAll('__OKFKS_PILOT_ORNAMENT__',await dataUrl('public/brand/side-ornament.png','image/png'))
css=css.replace(/url\([^)]*raleway-cyrillic\.woff2[^)]*\)/g,`url("${await dataUrl('public/fonts/raleway-cyrillic.woff2','font/woff2')}")`)
await fs.mkdir(path.dirname(output),{recursive:true})
await fs.writeFile(output,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Мастерская надёжности · Пилот</title><link rel="icon" href="data:,"><style>body{margin:0}${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`)
console.log(`Автономная мастерская: ${output}`)
