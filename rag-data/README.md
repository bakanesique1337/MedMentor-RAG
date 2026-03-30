# RAG Source Data

Place clinical recommendation source documents in this folder.

Supported file extensions:
- `txt`
- `md`
- `markdown`
- `json`
- `csv`

The backend RAG ingestion pipeline scans this folder on startup and then
periodically (`MEDMENTOR_RAG_SYNC_INTERVAL_MS`) to apply incremental updates:
- new/changed files are re-embedded
- removed files are deleted from vector storage
