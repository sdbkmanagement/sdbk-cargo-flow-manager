// Exclusion limitée à la matrice : la fiche RH et son historique restent intacts.
export const isEmployeeVisibleInMatrix = (employee) =>
  employee.id !== '8bc75965-38fd-48bc-a0b8-5c08749afcbb';