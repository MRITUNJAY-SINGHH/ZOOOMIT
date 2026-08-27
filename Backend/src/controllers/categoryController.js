import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const { parent, tree } = req.query;

    let query = {};
    if (parent === 'root' || parent === 'null') {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    const categories = await Category.find(query).populate('parentCategory', 'name slug');

    if (tree === 'true') {
      const allCategories = await Category.find({});
      const rootCategories = allCategories.filter(c => !c.parentCategory);
      const categoryTree = rootCategories.map(root => ({
        ...root.toObject(),
        subcategories: allCategories.filter(c => c.parentCategory && c.parentCategory.toString() === root._id.toString())
      }));
      return res.json(categoryTree);
    }

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory', 'name slug');
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    const subcategories = await Category.find({ parentCategory: category._id });
    res.json({ category, subcategories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, image, description, parentCategory, status } = req.body;
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Category slug already exists' });

    const category = await Category.create({ 
      name, 
      slug, 
      image, 
      description,
      parentCategory: parentCategory || null, 
      status 
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { parentCategory } = req.body;
    if (parentCategory && parentCategory.toString() === req.params.id.toString()) {
      return res.status(400).json({ message: 'A category cannot be its own parent' });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Update child subcategories to have no parent or block deletion if children exist
    await Category.updateMany({ parentCategory: category._id }, { $set: { parentCategory: null } });
    await Category.deleteOne({ _id: category._id });

    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
