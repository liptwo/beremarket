import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { listingModel } from '~/models/listingModel'

const getStats = async (req, res, next) => {
  try {
    const totalUsers = await userModel.countDocuments({})

    const activeListings = await listingModel.countDocuments({
      status: 'PUBLISHED',
      _destroy: false
    })

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newUsersThisWeek = await userModel.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    })

    res.status(StatusCodes.OK).json({
      totalUsers,
      activeListings,
      newUsersThisWeek
    })
  } catch (error) {
    next(error)
  }
}

export const dashboardController = {
  getStats
}
