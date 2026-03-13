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
    <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl shadow-xl p-6 space-y-4 border border-slate-500">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔍</span>
        <h2 className="text-lg font-semibold text-white">Filter & Sort</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
            📊 Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="w-full px-3 py-2 text-sm bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all hover:bg-slate-500"
          >
            <option value="createdAt">Date Added</option>
            <option value="engagement">Engagement</option>
            <option value="fundraise">Fundraise Amount</option>
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
            ↕️ Order
          </label>
          <button
            onClick={handleOrderChange}
            className="w-full px-3 py-2 text-sm bg-slate-600 border border-slate-500 rounded-lg text-white hover:bg-slate-500 transition-all font-medium"
          >
            {filters.order === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Min Engagement */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
            🔥 Min Engagement
          </label>
          <input
            type="number"
            value={filters.minEngagement}
            onChange={handleMinEngagementChange}
            min="0"
            className="w-full px-3 py-2 text-sm bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-400"
          />
        </div>

        {/* Has Contact */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
            📞 Contact Info
          </label>
          <select
            value={filters.hasContact === null ? 'all' : filters.hasContact ? 'true' : 'false'}
            onChange={handleHasContactChange}
            className="w-full px-3 py-2 text-sm bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all hover:bg-slate-500"
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
