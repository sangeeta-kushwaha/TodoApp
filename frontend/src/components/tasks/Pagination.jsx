import Button from "../ui/Button";

export default function Pagination({ page, pageCount, start, end, total, onPage }) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted" aria-live="polite">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <p className="min-w-24 text-center text-sm text-muted">
          Page {page} of {pageCount}
        </p>
        <Button
          variant="secondary"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
