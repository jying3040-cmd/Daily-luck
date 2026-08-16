import { spawn } from 'node:child_process'

const npmCli = process.env.npm_execpath

function runNpmScript(script) {
  if (npmCli) {
    return spawn(process.execPath, [npmCli, 'run', script], { stdio: 'inherit' })
  }

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return spawn(npm, ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
}

const children = [
  runNpmScript('dev:server'),
  runNpmScript('dev:web'),
]

let stopping = false
function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exitCode = exitCode
}

for (const child of children) {
  child.once('error', (error) => {
    console.error(error)
    stop(1)
  })
  child.once('exit', (code, signal) => {
    if (!stopping && (code !== 0 || signal)) stop(code ?? 1)
  })
}

process.once('SIGINT', () => stop())
process.once('SIGTERM', () => stop())
