'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Database, Cloud, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useClients, useMarginCalls, useDailyActivities } from '../hooks/useFirestore'
import { checkDataExists } from '../lib/migrateData'

interface DataSourceToggleProps {
  onDataSourceChange: (source: 'mock' | 'firebase') => void
  currentSource: 'mock' | 'firebase'
}

export default function FirebaseDataToggle({ onDataSourceChange, currentSource }: DataSourceToggleProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [dataCounts, setDataCounts] = useState<{
    clients: number
    marginCalls: number
    activities: number
  } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  const { clients, loading: clientsLoading, error: clientsError } = useClients()
  const { marginCalls, loading: marginCallsLoading, error: marginCallsError } = useMarginCalls()
  const { activities, loading: activitiesLoading, error: activitiesError } = useDailyActivities()

  // Check Firebase connection and data counts
  useEffect(() => {
    const checkFirebaseStatus = async () => {
      setIsChecking(true)
      try {
        const counts = await checkDataExists()
        setDataCounts(counts)
        setConnectionStatus('connected')
      } catch (error) {
        console.error('Firebase connection error:', error)
        setConnectionStatus('error')
      } finally {
        setIsChecking(false)
      }
    }

    if (currentSource === 'firebase') {
      checkFirebaseStatus()
    }
  }, [currentSource])

  // Monitor connection status based on hook errors
  useEffect(() => {
    if (currentSource === 'firebase') {
      if (clientsError || marginCallsError || activitiesError) {
        setConnectionStatus('error')
      } else if (!clientsLoading && !marginCallsLoading && !activitiesLoading) {
        setConnectionStatus('connected')
      }
    }
  }, [clientsError, marginCallsError, activitiesError, clientsLoading, marginCallsLoading, activitiesLoading, currentSource])

  const handleRefreshData = async () => {
    setIsChecking(true)
    try {
      const counts = await checkDataExists()
      setDataCounts(counts)
      setConnectionStatus('connected')
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setIsChecking(false)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Connection Error</Badge>
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDataSourceIcon = () => {
    return currentSource === 'firebase' ? <Cloud className="h-5 w-5" /> : <Database className="h-5 w-5" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getDataSourceIcon()}
          Data Source Configuration
        </CardTitle>
        <CardDescription>
          Choose between mock data and Firebase Firestore as your data source.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Data Source */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="font-medium">
              Current Source: {currentSource === 'firebase' ? 'Firebase Firestore' : 'Mock Data'}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentSource === 'firebase' 
                ? 'Real-time data from your Firestore database'
                : 'Static mock data for development and testing'
              }
            </div>
          </div>
          {currentSource === 'firebase' && getConnectionStatusBadge()}
        </div>

        {/* Data Source Toggle Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={currentSource === 'mock' ? 'default' : 'outline'}
            onClick={() => onDataSourceChange('mock')}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Database className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Mock Data</div>
              <div className="text-xs text-muted-foreground">Development</div>
            </div>
          </Button>
          
          <Button
            variant={currentSource === 'firebase' ? 'default' : 'outline'}
            onClick={() => onDataSourceChange('firebase')}
            disabled={connectionStatus === 'error'}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Cloud className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Firebase</div>
              <div className="text-xs text-muted-foreground">Production</div>
            </div>
          </Button>
        </div>

        {/* Firebase Status Information */}
        {currentSource === 'firebase' && (
          <div className="space-y-3">
            {/* Connection Status */}
            {connectionStatus === 'connected' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully connected to Firebase Firestore. Real-time data is being loaded.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to connect to Firebase. Please check your configuration and try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Data Counts */}
            {dataCounts && connectionStatus === 'connected' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Records:</span>
                  <Button
                    onClick={handleRefreshData}
                    disabled={isChecking}
                    size="sm"
                    variant="outline"
                  >
                    {isChecking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{dataCounts.clients}</div>
                    <div className="text-muted-foreground">Clients</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{dataCounts.marginCalls}</div>
                    <div className="text-muted-foreground">Margin Calls</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">{dataCounts.activities}</div>
                    <div className="text-muted-foreground">Activities</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading States */}
            {(clientsLoading || marginCallsLoading || activitiesLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading data from Firebase...
              </div>
            )}

            {/* Real-time Data Info */}
            {connectionStatus === 'connected' && !clientsLoading && !marginCallsLoading && !activitiesLoading && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <div className="font-medium mb-1">Real-time Updates Active</div>
                <div>Data will automatically update when changes are made to your Firestore database.</div>
              </div>
            )}
          </div>
        )}

        {/* Mock Data Info */}
        {currentSource === 'mock' && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <div className="font-medium mb-1">Mock Data Mode</div>
            <div>Using static mock data for development and testing purposes. No external database connection required.</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 