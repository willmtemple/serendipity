export function arrayEqual(prev : any[] | null, current : any[] | null) {
    if (prev === current) { return true; }
    if (prev == null || current == null) { return false; }
    if (prev.length !== current.length) { return false; }

    for (let i = 0; i < prev.length; i++) {
        // tslint:disable-next-line: triple-equals
        if (prev[i] != current[i]) { return false; }
    }

    return true;
}