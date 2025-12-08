import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Bogner Pools Resource Site',
};

export default function PrivacyPolicy() {
  return (
    <div className="page-content">
      <div className="max-w-4xl mx-auto">
        <div className="card-solid p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">1. About This Site</h2>
              <p className="text-gray-600 leading-relaxed">
                This is an internal resource site for Bogner Pools staff and authorized users.
                It provides price lists, calculators, and other tools to assist with daily operations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">2.1 Authentication</h3>
              <p className="text-gray-600 leading-relaxed">
                This site uses Google OAuth for authentication. When you sign in, we receive your
                Google account email address to verify access. We do not store your Google password.
              </p>

              <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">2.2 Local Storage</h3>
              <p className="text-gray-600 leading-relaxed">
                This site uses your browser&apos;s local storage to save:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-600">
                <li>API keys for AI-powered tools (stored locally, never sent to our servers)</li>
                <li>Cookie consent preferences</li>
                <li>User preferences and settings</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-2">
                This data is stored only on your device and is never transmitted to our servers or any third parties
                (except API keys which are sent directly to their respective services when you use those features).
              </p>

              <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">2.3 No Tracking or Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                We do not use Google Analytics, Facebook Pixel, or any other tracking technologies on this site.
                We do not collect information about your browsing behavior.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                This site uses minimal, essential cookies required for authentication and the site to function properly.
                These are first-party cookies and do not track you across other websites.
                You can disable cookies in your browser settings, but some features may not work correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed">
                This site integrates with the following third-party services:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-600">
                <li><strong>Google OAuth:</strong> For secure user authentication</li>
                <li><strong>AI Services (OpenAI/Anthropic):</strong> For receipt processing and analysis tools (when you provide your own API key)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-2">
                When using AI-powered features, the content you submit is sent directly to those services for processing.
                Please review their respective privacy policies for information on how they handle data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement reasonable security measures to protect any data processed through this site.
                Access to this site is restricted to authorized users via Google OAuth authentication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                You can clear all locally stored data at any time by:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-600">
                <li>Clearing your browser&apos;s local storage</li>
                <li>Using your browser&apos;s &quot;Clear browsing data&quot; feature</li>
                <li>Deleting cookies for this site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about this privacy policy or our data practices, please contact Bogner Pools.
              </p>
            </section>

            <section className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-500 text-sm">
                This privacy policy applies only to this resource site. For the main Bogner Pools
                website privacy policy, please visit{' '}
                <a href="https://www.bognerpools.com/privacy-policy" className="link" target="_blank" rel="noopener noreferrer">
                  bognerpools.com/privacy-policy
                </a>.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/" className="btn btn-primary btn-md">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
