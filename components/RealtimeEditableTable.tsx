import React from 'react';
import { useRealtimeCollection } from '../hooks/useFirestore';
import EditableCell from './EditableCell';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  collectionName: string;
  assignedIdMap?: Record<string, string>;
}

const RealtimeEditableTable: React.FC<Props> = ({ collectionName, assignedIdMap }) => {
  const { data, loading, error } = useRealtimeCollection<Record<string, any>>(collectionName);

  // Debug logging
  React.useEffect(() => {
    console.log(`[DEBUG] ${collectionName} collection data:`, {
      totalDocuments: data?.length || 0,
      documents: data?.map(doc => ({
        id: doc.id,
        fields: Object.keys(doc).filter(key => key !== 'id'),
        hasId: !!doc.id,
        isEmpty: Object.keys(doc).length === 1 && doc.id
      })) || []
    });
  }, [data, collectionName]);

  const handleSave = async (rowId: string, field: string, value: any) => {
    try {
      const docRef = doc(db, collectionName, rowId);
      await updateDoc(docRef, { [field]: value });
    } catch (err) {
      console.error('Error updating document:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading {collectionName} data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <div className="text-red-400">Error loading data: {error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No data found in {collectionName} collection
      </div>
    );
  }

  // Get all unique fields from all documents
  const allFields = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item))
    )
  ).filter(field => {
    // Only show 'id' field for unified_data collection
    if (field === 'id') {
      return collectionName === 'unified_data';
    }
    return true;
  });

  // Add assignedId column if assignedIdMap is provided
  const displayFields = assignedIdMap ? ['assignedId', ...allFields] : allFields;

  // Filter out empty documents for display
  const displayData = data.filter(item => {
    const hasFields = Object.keys(item).some(key => key !== 'id');
    if (!hasFields) {
      console.log(`[DEBUG] Filtering out empty document with ID: ${item.id}`);
    }
    return hasFields;
  });

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          {collectionName.charAt(0).toUpperCase() + collectionName.slice(1)} Data
        </h3>
        <p className="text-sm text-gray-400">
          {displayData.length} records • Click any cell to edit
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              {displayFields.map(field => (
                <th
                  key={field}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-700 last:border-r-0"
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {displayData.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-gray-800/50 transition-colors"
              >
                {displayFields.map(field => (
                  <td
                    key={field}
                    className="px-1 py-1 border-r border-gray-700 last:border-r-0"
                  >
                    {field === 'id' ? (
                      <span className="text-gray-400 font-mono text-xs px-2 py-1 bg-gray-800 rounded">
                        {item[field]}
                      </span>
                    ) : field === 'assignedId' ? (
                      <span className="text-blue-400 font-mono text-xs px-2 py-1 bg-blue-900/30 rounded">
                        {assignedIdMap?.[item.id] || 'Not Assigned'}
                      </span>
                    ) : (
                      <EditableCell
                        rowId={item.id || `row-${index}`}
                        field={field}
                        value={item[field]}
                        onSave={handleSave}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Data updates automatically. Changes are saved to Firebase when you finish editing a cell.
        </div>
      </div>
    </div>
  );
};

export default RealtimeEditableTable; 