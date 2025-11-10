import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import React, { useEffect, useRef } from 'react';
import type { Card, WordType } from '../flashcard-types';

interface CardTableProps {
  cards: Card[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRemove: (id: string) => void;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
}

export function CardTable({
  cards,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRemove,
  pagination,
  onPaginationChange,
}: CardTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate =
      selectedIds.size > 0 && selectedIds.size < cards.length;
  }, [selectedIds, cards.length]);

  const columns: ColumnDef<Card>[] = [
    {
      id: 'inSession',
      header: () => (
        <input
          ref={headerCheckboxRef}
          type="checkbox"
          checked={selectedIds.size > 0 && selectedIds.size === cards.length}
          onChange={onToggleSelectAll}
        />
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.id;
        const checked = selectedIds.has(id);
        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleSelect(id)}
          />
        );
      },
    },

    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const t = row.original.type ?? 'other';
        const colors: Record<WordType, string> = {
          noun: '#6b5b95',
          'verb-regular': '#45b7d1',
          'verb-irregular': '#e94e77',
          adjective: '#88b04b',
          adverb: '#f7cac9',
          expression: '#f7786b',
          phrase: '#92a8d1',
          other: '#999',
        };
        return (
          <span
            style={{
              background: colors[t],
              color: 'white',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              textTransform: 'capitalize',
            }}
          >
            {t.replace('-', ' ')}
          </span>
        );
      },
    },

    { id: 'front', header: 'English', accessorKey: 'front' },
    { id: 'back', header: 'Portuguese (EU)', accessorKey: 'back' },
    {
      id: 'createdAt',
      header: 'Added',
      accessorFn: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
    {
      id: 'delete',
      header: '',
      cell: (info) => (
        <button
          type="button"
          className="btn link"
          onClick={() => onRemove(info.row.original.id)}
        >
          🗑
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: cards,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div style={{ maxHeight: '560px', overflowY: 'auto' }}>
        <table className="table modern" style={{ width: '100%' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      cursor: header.column.getCanSort()
                        ? 'pointer'
                        : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      paddingRight: '1.2rem',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            opacity: header.column.getIsSorted()
                              ? 0.9
                              : 0.3,
                            transform:
                              header.column.getIsSorted() === 'asc'
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                            transition:
                              'transform 0.15s ease, opacity 0.15s ease',
                            display: 'inline-block',
                          }}
                        >
                          ▲
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          gap: 8,
        }}
      >
        <button
          className="btn"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ◀ Prev
        </button>

        <span className="pill">
          Page {table.getState().pagination.pageIndex + 1} /{' '}
          {table.getPageCount()}
        </span>

        <button
          className="btn"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next ▶
        </button>

        <label className="muted">Rows:</label>
        <select
          className="input"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{ width: 80 }}
        >
          {[5, 10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
