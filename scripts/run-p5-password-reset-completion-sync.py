from pathlib import Path
from textwrap import dedent

WORKFLOW_PATH = Path(
    '.github/workflows/p5-password-reset-completion-roadmap.yml'
)
START_MARKER = "          python - <<'PY'\n"
END_MARKER = "          PY\n"

workflow = WORKFLOW_PATH.read_text()
start = workflow.find(START_MARKER)
if start < 0:
    raise SystemExit('roadmap synchronization script start marker missing')
start += len(START_MARKER)
end = workflow.find(END_MARKER, start)
if end < 0:
    raise SystemExit('roadmap synchronization script end marker missing')

script = dedent(workflow[start:end])
exec(compile(script, str(WORKFLOW_PATH), 'exec'), {})
