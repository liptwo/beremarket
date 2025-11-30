import { StatusCodes } from 'http-status-codes'
import { listingModel } from '~/models/listingModel'
import { userModel } from '~/models/userModel'

const getStats = async (req, res, next) => {
  try {
    // --- 1. Basic Stats ---
    const totalUsers = await userModel.countDocuments({ _destroy: false })
    const activeListings = await listingModel.countDocuments({
      status: 'PUBLISHED',
      _destroy: false
    })
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newUsersThisWeek = await userModel.countDocuments({
      createdAt: { $gte: oneWeekAgo },
      _destroy: false
    })

    // --- 2. User Growth (last 6 months) ---
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const userGrowthData = await userModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, _destroy: false } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          users: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: { $concat: ['T', { $toString: '$_id.month' }] },
          users: 1
        }
      }
    ])

    // --- 3. Listing Activity (last 7 days) ---
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const listingActivityData = await listingModel.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, _destroy: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] }
          },
          inactive: {
            $sum: {
              $cond: [{ $not: { $eq: ['$status', 'PUBLISHED'] } }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id',
          active: 1,
          inactive: 1
        }
      }
    ])

    // --- 4. Recent Activities (5 new users and 5 new listings) ---
    const recentUsers = await userModel.find(
      { _destroy: false },
      { sort: { createdAt: -1 }, limit: 5 }
    )
    const recentListings = await listingModel.find(
      { _destroy: false },
      { sort: { createdAt: -1 }, limit: 5, populate: { path: 'seller' } }
    )

    res.status(StatusCodes.OK).json({
      stats: {
        totalUsers,
        activeListings,
        newUsersThisWeek
      },
      userGrowthData,
      listingActivityData,
      recentUsers,
      recentListings
    })
  } catch (error) {
    next(error)
  }
}

export const dashboardController = {
  getStats
}
