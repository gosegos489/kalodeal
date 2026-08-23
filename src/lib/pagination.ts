type GetPaginationParams = {
  pageParam?: string
  totalItems: number
  pageSize?: number
}

export function getPagination({ pageParam, totalItems, pageSize = 10 }: GetPaginationParams) {
  const parsedPage = Number(pageParam)

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1

  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    page,
    pageSize,
    totalPages,
    skip: (page - 1) * pageSize,
    take: pageSize
  }
}
