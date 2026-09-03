// Physical station order and public numeric station labels.
export const SEAT_LAYOUT = {
  leftWall: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13'],
  centerLeft: ['C12', 'C11', 'C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1'],
  centerRight: ['C13', 'C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24'],
  tWing: ['T4', 'T3', 'T2'],
  baseline: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
  rightWall: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16']
};

export const PHYSICAL_SEAT_ORDER = [
  ...SEAT_LAYOUT.centerRight,
  ...SEAT_LAYOUT.tWing,
  ...SEAT_LAYOUT.centerLeft,
  ...SEAT_LAYOUT.leftWall,
  ...SEAT_LAYOUT.baseline,
  ...SEAT_LAYOUT.rightWall.slice().reverse()
];

export const SEAT_NUMBER_BY_PHYSICAL_ID = Object.fromEntries(
  PHYSICAL_SEAT_ORDER.map((physicalId, index) => [physicalId, index + 1])
);

export const PHYSICAL_ID_BY_SEAT_NUMBER = Object.fromEntries(
  PHYSICAL_SEAT_ORDER.map((physicalId, index) => [String(index + 1), physicalId])
);

export const getNumericSeatNumber = (physicalId) => SEAT_NUMBER_BY_PHYSICAL_ID[physicalId] || physicalId;
