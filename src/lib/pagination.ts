import { createParser, createSerializer } from 'nuqs/server'

export const paginationPageParser = createParser({
  parse(value) {
    if (!/^\d+$/.test(value)) return null
    const page = Number(value)
    return Number.isSafeInteger(page) && page >= 1 ? page : null
  },
  serialize: String
})
  .withDefault(1)
  .withOptions({ clearOnDefault: false })

export const serializePagination = createSerializer({ page: paginationPageParser })

type GetPaginationParams = {
  pageParam?: string | string[]
  totalItems: number
  pageSize?: number
}

export function getPagination({ pageParam, totalItems, pageSize = 10 }: GetPaginationParams) {
  const requestedPage = paginationPageParser.parseServerSide(typeof pageParam === 'string' ? pageParam : undefined)
  const totalPages = Math.ceil(totalItems / pageSize)
  const page = Math.min(requestedPage, Math.max(1, totalPages))

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    skip: (page - 1) * pageSize,
    take: pageSize
  }
}
