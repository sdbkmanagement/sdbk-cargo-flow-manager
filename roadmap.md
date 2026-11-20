# Formation matrix
- [x] Replace the matrix columns with the eleven requested formations.
- [x] Persist editable annual plans and isolate completion tracking by year.
- [x] Add direct formation creation; five service tests pass and the preview compiles.
- [ ] Verify saving through a signed-in UI session: blocked by external unmanaged authentication.

# BL destinations and clients
- [x] Check existing destinations, clients and equalization rates: Koba 141.63 and Linsan 242.50 GNF/L exist; Continental Wawa is currently registered only in Conakry.
- [x] Add Continental Wawa in Koba and Station Linsan Carrefour in Linsan without changing existing clients.
- [x] Verify both saved client/destination pairs and rates through a database read; the BL selector already loads database clients and their cities.
- [ ] Verify selection and BL creation in a signed-in UI session: blocked by external unmanaged authentication.

# Work-order dates
- [x] Require manually entered dates for start, completion and validation/closure in both work-order views.
- [x] Four date-rule tests pass; the preview compiles, and PDF history reads the saved completion and closure dates.
- [ ] Verify saving through a signed-in UI session: blocked by external unmanaged authentication.

# Intervention history
- [x] Separate completed and closed interventions into a History tab, preserving validation and PDF actions.
- [x] Three history classification tests pass; the available preview opens the sign-in page without runtime errors.
- [ ] Verify History navigation with saved interventions in a signed-in UI session: blocked by external unmanaged authentication.