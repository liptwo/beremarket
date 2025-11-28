import { StatusCodes } from 'http-status-codes'
import { listingModel } from '~/models/listingModel'

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

    res.status(StatusCodes.OK).json(listing)
  } catch (error) {
    next(error)
  }
}

const getListings = async (req, res, next) => {
  try {
    // Basic filtering, can be expanded
    const { category, status, minPrice, maxPrice, location } = req.query
    const filter = { _destroy: false } // Don't show soft-deleted items

    if (category) filter.category = category
    if (status) filter.status = status
    if (location) filter.location = new RegExp(location, 'i') // Case-insensitive search for location

    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseInt(minPrice, 10)
      if (maxPrice) filter.price.$lte = parseInt(maxPrice, 10)
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
    const listingId = req.params.id
    const userId = req.jwtDecoded._id.toString()

    const listing = await listingModel.findOneById(listingId)

    if (!listing) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Listing not found.' })
    }

    // Check if the user trying to delete is the seller
    if (listing.sellerId.toString() !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'You are not authorized to delete this listing.' })
    }

    const result = await listingModel.deleteOneById(listingId) // This performs a soft delete
    res
      .status(StatusCodes.OK)
      .json({ message: 'Listing deleted successfully.', result })
  } catch (error) {
    next(error)
  }
}

export const listingController = {
  createNew,
  getDetails,
  getListings,
  updateListing,
  deleteListing
}
