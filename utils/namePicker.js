/**
 * Advanced Name Deduplication Logic for Node.js
 * Uses natural language processing and fuzzy matching libraries
 * 
 * Install dependencies:
 * npm install natural string-similarity compromise
 */

import natural from 'natural'
import stringSimilarity from 'string-similarity'
import nlp from 'compromise'

// Tokenizer for splitting names
const tokenizer = new natural.WordTokenizer();

/**
 * Analyzes name quality using NLP
 */
function analyzeNameWithNLP(name) {
    if (!name || typeof name !== 'string') return { isValid: false, info: {} };

    const doc = nlp(name);

    return {
        isValid: true,
        hasPerson: doc.people().length > 0,
        personCount: doc.people().length,
        hasProperNouns: doc.nouns().length > 0,
        isCapitalized: doc.terms().some(t => t.has('#TitleCase')),
        tokens: doc.terms().out('array'),
        text: doc.text()
    };
}

/**
 * Calculates Levenshtein distance between names
 */
function calculateSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    return stringSimilarity.compareTwoStrings(
        name1.toLowerCase().trim(),
        name2.toLowerCase().trim()
    );
}

/**
 * Checks if a name is a placeholder or generic (Portuguese-focused)
 */
function isPlaceholder(name) {
    if (!name || typeof name !== 'string') return true;

    const trimmed = name.trim().toLowerCase();

    // Placeholder patterns (Portuguese + English)
    const placeholderPatterns = [
        /^\[ext\]/i,
        /^\[.*?\]/i,                    // Any bracketed prefix
        /^sem\s+nome/i,                 // sem nome
        /^nome\s+desconhecido/i,        // nome desconhecido
        /^não\s+informado/i,            // não informado
        /^nao\s+informado/i,            // nao informado (sem acento)
        /^n\/a$/i,
        /^ns$/i,                        // ns (não sei)
        /^nsn$/i,                       // nsn (não sei o nome)
        /^contato\s*\d*/i,              // contato, contato1, contato2
        /^cliente\s*\d*/i,              // cliente, cliente1
        /^lead\s*\d*/i,                 // lead, lead1
        /^aluno\s*\d*/i,                // aluno, aluno1
        /^responsável\s*\d*/i,          // responsável
        /^pai\s+de/i,                   // pai de...
        /^mãe\s+de/i,                   // mãe de...
        /^mae\s+de/i,                   // mae de...
        /^desconhecido/i,
        /^unknown/i,
        /^unnamed/i,
        /^\d+$/,                        // só números
        /^user\d+/i,
        /^contact\d+/i,
        /^test/i,
        /^teste/i,
        /^cliente$/i,
        /^contato$/i,
        /^lead$/i,
        /^whatsapp$/i,
        /^zap$/i,
        /^tel$/i,
        /^telefone$/i
    ];

    return placeholderPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Checks if name is likely a phone number or email
 */
function isContactInfo(name) {
    if (!name) return false;

    const phonePattern = /^[\d\s\-\+\(\)]{8,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return phonePattern.test(name.trim()) || emailPattern.test(name.trim());
}

/**
 * Scores name completeness with advanced analysis
 */
function scoreNameCompleteness(name) {
    if (!name || typeof name !== 'string') return 0;

    const trimmed = name.trim();
    if (!trimmed) return 0;

    let score = 0;

    // Check for placeholders first (immediate disqualification)
    if (isPlaceholder(trimmed)) return -100;
    if (isContactInfo(trimmed)) return -50;

    // NLP analysis
    const nlpInfo = analyzeNameWithNLP(trimmed);

    // Base score
    score += 10;

    // NLP-based scoring
    if (nlpInfo.hasPerson) score += 50; // Strong indicator of real name
    score += nlpInfo.personCount * 20;
    if (nlpInfo.hasProperNouns) score += 30;
    if (nlpInfo.isCapitalized) score += 20;

    // Token count (word parts)
    const tokens = tokenizer.tokenize(trimmed) || [];
    score += tokens.length * 15;

    // Bonus for 2-3 parts (typical full name)
    if (tokens.length === 2) score += 25; // First + Last
    if (tokens.length === 3) score += 30; // First + Middle + Last
    if (tokens.length > 4) score -= 10; // Too many parts might be noise

    // Length scoring
    const length = trimmed.length;
    if (length >= 5 && length <= 50) {
        score += Math.min(length, 30);
    } else if (length > 50) {
        score -= 10; // Penalize overly long names
    }

    // Character diversity (not just repeated characters)
    const uniqueChars = new Set(trimmed.toLowerCase()).size;
    score += Math.min(uniqueChars * 2, 20);

    // Bonus for accented characters (common in Portuguese names)
    if (/[áàâãéêíóôõúüç]/i.test(trimmed)) score += 15;

    // Check for proper name structure (First Last or First Middle Last)
    // Portuguese names pattern with accents
    const hasProperStructure = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][a-záàâãéêíóôõúüç]+(\s+(da|de|do|dos|das|e)\s+)?(\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][a-záàâãéêíóôõúüç]+)+$/
        .test(trimmed);
    if (hasProperStructure) score += 40;

    // Common Portuguese name patterns
    const commonPrefixes = ['da', 'de', 'do', 'dos', 'das'];
    const hasPortuguesePrefixes = commonPrefixes.some(prefix =>
        new RegExp(`\\s${prefix}\\s`, 'i').test(trimmed)
    );
    if (hasPortuguesePrefixes) score += 10;

    return score;
}

