#!/usr/bin/env node
import inquirer from 'inquirer'
import create from './create'
import { resolve } from 'path'

const [ botName, projectDir ] = process.argv.slice(2)

async function main() {
  process.chdir(resolve(process.cwd(), projectDir || ''))
  create(botName, await inquirer.prompt([{
    type: 'input',
    name: 'botName',
    default: botName,
    message: 'What is the name of your bot?',
    validate: (input: string) => {
      if (!input) {
        return 'Please enter a name for your bot'
      }
      return true
    }
  }, {
    type: 'input',
    name: 'description',
    message: 'What is the description of your bot?'
  }, {
    type: 'list',
    name: 'language',
    message: 'What language would you like to use?',
    choices: ['TypeScript', 'JavaScript'],
    default: 'TypeScript'
  }, {
    type: 'list',
    name: 'packageManager',
    message: 'What package manager would you like to use?',
    choices: ['yarn', 'npm'],
    default: 'yarn'
  // }, {
  //   type: 'confirm',
  //   name: 'eslint',
  //   message: 'Would you like to use ESLint?',
  //   default: true
  // }, {
  //   type: 'confirm',
  //   name: 'git',
  //   message: 'Would you like to use Git?',
  //   default: true
  }]))
}

main().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err.toString())
  process.exit(1)
})
