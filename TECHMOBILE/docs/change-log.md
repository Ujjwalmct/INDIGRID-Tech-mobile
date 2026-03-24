# Change Log

## 2026-03-24

### Task List UI

- Removed the right-side task checkmark visuals from the Tasks list.
- Expanded the task description column so rows do not leave a large empty action area after removing the checkmark controls.
- Removed the remaining right-side status/action column entirely so task rows no longer render any checkmark-related slot.
- Replaced the leftover single-column `adaptive-row` wrapper with a plain box layout so `app.xml` remains valid.

### Files Updated

- `src/app.xml`
