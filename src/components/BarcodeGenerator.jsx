import React, { useState, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeGenerator = ({ onGenerate }) => {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [isRange, setIsRange] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [padding, setPadding] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [barcodeSize, setBarcodeSize] = useState('medium');
  const canvasRef = useRef(null);

  const getBarcodeSettings = () => {
    const sizes = {
      small: { width: 1, height: 50, fontSize: 12 },
      medium: { width: 2, height: 100, fontSize: 14 },
      large: { width: 3, height: 150, fontSize: 16 }
    };
    return sizes[barcodeSize];
  };

  const generateSingleBarcode = (value) => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const settings = getBarcodeSettings();
        JsBarcode(canvas, value, {
          format: barcodeFormat,
          ...settings,
          displayValue: true,
          margin: 10
        });
        
        resolve({ value, image: canvas.toDataURL('image/png') });
      } catch (error) {
        console.error('Error generating barcode:', error);
        resolve(null);
      }
    });
  };

  const generateBulkBarcodes = async () => {
    setGenerating(true);
    const values = bulkInput
      .split(';')
      .map(value => value.trim())
      .filter(value => value !== '');

    if (values.length === 0) {
      alert('Please enter at least one value');
      setGenerating(false);
      return;
    }

    const barcodes = [];
    for (const value of values) {
      const barcode = await generateSingleBarcode(value);
      if (barcode) {
        barcodes.push(barcode);
      }
      // Small delay to prevent browser from hanging
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    onGenerate(barcodes);
    setBulkInput('');
    setGenerating(false);
  };

  const generateBarcodeRange = async () => {
    setGenerating(true);
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    
    if (isNaN(start) || isNaN(end) || start > end) {
      alert('Please enter valid range values');
      setGenerating(false);
      return;
    }

    const barcodes = [];
    // Generate all barcodes in the range
    for (let i = start; i <= end; i++) {
      const paddedNumber = i.toString().padStart(padding, '0');
      const value = `${prefix}${paddedNumber}${suffix}`;
      const barcode = await generateSingleBarcode(value);
      if (barcode) {
        barcodes.push(barcode);
      }
      // Small delay to prevent browser from hanging
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Send all barcodes at once
    onGenerate(barcodes);
    setGenerating(false);
  };

  const generateSingle = async () => {
    const barcode = await generateSingleBarcode(barcodeValue);
    if (barcode) {
      onGenerate([barcode]);  // Send as array for consistency
      setBarcodeValue('');
    }
  };

  const handleGenerate = async () => {
    if (isBulk) {
      await generateBulkBarcodes();
    } else if (isRange) {
      await generateBarcodeRange();
    } else {
      await generateSingle();
    }
  };

  const renderInputSection = () => {
    if (isBulk) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700">Bulk Barcode Values</label>
          <p className="text-sm text-gray-500 mb-2">Enter values separated by semicolons (;)</p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-32"
            placeholder="Example: ABC123;DEF456;GHI789"
          />
        </div>
      );
    }

    if (isRange) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Range Start</label>
              <input
                type="number"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Start number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Range End</label>
              <input
                type="number"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="End number"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Optional prefix"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Optional suffix"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number Padding</label>
            <input
              type="number"
              min="0"
              value={padding}
              onChange={(e) => setPadding(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Number of digits (adds leading zeros)"
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">Barcode Value</label>
        <input
          type="text"
          value={barcodeValue}
          onChange={(e) => setBarcodeValue(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Enter value for barcode"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="singleMode"
            checked={!isRange && !isBulk}
            onChange={() => { setIsRange(false); setIsBulk(false); }}
            className="rounded border-gray-300"
          />
          <label htmlFor="singleMode" className="text-sm font-medium text-gray-700">
            Single Barcode
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="rangeMode"
            checked={isRange}
            onChange={() => { setIsRange(true); setIsBulk(false); }}
            className="rounded border-gray-300"
          />
          <label htmlFor="rangeMode" className="text-sm font-medium text-gray-700">
            Generate Range
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="bulkMode"
            checked={isBulk}
            onChange={() => { setIsRange(false); setIsBulk(true); }}
            className="rounded border-gray-300"
          />
          <label htmlFor="bulkMode" className="text-sm font-medium text-gray-700">
            Bulk Input
          </label>
        </div>
      </div>

      {renderInputSection()}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Format</label>
          <select
            value={barcodeFormat}
            onChange={(e) => setBarcodeFormat(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="CODE128">Code 128</option>
            <option value="EAN13">EAN-13</option>
            <option value="UPC">UPC</option>
            <option value="CODE39">Code 39</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <select
            value={barcodeSize}
            onChange={(e) => setBarcodeSize(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || 
          (!isBulk && !isRange && !barcodeValue.trim()) || 
          (isRange && (!rangeStart || !rangeEnd)) ||
          (isBulk && !bulkInput.trim())}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {generating ? 'Generating...' : `Generate Barcodes`}
      </button>
    </div>
  );
};

export default BarcodeGenerator;