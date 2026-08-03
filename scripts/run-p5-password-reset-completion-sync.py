from pathlib import Path

WORKFLOW_PATH = Path(
    '.github/workflows/p5-password-reset-completion-roadmap.yml'
)
START_MARKER = "          python - <<'PY'\n"
END_MARKER = "          PY\n"
INDENT = '          '

workflow = WORKFLOW_PATH.read_text()
start = workflow.find(START_MARKER)
if start < 0:
    raise SystemExit('roadmap synchronization script start marker missing')
start += len(START_MARKER)
end = workflow.find(END_MARKER, start)
if end < 0:
    raise SystemExit('roadmap synchronization script end marker missing')

script = ''.join(
    line[len(INDENT):] if line.startswith(INDENT) else line
    for line in workflow[start:end].splitlines(keepends=True)
)
exec(compile(script, str(WORKFLOW_PATH), 'exec'), {})
