'use client';

import { useState } from 'react';

const columnResources = {
  left: [
    {
      title: "🏘️ Riverside County Maps",
      links: [
        { name: "Riverside County - Assessor", url: "https://ca-riverside-acr.publicaccessnow.com/Search.aspx" },
        { name: "Riverside County - GIS Maps", url: "https://gis1.countyofriverside.us/Html5Viewer/?viewer=MMC_Public" },
        { name: "Riverside County - Survey Records", url: "http://weblink.rctlma.org/weblink/Search_tran.aspx" },
        { name: "Beaumont - GIS Maps", url: "https://experience.arcgis.com/experience/70c3c369402f4114910f9fe9e8e38127" },
        { name: "Corona - GIS Maps", url: "https://gis.coronaca.gov/apps/propertyinformation/" },
        { name: "Murrieta - GIS Maps", url: "https://comgeopub.murrietaca.gov/gvh/Index.html?viewer=MurrietaPublic" },
        { name: "Riverside - GIS Maps", url: "https://cityofriverside.maps.arcgis.com/apps/webappviewer/index.html?id=0133857a762c4108a745230732cbaa8c" },
        { name: "Riverside - Survey Records", url: "https://riversideca.gov/pwsurvey/survey.asp" },
        { name: "Temecula - GIS Maps", url: "https://temeculaca.gov/1487/21920/ArcGIS-Redirect" },
        { name: "Wildomar - GIS Maps", url: "https://wildomar.maps.arcgis.com/apps/webappviewer/index.html?id=e9ca066febb24b35bbbafa68a5fe5ae1" },
      ]
    },
    {
      title: "📋 Riverside County - Permit Portals",
      links: [
        { name: "Riverside County - Permits", url: "https://rivcoplus.org/energov_prod/selfservice#/home" },
        { name: "Banning - Permits", url: "https://ci-banning-ca.smartgovcommunity.com/ApplicationPublic/ApplicationHome" },
        { name: "Beaumont - Permits", url: "https://beaumontca-energovpub.tylerhost.net/Apps/SelfService#/home" },
        { name: "Corona - Permits", url: "https://etrakit.coronaca.gov/etrakit/" },
        { name: "Eastvale - Permits", url: "https://aca-prod.accela.com/EASTVALE/Default.aspx" },
        { name: "Hemet - Permits", url: "https://cohchcrwweb.cityofhemet.org/eTRAKiT3/Search/permit.aspx" },
        { name: "Jurupa Valley - Permits", url: "https://aca-prod.accela.com/JURUPA/Default.aspx" },
        { name: "Lake Elsinore - Permits", url: "https://mill.lake-elsinore.org/EnerGov_Prod/SelfService#/home" },
        { name: "Menifee - Permits", url: "https://aca-prod.accela.com/MENIFEE/Account/RegisterConfirm.aspx?UserSeqNum=379368" },
        { name: "Moreno Valley - Permits", url: "https://aca-prod.accela.com/MOVAL/Default.aspx" },
        { name: "Murrieta - Permits", url: "https://www.murrietaca.gov/FormCenter/Development-Services-4/Building-Inspection-Request-46" },
        { name: "Perris - Permits", url: "https://aca-prod.accela.com/PERRIS/Default.aspx" },
        { name: "Riverside - Permits", url: "https://riversideca.gov/cedd/building-safety/online-services/public-permit-portal" },
        { name: "San Jacinto - Permits", url: "https://sanjacintoca-energovpub.tylerhost.net/Apps/SelfService#/permit/apply/122/0/0" },
      ]
    },
  ],
  center: [
    {
      title: "🏔️ San Bernardino County Maps",
      links: [
        { name: "San Bernardino County - Assessor", url: "https://www.mytaxcollector.com/trSearch.aspx" },
        { name: "San Bernardino County - GIS Maps", url: "http://www.sbcounty.gov/assessor/pims/(S(g4fahiu2guymftpcuinimsgr))/recaptcha.aspx" },
        { name: "San Bernardino County - Survey Records", url: "https://experience.arcgis.com/experience/a1a8b62daed444d2ad76caae4327f91a" },
        { name: "Highland - GIS Maps", url: "https://experience.arcgis.com/experience/463da49139744cafa0eaad6c88fcef22" },
        { name: "San Bernardino - GIS Maps", url: "https://sbcity.maps.arcgis.com/apps/webappviewer/index.html?id=49cc0aeafa0045e692e8f096d0e036b0" },
      ]
    },
    {
      title: "📋 San Bernardino County - Permit Portals",
      links: [
        { name: "San Bernardino County - Permits", url: "http://wp.sbcounty.gov/ezop/" },
        { name: "Chino - Permits", url: "https://aca.cityofchino.org/CitizenAccess/Account/RegisterConfirm.aspx?UserSeqNum=5949" },
        { name: "Fontana - Permits", url: "https://aca-prod.accela.com/FONTANA/Default.aspx" },
        { name: "Highland - Permits", url: "https://www.cityofhighland.org/DocumentCenter/View/4366/Inspection-Calendar-2024-PDF" },
        { name: "Loma Linda - Permits", url: "https://cityoflomalindaca-energovweb.tylerhost.net/apps/selfservice#/paymentsuccess?invoiceNumber=5921" },
        { name: "Rancho Cucamonga - Permits", url: "https://aca.accela.com/cityofrc/" },
        { name: "Redlands - Permits", url: "https://www.cityofredlands.org/webform/request-building-inspection" },
        { name: "San Bernardino - Permits", url: "https://www.velocityhall.com/accela/velohall/index.cfm?CITY=SAN%20BERNARDINO&STATE=CALIFORNIA" },
        { name: "Upland - Permits", url: "https://cityofuplandca-energovweb.tylerhost.net/apps/selfservice#/dashboard" },
        { name: "Victorville - Permits", url: "https://cityofvictorvilleca-energovweb.tylerhost.net/apps/selfservice#/home" },
        { name: "Yucaipa - Permits", url: "https://cityofyucaipaca-energovweb.tylerhost.net/apps/selfservice#/dashboard" },
      ]
    },
  ],
  right: [
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
      title: "🛒 Products & Vendors",
      links: [
        { name: "Pool Engineering - Project Submittal", url: "https://submit.pooleng.com/" },
        { name: "Scottsdale Fire & Water - Scuppers", url: "http://www.scottsdalefireandwater.com/product-order-forms/" },
        { name: "Little Tile - Mosaics", url: "http://www.littletileinc.com/artistry_in_mosaics_retail_prices" },
        { name: "American Fire Glass", url: "https://americanfireglass.com/" },
        { name: "American Fire Products", url: "https://americanfireproducts.com/" },
      ]
    },
    {
      title: "🔧 Utilities",
      links: [
        { name: "DigAlert - Underground Service Alert", url: "https://newtinb.digalert.org/direct/index.html" },
        { name: "PDF Grayscale Converter", url: "https://www.fileconverto.com/pdf-grayscale-online/" },
      ]
    },
    {
      title: "🗺️ California Statewide Property Tools",
      links: [
        { name: "ParcelQuest - CA Property Data (Statewide)", url: "https://www.parcelquest.com/" },
      ]
    },
    {
      title: "📋 Other Counties - Permit Portals",
      links: [
        { name: "Orange County - Permits", url: "https://myoceservices.ocgov.com/" },
        { name: "Orange (City) - Permits", url: "https://epermit.cityoforange.org/etrakit3/" },
      ]
    },
  ],
};

