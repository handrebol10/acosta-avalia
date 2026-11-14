// Publica a pasta dist/ no branch gh-pages (GitHub Pages).
// Uso: npm run deploy
import { execSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'

const run = (cmd, cwd = 'dist') => execSync(cmd, { cwd, stdio: 'inherit' })
const git = (c) => execSync('git ' + c).toString().trim()
const remote = git('remote get-url origin')
const who = `-c user.name="${git('config user.name')}" -c user.email="${git('config user.email')}"`

rmSync('dist/.git', { recursive: true, force: true })
writeFileSync('dist/.nojekyll', '')
run('git init -q -b gh-pages')
run('git add -A')
run(`git ${who} commit -q -m "Publicação"`)
run(`git push -q -f ${remote} gh-pages`)
console.log('\nPublicado! Em 1 a 2 minutos estará em https://handrebol10.github.io/acosta-avalia/')
