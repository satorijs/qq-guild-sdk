declare global {
  namespace NodeJS {
    interface ProcessEnv {
      id: string
      key: string
      token: string
    }
  }
}
