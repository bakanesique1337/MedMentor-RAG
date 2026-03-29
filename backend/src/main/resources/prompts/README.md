# Prompt Catalog

These prompt templates are the first draft for the gameplay loop.

Files:
- `global-system.txt`: top-level behavior and simulation rules
- `patient-role.txt`: how the model should answer as the patient
- `session-opening.txt`: how the first patient message should sound
- `score-review.txt`: end-of-session scoring and summary output

Design notes:
- Keep prompts short and composable.
- Case-specific data should come from `/cases` JSON, not be hardcoded here.
- Prompt files are versioned with the backend and loaded from classpath resources.
