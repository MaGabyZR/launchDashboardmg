interface DataSourceBadgeProps {
  source: 'scraped' | 'manual' | 'yc_api';
}

function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const styles = {
    scraped: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
    manual: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg',
    yc_api: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg',
  };

  const icons = {
    scraped: '🌐',
    manual: '✍️',
    yc_api: '🚀',
  };

  const labels = {
    scraped: 'Scraped',
    manual: 'Manual',
    yc_api: 'YC API',
  };

  return (
    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${styles[source]} flex items-center gap-1 w-fit`}>
      <span>{icons[source]}</span>
      {labels[source]}
    </span>
  );
}

export default DataSourceBadge;
