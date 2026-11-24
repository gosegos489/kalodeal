import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatReportQueueSchema } from '@/features/messages/report-schema'
import { getPagination } from './pagination'

test('search pagination uses the first page value, matching browser links and nuqs', () => {
  const result = (pageParam?: string | string[]) => getPagination({ pageParam, totalItems: 53, pageSize: 50 })
  assert.deepEqual(result(['2', '1']), result('2'))
  assert.equal(result('2').skip, 50)
  assert.equal(result('2').take, 50)
  assert.equal(result('100').page, 2)
  for (const invalid of ['0.5', '0', '-1', '', '9007199254740992', undefined, ['0.5', '2']]) {
    assert.equal(result(invalid).skip, 0)
    assert.equal(result(invalid).page, 1)
  }
})

test('repeated page parameters retain the selected chat report status', () => {
  const filters = chatReportQueueSchema.parse({ status: 'RESOLVED', page: ['2', '1'] })
  assert.equal(filters.status, 'RESOLVED')
  assert.equal(getPagination({ pageParam: filters.page, totalItems: 12 }).skip, 10)
})
