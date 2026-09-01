export type QueryRow = Record<string, unknown>;

export type QueryResult = {
  id: string;
  title?: string;
  description?: string;
  sql?: string;
  statementId?: string;
  columns: string[];
  rows: QueryRow[];
  rowCount?: number;
  isTruncated?: boolean;
};

export type PlacementCellGenieResponse = {
  answer: string;
  conversationId?: string;
  queryResults: QueryResult[];
  suggestedQuestions: string[];
  status: "completed";
};

export type PlacementCellNavItem = {
  label: string;
  question: string;
};
