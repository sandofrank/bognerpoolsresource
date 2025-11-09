'use client';

import { useState } from 'react';

const resources = [
  {
    title: "📧 Daily Business Tools",
    links: [
      { name: "Gmail Inbox", url: "https://mail.google.com/mail/u/0/#inbox" },
      { name: "Smartsheet - Lead Management", url: "https://app.smartsheet.com/b/home" },
      { name: "SignNow - Contract Management", url: "https://app.signnow.com/rctapp/login" },
      { name: "Bogner Server - File Access", url: "https://bogserv.us5.quickconnect.to/?launchApp=SYNO.SDS.Drive.Application" },
      { name: "Bogner Pools Website", url: "https://www.bognerpools.com/" },
    ]
  },
  {
    title: "🗺️ California Statewide Property Tools",
    links: [
      { name: "ParcelQuest - CA Property Data (Statewide)", url: "https://www.parcelquest.com/" },
    ]
  },
  {
    title: "🏞️ Riverside County",
    links: [
      { name: "Riverside County Assessor Records", url: "https://ca-riverside-acr.publicaccessnow.com/Search.aspx" },
      { name: "Riverside County GIS Maps", url: "https://gis1.countyofriverside.us/Html5Viewer/?viewer=MMC_Public" },
      { name: "Riverside County Survey Records", url: "http://weblink.rctlma.org/weblink/Search_tran.aspx" },
    ]
  },
  {
    title: "🏘️ Riverside County Cities",
    links: [
      { name: "Beaumont - City GIS Maps", url: "https://experience.arcgis.com/experience/70c3c369402f4114910f9fe9e8e38127" },
      { name: "Corona - Property Information", url: "https://gis.coronaca.gov/apps/propertyinformation/" },
      { name: "Murrieta - City GIS Portal", url: "https://comgeopub.murrietaca.gov/gvh/Index.html?viewer=MurrietaPublic" },
      { name: "Riverside - City GIS Maps", url: "https://cityofriverside.maps.arcgis.com/apps/webappviewer/index.html?id=0133857a762c4108a745230732cbaa8c" },
      { name: "Riverside - Tract Maps & Surveys", url: "https://riversideca.gov/pwsurvey/survey.asp" },
      { name: "Temecula - City GIS Portal", url: "https://temeculaca.gov/1487/21920/ArcGIS-Redirect" },
      { name: "Wildomar - City GIS Maps", url: "https://wildomar.maps.arcgis.com/apps/webappviewer/index.html?id=e9ca066febb24b35bbbafa68a5fe5ae1" },
    ]
  },
  {
    title: "⛰️ San Bernardino County",
    links: [
      { name: "San Bernardino County Assessor", url: "https://www.mytaxcollector.com/trSearch.aspx" },
      { name: "San Bernardino County GIS", url: "http://www.sbcounty.gov/assessor/pims/(S(g4fahiu2guymftpcuinimsgr))/recaptcha.aspx" },
      { name: "San Bernardino County Survey Records", url: "https://experience.arcgis.com/experience/a1a8b62daed444d2ad76caae4327f91a" },
    ]
  },
  {
    title: "🏔️ San Bernardino County Cities",
    links: [
      { name: "Highland - City GIS Maps", url: "https://experience.arcgis.com/experience/463da49139744cafa0eaad6c88fcef22" },
      { name: "San Bernardino - City GIS Maps", url: "https://sbcity.maps.arcgis.com/apps/webappviewer/index.html?id=49cc0aeafa0045e692e8f096d0e036b0" },
    ]
  },
];

export default function ResourcesPage() {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(
    new Set(resources.map((_, idx) => idx))
  );

  const toggleCard = (idx: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <main className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30 p-2 sm:p-3" style={{ height: 'calc(100vh - 108px)', marginTop: '8px' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold mb-2 bg-gradient-to-r from-bogner-blue to-bogner-teal bg-clip-text text-transparent">
          Quick Links
        </h1>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-2 space-y-2">
          {resources.map((category, idx) => {
            const isExpanded = expandedCards.has(idx);
            return (
              <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 break-inside-avoid mb-2">
                <button
                  onClick={() => toggleCard(idx)}
                  className="w-full px-2 py-1.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 transition-all duration-200 flex items-center justify-between"
                >
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight">{category.title}</h2>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-1.5">
                    <ul className="space-y-0.5">
                      {category.links.map((link, linkIdx) => {
                        const domain = new URL(link.url).hostname;
                        return (
                          <li key={linkIdx}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-1.5 px-2 py-1.5 rounded border border-gray-200 hover:border-bogner-teal hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all duration-200"
                            >
                              <img
                                src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                                alt=""
                                className="w-4 h-4 flex-shrink-0"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src.includes('duckduckgo')) {
                                    target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                                  } else {
                                    target.style.display = 'none';
                                    const svg = target.nextElementSibling;
                                    if (svg instanceof SVGElement) {
                                      svg.classList.remove('hidden');
                                    }
                                  }
                                }}
                              />
                              <svg className="w-4 h-4 flex-shrink-0 text-bogner-blue group-hover:text-bogner-teal transition-colors hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-bogner-blue transition-colors">
                                {link.name}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
