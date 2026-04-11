export interface QuickPrompt {
    label: string;
    content: string;
}

export const SIMULATION_QUICK_PROMPTS: readonly QuickPrompt[] = [
    {
        label: 'Physical examination',
        content: 'I would like to perform a physical examination.',
    },
    {
        label: 'Laboratory diagnostics',
        content: 'I would like to order laboratory diagnostics.',
    },
    {
        label: 'Instrumental diagnostics',
        content: 'I would like to order instrumental diagnostics.',
    },
]
