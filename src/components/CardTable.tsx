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
      {/* Desktop Table View */}
      <div
        className="desktop-table"
        style={{
          maxHeight: '560px',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 12,
        }}
      >
        <table
          className="table modern"
          style={{ width: '100%', minWidth: 720 }}
        >
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
                            opacity: header.column.getIsSorted() ? 0.9 : 0.3,
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-cards">
        {table.getRowModel().rows.map((row) => {
          const card = row.original;
          const isChecked = selectedIds.has(card.id);
          return (
            <div
              key={row.id}
              className="card"
              style={{
                padding: '0.75rem',
                marginBottom: '0.75rem',
                background: isChecked ? '#f0f9ff' : '#fff',
                border: isChecked
                  ? '2px solid #3b82f6'
                  : '1px solid var(--br)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSelect(card.id)}
                  style={{ marginTop: '0.2rem', flexShrink: 0 }}
                />
                {columns[1].cell &&
                  flexRender(columns[1].cell, row.getAllCells()[1].getContext())}
                <button
                  type="button"
                  className="btn link"
                  onClick={() => onRemove(card.id)}
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  🗑
                </button>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {card.front}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {card.back}
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                }}
              >
                {card.createdAt
                  ? new Date(card.createdAt).toLocaleString()
                  : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ◀ Prev
          </button>
          <button
            className="btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next ▶
          </button>
        </div>

        <span className="pill">
          Page {table.getState().pagination.pageIndex + 1} /{' '}
          {table.getPageCount()}
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
      </div>

      <style>{`
        .mobile-cards {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-table {
            display: none;
          }
          .mobile-cards {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
