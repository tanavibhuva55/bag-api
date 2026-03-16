const Product = require('../model/ProductModel');
const multer = require('multer');
const path = require('path');

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

/* ========= MULTER CONFIG ========= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    }
});

/* ========= ADD PRODUCT ========= */

// exports.addProduct = [
//     upload.array('images', 3),
//     async (req, res) => {
//          if (!req.session.isAdmin) {
//             return res.status(403).json({
//                 message: "Only admin can add product"
//             });
//         }
//         try {
//             const { name, price, rating, category, color } = req.body;

//             if (!name || !price || !rating || !category || !color || !req.files || req.files.length == 0) {
//                 return res.status(400).json({
//                     message: "All fields including 3 images are required"
//                 });
//             }

//             const imageNames = req.files.map(file => file.filename);
//             const newProduct = new Product({
//                 name,
//                 images: imageNames,
//                 price,
//                 rating,
//                 category,
//                 color
//             });

//             await newProduct.save();

//             res.status(201).json({
//                 message: "Product added successfully",
//                 data: newProduct
//             });

//         } catch (error) {
//             res.status(500).json({
//                 message: "Error creating product",
//                 error: error.message
//             });
//         }
//     }
// ];

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();

        res.status(200).json({
            success: true,


            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching products",
            error: error.message
        });
    }
};

// 
/* ========= ADD PRODUCT (Updated) ========= */
exports.addProduct = [
    upload.array('images', 3),
    async (req, res) => {
        // Admin Check
        if (!req.session.isAdmin) {
            return res.status(403).json({ message: "Only admin can add product" });
        }

        try {
            const { name, price, rating, category, color, stock, status } = req.body;

            // Strict Validation for 3 images
            if (!req.files || req.files.length !== 3) {
                return res.status(400).json({ message: "Exactly 3 images are required" });
            }

            // Text field validation
            if (!name || !price || !category || !stock) {
                return res.status(400).json({ message: "Missing required text fields" });
            }

            const imageNames = req.files.map(file => file.filename);

            const newProduct = new Product({
                name,
                images: imageNames,
                price: Number(price),
                rating: Number(rating) || 5,
                category,
                color,
                stock: Number(stock),
                status: status || "In Stock"
            });

            await newProduct.save();
            res.status(201).json({ success: true, message: "Product added!", data: newProduct });

        } catch (error) {
            res.status(500).json({ message: "Error creating product", error: error.message });
        }
    }
];
/* ========= GET PRODUCT BY ID ========= */

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching product",
            error: error.message
        });
    }
};

/* ========= UPDATE PRODUCT ========= */

// /* ========= UPDATE PRODUCT (Corrected) ========= */
exports.updateProduct = [
    upload.array('images', 3), // Max 3 images allow karega
    async (req, res) => {
        // 1. Admin Authentication Check
        if (!req.session.isAdmin) {
            return res.status(403).json({ message: "Only admin can update product" });
        }

        try {
            const { id } = req.params;
            const { name, price, rating, category, color, stock, status } = req.body;

            // 2. Pehle check karein product exist karta hai ya nahi
            let product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            // 3. Update Object taiyar karein
            const updateData = {
                name: name || product.name,
                price: price ? Number(price) : product.price,
                rating: rating ? Number(rating) : product.rating,
                category: category || product.category,
                color: color || product.color,
                stock: stock ? Number(stock) : product.stock,
                status: status || product.status
            };

            // 4. Image Update Logic
            // Agar admin ne nayi files select ki hain
            if (req.files && req.files.length > 0) {
                // Agar aapne front-end par 3 ki condition lagayi hai toh:
                if (req.files.length !== 3) {
                    return res.status(400).json({ message: "Please upload exactly 3 images to replace old ones" });
                }
                updateData.images = req.files.map(file => file.filename);
            }

            // 5. Database update karein
            const updatedProduct = await Product.findByIdAndUpdate(
                id, 
                { $set: updateData }, 
                { new: true, runValidators: true }
            );

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                data: updatedProduct
            });

        } catch (error) {
            console.error("Update Error:", error);
            res.status(500).json({
                message: "Error updating product",
                error: error.message
            });
        }
    }
];
/* ========= DELETE PRODUCT ========= */

// exports.deleteProduct = async (req, res) => {
//      if (!req.session.isAdmin) {
//             return res.status(403).json({
//                 message: "Only admin can delete product"
//             });
//         }
//     try {
//         const { id } = req.params;
//         const deletedProduct = await Product.findByIdAndDelete(id);

//         if (!deletedProduct) {
//             return res.status(404).json({
//                 message: "Product not found"
//             });
//         }

//         res.status(200).json({
//             message: "Product deleted successfully"
//         });

//     } catch (error) {
//         res.status(500).json({
//             message: "Error deleting product",
//             error: error.message
//         });
//     }
// };
/* ========= DELETE PRODUCT (Final) ========= */
exports.deleteProduct = async (req, res) => {
    // 1. Session Check (Admin hai ya nahi)
    if (!req.session.isAdmin) {
        return res.status(403).json({
            message: "Only admin can delete product"
        });
    }

    try {
        const { id } = req.params;

        // 2. MongoDB se delete karein
        const deletedProduct = await Product.findByIdAndDelete(id);

        // 3. Agar ID database mein nahi mili
        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found in database"
            });
        }

        // 4. Success Response
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({
            message: "Error deleting product",
            error: error.message
        });
    }
};
