export type SimulationQuickPromptKey =
    | 'physical-exam'
    | 'lab-diagnostics'
    | 'instrumental-diagnostics'

export interface SimulationQuickPrompt {
    key: SimulationQuickPromptKey
    label: string
    content: string
}

export const SIMULATION_QUICK_PROMPTS: readonly SimulationQuickPrompt[] = [
    {
        key: 'physical-exam',
        label: 'Physical exam',
        content:
            'Please provide objective physical examination findings for this patient at the current stage. Include general appearance, vital signs, and key system-specific findings relevant to this case. Respond only with findings that are available in the case data.',
    },
    {
        key: 'lab-diagnostics',
        label: 'Lab diagnostics',
        content:
            'Please provide available laboratory test results for this patient at the current stage. Include test name, value, units, and reference interpretation if present in case data. Respond only with available data and do not invent missing results.',
    },
    {
        key: 'instrumental-diagnostics',
        label: 'Instrumental diagnostics',
        content:
            'Please provide available instrumental and imaging study results for this patient at the current stage. Include modality, key findings, and formal impression if present in case data. Respond only with available data and do not add assumptions.',
    },
] as const
