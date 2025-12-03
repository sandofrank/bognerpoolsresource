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
    if (!searchTerm) return true;
    if (!text) return false;
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
    return note.replace(/^Note\s*[–\-—]\s*/i, '').trim();
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    try {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  if (error) {
    return (
      <div className="content-full-height flex items-center justify-center gradient-page-bg p-4">
        <div className="text-center max-w-md">
          <div className="error-icon-container">
            <svg className="icon-xl text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Price Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !priceData) {
    return (
      <div className="content-full-height flex items-center justify-center gradient-page-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-bogner-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-700 font-medium">Loading price data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-2 content-full-height">
      {/* Sidebar */}
      <aside className="sidebar" role="navigation" aria-label="Price list sections">
        <div className="sidebar-header">
          <h3 className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
            <span className="w-1 h-3 gradient-primary rounded-full"></span>
            Sections
          </h3>
        </div>
        <nav className="sidebar-nav">
          {priceData.categories.map((category, catIdx) => {
            let currentPhase: string | null = null;

            return (
              <div key={catIdx} className="mb-2">
                <div className="sidebar-category">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                  {category.name}
                </div>
                {category.sections.map((section, secIdx) => {
                  const sectionId = `${catIdx}-${secIdx}`;
                  const isPhase = isPhaseHeader(section.name);

                  if (isPhase) {
                    currentPhase = sectionId;
                    const isExpanded = expandedPhases.has(sectionId);

                    return (
                      <div key={secIdx} className="mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`section-${catIdx}-${secIdx}`)?.scrollIntoView({ behavior: 'smooth' });
                            setActiveSection(sectionId);
                          }}
                          className={`sidebar-phase ${activeSection === sectionId ? 'ring-2 ring-bogner-teal' : ''}`}
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
                              className={`icon-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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

                  const underPhase = currentPhase !== null;
                  const phaseExpanded = currentPhase ? expandedPhases.has(currentPhase) : true;

                  if (underPhase && !phaseExpanded) {
                    return null;
                  }

                  return (
                    <a
                      key={secIdx}
                      href={`#section-${catIdx}-${secIdx}`}
                      className={`${activeSection === sectionId ? 'sidebar-link-active' : 'sidebar-link'} ${underPhase ? 'sidebar-link-nested' : ''}`}
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
      <main className="flex-1 flex flex-col card-glass" style={{ maxHeight: 'calc(var(--content-height) - 0.5rem)' }}>
        {/* Search Bar */}
        <div className="p-2 gradient-page-bg border-b border-gray-200 rounded-t-xl">
          <div className="search-input-container" role="search">
            <label htmlFor="price-search" className="sr-only">Search price list</label>
            <input
              id="price-search"
              type="search"
              placeholder="Search price list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search price list items"
            />
            <svg className="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Price List */}
        <div className="flex-1 overflow-y-auto p-2 gradient-page-bg space-y-1.5">
          {priceData.categories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <div className="category-header">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                  {category.name}
                </div>
              </div>
              {category.sections.map((section, secIdx) => {
                const sectionId = `${catIdx}-${secIdx}`;
                const isPhase = isPhaseHeader(section.name);

                if (isPhase) {
                  return (
                    <div key={secIdx} id={`section-${catIdx}-${secIdx}`} className="phase-header">
                      <div className="phase-header-text">
                        {section.name}
                      </div>
                    </div>
                  );
                }

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
                  <div key={secIdx} id={`section-${catIdx}-${secIdx}`} className="price-section-card">
                    <div className={category.name.toLowerCase().includes('remodel') ? 'price-section-header-orange' : 'price-section-header-blue'}>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        {section.name}
                      </span>
                    </div>
                    <div className="transition-all duration-200">
                      {filteredNotes.length > 0 && (
                        <div className="note-box">
                          <div className="flex items-start gap-1.5">
                            <div className="note-label">
                              <svg className="icon-xs" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span>Note:</span>
                            </div>
                            <div className="note-text">
                              {filteredNotes.map((note, idx) => (
                                <div key={idx} className="font-medium">{highlightText(cleanNote(note))}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {filteredItems.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="price-table">
                            <thead className="price-table-header">
                              <tr>
                                <th className="w-20">
                                  <div className="flex items-center gap-0.5">
                                    <svg className="icon-xs text-bogner-blue hidden sm:block" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                    Cost
                                  </div>
                                </th>
                                <th className="w-14">Unit</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredItems.map((item, idx) => (
                                <tr key={idx} className={`group price-table-row ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                  <td className="price-value">
                                    ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td>
                                    <span className="price-unit">
                                      {item.unit || '-'}
                                    </span>
                                  </td>
                                  <td className="text-slate-700 text-xs leading-snug">{highlightText(item.description)}</td>
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
