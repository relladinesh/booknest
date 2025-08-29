import React from "react";
import { Search, X } from "lucide-react";

interface SearchFilterBarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filterBy: string;
  setFilterBy: (value: string) => void;
  filterOptions: { label: string; value: string }[];
  userProfile: { city: string; pincode: string; area: string };
  filterActive: boolean;
  onClearFilter: () => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  setSearchValue,
  filterBy,
  setFilterBy,
  filterOptions,
  userProfile,
  filterActive,
  onClearFilter,
}) => (
  <div
    className="w-full flex flex-col gap-3 mb-8 sm:flex-row sm:gap-6 sm:items-end"
    style={{ fontFamily: "inherit" }}
  >
    {/* Search Label and Input */}
    <div className="flex-1 min-w-0">
      <label
        className="block text-xs font-semibold"
        style={{ color: "#232946", marginBottom: "4px" }}
      >
        Search by Book Title or Subject
      </label>
      <div className="relative">
        <input
          className="w-full rounded-lg pl-10 pr-10 py-2 transition outline-none shadow-sm"
          placeholder="Search book title or subject..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          style={{
            border: "1px solid #B7A1E2",
            color: "#232946",
            background: "#F3F6FF",
            fontSize: 16,
            fontWeight: 500,
            boxShadow: "0 1px 4px #6D28D91A",
          }}
        />
        <Search
          className="absolute left-3 top-2.5 w-5 h-5"
          style={{ color: "#6D28D9", pointerEvents: "none" }}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue("")}
            className="absolute right-2 top-2.5"
            aria-label="Clear search"
            style={{ color: "#B7A1E2" }}
            onMouseOver={e => (e.currentTarget.style.color = "#6D28D9")}
            onMouseOut={e => (e.currentTarget.style.color = "#B7A1E2")}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
    {/* Filter Label and Dropdown */}
    <div className="min-w-[220px] w-full sm:w-[320px]">
      <label
        className="block text-xs font-semibold"
        style={{ color: "#232946", marginBottom: "4px" }}
      >
        Filter by
      </label>
      <div className="relative">
        <select
          className="w-full rounded-lg px-3 py-2 outline-none"
          value={filterBy}
          onChange={e => setFilterBy(e.target.value)}
          style={{
            border: "1px solid #B7A1E2",
            color: "#232946",
            background: "#FFF",
            fontSize: 16,
            fontWeight: 500,
            appearance: "none",
          }}
        >
          <option value="none">None</option>
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {filterActive && (
          <button
            type="button"
            onClick={onClearFilter}
            className="absolute right-2 top-2.5"
            aria-label="Clear filter"
            style={{ color: "#B7A1E2" }}
            onMouseOver={e => (e.currentTarget.style.color = "#6D28D9")}
            onMouseOut={e => (e.currentTarget.style.color = "#B7A1E2")}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default SearchFilterBar;