/**
 * Finds the most similar names in a group
 */
function groupSimilarNames(names, threshold = 0.6) {
    const validNames = names.filter(n => n && typeof n === 'string' && n.trim());
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < validNames.length; i++) {
        if (processed.has(i)) continue;

        const group = [validNames[i]];
        processed.add(i);

        for (let j = i + 1; j < validNames.length; j++) {
            if (processed.has(j)) continue;

            const similarity = calculateSimilarity(validNames[i], validNames[j]);
            if (similarity >= threshold) {
                group.push(validNames[j]);
                processed.add(j);
            }
        }

        groups.push(group);
    }

    return groups;
}

/**
 * Chooses the most complete name from an array
 */
function chooseMostCompleteName(names) {
    if (!Array.isArray(names) || names.length === 0) {
        return null;
    }

    // Filter valid names
    const validNames = names.filter(n => n && typeof n === 'string' && n.trim());

    if (validNames.length === 0) return null;
    if (validNames.length === 1) return cleanName(validNames[0]);

    // Score each name
    const scored = validNames.map(name => {
        const score = scoreNameCompleteness(name);
        return {
            original: name,
            name: name.trim(),
            score: score
        };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Return cleaned version of best name
    return cleanName(scored[0].name);
}

/**
 * Cleans a name by removing prefixes and extra spaces
 */
function cleanName(name) {
    if (!name) return null;

    let cleaned = name.trim();

    // Remove common prefixes
    cleaned = cleaned.replace(/^\[EXT\]\s*/i, '');
    cleaned = cleaned.replace(/^\[.*?\]\s*/g, '');

    // Normalize spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Capitalize properly if needed
    const doc = nlp(cleaned);
    const people = doc.people();

    if (people.length > 0) {
        cleaned = people.toTitleCase().text();
    }

    return cleaned.trim();
}

/**
 * Intelligent merge with similarity detection
 */
function intelligentMerge(names) {
    if (!Array.isArray(names) || names.length === 0) return null;

    // Group similar names
    const groups = groupSimilarNames(names);

    // For each group, choose the best name
    const bestFromGroups = groups.map(group => chooseMostCompleteName(group));

    // If multiple groups, choose the best overall
    if (bestFromGroups.length > 1) {
        return chooseMostCompleteName(bestFromGroups);
    }

    return bestFromGroups[0];
}

// Export functions
export {
    chooseMostCompleteName,
    intelligentMerge,
    scoreNameCompleteness,
    cleanName,
    groupSimilarNames,
    calculateSimilarity,
    isPlaceholder,
    isContactInfo
};