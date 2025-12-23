/**
 * Normaliza um número de telefone brasileiro para um formato padrão
 * @param {string} phone - Número de telefone em qualquer formato
 * @returns {string} - Número normalizado (apenas dígitos do número local)
 */
/**
 * Gera uma chave de normalização para comparação
 * Remove 55, e remove o 9º dígito se parecer um celular, para garantir que
 * números com e sem o 9 sejam tratados como o mesmo.
 */
function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');

    // Remove 55 inicial
    if (digits.startsWith('55') && digits.length > 2) {
        digits = digits.slice(2);
    }

    // Se tem 11 dígitos (DDD + 9 + 8), remove o primeiro 9 da parte local
    // Assumimos que o 9 extra é sempre o terceiro dígito (XX 9 XXXX-XXXX)
    if (digits.length === 11 && digits[2] === '9') {
        return digits.slice(0, 2) + digits.slice(3);
    }

    // Se tem 9 dígitos (9 + 8, sem DDD), remove o 9 inicial
    if (digits.length === 9 && digits[0] === '9') {
        return digits.slice(1);
    }

    return digits;
}

/**
 * Função principal: recebe array de telefones e retorna array deduplicado
 * Preferência é dada para o número "mais completo" (maior comprimento),
 * para preservar o 9º dígito e o código de país se existirem.
 * @param {string[]} phonesArray - Array de números de telefone
 * @returns {string[]} - Array de números únicos
 */
function deduplicate(phonesArray) {
    const seen = new Map(); // normalized_key -> { original, length }

    for (const phone of phonesArray) {
        if (!phone) continue;

        const digits = phone.replace(/\D/g, '');
        const normalized = normalizePhone(digits);

        const currentData = {
            original: phone,
            length: digits.length
        };

        if (!seen.has(normalized)) {
            seen.set(normalized, currentData);
        } else {
            // Se já existe, verifica se o atual é "melhor" (mais longo)
            // Ex: 557798826... (13) vence de 55778826... (12)
            const existing = seen.get(normalized);
            if (currentData.length > existing.length) {
                seen.set(normalized, currentData);
            }
        }
    }

    return Array.from(seen.values()).map(item => item.original);
}

// Exporta as funções (para uso em módulos)
export { deduplicate, normalizePhone }