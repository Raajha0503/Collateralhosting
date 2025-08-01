import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  collectionName: string;
  onUploadComplete?: () => void;
}

const DailyActivityCsvUploader: React.FC<Props> = ({ collectionName, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    setSuccess(false);
    setUploading(true);
    setProgress(0);
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are supported.');
      setUploading(false);
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, any>>) => {
        try {
          const rows = results.data as Record<string, any>[];
          let uploaded = 0;
          for (const row of rows) {
            await addDoc(collection(db, collectionName), row);
            uploaded++;
            setProgress((uploaded / rows.length) * 100);
          }
          setSuccess(true);
          if (onUploadComplete) onUploadComplete();
        } catch (err: any) {
          setError('Upload failed: ' + err.message);
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        setError('Parsing failed: ' + err.message);
        setUploading(false);
      },
    });
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-50/10' : 'border-gray-500 bg-gray-900/40'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <p className="text-gray-200 text-lg font-semibold mb-2">Drag & drop CSV file here, or click to select</p>
        <p className="text-gray-400 text-sm">Accepted: .csv only</p>
        {uploading && <p className="text-blue-400 mt-2">Uploading... {progress.toFixed(0)}%</p>}
        {success && <p className="text-green-400 mt-2">Upload successful!</p>}
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default DailyActivityCsvUploader; 