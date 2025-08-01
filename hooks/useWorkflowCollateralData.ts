import { useState, useEffect } from 'react'
import { 
  collection, 
  query,
  orderBy, 
  limit, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface WorkflowCollateralDataRecord {
  id: string
  [key: string]: any // Allow any fields from CSV
  uploadedAt: Date
  rowNumber: number
  fileName: string
  totalRows: number
}

export const useWorkflowCollateralData = (collectionName: string = 'workflow_collateraldata', limitCount?: number) => {
  const [data, setData] = useState<WorkflowCollateralDataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    let q: any = collection(db, collectionName)
    // Remove orderBy('uploadedAt') to allow collections without that field
    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot: any) => {
        const records: WorkflowCollateralDataRecord[] = []
        querySnapshot.forEach((doc: any) => {
          const data = doc.data()
          records.push({
            id: doc.id,
            ...data
          })
        })
        setData(records)
        setLoading(false)
      },
      (err: any) => {
        console.error('Error fetching workflow collateral data:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [collectionName, limitCount])

  const getUniqueFields = () => {
    if (data.length === 0) return []
    const allFields = new Set<string>()
    data.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== 'id') {
          allFields.add(key)
        }
      })
    })
    return Array.from(allFields).sort()
  }

  return {
    data,
    loading,
    error,
    getUniqueFields,
    totalRecords: data.length
  }
} 