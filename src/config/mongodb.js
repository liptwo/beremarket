import { MongoClient, ServerApiVersion } from 'mongodb'
import { ENV } from './environment'

let clientDB
let trelloDBInstance = null

export const connectToDatabase = async () => {
  if (!trelloDBInstance) {
    clientDB = new MongoClient(ENV.MONGO_DB, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })
    await clientDB.connect()
    trelloDBInstance = clientDB.db(ENV.DB_NAME)
  }
  return trelloDBInstance
}

export const GET_DB = () => {
  if (!trelloDBInstance) throw new Error('Must connect to Database first!')
  return trelloDBInstance
}

export const EXIT_DB = async () => {
  console.log('code chay hong')
  await clientDB.close()
}
