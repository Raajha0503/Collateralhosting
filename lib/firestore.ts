import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

// Types for your data structures
export interface Client {
  id?: string
  clientId: string
  accountName: string
  accountNumber: string
  principalEntity: string
  lei: string
  domicile: string
  threshold: number
  reportingCurrency: string
  mta: {
    amount: number
    currency: string
  }
  assets: string[]
  currencies: string[]
  holidays: string[]
  contact: {
    phone: string
    email: string
  }
  notificationTime: string
  settlementPeriod: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MarginCall {
  id?: string
  clientId: string
  counterparty: string
  callAmount: number
  currency: string
  exposure: number
  bookingStatus: string
  disputeAmount: number
  priceMovement: number
  bookingType: string
  disputeReason?: string
  direction: 'inbound' | 'outbound'
  date: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface DailyActivity {
  id?: string
  clientId: string
  activityType: string
  amount: number
  currency: string
  status: string
  date: Date
  createdAt?: Date
}

// Generic CRUD operations
export class FirestoreService {
  // Create a new document
  static async create<T>(collectionName: string, data: T): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error)
      throw error
    }
  }

  // Get a single document by ID
  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T
      } else {
        return null
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error)
      throw error
    }
  }

  // Get all documents from a collection
  static async getAll<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error)
      throw error
    }
  }

  // Update a document
  static async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error)
      throw error
    }
  }

  // Delete a document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error)
      throw error
    }
  }

  // Query documents with filters
  static async query<T>(
    collectionName: string,
    filters?: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q: any = collection(db, collectionName)
      
      if (filters) {
        filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value))
        })
      }
      
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection))
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount))
      }
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as object)
      })) as T[]
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error)
      throw error
    }
  }

  // Batch operations
  static async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete'
    collection: string
    id?: string
    data?: any
  }>): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      operations.forEach(operation => {
        if (operation.type === 'create') {
          const docRef = doc(collection(db, operation.collection))
          batch.set(docRef, {
            ...operation.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else if (operation.type === 'update' && operation.id) {
          const docRef = doc(db, operation.collection, operation.id)
          batch.update(docRef, {
            ...operation.data,
            updatedAt: new Date(),
          })
        } else if (operation.type === 'delete' && operation.id) {
          const docRef = doc(db, operation.collection, operation.id)
          batch.delete(docRef)
        }
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Error in batch write:', error)
      throw error
    }
  }

  // Real-time listener
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters?: Array<{ field: string; operator: any; value: any }>
  ): Unsubscribe {
    let q: any = collection(db, collectionName)
    
    if (filters) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value))
      })
    }
    
    return onSnapshot(q, (querySnapshot: any) => {
      const data = querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as object)
      })) as T[]
      callback(data)
    })
  }
}

// Specific service functions for your application data
export class ClientService {
  static async createClient(client: Omit<Client, 'id'>): Promise<string> {
    return FirestoreService.create<Client>('clients', client)
  }

  static async getClient(id: string): Promise<Client | null> {
    return FirestoreService.getById<Client>('clients', id)
  }

  static async getAllClients(): Promise<Client[]> {
    return FirestoreService.getAll<Client>('clients')
  }

  static async updateClient(id: string, client: Partial<Client>): Promise<void> {
    return FirestoreService.update<Client>('clients', id, client)
  }

  static async deleteClient(id: string): Promise<void> {
    return FirestoreService.delete('clients', id)
  }

  static async getClientsByDomicile(domicile: string): Promise<Client[]> {
    return FirestoreService.query<Client>('clients', [
      { field: 'domicile', operator: '==', value: domicile }
    ])
  }

  static async getClientsByCurrency(currency: string): Promise<Client[]> {
    return FirestoreService.query<Client>('clients', [
      { field: 'currencies', operator: 'array-contains', value: currency }
    ])
  }
}

export class MarginCallService {
  static async createMarginCall(marginCall: Omit<MarginCall, 'id'>): Promise<string> {
    return FirestoreService.create<MarginCall>('marginCalls', marginCall)
  }

  static async getMarginCall(id: string): Promise<MarginCall | null> {
    return FirestoreService.getById<MarginCall>('marginCalls', id)
  }

  static async getAllMarginCalls(): Promise<MarginCall[]> {
    return FirestoreService.getAll<MarginCall>('marginCalls')
  }

  static async updateMarginCall(id: string, marginCall: Partial<MarginCall>): Promise<void> {
    return FirestoreService.update<MarginCall>('marginCalls', id, marginCall)
  }

  static async deleteMarginCall(id: string): Promise<void> {
    return FirestoreService.delete('marginCalls', id)
  }

  static async getMarginCallsByClient(clientId: string): Promise<MarginCall[]> {
    return FirestoreService.query<MarginCall>('marginCalls', [
      { field: 'clientId', operator: '==', value: clientId }
    ], 'date', 'desc')
  }

  static async getMarginCallsByStatus(status: string): Promise<MarginCall[]> {
    return FirestoreService.query<MarginCall>('marginCalls', [
      { field: 'bookingStatus', operator: '==', value: status }
    ], 'date', 'desc')
  }

  static async getMarginCallsByDateRange(startDate: Date, endDate: Date): Promise<MarginCall[]> {
    return FirestoreService.query<MarginCall>('marginCalls', [
      { field: 'date', operator: '>=', value: startDate },
      { field: 'date', operator: '<=', value: endDate }
    ], 'date', 'desc')
  }

  static async getDisputedMarginCalls(): Promise<MarginCall[]> {
    return FirestoreService.query<MarginCall>('marginCalls', [
      { field: 'disputeAmount', operator: '>', value: 0 }
    ], 'date', 'desc')
  }
}

export class DailyActivityService {
  static async createActivity(activity: Omit<DailyActivity, 'id'>): Promise<string> {
    return FirestoreService.create<DailyActivity>('dailyActivities', activity)
  }

  static async getActivity(id: string): Promise<DailyActivity | null> {
    return FirestoreService.getById<DailyActivity>('dailyActivities', id)
  }

  static async getAllActivities(): Promise<DailyActivity[]> {
    return FirestoreService.getAll<DailyActivity>('dailyActivities')
  }

  static async updateActivity(id: string, activity: Partial<DailyActivity>): Promise<void> {
    return FirestoreService.update<DailyActivity>('dailyActivities', id, activity)
  }

  static async deleteActivity(id: string): Promise<void> {
    return FirestoreService.delete('dailyActivities', id)
  }

  static async getActivitiesByDate(date: Date): Promise<DailyActivity[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return FirestoreService.query<DailyActivity>('dailyActivities', [
      { field: 'date', operator: '>=', value: startOfDay },
      { field: 'date', operator: '<=', value: endOfDay }
    ], 'date', 'desc')
  }

  static async getActivitiesByClient(clientId: string): Promise<DailyActivity[]> {
    return FirestoreService.query<DailyActivity>('dailyActivities', [
      { field: 'clientId', operator: '==', value: clientId }
    ], 'date', 'desc')
  }
} 