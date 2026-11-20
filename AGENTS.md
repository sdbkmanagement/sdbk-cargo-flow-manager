# Project conventions

- Individual payroll PDFs use stored bulletin amounts rather than current payroll settings so historical payslips remain faithful to the saved month.
- Training matrix columns are persisted per year and personnel category; completion records include the year, and removing a column only archives its plan entry so historical tracking survives annual plan changes.
- Archived evaluation sheets store the initial score in `note_initiale` and the final score in the existing `note_obtenue` field to preserve historical scores and compatibility.
- Both work-order views use the shared date dialog and payload helper for lifecycle transitions so manually entered dates are required consistently and preserved in PDF history.
- The interventions screen partitions work orders into active and history tabs with one shared history predicate; completion or closure moves an order to history without changing stored records or validation actions.