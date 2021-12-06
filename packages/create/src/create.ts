import * as fs from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

interface Options {
  description: string
  eslint: boolean
  language: 'JavaScript' | 'TypeScript'
  git: boolean
  packageManager: 'npm' | 'yarn'
  appId: string
  appKey: string
  appToken: string
}

export default (botName: string, options: Options) => {
  const projectPath = resolve(process.cwd(), botName)
  fs.mkdirSync(projectPath)
  const pkg = JSON.parse(
    fs.readFileSync(resolve(__dirname, '../templates/package.json'), 'utf8'))
  pkg.name = botName
  pkg.description = options.description
  pkg.main = `src/index.${ {
    'JavaScript': 'js',
    'TypeScript': 'ts'
  }[options.language] }`
  pkg.scripts = {
    start: `${ {
      'TypeScript': 'ts-',
      'JavaScript': ''
    }[options.language] }node -r dotenv/config ${ pkg.main }`
  }
  pkg.dependencies = {
    'qq-guild-sdk': '^1.1.1'
  }
  pkg.devDependencies = {
  }
  switch (options.language) {
    case 'JavaScript':
      pkg.devDependencies = Object.assign(pkg.devDependencies, {
      })
      break
    case 'TypeScript':
      pkg.devDependencies = Object.assign(pkg.devDependencies, {
        '@types/node': '*',
        'typescript': '^4.5.2',
        'ts-node': '^10.4.0'
      })
  }
  fs.writeFileSync(resolve(projectPath, 'package.json'), JSON.stringify(pkg, null, 2))
  const commonFiles = {
    'README.md': {
      name: botName,
      description: options.description
    },
    '.editorconfig': {
      languageList: `{${{
        'JavaScript': [ 'js', 'jsx' ],
        'TypeScript': [ 'ts', 'tsx' ]
      }[options.language].join(',')}}`
    },
    '.env': {
      id: options.appId,
      key: options.appKey,
      token: options.appToken
    }
  }

  Object.entries(commonFiles).forEach(([fileName, obj]) => {
    fs.writeFileSync(
      resolve(projectPath, fileName),
      formatStr(resolve(__dirname, `../templates/common/${fileName}`), obj)
    )
  })
  fs.cpSync(resolve(__dirname, `../templates/${{
    'JavaScript': 'js',
    'TypeScript': 'ts'
  }[options.language]}`), resolve(projectPath), { recursive: true })
  execSync(`cd ${ projectPath } && ${ {
    'npm': 'npm install',
    'yarn': 'yarn'
  }[options.packageManager] }`, { stdio: [0, 1, 2], encoding: 'utf8' })

  console.log('bot created successfully!')
  console.log(`run \`cd ${ botName } && ${ options.packageManager } start\` to start your bot.`)
}

export const formatStr = (filePath: string, obj: any) => {
  const fileContent = fs.readFileSync(filePath, 'utf8')
    .replaceAll('`', '\\`')
  return new Function('return `' + fileContent + '`').bind(obj)()
}
