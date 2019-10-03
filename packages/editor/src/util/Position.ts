export interface IPosition {
    x: number,
    y: number,
}

export function distance(p1 : IPosition, p2 : IPosition) : number {
    return (((p2.x - p1.x) ** 2) + ((p2.y - p1.y) ** 2)) ** 0.5;
}