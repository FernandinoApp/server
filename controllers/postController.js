
const postModel = require("../models/postModel")

//create post
const createPostController = async (req,res) => {
    try {
        const {category,title,description} = req.body
        //validate
        if(!title || !description ){
            return res.status(500).send({
                success:false,
                message: "Please Provide All Fields"

            });

        }
        const post = await postModel({
            title,
            description,
            postedBy: req.auth._id
        }).save();
        res.status(201).send({
            success: true,
            message: "Post Created Successfully",
            post,

        });
        console.log(req)
     } catch (error) {
        console.log(error)
        res.status(500).send({
            success:true,
            message:"Error in Create Post API",
            error,
        });
     }
    
};
// GET ALL POSTS
const getAllPostsController = async (req,res) => {
try {
    const posts = await postModel.find().populate("postedBy", "_id name").sort({createdAt: -1});
    res.status(200).send({
        success: true,
        message: "All Posts Data",
        posts,
    })
} catch (error) {
    console.log(error)
    res.status(500).send({
        success: false,
        message: "Error in GETALLPOST API",
        error
    })

}
};

 
module.exports = {createPostController, getAllPostsController};