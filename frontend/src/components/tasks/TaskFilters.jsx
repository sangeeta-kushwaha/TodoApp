import { PRIORITY_FILTERS, SORT_OPTIONS, STATUS_FILTERS } from "../../constants/tasks";
import { SelectField, TextField } from "../ui/Fields";

export default function TaskFilters({
  search,
  status,
  priority,
  sort,
  onSearch,
  onStatus,
  onPriority,
  onSort,
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-4">
      <TextField
        id="task-search"
        label="Search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search title or description"
      />
      <SelectField
        id="status-filter"
        label="Status"
        value={status}
        onChange={(event) => onStatus(event.target.value)}
      >
        {STATUS_FILTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="priority-filter"
        label="Priority"
        value={priority}
        onChange={(event) => onPriority(event.target.value)}
      >
        {PRIORITY_FILTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="task-sort"
        label="Sort"
        value={sort}
        onChange={(event) => onSort(event.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
