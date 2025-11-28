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
    const listing = await listingModel.findOneById(listingId)

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
      sortOrder = 'desc'
    } = req.query

    const filter = { _destroy: false }

    // Nếu không phải admin, áp dụng bộ lọc status mặc định
    const isAdmin = req.jwtDecoded?.role === userModel.USER_ROLES.ADMIN
    if (!isAdmin) {
      filter.status = { $nin: ['DELETED', 'EXPIRED', 'PENDING'] }
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

    // 🎯 Lọc theo trạng thái
    // Nếu admin có truyền status thì vẫn lọc theo status đó
    // Nếu không phải admin, param status sẽ ghi đè bộ lọc mặc định
    if (status) {
      filter.status = status
    }

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

    // 📌 Truy vấn
    const listings = await listingModel.find(filter, { sort })

    res.status(StatusCodes.OK).json(listings)
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
    const listings = await listingModel.find(filter)

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
