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
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      const reportText = generateReportText();
      navigator.share({
        title: 'Bogner Pools - Fresh Plaster Startup Report',
        text: reportText,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          window.print();
        }
      });
    } else {
      window.print();
    }
  };

  const generateReportText = () => {
    const lines = [
      '═══════════════════════════════════════',
      'BOGNER POOLS',
      'Fresh Plaster Startup Report',
      '═══════════════════════════════════════',
      '',
    ];

    if (jobName) {
      lines.push(`Job: ${jobName}`);
      lines.push('');
    }

    lines.push(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    lines.push('');
    lines.push('POOL SPECIFICATIONS');
    lines.push('───────────────────────────────────────');
    lines.push(`Surface Area: ${surfaceArea} sq ft`);
    lines.push(`Shallow End: ${shallowDepth} ft`);
    lines.push(`Deep End: ${deepDepth} ft`);

    if (shallowDepth2 && parseFloat(shallowDepth2) > 0) {
      lines.push(`Shallow End 2: ${shallowDepth2} ft`);
    }
    if (deepInMiddle) {
      lines.push('Pool Type: Deep end in middle');
    }
    if (landingArea && parseFloat(landingArea) > 0) {
      lines.push(`Landing Area: ${landingArea} sq ft`);
      lines.push(`Landing Depth: ${landingDepth} ft`);
    }
    if (seatsStepsLength && parseFloat(seatsStepsLength) > 0) {
      lines.push(`Seats/Steps: ${seatsStepsLength} ft length`);
    }
    lines.push(`Target Salt: ${desiredSaltPPM} PPM`);
    lines.push(`Target CYA: ${desiredCYA} PPM`);
    lines.push('');

    lines.push('CHEMICAL REQUIREMENTS');
    lines.push('───────────────────────────────────────');
    lines.push(`Water Volume: ${volume?.toLocaleString()} gallons`);
    lines.push('');

    if (saltNeeded !== null) {
      lines.push(`Salt: ${saltNeeded.toLocaleString()} lbs`);
      lines.push(`  (≈ ${Math.round(saltNeeded / 40)} bags, 40 lb each)`);
      lines.push('');
    }

    if (chlorineNeeded !== null) {
      lines.push(`Liquid Chlorine: ${(chlorineNeeded / 128).toFixed(2)} gallons`);
      lines.push(`  (${chlorineNeeded} oz, 12.5% to 2.0 PPM)`);
      lines.push('');
    }

    if (cyaNeeded !== null) {
      lines.push(`Stabilizer (CYA): ${(cyaNeeded / 16).toFixed(1)} lbs`);
      lines.push(`  (${cyaNeeded} oz to ${desiredCYA} PPM)`);
      lines.push('');
    }

    if (acidNeeded !== null) {
      lines.push(`Muriatic Acid: ${(acidNeeded / 128).toFixed(2)} gallons`);
      lines.push(`  (${acidNeeded} oz, 31.45%)`);
      lines.push('  ✓ Includes 1.5x dose for fresh plaster');
      lines.push('  ✓ Includes chlorine pH compensation');
      lines.push('  ⚠ Retest pH daily during first week');
      lines.push('');
    }

    lines.push('SAFETY NOTES');
    lines.push('───────────────────────────────────────');
    lines.push('• Add chemicals with pump running');
    lines.push('• Never mix chemicals together');
    lines.push('• Wear safety equipment');
    lines.push('• Test daily during first week');
    lines.push('');
    lines.push('═══════════════════════════════════════');
    lines.push('BOGNER POOLS');
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  };

  const calculateVolume = () => {
    if (!surfaceArea || !shallowDepth || !deepDepth) return;

    const mainPoolArea = landingArea && parseFloat(landingArea) > 0
      ? parseFloat(surfaceArea) - parseFloat(landingArea)
      : parseFloat(surfaceArea);

    let avgDepth;
    if (deepInMiddle) {
      if (shallowDepth2 && parseFloat(shallowDepth2) > 0) {
        avgDepth = (parseFloat(shallowDepth) + parseFloat(shallowDepth2) + parseFloat(deepDepth)) / 3;
      } else {
        avgDepth = (2 * parseFloat(shallowDepth) + parseFloat(deepDepth)) / 3;
      }
    } else {
      avgDepth = (parseFloat(shallowDepth) + parseFloat(deepDepth)) / 2;
    }

    let volumeCubicFeet = mainPoolArea * avgDepth;

    if (landingArea && landingDepth && parseFloat(landingArea) > 0 && parseFloat(landingDepth) > 0) {
      const landingVolume = parseFloat(landingArea) * parseFloat(landingDepth);
      volumeCubicFeet += landingVolume;
    }

    if (seatsStepsLength && parseFloat(seatsStepsLength) > 0) {
      const seatsStepsVolume = parseFloat(seatsStepsLength) * 1.33 * 1.67;
      volumeCubicFeet += seatsStepsVolume;
    }

    const volumeGallons = volumeCubicFeet * 7.48052;
    setVolume(Math.round(volumeGallons));

    if (desiredSaltPPM && parseFloat(desiredSaltPPM) > 0) {
      const saltLbs = (volumeGallons / 10000) * (parseFloat(desiredSaltPPM) / 1000) * 83;
      setSaltNeeded(Math.round(saltLbs));
    } else {
      setSaltNeeded(null);
    }

    const chlorineOz = (volumeGallons / 10000) * 2.0 * 13;
    setChlorineNeeded(Math.round(chlorineOz));

    const pHDecrease = 0.6;
    const ozPerUnit = 25.6;
    let acidOz = (volumeGallons / 10000) * (pHDecrease / 0.4) * ozPerUnit;
    acidOz *= 1.5;
    setAcidNeeded(Math.round(acidOz));

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
        input[type="text"],
        input[type="number"] {
          font-size: 16px;
        }

        @media print {
          @page {
            margin: 0.3in;
            size: letter portrait;
          }

          nav, header, footer, .nav, .navigation, .header, .footer,
          [role="navigation"], [role="banner"] {
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

          .print\\:text-3xl { font-size: 1.3rem !important; line-height: 1.1 !important; }
          .print\\:text-2xl { font-size: 1.1rem !important; line-height: 1.1 !important; }
          .print\\:text-xl { font-size: 0.9rem !important; line-height: 1.1 !important; }
          .print\\:text-lg { font-size: 0.8rem !important; line-height: 1.1 !important; }
          .print\\:text-base { font-size: 0.7rem !important; line-height: 1.1 !important; }
          .print\\:text-sm { font-size: 0.65rem !important; line-height: 1.1 !important; }
          .print\\:text-xs { font-size: 0.6rem !important; line-height: 1.1 !important; }

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
          .print\\:gap-2 { gap: 0.1rem !important; }
          .print\\:gap-3 { gap: 0.15rem !important; }

          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <main className="page-content print:bg-white print:p-0">
        <div className="max-w-2xl mx-auto">
          {/* Print-only header */}
          <div className="hidden print:block print:mb-3">
            <div className="border-b-4 border-blue-600 print:pb-2 print:mb-2 text-center">
              <Image
                src="/bogner-logo.png"
                alt="Bogner Pools"
                width={200}
                height={60}
                className="mx-auto print:mb-1 print:pt-2 max-h-[50px] w-auto"
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

          <h1 className="text-2xl font-bold mb-4 text-gradient-primary text-center print:hidden">
            Pool Tools
          </h1>

          {/* Water Volume Calculator */}
          <div className="card-solid p-4 mb-4 print:shadow-none print:block print:p-0 print:mb-0">
            <h2 className="text-xl font-semibold mb-3 text-bogner-blue print:hidden">
              Fresh Plaster Startup Calculations
            </h2>

            <div className="space-y-3 print:hidden">
              {/* Job Name Input */}
              <div className="form-group">
                <label className="label">Job Name / Address</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g., Smith Residence - 123 Main St"
                  className="input"
                />
              </div>

              {/* Surface Area Input */}
              <div className="form-group">
                <label className="label">Total Surface Area (square feet)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfaceArea}
                  onChange={(e) => {
                    setSurfaceArea(e.target.value);
                    setVolume(null);
                  }}
                  placeholder="e.g., 800"
                  className="input"
                />
              </div>

              {/* Landing Area (Optional) */}
              <div className="divider-light" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Landing / Sun Shelf (Optional)</label>
                  <span className="text-xs text-gray-500">for shallow areas like tanning ledges</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Landing Area (sq ft)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={landingArea}
                      onChange={(e) => {
                        setLandingArea(e.target.value);
                        setVolume(null);
                      }}
                      placeholder="e.g., 60"
                      className="input input-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Landing Depth (feet)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={landingDepth}
                      onChange={(e) => {
                        setLandingDepth(e.target.value);
                        setVolume(null);
                      }}
                      placeholder="e.g., 1"
                      className="input input-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seats and Steps (Optional) */}
              <div className="divider-light" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Seats & Steps (Optional)</label>
                  <span className="text-xs text-gray-500">assumes 20" water depth, 16" wide</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Total Length of Seats/Steps (feet)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={seatsStepsLength}
                    onChange={(e) => {
                      setSeatsStepsLength(e.target.value);
                      setVolume(null);
                    }}
                    placeholder="e.g., 12"
                    className="input input-sm"
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
                    <label className="label">
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
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">
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
                      className="input"
                    />
                  </div>
                </div>

                {deepInMiddle && (
                  <div>
                    <label className="label">
                      Shallow End 2 (feet) <span className="text-xs text-gray-500 font-normal">(optional if different)</span>
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
                      className="input"
                    />
                  </div>
                )}
              </div>

              {/* Salt Startup Calculation */}
              <div className="divider-light" />
              <div>
                <label className="label">Startup Chemicals</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Desired Salt Level (PPM)</label>
                    <input
                      type="number"
                      step="100"
                      value={desiredSaltPPM}
                      onChange={(e) => {
                        setDesiredSaltPPM(e.target.value);
                        setSaltNeeded(null);
                      }}
                      placeholder="e.g., 3200"
                      className="input input-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical: 2700-3400 PPM</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Desired CYA/Stabilizer (PPM)</label>
                    <input
                      type="number"
                      step="10"
                      value={desiredCYA}
                      onChange={(e) => {
                        setDesiredCYA(e.target.value);
                        setCyaNeeded(null);
                      }}
                      placeholder="e.g., 70"
                      className="input input-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Saltwater: 70-80 PPM</p>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <button onClick={calculateVolume} className="btn btn-primary btn-lg w-full">
                Calculate Volume
              </button>
            </div>

            {/* Result */}
            {volume !== null && (
              <div className="space-y-3 mt-4 print:block">
                {/* Download/Share Report Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="btn btn-ghost btn-lg w-full bg-gray-600 hover:bg-gray-700 text-white print:hidden"
                >
                  <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="desktop-only">Save as PDF</span>
                  <span className="mobile-only">Share Report</span>
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
                <div className="result-card result-card-blue">
                  <p className="result-label">Estimated Water Volume</p>
                  <p className="result-value text-bogner-blue">
                    {volume.toLocaleString()} gallons
                  </p>
                  <p className="result-note">
                    {deepInMiddle
                      ? 'Calculated for pool with deep middle and shallow ends'
                      : 'Calculated for pool sloping from shallow to deep end'}
                  </p>
                </div>

                {/* Salt Needed Result */}
                {saltNeeded !== null && (
                  <div className="result-card result-card-green">
                    <p className="result-label">Startup Salt Required</p>
                    <p className="result-value text-green-700">
                      {saltNeeded.toLocaleString()} lbs
                    </p>
                    <p className="result-note">
                      To achieve {desiredSaltPPM} PPM • ≈ {Math.round(saltNeeded / 40)} bags (40 lb)
                    </p>
                  </div>
                )}

                {/* Liquid Chlorine Result */}
                {chlorineNeeded !== null && (
                  <div className="result-card result-card-cyan">
                    <p className="result-label">Liquid Chlorine (to 2.0 PPM)</p>
                    <p className="result-value text-cyan-700">
                      {(chlorineNeeded / 128).toFixed(2)} gal
                    </p>
                    <p className="result-note">
                      ({chlorineNeeded} oz, 12.5%) • Pour around perimeter
                    </p>
                  </div>
                )}

                {/* Cyanuric Acid (Stabilizer) Result */}
                {cyaNeeded !== null && (
                  <div className="result-card result-card-purple">
                    <p className="result-label">Stabilizer (CYA)</p>
                    <p className="result-value text-purple-700">
                      {(cyaNeeded / 16).toFixed(1)} lbs
                    </p>
                    <p className="result-note">
                      ({cyaNeeded} oz to {desiredCYA} PPM) • Add to skimmer
                    </p>
                  </div>
                )}

                {/* Acid Needed Result */}
                {acidNeeded !== null && (
                  <div className="result-card result-card-orange">
                    <p className="result-label">Muriatic Acid (Fresh Plaster)</p>
                    <p className="result-value text-orange-700">
                      {(acidNeeded / 128).toFixed(2)} gal
                    </p>
                    <p className="result-note">
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
