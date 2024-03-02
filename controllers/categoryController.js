const Category = require("../models/categoryModel")



//-----------------  load category page -----------------//

const loadCategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('category', { categories });
    } catch (error) {
        console.log(error.message);
    }
};

//-----------------  load Addcategory page -----------------//

const loadAddCategory = async (req, res) => {
    try {
        
        res.render('addcategory',{message:""});
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  Addcategory (post) -----------------//

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const cat = await Category.findOne({name:name})
        if(cat){
            res.render('addcategory',{message: "This Category alredy exists"})
        }else{
            const category = new Category({ name, description }); 

            await category.save();

            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Load EditCategory page -----------------//

const LoadEditCategory = async (req, res) => { 
    try {
        const id = req.params.id;
        
        const catData = await Category.findById(id); 
        
        if(catData) {
            res.render('editcategory',{message:"" , category:catData});
        } else {
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
    }
}


//-----------------  EditCategory (post) -----------------//

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const { name, description } = req.body;

        const cat = await Category.findOne({name:name})
        if(cat){
            const catData = await Category.findById(categoryId); 
            res.render('editcategory',{message: "This Category alredy exists", category:catData})
        }


        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
        }

        category.name = name;
        category.description = description;

        await category.save();

        res.redirect('/admin/category');
        
        
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  active and block category -----------------//

const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
        }

        
        category.status = category.status === 'active' ? 'blocked' : 'active';

        await category.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    LoadEditCategory,
    editCategory,
    toggleCategoryStatus,
}