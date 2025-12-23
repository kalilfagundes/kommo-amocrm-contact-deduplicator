import he from 'he';

export function unescapeHTML(str) {
    if (typeof str !== 'string') {
        return str;
    }
    return he.decode(str);
}