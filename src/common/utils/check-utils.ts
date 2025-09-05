function isNumeric(str: string) {
    return /^\d+$/.test(str);
}

function isAlpha(str: string): boolean {
    return /^[A-Za-z]+$/.test(str);
}

function isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
}

export {
    isNumeric, isAlpha, isNullOrUndefined
}