export default function ResourcesPage() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(
    new Set([
      ...columnResources.left.map((_, idx) => `left-${idx}`),
      ...columnResources.center.map((_, idx) => `center-${idx}`),
      ...columnResources.right.map((_, idx) => `right-${idx}`),
    ])
  );

  const toggleCard = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const renderColumn = (categories: typeof columnResources.left, columnName: string) => {
    return categories.map((category, idx) => {
      const cardId = `${columnName}-${idx}`;
      const isExpanded = expandedCards.has(cardId);
      return (
        <div key={cardId} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 mb-2">
          <button
            onClick={() => toggleCard(cardId)}
            className="w-full px-3 py-2.5 sm:py-2 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 transition-all duration-200 flex items-center justify-between min-h-[44px] touch-manipulation"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.title} section`}
          >
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-left">{category.title}</h2>
            <svg
              className={`w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
                        className="group flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded border border-gray-200 hover:border-bogner-teal hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all duration-200 min-h-[44px] touch-manipulation"
                        aria-label={`Open ${link.name} in new tab`}
                      >
                        <img
                          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                          alt=""
                          className="w-4 h-4 flex-shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <svg className="w-4 h-4 flex-shrink-0 text-bogner-blue group-hover:text-bogner-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-bogner-blue transition-colors flex-1">
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
    });
  };

  return (
    <main className="overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30 p-2 sm:p-3 mt-2" style={{ minHeight: 'var(--content-height)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold mb-3 bg-gradient-to-r from-bogner-blue to-bogner-teal bg-clip-text text-transparent">
          Quick Links
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="space-y-2">
            {renderColumn(columnResources.left, 'left')}
          </div>
          <div className="space-y-2">
            {renderColumn(columnResources.center, 'center')}
          </div>
          <div className="space-y-2">
            {renderColumn(columnResources.right, 'right')}
          </div>
        </div>
      </div>
    </main>
  );
}
