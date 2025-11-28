import { StatusCodes } from 'http-status-codes'
import { categoryModel } from '~/models/categoryModel'
import { userModel } from '~/models/userModel'
import { slugify } from '~/utils/formatters'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    // The user's role is decoded from the JWT and attached to the request object by the auth middleware.
    // We check if the user has the 'admin' role.
    if (req.jwtDecoded.role !== userModel.USER_ROLES.ADMIN) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to create a category.'
      )
    }

    const { name, parentId, image } = req.body
    // Generate a slug from the category name.
    const generatedSlug = slugify(name)

    const categoryData = {
      name,
      slug: generatedSlug,
      parentId: parentId || null,
      imageUrl: image || null
    }

    const createdCategory = await categoryModel.createNew(categoryData)
    res.status(StatusCodes.CREATED).json(createdCategory)
  } catch (error) {
    next(error)
  }
}

const getCategories = async (req, res, next) => {
  try {
    const filter = { _destroy: false } // Only retrieve non-deleted categories
    const categories = await categoryModel.find(filter)
    res.status(StatusCodes.OK).json(categories)
  } catch (error) {
    next(error)
  }
}

export const categoryController = {
  createNew,
  getCategories
}
