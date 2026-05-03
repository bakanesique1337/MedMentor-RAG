/**
 * @file Сопоставление категорий кейсов (приходят с бэкенда на английском
 * из JSON-файлов кейсов) с человекочитаемыми метками и палитрами аватаров,
 * которые используются по всему UI.
 */

export interface CategoryPalette {
    from: string;
    to: string;
}

/**
 * Map меток для отображения категорий.
 */
const CATEGORY_DISPLAY: Record<string, string> = {
    Cardiology: 'Кардиология',
    Pulmonology: 'Пульмонология',
    Neurology: 'Неврология',
    Endocrinology: 'Эндокринология',
    Gastroenterology: 'Гастроэнтерология',
    Nephrology: 'Нефрология',
    Infections: 'Инфекции',
}

/**
 * Map градиентных палитр для аватаров и плашек кейсов по категориям.
 */
const CATEGORY_PALETTE: Record<string, CategoryPalette> = {
    Cardiology: {from: '#f0b5a8', to: '#c4584a'},
    Pulmonology: {from: '#cfe2ea', to: '#5a8ba3'},
    Neurology: {from: '#d6ccea', to: '#6e5d9e'},
    Endocrinology: {from: '#ecd5a0', to: '#b07f2a'},
    Gastroenterology: {from: '#e8c39a', to: '#a8713b'},
    Nephrology: {from: '#bfd9d7', to: '#3d7f83'},
    Infections: {from: '#b8d8d5', to: '#4a8a85'},
}

/**
 * Палитра по умолчанию для категорий, отсутствующих в CATEGORY_PALETTE.
 */
const DEFAULT_PALETTE: CategoryPalette = {from: '#3fb9b3', to: '#0d7377'}

/**
 * Возвращает метку для категории с бэкенда.
 *
 * @param category — исходное значение категории.
 * @returns метка либо исходное значение, если соответствия нет.
 */
export function categoryDisplayLabel(category: string): string {
    return CATEGORY_DISPLAY[category] || category
}

/**
 * Возвращает пару цветов для градиента по категории.
 *
 * @param category — исходное значение категории.
 * @returns пара цветов градиента либо нейтральная teal-палитра по умолчанию.
 */
export function categoryPalette(category: string): CategoryPalette {
    return CATEGORY_PALETTE[category] || DEFAULT_PALETTE
}
