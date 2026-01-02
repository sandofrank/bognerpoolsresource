'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const API_KEY_STORAGE_KEY = 'bert_claude_api_key';

interface Redaction {
  original: string;
  replacement: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

interface Receipt {
  id: string;
  file: File;
  preview: string;
  parsed: boolean;
  parsing: boolean;
  error?: string;
  data: {
    vendor: string;
    date: string;
    amount: string;
    description: string;
    redactions: Redaction[];
    billTo: {
      name: string;
      company: string;
      email: string;
    };
  };
}

const DEFAULT_BILL_TO = {
  name: 'Frank Sandoval',
  company: 'Bogner Pools',
  email: 'franks@bognerpools.com',
};

const KNOWN_VENDORS: Record<string, string> = {
  'Google Workspace': 'Business email & productivity suite',
  'Google Suite': 'Business email & productivity suite',
  'Google Ads': 'Online advertising & lead generation',
  'Slack': 'Team communication platform',
  'Pool Studio': '3D pool design software',
  'ParcelQuest': 'Property & parcel research tool',
  'Setapp': 'Web-related software subscription',
  'Foxit': 'PDF editing software',
  'Claude': 'Website AI tools',
  'Anthropic': 'Website AI tools',
  'Vercel': 'Website hosting & deployment',
};

const getVendorDescription = (vendor: string): string | null => {
  const normalizedVendor = vendor.toLowerCase().trim();
  for (const [knownVendor, description] of Object.entries(KNOWN_VENDORS)) {
    if (normalizedVendor.includes(knownVendor.toLowerCase())) {
      return description;
    }
  }
  return null;
};

export default function BERTPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      receipts.forEach((receipt) => {
        if (receipt.preview) {
          URL.revokeObjectURL(receipt.preview);
        }
      });
    };
  }, [receipts]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newReceipts: Receipt[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      parsed: false,
      parsing: false,
      data: {
        vendor: '',
        date: '',
        amount: '',
        description: '',
        redactions: [],
        billTo: { ...DEFAULT_BILL_TO },
      },
    }));
    setReceipts((prev) => [...prev, ...newReceipts]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
  });

  const parseReceipt = async (receiptId: string) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId ? { ...r, parsing: true, error: undefined } : r
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', receipt.file);
      formData.append('apiKey', apiKey);

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse receipt');
      }

      const data = await response.json();

      setReceipts((prev) =>
        prev.map((r) => {
          if (r.id !== receiptId) return r;
          const vendorDescription = getVendorDescription(data.vendor || '');
          return {
            ...r,
            parsing: false,
            parsed: true,
            data: {
              ...data,
              description: vendorDescription || data.description || '',
              redactions: data.redactions || [],
              billTo: { ...DEFAULT_BILL_TO },
            },
          };
        })
      );
    } catch {
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === receiptId
            ? { ...r, parsing: false, error: 'Failed to parse receipt' }
            : r
        )
      );
    }
  };

  const parseAllReceipts = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const unparsedReceipts = receipts.filter((r) => !r.parsed && !r.parsing);
    for (const receipt of unparsedReceipts) {
      await parseReceipt(receipt.id);
    }
  };

  const updateReceiptData = (
    receiptId: string,
    field: string,
    value: string
  ) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id !== receiptId) return r;

        if (field.startsWith('billTo.')) {
          const billToKey = field.replace('billTo.', '');
          if (!['name', 'company', 'email'].includes(billToKey)) return r;
          const billToField = billToKey as keyof typeof r.data.billTo;
          return {
            ...r,
            data: {
              ...r.data,
              billTo: {
                ...r.data.billTo,
                [billToField]: value,
              },
            },
          };
        }

        // Auto-fill description when vendor changes and matches a known vendor
        if (field === 'vendor') {
          const vendorDescription = getVendorDescription(value);
          if (vendorDescription && !r.data.description) {
            return {
              ...r,
              data: {
                ...r.data,
                vendor: value,
                description: vendorDescription,
              },
            };
          }
        }

        return {
          ...r,
          data: {
            ...r.data,
            [field]: value,
          },
        };
      })
    );
  };

  const removeReceipt = (receiptId: string) => {
    // Revoke the object URL before removing to prevent memory leak
    const receiptToRemove = receipts.find((r) => r.id === receiptId);
    if (receiptToRemove?.preview) {
      URL.revokeObjectURL(receiptToRemove.preview);
    }
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    if (selectedReceipt === receiptId) {
      setSelectedReceipt(null);
    }
  };

  const generateReport = async () => {
    if (receipts.length === 0) return;

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('title', reportTitle || 'Expense Report');
      formData.append('date', new Date().toLocaleDateString());
      formData.append('submittedBy', DEFAULT_BILL_TO.name);
      formData.append('receiptsData', JSON.stringify(receipts.map((r) => ({
        id: r.id,
        data: r.data,
      }))));

      if (apiKey) {
        formData.append('apiKey', apiKey);
      }

      receipts.forEach((receipt, index) => {
        formData.append(`file_${index}`, receipt.file);
      });

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle || 'expense-report'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReceiptData = receipts.find((r) => r.id === selectedReceipt);

  return (
    <main className="page-content">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gradient-primary">
            BERT
          </h1>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="p-1.5 text-gray-400 hover:text-bogner-blue transition-colors"
            title="API Key Settings"
          >
            <svg className="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {apiKey && (
            <span className="w-2 h-2 bg-green-500 rounded-full" title="API key configured" />
          )}
        </div>
        <p className="text-center text-gray-600 mb-4 text-sm">Bogner Expense Report Tool</p>

        {/* API Key Modal */}
        {showApiKeyInput && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="text-lg font-semibold mb-2">Claude API Key</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your Anthropic API key to enable receipt parsing. Your key will be saved locally.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="btn btn-secondary btn-md flex-1"
                >
                  Cancel
                </button>
                {apiKey && (
                  <button
                    onClick={() => {
                      saveApiKey('');
                    }}
                    className="btn btn-danger btn-md"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => {
                    if (apiKey) {
                      saveApiKey(apiKey);
                      setShowApiKeyInput(false);
                    }
                  }}
                  className="btn btn-primary btn-md flex-1"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Upload & Receipt List */}
          <div className="space-y-4">
            {/* Report Title */}
            <div className="card-solid p-4">
              <label className="label">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., November 2024 Expenses"
                className="input"
              />
            </div>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop receipts here...'
                    : 'Drag & drop receipts here, or click to select'}
                </p>
                <p className="mt-1 text-xs text-gray-500">PDF and images supported</p>
              </div>
            </div>

            {/* Receipt List */}
            {receipts.length > 0 && (
              <div className="card-solid p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Receipts ({receipts.length})
                  </h2>
                  <button
                    onClick={parseAllReceipts}
                    disabled={receipts.every((r) => r.parsed || r.parsing)}
                    className="btn btn-primary btn-sm"
                  >
                    Parse All
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() => setSelectedReceipt(receipt.id)}
                      className={`receipt-card ${selectedReceipt === receipt.id ? 'receipt-card-selected' : ''}`}
                    >
                      <div className="receipt-icon-container">
                        {receipt.file.type === 'application/pdf' ? (
                          <svg className="icon-lg text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v5H9v-2H8v2H7v-5h1v2h1v-2zm4 0h1.5c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5H13v-5zm1 1v3h.5c.28 0 .5-.22.5-.5v-2c0-.28-.22-.5-.5-.5H14z"/>
                          </svg>
                        ) : (
                          <svg className="icon-lg text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {receipt.data.vendor || receipt.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {receipt.parsed
                            ? `${receipt.data.amount} - ${receipt.data.date}`
                            : receipt.parsing
                            ? 'Parsing...'
                            : 'Not parsed'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {receipt.parsing && (
                          <div className="spinner-sm" />
                        )}
                        {receipt.parsed && (
                          <svg className="icon-md text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {receipt.error && (
                          <svg className="icon-md text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeReceipt(receipt.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Report Button */}
            {receipts.length > 0 && (
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="btn btn-primary btn-lg w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="spinner-sm border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Expense Report PDF
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Receipt Editor */}
          <div className="card-solid p-4">
            {selectedReceiptData ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Edit Receipt</h2>
                  {!selectedReceiptData.parsed && !selectedReceiptData.parsing && (
                    <button
                      onClick={() => parseReceipt(selectedReceiptData.id)}
                      className="btn btn-primary btn-sm"
                    >
                      Parse with AI
                    </button>
                  )}
                </div>

                {/* Receipt Preview */}
                <div className="mb-4 bg-gray-100 rounded-lg p-2 h-48 flex items-center justify-center overflow-hidden">
                  {selectedReceiptData.file.type === 'application/pdf' ? (
                    <div className="text-center">
                      <svg className="mx-auto icon-xl text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                      </svg>
                      <p className="text-sm text-gray-600 mt-2">{selectedReceiptData.file.name}</p>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedReceiptData.preview}
                      alt="Receipt preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                {/* Receipt Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Vendor</label>
                      <input
                        type="text"
                        list="known-vendors"
                        value={selectedReceiptData.data.vendor}
                        onChange={(e) =>
                          updateReceiptData(selectedReceiptData.id, 'vendor', e.target.value)
                        }
                        placeholder="Store/Vendor name"
                        className="input text-sm"
                      />
                      <datalist id="known-vendors">
                        {Object.keys(KNOWN_VENDORS).filter((v, i, arr) =>
                          // Filter out duplicates (Google Suite/Workspace, Claude/Anthropic)
                          !arr.slice(0, i).some(prev => KNOWN_VENDORS[prev] === KNOWN_VENDORS[v])
                        ).map((vendor) => (
                          <option key={vendor} value={vendor} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="label text-xs">Amount</label>
                      <input
                        type="text"
                        value={selectedReceiptData.data.amount}
                        onChange={(e) =>
                          updateReceiptData(selectedReceiptData.id, 'amount', e.target.value)
                        }
                        placeholder="$0.00"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs">Date</label>
                    <input
                      type="text"
                      value={selectedReceiptData.data.date}
                      onChange={(e) =>
                        updateReceiptData(selectedReceiptData.id, 'date', e.target.value)
                      }
                      placeholder="MM/DD/YYYY"
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="label text-xs">Description</label>
                    <input
                      type="text"
                      value={selectedReceiptData.data.description}
                      onChange={(e) =>
                        updateReceiptData(selectedReceiptData.id, 'description', e.target.value)
                      }
                      placeholder="What was purchased"
                      className="input text-sm"
                    />
                  </div>

                  {/* Bill To Section */}
                  <div className="divider-light" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Bill To</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="label text-xs">Name</label>
                        <input
                          type="text"
                          value={selectedReceiptData.data.billTo.name}
                          onChange={(e) =>
                            updateReceiptData(selectedReceiptData.id, 'billTo.name', e.target.value)
                          }
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Company</label>
                        <input
                          type="text"
                          value={selectedReceiptData.data.billTo.company}
                          onChange={(e) =>
                            updateReceiptData(selectedReceiptData.id, 'billTo.company', e.target.value)
                          }
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Email</label>
                        <input
                          type="email"
                          value={selectedReceiptData.data.billTo.email}
                          onChange={(e) =>
                            updateReceiptData(selectedReceiptData.id, 'billTo.email', e.target.value)
                          }
                          className="input text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm">Select a receipt to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
