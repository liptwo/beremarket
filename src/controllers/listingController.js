import { StatusCodes } from 'http-status-codes'
import { listingModel } from '~/models/listingModel'
import { ObjectId } from 'mongodb'
import { userModel } from '~/models/userModel'

const createNew = async (req, res, next) => {
  try {
    // The authenticated user's ID should be attached to the request object by the auth middleware.
    // Assuming req.user._id exists.
    const sellerId = req.jwtDecoded._id

    const listingData = {
      ...req.body,
      sellerId: sellerId.toString() // Ensure it's a string for validation
    }

    const createdListing = await listingModel.createNew(listingData)
    if (createdListing.acknowledged) {
      const newListing = await listingModel.findOneById(
        createdListing.insertedId
      )
      res.status(StatusCodes.CREATED).json(newListing)
    }
    res.status(StatusCodes.CREATED).json(createdListing)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const listingId = req.params.id
    const userId = req.jwtDecoded?._id // Lấy userId từ token nếu có

    let listing

    if (userId) {
      // Nếu người dùng đã đăng nhập, thử cập nhật lượt xem
      // Hàm này sẽ trả về listing đã cập nhật nếu user chưa xem, hoặc null nếu đã xem rồi
      await listingModel.findOneByIdAndUpdateView(listingId, userId)
    }

    // Luôn lấy thông tin mới nhất của listing sau khi đã cập nhật (hoặc không)
    listing = await listingModel.findOneById(listingId)

    if (!listing || listing._destroy) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Listing not found.' })
    }

    const seller = await userModel.findOneById(listing.sellerId)
    listing.seller = seller

    res.status(StatusCodes.OK).json(listing)
  } catch (error) {
    next(error)
  }
}
const getListings = async (req, res, next) => {
  try {
    const {
      q,
      categoryId,
      status,
      minPrice,
      maxPrice,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query

    const filter = { _destroy: false }

    // Nếu không phải admin, áp dụng bộ lọc status mặc định
    const isAdmin = req.jwtDecoded?.role === userModel.USER_ROLES.ADMIN
    if (isAdmin && status) {
      // Admin có thể lọc theo bất kỳ trạng thái nào được cung cấp
      filter.status = Array.isArray(status) ? { $in: status } : status
    } else if (!isAdmin) {
      // Người dùng thường chỉ có thể xem các bài đăng đã được xuất bản
      filter.status = 'PUBLISHED'
    }

    // 🔍 Search q (không dùng $text nữa)
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }

    // 🎯 Lọc theo danh mục
    if (categoryId) filter.categoryId = new ObjectId(categoryId)

    // 🎯 Lọc theo vị trí (tỉnh/thành)
    if (location) filter.location = { $regex: location, $options: 'i' }

    // 💰 Lọc giá
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // 🔽 Sắp xếp
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // 📌 Phân trang và Truy vấn
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Đếm tổng số document khớp với bộ lọc
    const totalItems = await listingModel.countDocuments(filter)
    const totalPages = Math.ceil(totalItems / limitNum)

    // Xây dựng pipeline để lấy dữ liệu và thông tin người bán
    const listings = await listingModel.aggregate([
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME, // 'users' collection
          localField: 'sellerId',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: {
          path: '$sellerInfo',
          preserveNullAndEmptyArrays: true // Giữ lại listing ngay cả khi không tìm thấy seller
        }
      },
      {
        $addFields: {
          seller: '$sellerInfo' // Đổi tên 'sellerInfo' thành 'seller' cho đẹp
        }
      },
      {
        $project: {
          sellerInfo: 0,
          'seller.password': 0,
          'seller.verifyToken': 0
        }
      } // Xóa trường 'sellerInfo' thừa và các trường nhạy cảm
    ])

    res.status(StatusCodes.OK).json({
      data: listings,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum
      }
    })
  } catch (error) {
    next(error)
  }
}

const getAllListingsSimple = async (req, res, next) => {
  try {
    const filter = {
      _destroy: false, // Chỉ lấy các tin đăng chưa bị xóa mềm
      status: { $nin: ['DELETED', 'EXPIRED', 'PENDING'] } // Không lấy các trạng thái này
    }
    // Sử dụng aggregation để join với thông tin người bán
    const listings = await listingModel.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'sellerId',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: {
          path: '$sellerInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      { $addFields: { seller: '$sellerInfo' } },
      {
        $project: {
          sellerInfo: 0,
          'seller.password': 0,
          'seller.verifyToken': 0
        }
      }
    ])

    res.status(StatusCodes.OK).json(listings)
  } catch (error) {
    next(error)
  }
}

const updateListing = async (req, res, next) => {
  try {
    const listingId = req.params.id
    const userId = req.jwtDecoded._id.toString()
    const updateData = req.body

    const listing = await listingModel.findOneById(listingId)

    if (!listing) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Listing not found.' })
    }

    // Check if the user trying to update is the seller
    if (listing.sellerId.toString() !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'You are not authorized to update this listing.' })
    }

    const updatedListing = await listingModel.update(listingId, updateData)
    res.status(StatusCodes.OK).json(updatedListing)
  } catch (error) {
    next(error)
  }
}

const deleteListing = async (req, res, next) => {
  try {
    const listingId = new ObjectId(req.params.id)
    const userId = req.jwtDecoded._id.toString()

    const listing = await listingModel.findOneById(listingId)

    if (!listing) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Không tìm thấy tin đăng.' })
    }

    // Check if the user trying to delete is the seller
    if (listing.sellerId.toString() !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Bạn không phải là chủ của bài đăng.' })
    }

    const result = await listingModel.deleteOneById(listingId) // This performs a soft delete
    res
      .status(StatusCodes.OK)
      .json({ message: 'Xóa bài đăng thành công.', result })
  } catch (error) {
    next(error)
  }
}

const getMyListings = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id.toString()
    const filter = {
      sellerId: new ObjectId(userId),
      _destroy: false
    }
    const listings = await listingModel.find(filter)
    res.status(StatusCodes.OK).json(listings)
  } catch (error) {
    next(error)
  }
}

export const listingController = {
  createNew,
  getDetails,
  getListings,
  updateListing,
  deleteListing,
  getMyListings,
  getAllListingsSimple
}
