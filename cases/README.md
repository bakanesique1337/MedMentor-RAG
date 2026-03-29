# Case Format

Case files live under category folders, for example `cases/infections/`.
The draft JSON Schema for authored cases is stored at `cases/case.schema.json`.

Each case is one JSON file with this draft structure:

```json
{
  "id": "infection-influenza-001",
  "version": 1,
  "category": "Infections",
  "title": "Classic influenza presentation",
  "difficulty": "easy",
  "tags": ["fever", "cough"],
  "patientName": "Anna Petrova",
  "patientAge": 26,
  "patientSex": "female",
  "patientBrief": "Fever, body aches, and dry cough since yesterday.",
  "openingComplaint": "I've had fever and body aches since yesterday.",
  "authorNote": "Short authoring note for the model. Keep this case-specific.",
  "facts": {
    "symptoms": ["fever", "dry cough"],
    "history": ["coworkers were sick last week"],
    "negatives": ["no rash"]
  },
  "diagnosisOptions": [
    "Influenza",
    "Common cold",
    "Streptococcal pharyngitis",
    "COVID-19"
  ],
  "correctDiagnosis": "Influenza"
}
```

Required fields:
- `id`: stable unique identifier
- `version`: integer for future case revisions
- `category`: frontend grouping label
- `title`: short author-facing case label
- `difficulty`: simple seed value like `easy`, `medium`, or `hard`
- `patientName`: display name for the case card and session
- `patientAge`: integer age
- `patientSex`: simple display value for UI and prompt context
- `patientBrief`: short case-card summary with the initial symptoms
- `openingComplaint`: first complaint seed for the patient opener
- `authorNote`: one short case-specific instruction block for the model
- `facts`: structured interview facts grouped into `symptoms`, `history`, and `negatives`
- `diagnosisOptions`: list shown at final diagnosis step
- `correctDiagnosis`: exact match to one value from `diagnosisOptions`

Validation notes:
- The schema currently enforces the documented field set and disallows unknown top-level or `facts` properties.
- `correctDiagnosis` is documented as an exact match to one `diagnosisOptions` value, but that cross-field rule is not enforced in the schema yet.
- `difficulty` and `patientSex` are intentionally left as open strings for now so authoring can evolve without a schema migration.

Simulation state machine rules:
- `CASE_BROWSE`: user is looking at available case cards and may filter by category.
- `CASE_SELECTED`: a case has been chosen in the UI, but no persisted simulation session exists yet.
- `CASE_STARTED`: backend created the session and kicked off the opening patient message.
- `IN_PROGRESS`: opening message finished successfully and the interview is active.
- `DIAGNOSIS_SELECT`: user explicitly finished questioning and may choose from the session's shuffled diagnosis options.
- `SCORING`: diagnosis was submitted and the backend is generating the final score/result payload.
- `COMPLETED`: score and summary are persisted; the session becomes part of history and no longer blocks starting a new one.

Transition rules:
- Session creation moves directly into `CASE_STARTED` with `OPENING_PENDING`.
- When opening generation succeeds, `openingStatus` becomes `OPENING_READY` and the main state becomes `IN_PROGRESS`.
- When opening generation fails, `openingStatus` becomes `OPENING_FAILED`; retry must reuse the same session id.
- User chat messages are accepted only in `IN_PROGRESS`.
- Diagnosis options are exposed only in `DIAGNOSIS_SELECT`, `SCORING`, or `COMPLETED`.
- Scoring is allowed only after a diagnosis is selected.
- Only one unfinished session may exist for a user at a time.

Authoring rules:
- Keep the case medically coherent but short.
- Put reusable behavior in backend prompt files, not in each case.
- `patientBrief` is for the frontend card, not hidden prompt logic.
- Put only case-specific model guidance in `authorNote`.
- Keep `diagnosisOptions` short and plausible.
- Use plain strings first; richer nested schema can come later.
