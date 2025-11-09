'use client';

import { useEffect, useState } from 'react';

interface PriceItem {
  cost: number;
  unit: string;
  description: string;
}

interface Section {
  name: string;
  items: PriceItem[];
  notes?: string[];
}

interface Category {
  name: string;
  sections: Section[];
}

interface PriceData {
  lastUpdated: string;
  categories: Category[];
}

export default function PriceListPage() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/price-data.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load price data');
        return res.json();
      })
      .then(data => {
        setPriceData(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to load price data');
        console.error('Error loading price data:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isPhaseHeader = (sectionName: string) => {
    return sectionName.startsWith('PHASE') || sectionName.startsWith('REMODEL PHASE');
  };

  const matchesSearch = (text: string | undefined) => {
    if (!searchTerm) return true; // Show all when no search term
    if (!text) return false; // Empty text doesn't match
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const cleanNote = (note: string) => {
    // Remove "Note –" or "Note -" prefix
    return note.replace(/^Note\s*[–\-—]\s*/i, '').trim();
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    try {
      // Escape special regex characters to prevent RegExp errors
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          part
        )
      );
    } catch (e) {
      // Fallback if regex fails
      return text;
    }
  };

  if (error) {
    return (
      <div className="min-h-[var(--content-height)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Price Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-bogner-blue to-bogner-teal text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !priceData) {
    return (
      <div className="min-h-[var(--content-height)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-bogner-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-700 font-medium">Loading price data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-2" style={{ minHeight: 'var(--content-height)' }}>
        {/* Sidebar */}
        <aside className="hidden lg:block w-48 xl:w-56 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 sticky top-2 self-start overflow-y-auto" style={{ maxHeight: 'calc(var(--content-height) - 1rem)' }} role="navigation" aria-label="Price list sections">
        <div className="p-2 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-gray-200 rounded-t-xl">
          <h3 className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
            <span className="w-1 h-3 bg-gradient-to-b from-bogner-blue to-bogner-teal rounded-full"></span>
            Sections
          </h3>
        </div>
        <nav className="p-2 space-y-0.5">
          {priceData.categories.map((category, catIdx) => {
            let currentPhase: string | null = null;
            let phaseStartIdx = -1;

            return (
              <div key={catIdx} className="mb-2">
                <div className="px-2 py-1.5 mt-2 first:mt-0 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white text-xs font-bold tracking-tight shadow-md rounded-lg flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                  {category.name}
                </div>
                {category.sections.map((section, secIdx) => {
                  const sectionId = `${catIdx}-${secIdx}`;
                  const isPhase = isPhaseHeader(section.name);

                  if (isPhase) {
                    currentPhase = sectionId;
                    phaseStartIdx = secIdx;
                    const isExpanded = expandedPhases.has(sectionId);

                    return (
                      <div key={secIdx} className="mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`section-${catIdx}-${secIdx}`)?.scrollIntoView({ behavior: 'smooth' });
                            setActiveSection(sectionId);
                          }}
                          className={`w-full px-2 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold tracking-tight rounded flex items-center justify-between transition-colors ${
                            activeSection === sectionId ? 'ring-2 ring-bogner-teal' : ''
                          }`}
                        >
                          <span className="flex items-center gap-1 flex-1 text-left">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                            {section.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePhase(sectionId);
                            }}
                            className="ml-2 p-0.5 hover:bg-white/20 rounded"
                          >
                            <svg
                              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </button>
                      </div>
                    );
                  }

                  // Regular section - check if it's under a phase
                  const underPhase = currentPhase !== null;
                  const phaseExpanded = currentPhase ? expandedPhases.has(currentPhase) : true;

                  if (underPhase && !phaseExpanded) {
                    return null; // Hide sections when phase is collapsed
                  }

                  return (
                    <a
                      key={secIdx}
                      href={`#section-${catIdx}-${secIdx}`}
                      className={`group block px-2 py-1.5 ${underPhase ? 'pl-6' : 'pl-4'} text-xs rounded-lg border-l-2 transition-all duration-200 ${
                        activeSection === sectionId
                          ? 'bg-gradient-to-r from-blue-50 via-sky-50 to-teal-50 text-bogner-blue border-l-bogner-teal font-semibold shadow-sm'
                          : 'text-slate-600 border-l-transparent hover:border-l-bogner-teal/50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-teal-50/50 hover:text-bogner-blue hover:pl-7'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`section-${catIdx}-${secIdx}`)?.scrollIntoView({ behavior: 'smooth' });
                        setActiveSection(sectionId);
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-0.5 h-0.5 rounded-full transition-all ${activeSection === sectionId ? 'bg-bogner-teal' : 'bg-slate-300 group-hover:bg-bogner-teal/60'}`}></span>
                        {section.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200" style={{ maxHeight: 'calc(var(--content-height) - 0.5rem)' }}>
        {/* Search Bar */}
        <div className="p-2 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-gray-200 rounded-t-xl">
          <div className="relative" role="search">
            <label htmlFor="price-search" className="sr-only">Search price list</label>
            <input
              id="price-search"
              type="search"
              placeholder="Search price list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 pl-8 border-2 border-gray-200 rounded-lg text-sm sm:text-xs focus:outline-none focus:border-bogner-teal focus:ring-2 focus:ring-bogner-teal/20 transition-all bg-white shadow-sm"
              aria-label="Search price list items"
            />
            <svg className="absolute left-2 top-2.5 sm:top-2 w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Price List */}
        <div className="flex-1 overflow-y-auto p-2 bg-gradient-to-br from-slate-50 to-blue-50/30 space-y-1.5">
          {priceData.categories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <div className="sticky top-0 z-20 px-2 py-1.5 mb-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white text-xs sm:text-sm font-bold tracking-tight rounded-lg shadow-lg border-l-3 border-white/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                  {category.name}
                </div>
              </div>
              {category.sections.map((section, secIdx) => {
                const sectionId = `${catIdx}-${secIdx}`;
                const isPhase = isPhaseHeader(section.name);

                // Phase headers - display with special styling
                if (isPhase) {
                  return (
                    <div key={secIdx} id={`section-${catIdx}-${secIdx}`} className="relative z-10 bg-slate-600 rounded-lg shadow-md overflow-hidden scroll-mt-[45px] mb-1">
                      <div className="px-3 py-2 text-white text-sm font-bold text-center tracking-tight">
                        {section.name}
                      </div>
                    </div>
                  );
                }

                // Filter items and notes
                const filteredItems = section.items?.filter(item =>
                  matchesSearch(item.description) ||
                  matchesSearch(item.cost?.toString()) ||
                  matchesSearch(item.unit)
                ) || [];

                const filteredNotes = section.notes?.filter(note => matchesSearch(note)) || [];

                if (searchTerm && filteredItems.length === 0 && filteredNotes.length === 0) {
                  return null;
                }

                return (
                  <div key={secIdx} id={`section-${catIdx}-${secIdx}`} className="relative z-0 group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden scroll-mt-20">
                    <div
                      className={`px-2 py-1 ${category.name.toLowerCase().includes('remodel') ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500' : 'bg-gradient-to-r from-bogner-blue via-blue-600 to-bogner-teal'} text-white text-xs font-semibold transition-all duration-200`}
                    >
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        {section.name}
                      </span>
                    </div>
                    <div className="transition-all duration-200">
                        {filteredNotes.length > 0 && (
                          <div className="mx-1.5 my-1 p-1.5 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-l-2 border-bogner-teal rounded shadow-sm">
                            <div className="flex items-start gap-1.5">
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <svg className="w-3 h-3 text-bogner-teal" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-bold text-bogner-teal">Note:</span>
                              </div>
                              <div className="space-y-0.5 text-amber-900 text-xs leading-snug flex-1">
                                {filteredNotes.map((note, idx) => (
                                  <div key={idx} className="font-medium">{highlightText(cleanNote(note))}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {filteredItems.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50 sticky top-0">
                                <tr>
                                  <th className="px-1.5 py-1 text-left text-xs font-bold text-slate-700 border-b border-bogner-blue/20 w-20 tracking-tight">
                                    <div className="flex items-center gap-0.5">
                                      <svg className="w-2.5 h-2.5 text-bogner-blue hidden sm:block" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                      </svg>
                                      Cost
                                    </div>
                                  </th>
                                  <th className="px-1.5 py-1 text-left text-xs font-bold text-slate-700 border-b border-bogner-blue/20 w-14 tracking-tight">Unit</th>
                                  <th className="px-1.5 py-1 text-left text-xs font-bold text-slate-700 border-b border-bogner-blue/20 tracking-tight">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {filteredItems.map((item, idx) => (
                                  <tr key={idx} className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:via-sky-50 hover:to-teal-50 transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                    <td className="px-1.5 py-1 font-bold text-bogner-blue text-xs whitespace-nowrap">
                                      ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-1.5 py-1 text-slate-600 text-xs font-semibold">
                                      <span className="px-1.5 py-0.5 bg-slate-100 group-hover:bg-bogner-teal/10 rounded border border-slate-200 group-hover:border-bogner-teal/30 transition-colors whitespace-nowrap">
                                        {item.unit || '-'}
                                      </span>
                                    </td>
                                    <td className="px-1.5 py-1 text-slate-700 text-xs leading-snug">{highlightText(item.description)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
