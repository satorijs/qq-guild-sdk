namespace Utils {
  export function isString(value: any): value is string {
      return typeof value === 'string'
  }
  export function isNumber(value: any): value is number {
      return typeof value === 'number'
  }
  export function isBoolean(value: any): value is boolean {
      return typeof value === 'boolean'
  }
  export function isFunction(value: any): value is Function {
      return typeof value === 'function'
  }
  export function isObject(value: any): value is Object {
      return typeof value === 'object'
  }
  export function isNull(value: any): value is null {
      return value === null
  }
  export function isUndefined(value: any): value is undefined {
      return typeof value === 'undefined'
  }
  export function isDate(value: any): value is Date {
      return value instanceof Date
  }
  export function isArray(value: any): value is any[] {
      return Array.isArray(value)
  }

  export function snakeCase(value: string): string {
      return value.replace(/([A-Z])/g, g => `_${g[0].toLowerCase()}`)
  }
  export function camelCase(value: string): string {
      return value.replace(/(_[a-z])/g, g => g[1].toUpperCase())
  }

  interface DoAllKeys {
    (o: any): any
  }
  export const doAllKeys = (
    doKey: (string?: string) => string
  ): DoAllKeys => {
    return o => {
      if (o === undefined || o === null) return
      const deal = doAllKeys(doKey)
      if (isArray(o)) {
        return o.map(deal)
      }
      if (isString(o) || isNumber(o) || isBoolean(o)) {
        return o
      }

      const tempObj = Object.entries(o).reduce((acc, [key, value]) => {
        acc[doKey(key)] = deal(value)
        return acc
      }, {} as any)
      Object.entries(tempObj).forEach(([key, value]) => {
        if (!isNumber(value) && !isString(value) && !isBoolean(value))
          tempObj[key] = deal(value)
      })
      return tempObj
    }
  }

  export const snakeCaseObjKeys = doAllKeys(snakeCase as (string?: string) => string) as <T>(o: {}) => T
  export const camelCaseObjKeys = doAllKeys(camelCase as (string?: string) => string) as <T>(o: {}) => T

  export function pluralize(word: string) {
    return word + 's'
  }
}

export = Utils
