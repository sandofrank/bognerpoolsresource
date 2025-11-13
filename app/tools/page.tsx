'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ToolsPage() {
  const [jobName, setJobName] = useState('');
  const [surfaceArea, setSurfaceArea] = useState('');
  const [shallowDepth, setShallowDepth] = useState('');
  const [shallowDepth2, setShallowDepth2] = useState('');
  const [deepDepth, setDeepDepth] = useState('');
  const [deepInMiddle, setDeepInMiddle] = useState(false);
  const [landingArea, setLandingArea] = useState('');
  const [landingDepth, setLandingDepth] = useState('');
  const [seatsStepsLength, setSeatsStepsLength] = useState('');
  const [desiredSaltPPM, setDesiredSaltPPM] = useState('3200');
  const [desiredCYA, setDesiredCYA] = useState('70');
  const [volume, setVolume] = useState<number | null>(null);
  const [saltNeeded, setSaltNeeded] = useState<number | null>(null);
  const [acidNeeded, setAcidNeeded] = useState<number | null>(null);
  const [chlorineNeeded, setChlorineNeeded] = useState<number | null>(null);
  const [cyaNeeded, setCyaNeeded] = useState<number | null>(null);

  const handleDownloadPDF = () => {
    window.print();
  };

  const calculateVolume = () => {
    if (!surfaceArea || !shallowDepth || !deepDepth) return;

    // Calculate main pool area (excluding landing if provided)
    const mainPoolArea = landingArea && parseFloat(landingArea) > 0
      ? parseFloat(surfaceArea) - parseFloat(landingArea)
      : parseFloat(surfaceArea);

    // Calculate average depth for main pool based on whether deep end is in middle or at one end
    let avgDepth;
    if (deepInMiddle) {
      // Pool slopes from both ends to middle
      if (shallowDepth2 && parseFloat(shallowDepth2) > 0) {
        // Two different shallow ends: (shallow1 + shallow2 + deep) / 3
        avgDepth = (parseFloat(shallowDepth) + parseFloat(shallowDepth2) + parseFloat(deepDepth)) / 3;
      } else {
        // Same depth both ends: (2 × shallow + deep) / 3
        avgDepth = (2 * parseFloat(shallowDepth) + parseFloat(deepDepth)) / 3;
      }
    } else {
      // Pool slopes from one end to other: (shallow + deep) / 2
      avgDepth = (parseFloat(shallowDepth) + parseFloat(deepDepth)) / 2;
    }

    // Calculate main pool volume
    let volumeCubicFeet = mainPoolArea * avgDepth;

    // Add landing area volume if provided
    if (landingArea && landingDepth && parseFloat(landingArea) > 0 && parseFloat(landingDepth) > 0) {
      const landingVolume = parseFloat(landingArea) * parseFloat(landingDepth);
      volumeCubicFeet += landingVolume;
    }

    // Add seats/steps volume if provided
    // Assumes: 20" (1.67 ft) water depth, 16" (1.33 ft) wide
    if (seatsStepsLength && parseFloat(seatsStepsLength) > 0) {
      const seatsStepsVolume = parseFloat(seatsStepsLength) * 1.33 * 1.67;
      volumeCubicFeet += seatsStepsVolume;
    }

    // Convert cubic feet to gallons (1 cubic foot = 7.48052 gallons)
    const volumeGallons = volumeCubicFeet * 7.48052;
    setVolume(Math.round(volumeGallons));

    // Calculate salt needed for startup
    // Formula: (Volume / 10,000) × (Desired PPM / 1000) × 83 lbs
    if (desiredSaltPPM && parseFloat(desiredSaltPPM) > 0) {
      const saltLbs = (volumeGallons / 10000) * (parseFloat(desiredSaltPPM) / 1000) * 83;
      setSaltNeeded(Math.round(saltLbs));
    } else {
      setSaltNeeded(null);
    }

    // Calculate liquid chlorine needed to reach 2.0 PPM
    // Formula: (Volume / 10,000) × 2.0 PPM × 13 oz (for 12.5% liquid chlorine)
    const chlorineOz = (volumeGallons / 10000) * 2.0 * 13;
    setChlorineNeeded(Math.round(chlorineOz));

    // Calculate acid needed for fresh plaster startup
    // pH decrease: 7.8 - 7.4 = 0.4 base
    // Liquid chlorine to reach 2 PPM raises pH by ~0.2 units
    // So we need to drop pH by 0.4 + 0.2 = 0.6 total
    // Formula: (Volume / 10,000) × pH_decrease × 25.6 oz (muriatic acid per 0.4 pH)
    // Always multiply by 1.5 for fresh plaster (plaster leaches calcium hydroxide)
    const pHDecrease = 0.6; // 0.4 base + 0.2 to compensate for liquid chlorine pH rise
    const ozPerUnit = 25.6; // ounces per 10,000 gallons per 0.4 pH decrease
    let acidOz = (volumeGallons / 10000) * (pHDecrease / 0.4) * ozPerUnit;

    // Always apply 1.5x multiplier for fresh plaster
    acidOz *= 1.5;

    setAcidNeeded(Math.round(acidOz));

    // Calculate cyanuric acid (stabilizer) needed
    // Formula: To raise CYA by 10 PPM per 10,000 gallons = 13 oz
    // For saltwater pools, target 70-80 PPM (starting from 0)
    if (desiredCYA && parseFloat(desiredCYA) > 0) {
      const cyaOz = (volumeGallons / 10000) * (parseFloat(desiredCYA) / 10) * 13;
      setCyaNeeded(Math.round(cyaOz));
    } else {
      setCyaNeeded(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Prevent iOS Safari zoom on input focus */
        input[type="text"],
        input[type="number"] {
          font-size: 16px;
        }

        @media print {
          @page {
            margin: 0.3in;
            size: letter portrait;
          }

          /* Hide navigation and other UI elements */
          nav,
          header,
          footer,
          .nav,
          .navigation,
          .header,
          .footer,
          [role="navigation"],
          [role="banner"] {
            display: none !important;
          }

          body {
            color-adjust: exact;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }

          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: auto !important;
          }

          /* Make text smaller in print */
          .print\\:text-3xl { font-size: 1.3rem !important; line-height: 1.1 !important; }
          .print\\:text-2xl { font-size: 1.1rem !important; line-height: 1.1 !important; }
          .print\\:text-xl { font-size: 0.9rem !important; line-height: 1.1 !important; }
          .print\\:text-lg { font-size: 0.8rem !important; line-height: 1.1 !important; }
          .print\\:text-base { font-size: 0.7rem !important; line-height: 1.1 !important; }
          .print\\:text-sm { font-size: 0.65rem !important; line-height: 1.1 !important; }
          .print\\:text-xs { font-size: 0.6rem !important; line-height: 1.1 !important; }

          /* Reduce padding and margins significantly */
          .print\\:p-5 { padding: 0.3rem !important; }
          .print\\:p-4 { padding: 0.25rem !important; }
          .print\\:p-3 { padding: 0.2rem !important; }
          .print\\:p-2 { padding: 0.15rem !important; }
          .print\\:pb-4 { padding-bottom: 0.2rem !important; }
          .print\\:pb-3 { padding-bottom: 0.15rem !important; }
          .print\\:pb-2 { padding-bottom: 0.1rem !important; }
          .print\\:pt-6 { padding-top: 0.3rem !important; }
          .print\\:pt-4 { padding-top: 0.2rem !important; }
          .print\\:pt-3 { padding-top: 0.15rem !important; }
          .print\\:pt-2 { padding-top: 0.1rem !important; }
          .print\\:mb-8 { margin-bottom: 0.3rem !important; }
          .print\\:mb-6 { margin-bottom: 0.25rem !important; }
          .print\\:mb-5 { margin-bottom: 0.2rem !important; }
          .print\\:mb-4 { margin-bottom: 0.15rem !important; }
          .print\\:mb-3 { margin-bottom: 0.1rem !important; }
          .print\\:mb-2 { margin-bottom: 0.08rem !important; }
          .print\\:mb-1 { margin-bottom: 0.05rem !important; }
          .print\\:mt-8 { margin-top: 0.3rem !important; }
          .print\\:mt-4 { margin-top: 0.2rem !important; }
          .print\\:mt-3 { margin-top: 0.15rem !important; }
          .print\\:mt-2 { margin-top: 0.1rem !important; }
          .print\\:mt-1 { margin-top: 0.05rem !important; }

          /* Reduce gaps */
          .print\\:gap-2 { gap: 0.1rem !important; }
          .print\\:gap-3 { gap: 0.15rem !important; }

          /* Ensure content fits */
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <main className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-[var(--content-height)] p-3 mt-2 print:bg-white print:p-0">
        <div className="max-w-2xl mx-auto">
          {/* Print-only header */}
          <div className="hidden print:block print:mb-3">
            <div className="border-b-4 border-blue-600 print:pb-2 print:mb-2 text-center">
              <Image
                src="/bogner-logo.png"
                alt="Bogner Pools"
                width={200}
                height={60}
                className="mx-auto print:mb-1 print:pt-2"
                style={{maxHeight: '50px', width: 'auto'}}
              />
              <p className="text-center text-blue-700 font-semibold print:text-base print:mb-1">Fresh Plaster Startup Report</p>
            </div>
            {jobName && (
              <div className="bg-blue-50 border-l-4 border-blue-600 print:p-2 print:mb-2">
                <p className="print:text-xs text-gray-600 uppercase font-semibold print:mb-1">Job Name</p>
                <h2 className="print:text-lg font-bold text-gray-900">{jobName}</h2>
              </div>
            )}
            <p className="text-right print:text-xs text-gray-600 print:mb-2">Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>

          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-bogner-blue to-bogner-teal bg-clip-text text-transparent text-center print:hidden">
            Pool Tools
          </h1>

        {/* Water Volume Calculator */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 print:shadow-none print:block print:p-0 print:mb-0">
          <h2 className="text-xl font-semibold mb-3 text-bogner-blue print:hidden">
            Fresh Plaster Startup Calculations
          </h2>

          <div className="space-y-3 print:hidden">
            {/* Job Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Name / Address
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Smith Residence - 123 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue"
              />
            </div>

            {/* Surface Area Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Surface Area (square feet)
              </label>
              <input
                type="number"
                step="0.1"
                value={surfaceArea}
                onChange={(e) => {
                  setSurfaceArea(e.target.value);
                  setVolume(null);
                }}
                placeholder="e.g., 800"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue"
              />
            </div>

            {/* Landing Area (Optional) */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Landing / Sun Shelf (Optional)
                </label>
                <span className="text-xs text-gray-500">for shallow areas like tanning ledges</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Landing Area (sq ft)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={landingArea}
                    onChange={(e) => {
                      setLandingArea(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Landing Depth (feet)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={landingDepth}
                    onChange={(e) => {
                      setLandingDepth(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Seats and Steps (Optional) */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Seats & Steps (Optional)
                </label>
                <span className="text-xs text-gray-500">assumes 20" water depth, 16" wide</span>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Total Length of Seats/Steps (feet)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={seatsStepsLength}
                  onChange={(e) => {
                    setSeatsStepsLength(e.target.value);
                    setVolume(null);
                  }}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue text-sm"
                />
              </div>
            </div>

            {/* Deep End Location */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
              <input
                type="checkbox"
                id="deepInMiddle"
                checked={deepInMiddle}
                onChange={(e) => {
                  setDeepInMiddle(e.target.checked);
                  setVolume(null);
                }}
                className="w-4 h-4 text-bogner-blue focus:ring-bogner-blue border-gray-300 rounded"
              />
              <label htmlFor="deepInMiddle" className="text-sm font-medium text-gray-700 cursor-pointer">
                Deep end is in the middle (play pool / diving pool)
              </label>
            </div>

            {/* Depths */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {deepInMiddle ? 'Shallow End 1 (feet)' : 'Shallow End (feet)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={shallowDepth}
                    onChange={(e) => {
                      setShallowDepth(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 3.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {deepInMiddle ? 'Deep Middle (feet)' : 'Deep End (feet)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={deepDepth}
                    onChange={(e) => {
                      setDeepDepth(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue"
                  />
                </div>
              </div>

              {/* Second Shallow End (only for deep in middle) */}
              {deepInMiddle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shallow End 2 (feet) <span className="text-xs text-gray-500">(optional if different)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={shallowDepth2}
                    onChange={(e) => {
                      setShallowDepth2(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue"
                  />
                </div>
              )}
            </div>

            {/* Salt Startup Calculation */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Startup Chemicals
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Desired Salt Level (PPM)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={desiredSaltPPM}
                    onChange={(e) => {
                      setDesiredSaltPPM(e.target.value);
                      setSaltNeeded(null);
                    }}
                    placeholder="e.g., 3200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typical: 2700-3400 PPM</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Desired CYA/Stabilizer (PPM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={desiredCYA}
                    onChange={(e) => {
                      setDesiredCYA(e.target.value);
                      setCyaNeeded(null);
                    }}
                    placeholder="e.g., 70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bogner-blue text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Saltwater: 70-80 PPM</p>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateVolume}
              className="w-full bg-gradient-to-r from-bogner-blue to-bogner-teal text-white font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
            >
              Calculate Volume
            </button>
          </div>

          {/* Result */}
          {volume !== null && (
            <div className="space-y-3 mt-4 print:block">
                {/* Download/Print PDF Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 print:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Save as PDF
                </button>

                {/* Pool Measurements - Only visible when printing */}
                <div className="hidden print:block bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-lg print:p-2 print:mb-2 shadow-sm">
                  <div className="flex items-center print:gap-2 print:mb-2 print:pb-2 border-b-2 border-blue-300">
                    <div className="w-1 print:h-4 bg-blue-600 rounded"></div>
                    <h3 className="print:text-sm font-bold text-blue-900 uppercase tracking-wide">Pool Specifications</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm print:text-xs print:gap-x-3 print:gap-y-1">
                    <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                      <span className="font-semibold text-blue-800">Surface Area:</span>
                      <span className="text-gray-900 font-medium">{surfaceArea} sq ft</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                      <span className="font-semibold text-blue-800">Shallow End:</span>
                      <span className="text-gray-900 font-medium">{shallowDepth} ft</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                      <span className="font-semibold text-blue-800">Deep End:</span>
                      <span className="text-gray-900 font-medium">{deepDepth} ft</span>
                    </div>
                    {shallowDepth2 && parseFloat(shallowDepth2) > 0 && (
                      <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                        <span className="font-semibold text-blue-800">Shallow End 2:</span>
                        <span className="text-gray-900 font-medium">{shallowDepth2} ft</span>
                      </div>
                    )}
                    {deepInMiddle && (
                      <div className="col-span-2 flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                        <span className="font-semibold text-blue-800">Pool Type:</span>
                        <span className="text-gray-900 font-medium">Deep end in middle (play pool)</span>
                      </div>
                    )}
                    {landingArea && parseFloat(landingArea) > 0 && (
                      <>
                        <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                          <span className="font-semibold text-blue-800">Landing Area:</span>
                          <span className="text-gray-900 font-medium">{landingArea} sq ft</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                          <span className="font-semibold text-blue-800">Landing Depth:</span>
                          <span className="text-gray-900 font-medium">{landingDepth} ft</span>
                        </div>
                      </>
                    )}
                    {seatsStepsLength && parseFloat(seatsStepsLength) > 0 && (
                      <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                        <span className="font-semibold text-blue-800">Seats/Steps:</span>
                        <span className="text-gray-900 font-medium">{seatsStepsLength} ft length</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                      <span className="font-semibold text-blue-800">Target Salt:</span>
                      <span className="text-gray-900 font-medium">{desiredSaltPPM} PPM</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2 print:pb-1">
                      <span className="font-semibold text-blue-800">Target CYA:</span>
                      <span className="text-gray-900 font-medium">{desiredCYA} PPM</span>
                    </div>
                  </div>
                </div>

                {/* Results Header - Only visible when printing */}
                <div className="hidden print:block print:mb-2 print:mt-2">
                  <div className="flex items-center print:gap-2 border-b-2 border-blue-600 print:pb-2">
                    <div className="w-1 print:h-4 bg-blue-600 rounded"></div>
                    <h3 className="print:text-sm font-bold text-blue-900 uppercase tracking-wide">Chemical Requirements</h3>
                  </div>
                </div>

                {/* Water Volume Result */}
                <div className="bg-gradient-to-r from-bogner-blue/10 to-bogner-teal/10 border-2 border-bogner-blue/20 rounded-md p-4 text-center print:border-2 print:border-blue-600 print:bg-blue-50 print:break-inside-avoid print:mb-2 print:p-2 print:rounded-lg">
                  <p className="text-sm text-gray-600 mb-1 print:text-blue-800 print:font-bold print:text-xs print:uppercase print:tracking-wide print:mb-1">Estimated Water Volume</p>
                  <p className="text-3xl font-bold text-bogner-blue print:text-blue-900 print:text-2xl">
                    {volume.toLocaleString()} gallons
                  </p>
                  <p className="text-xs text-gray-500 mt-2 print:text-gray-700 print:mt-1 print:text-xs">
                    {deepInMiddle
                      ? 'Calculated for pool with deep middle and shallow ends'
                      : 'Calculated for pool sloping from shallow to deep end'}
                  </p>
                </div>

                {/* Salt Needed Result */}
                {saltNeeded !== null && (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-md p-4 text-center print:border-2 print:border-green-600 print:bg-green-50 print:break-inside-avoid print:mb-2 print:p-2 print:rounded-lg">
                    <p className="text-sm text-gray-600 mb-1 print:text-green-800 print:font-bold print:text-xs print:uppercase print:tracking-wide print:mb-1">Startup Salt Required</p>
                    <p className="text-3xl font-bold text-green-700 print:text-green-900 print:text-2xl">
                      {saltNeeded.toLocaleString()} lbs
                    </p>
                    <p className="text-xs text-gray-500 mt-2 print:text-gray-700 print:mt-1 print:text-xs">
                      To achieve {desiredSaltPPM} PPM • ≈ {Math.round(saltNeeded / 40)} bags (40 lb)
                    </p>
                  </div>
                )}

                {/* Liquid Chlorine Result */}
                {chlorineNeeded !== null && (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-md p-4 text-center print:border-2 print:border-cyan-600 print:bg-cyan-50 print:break-inside-avoid print:mb-2 print:p-2 print:rounded-lg">
                    <p className="text-sm text-gray-600 mb-1 print:text-cyan-800 print:font-bold print:text-xs print:uppercase print:tracking-wide print:mb-1">Liquid Chlorine (to 2.0 PPM)</p>
                    <p className="text-3xl font-bold text-cyan-700 print:text-cyan-900 print:text-2xl">
                      {(chlorineNeeded / 128).toFixed(2)} gal
                    </p>
                    <p className="text-xs text-gray-500 mt-2 print:text-gray-700 print:mt-1 print:text-xs">
                      ({chlorineNeeded} oz, 12.5%) • Pour around perimeter
                    </p>
                  </div>
                )}

                {/* Cyanuric Acid (Stabilizer) Result */}
                {cyaNeeded !== null && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-md p-4 text-center print:border-2 print:border-purple-600 print:bg-purple-50 print:break-inside-avoid print:mb-2 print:p-2 print:rounded-lg">
                    <p className="text-sm text-gray-600 mb-1 print:text-purple-800 print:font-bold print:text-xs print:uppercase print:tracking-wide print:mb-1">Stabilizer (CYA)</p>
                    <p className="text-3xl font-bold text-purple-700 print:text-purple-900 print:text-2xl">
                      {(cyaNeeded / 16).toFixed(1)} lbs
                    </p>
                    <p className="text-xs text-gray-500 mt-2 print:text-gray-700 print:mt-1 print:text-xs">
                      ({cyaNeeded} oz to {desiredCYA} PPM) • Add to skimmer
                    </p>
                  </div>
                )}

                {/* Acid Needed Result */}
                {acidNeeded !== null && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-md p-4 text-center print:border-2 print:border-orange-600 print:bg-orange-50 print:break-inside-avoid print:mb-2 print:p-2 print:rounded-lg">
                    <p className="text-sm text-gray-600 mb-1 print:text-orange-800 print:font-bold print:text-xs print:uppercase print:tracking-wide print:mb-1">
                      Muriatic Acid (Fresh Plaster)
                    </p>
                    <p className="text-3xl font-bold text-orange-700 print:text-orange-900 print:text-2xl">
                      {(acidNeeded / 128).toFixed(2)} gal
                    </p>
                    <p className="text-xs text-gray-500 mt-2 print:text-gray-700 print:mt-1 print:text-xs">
                      ({acidNeeded} oz, 31.45%) • Includes 1.5x fresh plaster + chlorine compensation
                    </p>
                    <p className="text-xs text-orange-600 mt-2 font-semibold print:text-orange-900 print:font-bold print:mt-1 print:text-xs">
                      ⚠ Retest pH daily during first week
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Print Footer - Only visible when printing */}
          {volume !== null && (
            <div className="hidden print:block print:mt-2 print:pt-1 border-t border-gray-300">
              <div className="text-center print:text-xs text-gray-700">
                <p className="print:text-xs">Safety: Add chemicals with pump running • Never mix chemicals • Wear safety equipment • Test daily first week</p>
              </div>
            </div>
          )}
        </div>


        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 print:hidden">
          <h3 className="font-semibold text-bogner-blue mb-2">Fresh Plaster Startup Calculator:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Enter your pool's total surface area in square feet</li>
            <li>If you have a sun shelf/tanning ledge, enter its area and depth separately</li>
            <li>For seats and steps, enter the total linear footage (assumes 16" wide, 20" water depth)</li>
            <li>Measure and enter the depth at the shallow end</li>
            <li>Measure and enter the depth at the deep end (or middle)</li>
            <li>Check "Deep end in middle" for play/diving pools where both ends are shallow</li>
            <li>For play pools with different shallow end depths, enter both shallow depths separately</li>
            <li>Enter desired salt PPM (typically 3200) and CYA stabilizer (70-80 for saltwater)</li>
            <li>All calculations include liquid chlorine to 2.0 PPM for initial sanitation</li>
            <li>Acid dosing is calculated for fresh plaster (1.5x) and compensates for chlorine pH rise</li>
            <li>Get complete startup: water volume, salt, stabilizer, chlorine, and muriatic acid</li>
          </ul>
        </div>
      </div>
    </main>
    </>
  );
}
