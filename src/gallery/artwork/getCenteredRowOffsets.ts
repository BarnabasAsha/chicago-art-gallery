export function getCenteredRowOffsets(
  itemWidths: number[],
  gap: number,
): number[] {
  if (itemWidths.length === 0) return []

  const contentWidth = itemWidths.reduce((total, width) => total + width, 0)
  const totalWidth = contentWidth + gap * (itemWidths.length - 1)
  let cursor = -totalWidth / 2

  return itemWidths.map((width) => {
    const center = cursor + width / 2
    cursor += width + gap
    return center
  })
}
