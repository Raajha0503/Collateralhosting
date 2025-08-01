import { 
  ClientService, 
  MarginCallService, 
  DailyActivityService,
  Client,
  MarginCall,
  DailyActivity
} from './firestore'

// Import sample data
import { sampleClients, sampleMarginCalls, sampleDailyActivities } from './sampleData'

// Migration utility to populate Firestore with initial data
export class DataMigration {
  // Migrate clients data
  static async migrateClients(): Promise<void> {
    try {
      console.log('Starting clients migration...')
      
            for (const client of sampleClients) {
        const clientData: Omit<Client, 'id'> = {
          clientId: client.clientId,
          accountName: client.accountName,
          accountNumber: client.accountNumber,
          principalEntity: client.principalEntity,
          lei: client.lei,
          domicile: client.domicile,
          threshold: client.threshold,
          reportingCurrency: client.reportingCurrency,
          mta: client.mta,
          assets: client.assets,
          currencies: client.currencies,
          holidays: client.holidays,
          contact: {
            phone: client.contact.phone,
            email: client.contact.email,
          },
          notificationTime: client.notificationTime,
          settlementPeriod: client.settlementPeriod,
        }
        
        await ClientService.createClient(clientData)
        console.log(`Migrated client: ${client.accountName}`)
      }
      
      console.log('Clients migration completed successfully!')
    } catch (error) {
      console.error('Error migrating clients:', error)
      throw error
    }
  }

  // Migrate margin calls data
  static async migrateMarginCalls(): Promise<void> {
    try {
      console.log('Starting margin calls migration...')
      
      for (const marginCall of sampleMarginCalls) {
        const marginCallData: Omit<MarginCall, 'id'> = {
          clientId: marginCall.clientId,
          counterparty: marginCall.counterparty,
          callAmount: marginCall.callAmount,
          currency: marginCall.currency,
          exposure: marginCall.exposure,
          bookingStatus: marginCall.bookingStatus,
          disputeAmount: marginCall.disputeAmount,
          priceMovement: marginCall.priceMovement,
          bookingType: marginCall.bookingType,
          disputeReason: marginCall.disputeReason,
          direction: marginCall.direction,
          date: new Date(), // You might want to generate proper dates
        }
        
        await MarginCallService.createMarginCall(marginCallData)
        console.log(`Migrated margin call for client: ${marginCall.clientId}`)
      }
      
      console.log('Margin calls migration completed successfully!')
    } catch (error) {
      console.error('Error migrating margin calls:', error)
      throw error
    }
  }

  // Generate sample daily activities
  static async generateSampleActivities(): Promise<void> {
    try {
      console.log('Generating sample daily activities...')
      
      const sampleActivities: Omit<DailyActivity, 'id'>[] = sampleDailyActivities
      
      for (const activity of sampleActivities) {
        await DailyActivityService.createActivity(activity)
        console.log(`Created activity for client: ${activity.clientId}`)
      }
      
      console.log('Sample activities generation completed successfully!')
    } catch (error) {
      console.error('Error generating sample activities:', error)
      throw error
    }
  }

  // Run all migrations
  static async runAllMigrations(): Promise<void> {
    try {
      console.log('Starting all data migrations...')
      
      await this.migrateClients()
      await this.migrateMarginCalls()
      await this.generateSampleActivities()
      
      console.log('All migrations completed successfully!')
    } catch (error) {
      console.error('Error running migrations:', error)
      throw error
    }
  }

  // Clear all data (use with caution!)
  static async clearAllData(): Promise<void> {
    try {
      console.log('Clearing all data...')
      
      // Get all documents and delete them
      const clients = await ClientService.getAllClients()
      const marginCalls = await MarginCallService.getAllMarginCalls()
      const activities = await DailyActivityService.getAllActivities()
      
      // Delete clients
      for (const client of clients) {
        if (client.id) {
          await ClientService.deleteClient(client.id)
        }
      }
      
      // Delete margin calls
      for (const marginCall of marginCalls) {
        if (marginCall.id) {
          await MarginCallService.deleteMarginCall(marginCall.id)
        }
      }
      
      // Delete activities
      for (const activity of activities) {
        if (activity.id) {
          await DailyActivityService.deleteActivity(activity.id)
        }
      }
      
      console.log('All data cleared successfully!')
    } catch (error) {
      console.error('Error clearing data:', error)
      throw error
    }
  }
}

// Utility function to check if data exists
export const checkDataExists = async (): Promise<{
  clients: number
  marginCalls: number
  activities: number
}> => {
  try {
    const clients = await ClientService.getAllClients()
    const marginCalls = await MarginCallService.getAllMarginCalls()
    const activities = await DailyActivityService.getAllActivities()
    
    return {
      clients: clients.length,
      marginCalls: marginCalls.length,
      activities: activities.length,
    }
  } catch (error) {
    console.error('Error checking data existence:', error)
    throw error
  }
} 