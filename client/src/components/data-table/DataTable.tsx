import { ReactNode } from 'react';
import './DataTable.css';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render: (row: T, index: number) => ReactNode;
  numeric?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T>({ columns, data, emptyMessage = 'No records found', rowKey }: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
        <p className="muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={col.numeric ? 'num' : ''}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowKey ? rowKey(row, rowIdx) : rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={col.numeric ? 'num' : ''}>
                  {col.render(row, rowIdx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
