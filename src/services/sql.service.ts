import { getDb } from '../db/connection.js';

export interface SqlExecutionResult {
  success: boolean;
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  validation?: {
    isCorrect: boolean;
    message: string;
  };
}

export async function executeSqlQuery(query: string, lessonId?: string): Promise<SqlExecutionResult> {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Please enter a valid SQL query.');
  }

  const cleanQuery = query.trim();
  const db = await getDb();
  const startTime = performance.now();

  let result;
  try {
    result = db.exec(cleanQuery);
  } catch (dbErr: any) {
    const endTime = performance.now();
    return {
      success: false,
      error: dbErr.message || 'SQL Execution error',
      columns: [],
      values: [],
      rowCount: 0,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  let columns: string[] = [];
  let values: any[][] = [];

  if (result && result.length > 0) {
    columns = result[0].columns;
    values = result[0].values;
  }

  let validation = {
    isCorrect: true,
    message: 'Query executed successfully.',
  };

  if (lessonId) {
    const lessonResult = db.exec(`SELECT expected_query FROM lessons WHERE id = '${lessonId.replace(/'/g, "''")}'`);
    if (lessonResult.length > 0 && lessonResult[0].values.length > 0) {
      const expectedSql = lessonResult[0].values[0][0] as string;
      if (expectedSql) {
        try {
          const expectedExec = db.exec(expectedSql);
          if (expectedExec.length > 0) {
            const expectedCols: string[] = expectedExec[0].columns;
            const expectedRows = expectedExec[0].values;

            const colsMatch = JSON.stringify(columns.map((c: string) => c.toLowerCase())) === JSON.stringify(expectedCols.map((c: string) => c.toLowerCase()));
            const rowsMatch = JSON.stringify(values) === JSON.stringify(expectedRows);

            if (colsMatch && rowsMatch) {
              validation = {
                isCorrect: true,
                message: 'Great job! You successfully retrieved the expected data.',
              };
            } else {
              validation = {
                isCorrect: false,
                message: 'Query returned results, but they do not match the expected lesson output.',
              };
            }
          }
        } catch {
          // fallback
        }
      }
    }
  }

  return {
    success: true,
    columns,
    values,
    rowCount: values.length,
    executionTimeMs,
    validation,
  };
}

export async function getSandboxSchema() {
  const db = await getDb();
  const tables = ['sandbox_users', 'sandbox_orders', 'sandbox_departments', 'sandbox_products'];

  return tables.map(table => {
    const colInfo = db.exec(`PRAGMA table_info(${table})`);
    const cols = colInfo.length > 0 ? colInfo[0].values.map((c: any) => ({
      cid: c[0],
      name: c[1],
      type: c[2],
      notNull: !!c[3],
      isPk: !!c[5],
    })) : [];

    return {
      tableName: table,
      columns: cols,
    };
  });
}
