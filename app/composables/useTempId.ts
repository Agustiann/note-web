const TEMP_ID_PREFIX = 'tmp-'

export const useTempId = () => `${TEMP_ID_PREFIX}${crypto.randomUUID()}`

export const isTempId = (id: unknown): boolean =>
  typeof id === 'string' && id.startsWith(TEMP_ID_PREFIX)