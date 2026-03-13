interface DataSourceBadgeProps {
  source: 'scraped' | 'manual' | 'yc_api';
}

function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const styles = {
    scraped: 'bg-blue-100 text-blue-800',
    manual: 'bg-purple-100 text-purple-800',
    yc_api: 'bg-green-100 text-green-800',
  };

  const labels = {
    scraped: 'Scraped',
    manual: 'Manual',
    yc_api: 'YC API',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[source]}`}>
      {labels[source]}
    </span>
  );
}

export default DataSourceBadge;
