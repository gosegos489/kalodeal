export function matchesImageType(bytes: Uint8Array, type: string) {
  const data = Buffer.from(bytes)
  if (type === 'image/jpeg') return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (type === 'image/png') return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return type === 'image/webp' && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
}
