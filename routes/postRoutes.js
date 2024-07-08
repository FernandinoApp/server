const express = require("express");
const { requireSignIn } = require("../controllers/userController");
const { createPostController, getAllPostsController,  } = require("../controllers/postController");

//router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-post", requireSignIn, createPostController)

// GET ALL POSTS
router.get("/get-all-post", getAllPostsController)


//export
module.exports = router;
