/**
 * Maps backend category labels (English, sourced from case JSON files) to
 * display labels and avatar palettes used across the UI.
 *
 * If a category is not present in the maps, the helpers fall back to the
 * raw value and a neutral teal palette.
 */

export interface CategoryPalette {
    from: string;
    to: string;
}

const CATEGORY_DISPLAY: Record<string, string> = {
    Cardiology: 'Кардиология',
    Pulmonology: 'Пульмонология',
    Neurology: 'Неврология',
    Endocrinology: 'Эндокринология',
    Gastroenterology: 'Гастроэнтерология',
    Nephrology: 'Нефрология',
    Infections: 'Инфекции',
}

const CATEGORY_PALETTE: Record<string, CategoryPalette> = {
    Cardiology: {from: '#f0b5a8', to: '#c4584a'},
    Pulmonology: {from: '#cfe2ea', to: '#5a8ba3'},
    Neurology: {from: '#d6ccea', to: '#6e5d9e'},
    Endocrinology: {from: '#ecd5a0', to: '#b07f2a'},
    Gastroenterology: {from: '#e8c39a', to: '#a8713b'},
    Nephrology: {from: '#bfd9d7', to: '#3d7f83'},
    Infections: {from: '#b8d8d5', to: '#4a8a85'},
}

const DEFAULT_PALETTE: CategoryPalette = {from: '#3fb9b3', to: '#0d7377'}

/**
 * Returns a Russian display label for a backend category, or the input
 * value uppercased if no mapping exists.
 */
export function categoryDisplayLabel(category: string): string {
    return CATEGORY_DISPLAY[category] || category
}

/**
 * Returns a gradient palette pair for a category, or a neutral teal pair.
 */
export function categoryPalette(category: string): CategoryPalette {
    return CATEGORY_PALETTE[category] || DEFAULT_PALETTE
}
