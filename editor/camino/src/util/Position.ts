export interface Position {
    x: number,
    y: number,
}

export function distance(p1: Position, p2: Position): number {
    return (((p2.x - p1.x) ** 2) + ((p2.y - p1.y) ** 2)) ** 0.5;
}