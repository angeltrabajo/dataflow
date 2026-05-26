/**
 * Barrel export for API route adapters.
 * Each module provides thin adapter functions that delegate to feature handlers.
 */

export {
  handleListProjects,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
} from './projects';

export {
  handleCreateTable,
  handleUpdateTable,
  handleDeleteTable,
  handleReorderTables,
} from './tables';

export {
  handleCreateColumn,
  handleUpdateColumn,
  handleDeleteColumn,
  handleReorderColumns,
} from './columns';

export {
  handleCreateRow,
  handleUpdateRow,
  handleDeleteRow,
  handleBatchAddRows,
} from './rows';

export {
  handleEvaluateFormula,
} from './formulas';

export {
  handleImportCsv,
  handleExportCsv,
  handleExportZip,
} from './data-portability';
