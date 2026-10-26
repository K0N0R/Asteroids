/** Remove isolated specks before contours, radar and physics are built from this grid. */
export function removeSmallAnomalyPatches(
    values: Float32Array,
    width: number,
    minimumCells = 16,
    minimumDepth = 120,
) {
    const seen = new Uint8Array(values.length);
    let removed = 0;
    for (let start = 0; start < values.length; start++) {
        if (seen[start] || values[start] >= 0) continue;
        const cells = [start];
        seen[start] = 1;
        let depth = 0;
        for (let cursor = 0; cursor < cells.length; cursor++) {
            const index = cells[cursor],
                x = index % width,
                y = Math.floor(index / width);
            depth = Math.max(depth, -values[index]);
            for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx !== 0 && dy !== 0 && dx !== dy) continue;
                    const xx = x + dx,
                        yy = y + dy,
                        next = yy * width + xx;
                    if (
                        xx < 0 ||
                        xx >= width ||
                        yy < 0 ||
                        next >= values.length ||
                        seen[next] ||
                        values[next] >= 0
                    )
                        continue;
                    seen[next] = 1;
                    cells.push(next);
                }
        }
        if (cells.length >= minimumCells && depth >= minimumDepth) continue;
        for (const index of cells) values[index] = Math.max(1, -values[index]);
        removed++;
    }
    return removed;
}
