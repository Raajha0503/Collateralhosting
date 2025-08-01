'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface UploadProgress {
  total: number
  current: number
  status: 'idle' | 'uploading' | 'completed' | 'error'
  message: string
}

interface WorkflowCsvUploaderProps {
  collectionName: string
  onUploadComplete?: () => void
}

export default function WorkflowCsvUploader({ collectionName, onUploadComplete }: WorkflowCsvUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    current: 0,
    status: 'idle',
    message: ''
  })
  const [uploadResults, setUploadResults] = useState<{
    recordsUploaded: number
    errors: string[]
    sampleData: any[]
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }
    }

    return data
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadProgress({
      total: 0,
      current: 0,
      status: 'uploading',
      message: 'Reading CSV file...'
    })

    try {
      const text = await file.text()
      const csvData = parseCSV(text)
      
      setUploadProgress(prev => ({
        ...prev,
        total: csvData.length,
        message: `Processing ${csvData.length} records...`
      }))

      const results = {
        recordsUploaded: 0,
        errors: [] as string[],
        sampleData: csvData.slice(0, 3) // Show first 3 records as sample
      }

      // Upload each row to the selected collection
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i]
        
        try {
          // Add timestamp and row number for tracking
          const documentData = {
            ...row,
            uploadedAt: new Date(),
            rowNumber: i + 1,
            fileName: file.name,
            totalRows: csvData.length
          }
          
          await addDoc(collection(db, collectionName), documentData)
          results.recordsUploaded++
        } catch (error) {
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        setUploadProgress(prev => ({
          ...prev,
          current: i + 1,
          message: `Processed ${i + 1} of ${csvData.length} records...`
        }))
      }

      setUploadResults(results)
      setUploadProgress({
        total: csvData.length,
        current: csvData.length,
        status: 'completed',
        message: 'Upload completed successfully!'
      })
      if (onUploadComplete) onUploadComplete()
    } catch (error) {
      setUploadProgress({
        total: 0,
        current: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    setUploadProgress({
      total: 0,
      current: 0,
      status: 'idle',
      message: ''
    })
    setUploadResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV to Workflow
        </CardTitle>
        <CardDescription>
          Upload any CSV file to the 'workflow_collateraldata' collection in Firestore. All data will be stored as-is.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Button 
          onClick={handleButtonClick}
          disabled={uploadProgress.status === 'uploading'}
          className="w-full"
        >
          {uploadProgress.status === 'uploading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Select CSV File
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {uploadProgress.status === 'uploading' && uploadProgress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{uploadProgress.message}</span>
              <span>{uploadProgress.current} / {uploadProgress.total}</span>
            </div>
            <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
          </div>
        )}

        {/* Status Messages */}
        {uploadProgress.status === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{uploadProgress.message}</AlertDescription>
          </Alert>
        )}

        {uploadProgress.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadProgress.message}</AlertDescription>
          </Alert>
        )}

        {/* Upload Results */}
        {uploadResults && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{uploadResults.recordsUploaded}</div>
              <div className="text-sm text-muted-foreground">Records uploaded to 'workflow_collateraldata' collection</div>
            </div>
            {/* Sample Data Preview */}
            {uploadResults.sampleData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sample Data (first 3 records):</h4>
                <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(uploadResults.sampleData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {uploadResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errors ({uploadResults.errors.length}):</div>
                  <ul className="text-xs space-y-1">
                    {uploadResults.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {uploadResults.errors.length > 5 && (
                      <li>... and {uploadResults.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={resetUpload} variant="outline" size="sm">
              Upload Another File
            </Button>
          </div>
        )}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">How it works:</p>
          <p>• Upload any CSV file with any column structure</p>
          <p>• Data is stored in the 'workflow_collateraldata' collection</p>
          <p>• Each row becomes a document with all CSV columns as fields</p>
          <p>• Additional metadata (timestamp, row number, filename) is added automatically</p>
        </div>
      </CardContent>
    </Card>
  )
} 