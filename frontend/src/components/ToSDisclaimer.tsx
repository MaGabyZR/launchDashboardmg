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
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Web Scraping Disclaimer
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            This application uses web scraping to fetch public engagement metrics from X (Twitter) and LinkedIn.
            By using this service, you acknowledge that you are responsible for complying with the Terms of Service
            of these platforms. Scraping is limited to publicly accessible data only. Use at your own risk.
          </p>
          <button
            onClick={handleDismiss}
            className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
          >
            I understand, dismiss this message
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToSDisclaimer;
