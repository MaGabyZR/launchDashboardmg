interface DashboardFilters {
  sortBy: 'createdAt' | 'engagement' | 'fundraise';
  order: 'asc' | 'desc';
  minEngagement: number;
  hasContact: boolean | null;
}

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      sortBy: e.target.value as 'createdAt' | 'engagement' | 'fundraise',
    });
  };

  const handleOrderChange = () => {
    onFiltersChange({
      ...filters,
      order: filters.order === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleMinEngagementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      minEngagement: parseInt(e.target.value) || 0,
    });
  };

  const handleHasContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      hasContact: value === 'all' ? null : value === 'true',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Date Added</option>
            <option value="engagement">Engagement</option>
            <option value="fundraise">Fundraise Amount</option>
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Order
          </label>
          <button
            onClick={handleOrderChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors text-left"
          >
            {filters.order === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Min Engagement */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Engagement
          </label>
          <input
            type="number"
            value={filters.minEngagement}
            onChange={handleMinEngagementChange}
            min="0"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Has Contact */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Contact Info
          </label>
          <select
            value={filters.hasContact === null ? 'all' : filters.hasContact ? 'true' : 'false'}
            onChange={handleHasContactChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="true">Has Contact</option>
            <option value="false">No Contact</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
