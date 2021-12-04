#!/usr/bin/env node
import inquirer from 'inquirer'
import create from './create'
import { resolve } from 'path'

const [ botName, projectDir ] = process.argv.slice(2)

async function main() {
  process.chdir(resolve(process.cwd(), projectDir || ''))
  console.log('If you not register your bot, you can register in: https://bot.q.qq.com/open/#/type')
  console.log('You need bot id, secret key and token, you can get it in: https://bot.q.qq.com/#/developer/developer-setting')
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
    name: 'appId',
    message: 'What is your app id?',
    validate: (input: string) => {
      if (!input) {
        return 'Please enter your app id'
      }
      return true
    }
  }, {
    type: 'input',
    name: 'appKey',
    message: 'What is your app key(secret)?',
    validate: (input: string) => {
      if (!input) {
        return 'Please enter your app key'
      }
      return true
    }
  }, {
    type: 'input',
    name: 'appToken',
    message: 'What is your app token?',
    validate: (input: string) => {
      if (!input) {
        return 'Please enter your app token'
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
