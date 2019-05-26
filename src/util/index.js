export function arrayEqual(prev, current) {
    if (prev === current) return true;
    if (prev == null || current == null) return false;
    if (prev.length !== current.length) return false;

    for (let i = 0; i < prev.length; i++) {
        //eslint-disable-next-line eqeqeq 
        if (prev[i] != current[i]) return false;
    }

    return true;
}