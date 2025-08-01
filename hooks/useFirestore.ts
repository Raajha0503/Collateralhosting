import { useState, useEffect, useCallback } from 'react'
import { 
  ClientService, 
  MarginCallService, 
  DailyActivityService,
  FirestoreService,
  Client,
  MarginCall,
  DailyActivity
} from '../lib/firestore'

// Hook for managing clients
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ClientService.getAllClients()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }, [])

  const createClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      setError(null)
      const id = await ClientService.createClient(client)
      await fetchClients() // Refresh the list
      return id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
      throw err
    }
  }, [fetchClients])

  const updateClient = useCallback(async (id: string, client: Partial<Client>) => {
    try {
      setError(null)
      await ClientService.updateClient(id, client)
      await fetchClients() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client')
      throw err
    }
  }, [fetchClients])

  const deleteClient = useCallback(async (id: string) => {
    try {
      setError(null)
      await ClientService.deleteClient(id)
      await fetchClients() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client')
      throw err
    }
  }, [fetchClients])

  const getClientsByDomicile = useCallback(async (domicile: string) => {
    try {
      setError(null)
      const data = await ClientService.getClientsByDomicile(domicile)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients by domicile')
      throw err
    }
  }, [])

  const getClientsByCurrency = useCallback(async (currency: string) => {
    try {
      setError(null)
      const data = await ClientService.getClientsByCurrency(currency)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients by currency')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientsByDomicile,
    getClientsByCurrency,
  }
}

// Hook for managing margin calls
export const useMarginCalls = () => {
  const [marginCalls, setMarginCalls] = useState<MarginCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarginCalls = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await MarginCallService.getAllMarginCalls()
      setMarginCalls(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch margin calls')
    } finally {
      setLoading(false)
    }
  }, [])

  const createMarginCall = useCallback(async (marginCall: Omit<MarginCall, 'id'>) => {
    try {
      setError(null)
      const id = await MarginCallService.createMarginCall(marginCall)
      await fetchMarginCalls() // Refresh the list
      return id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create margin call')
      throw err
    }
  }, [fetchMarginCalls])

  const updateMarginCall = useCallback(async (id: string, marginCall: Partial<MarginCall>) => {
    try {
      setError(null)
      await MarginCallService.updateMarginCall(id, marginCall)
      await fetchMarginCalls() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update margin call')
      throw err
    }
  }, [fetchMarginCalls])

  const deleteMarginCall = useCallback(async (id: string) => {
    try {
      setError(null)
      await MarginCallService.deleteMarginCall(id)
      await fetchMarginCalls() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete margin call')
      throw err
    }
  }, [fetchMarginCalls])

  const getMarginCallsByClient = useCallback(async (clientId: string) => {
    try {
      setError(null)
      const data = await MarginCallService.getMarginCallsByClient(clientId)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch margin calls by client')
      throw err
    }
  }, [])

  const getMarginCallsByStatus = useCallback(async (status: string) => {
    try {
      setError(null)
      const data = await MarginCallService.getMarginCallsByStatus(status)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch margin calls by status')
      throw err
    }
  }, [])

  const getDisputedMarginCalls = useCallback(async () => {
    try {
      setError(null)
      const data = await MarginCallService.getDisputedMarginCalls()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disputed margin calls')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchMarginCalls()
  }, [fetchMarginCalls])

  return {
    marginCalls,
    loading,
    error,
    fetchMarginCalls,
    createMarginCall,
    updateMarginCall,
    deleteMarginCall,
    getMarginCallsByClient,
    getMarginCallsByStatus,
    getDisputedMarginCalls,
  }
}

// Hook for managing daily activities
export const useDailyActivities = () => {
  const [activities, setActivities] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DailyActivityService.getAllActivities()
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }, [])

  const createActivity = useCallback(async (activity: Omit<DailyActivity, 'id'>) => {
    try {
      setError(null)
      const id = await DailyActivityService.createActivity(activity)
      await fetchActivities() // Refresh the list
      return id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity')
      throw err
    }
  }, [fetchActivities])

  const updateActivity = useCallback(async (id: string, activity: Partial<DailyActivity>) => {
    try {
      setError(null)
      await DailyActivityService.updateActivity(id, activity)
      await fetchActivities() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity')
      throw err
    }
  }, [fetchActivities])

  const deleteActivity = useCallback(async (id: string) => {
    try {
      setError(null)
      await DailyActivityService.deleteActivity(id)
      await fetchActivities() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
      throw err
    }
  }, [fetchActivities])

  const getActivitiesByDate = useCallback(async (date: Date) => {
    try {
      setError(null)
      const data = await DailyActivityService.getActivitiesByDate(date)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities by date')
      throw err
    }
  }, [])

  const getActivitiesByClient = useCallback(async (clientId: string) => {
    try {
      setError(null)
      const data = await DailyActivityService.getActivitiesByClient(clientId)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities by client')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesByDate,
    getActivitiesByClient,
  }
}

// Hook for real-time updates
export const useRealtimeCollection = <T>(
  collectionName: string,
  filters?: Array<{ field: string; operator: any; value: any }>
) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = FirestoreService.subscribeToCollection<T>(
      collectionName,
      (newData) => {
        setData(newData)
        setLoading(false)
      },
      filters
    )

    return () => unsubscribe()
  }, [collectionName, JSON.stringify(filters)])

  return { data, loading, error }
}

// Hook for batch operations
export const useBatchOperations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeBatch = useCallback(async (operations: Array<{
    type: 'create' | 'update' | 'delete'
    collection: string
    id?: string
    data?: any
  }>) => {
    try {
      setLoading(true)
      setError(null)
      await FirestoreService.batchWrite(operations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute batch operation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { executeBatch, loading, error }
} 