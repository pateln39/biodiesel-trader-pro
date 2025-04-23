
// Constants for labels
export const LABELS = {
  COUNTERPARTY: "Counterparty",
  TRADE_REF: "Trade Ref",
  BARGE: "Barge",
  MOVE_DATE: "Move Date",
  NOM_VALID: "Nom. Valid",
  CUSTOMS: "Customs",
  SUSTAIN: "Sustain.",
  COMMENTS: "Comments",
  QTY_MT: "Qty (MT)",
  TOTAL_MT: "Total (MT)",
  TOTAL_M3: "Total (M³)",
  T1: "T1",
  T2: "T2",
  CURRENT_STOCK: "Current Stock",
  CURRENT_ULLAGE: "Current Ullage",
  DIFFERENCE: "Total (MT) - Qty (MT)",
  TANK: "Tank",
  CAPACITY: "Capacity:",
  SPEC: "Spec:",
  HEATING: "Heating:",
  SUMMARY: "Summary",
  BALANCES: "Balances",
  TOTAL_CAPACITY: "Total Capacity:",
};

// Constants for styling
export const STYLING = {
  HEADER_FONT_SIZE: "text-[10px]",
  CAPACITY_WIDTH: 100,
  HEATING_WIDTH: 100,
};

// Column widths for sticky columns
export const STICKY_COLUMN_WIDTHS = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
  movementDate: 75,
  nominationDate: 75,
  customs: 75,
  sustainability: 90,
  comments: 100,
  quantity: 70,
};

// Column widths for summary columns
export const SUMMARY_COLUMN_WIDTHS = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
  difference: 100,
};

// Header labels for table columns
export const TABLE_HEADER_LABELS = {
  counterparty: LABELS.COUNTERPARTY,
  tradeRef: LABELS.TRADE_REF,
  bargeName: LABELS.BARGE,
  movementDate: LABELS.MOVE_DATE,
  nominationDate: LABELS.NOM_VALID,
  customs: LABELS.CUSTOMS,
  sustainability: LABELS.SUSTAIN,
  comments: LABELS.COMMENTS,
  quantity: LABELS.QTY_MT,
  totalMT: LABELS.TOTAL_MT,
  totalM3: LABELS.TOTAL_M3,
  t1Balance: LABELS.T1,
  t2Balance: LABELS.T2,
  currentStock: LABELS.CURRENT_STOCK,
  currentUllage: LABELS.CURRENT_ULLAGE,
  difference: LABELS.DIFFERENCE,
};

export default {
  LABELS,
  STYLING,
  STICKY_COLUMN_WIDTHS,
  SUMMARY_COLUMN_WIDTHS,
  TABLE_HEADER_LABELS,
};
