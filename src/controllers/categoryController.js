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

    const { name, code, parentCode, imageUrl } = req.body
    // Generate a slug from the category name.
    const generatedSlug = slugify(name)

    const categoryData = {
      name,
      slug: generatedSlug,
      code: code || null,
      parentCode: parentCode || '',
      imageUrl: imageUrl || ''
    }

    const createdCategory = await categoryModel.createNew(categoryData)
    const newCategory = await categoryModel.findOneById(
      createdCategory.insertedId
    )
    res.status(StatusCodes.CREATED).json(newCategory)
    // res.status(StatusCodes.CREATED).json(createdCategory)
  } catch (error) {
    next(error)
  }
}

const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''

    const filter = { _destroy: false }
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: limit
    }

    const categories = await categoryModel.find(filter, options)
    const totalCategories = await categoryModel.count(filter)

    res.status(StatusCodes.OK).json({
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalItems: totalCategories
      }
    })
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const category = await categoryModel.findOneById(req.params.id)
    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found.')
    }
    res.status(StatusCodes.OK).json(category)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const updatedCategory = await categoryModel.update(req.params.id, req.body)
    if (!updatedCategory) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found.')
    }
    res.status(StatusCodes.OK).json(updatedCategory)
  } catch (error) {
    next(error)
  }
}

const deleteItem = async (req, res, next) => {
  try {
    await categoryModel.deleteItem(req.params.id)
    res
      .status(StatusCodes.OK)
      .json({ message: 'Category deleted successfully.' })
  } catch (error) {
    next(error)
  }
}

export const categoryController = {
  createNew,
  getCategories,
  getDetails,
  update,
  deleteItem
}
