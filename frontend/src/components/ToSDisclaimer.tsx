import { useState } from 'react';

function ToSDisclaimer() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('tos-disclaimer-dismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tos-disclaimer-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 border-l-4 border-amber-600 p-5 rounded-lg shadow-lg">
      <div className="flex gap-4">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Web Scraping Disclaimer
          </h3>
          <p className="mt-2 text-sm text-amber-50 leading-relaxed">
            This application uses web scraping to fetch public engagement metrics from X (Twitter) and LinkedIn.
            By using this service, you acknowledge that you are responsible for complying with the Terms of Service
            of these platforms. Scraping is limited to publicly accessible data only. Use at your own risk.
          </p>
          <button
            onClick={handleDismiss}
            className="mt-3 text-sm font-semibold text-white hover:text-amber-100 underline transition-colors"
          >
            ✓ I understand, dismiss this message
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToSDisclaimer;
