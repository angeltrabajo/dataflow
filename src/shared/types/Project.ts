import type { Entity } from '../domain/Entity';

// Column types
export type ColumnType =
  | "text" | "number" | "currency" | "percentage" | "date"
  | "select" | "multiselect" | "email" | "phone" | "url"
  | "checkbox" | "rating" | "reference" | "formula" | "autonumber";

export type ColumnDisplayMode =
  | "default" | "textarea" | "slider" | "stepper" | "buttons"
  | "chips" | "toggle" | "color" | "progress" | "badge";

export interface ConditionalFormatRule {
  condition: string;
  bgColor?: string;
  textColor?: string;
  icon?: string;
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  refTableId?: string;
  refDisplayColId?: string;
  refAutoFill?: { sourceColId: string; targetColId: string }[];
  refAutoFillReverse?: { sourceColId: string; targetColId: string }[];
  refOnAdd?: { targetColId: string; operation: "subtract" | "add"; sourceColId: string }[];
  refOnDelete?: { targetColId: string; operation: "subtract" | "add"; sourceColId: string }[];
  refOnEdit?: { targetColId: string; operation: "subtract" | "add"; sourceColId: string }[];
  formula?: string;
  ratingMax?: number;
  showIf?: string;
  requiredIf?: string;
  editableIf?: string;
  validIf?: string;
  resetIf?: string;
  autoCompute?: boolean;
  autoComputeFormula?: string;
  initialValueFormula?: string;
  complementaryOf?: { totalColId: string; otherColId: string };
  dependsOn?: string;
  cascadeOptions?: { parentValue: string; options: string[] }[];
  virtual?: boolean;
  virtualFormula?: string;
  placeholder?: string;
  helpText?: string;
  description?: string;
  prefix?: string;
  suffix?: string;
  displayMode?: ColumnDisplayMode;
  minValue?: number;
  maxValue?: number;
  step?: number;
  regex?: string;
  regexMessage?: string;
  minLength?: number;
  maxLength?: number;
  decimalPlaces?: number;
  unique?: boolean;
  dateMin?: string;
  dateMax?: string;
  noPastDates?: boolean;
  noFutureDates?: boolean;
  confirmInput?: boolean;
  textTransform?: "uppercase" | "lowercase" | "titlecase" | "none";
  conditionalFormat?: ConditionalFormatRule[];
  readOnly?: boolean;
  editableOnce?: boolean;
  showInTable?: boolean;
  showInList?: boolean;
  showInForm?: boolean;
  sectionName?: string;
  columnWidth?: "narrow" | "medium" | "wide";
  autonumberPrefix?: string;
  autonumberDigits?: number;
  dynamicOptionsTableId?: string;
  dynamicOptionsColumnId?: string;
  optionColors?: Record<string, string>;
}

export interface Row {
  id: string;
  _repeatGroupId?: string;
  [key: string]: any;
}

export interface RepeatableSection {
  name: string;
  columnIds: string[];
  minItems?: number;
  maxItems?: number;
}

export interface Table extends Entity {
  name: string;
  emoji: string;
  columns: Column[];
  rows: Row[];
  repeatableSection?: RepeatableSection;
}

export interface Project extends Entity {
  name: string;
  emoji: string;
  description: string;
  color: string;
  tables: Table[];
}
