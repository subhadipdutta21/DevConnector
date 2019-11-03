const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('..//../middleware/auth')
const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')


// create a post
router.get('/',[auth,[
    check('text','Text is required').not().isEmpty()
]],async(req,res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({errors : errors.array()})
    }

    try {
        const user = await User.findById(req.user.id).select('-password')
        const newPost = {
            text : req.body.text,
            name : user.name,
            avatar : user.avatar,
            user : req.user.id
        }

        const post = await newPost.save()
        res.json(post)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// get all posts
router.get('/',auth, async(req,res) => {
    try {
        const posts = await Post.find().sort({date : -1})
        res.json(posts)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// get a post 
router.get('/:id',auth, async(req,res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(!post) {
            return res.status(404).json({msg : 'Post not found'})
        }
        res.json(post)
    } catch (err) {
        console.log(err.message)
        if(err.kind === 'ObjectId') {
            return res.status(404).json({msg : 'Post not found'})
        }
        res.status(500).send('Server error')
    }
})

// delete a post
router.delete('/:id', auth, async(req,res)=> {
    try {
        const post = await Post.findById(req.params.id)

        if(!post) {
            return res.status(404).json({msg : 'Post not found'})
        }
        // check user
        if(post.user.toString() != req.user.id) {
            return res.status(401).json({msg : 'user not authorized'})
        }

        await post.remove()
        
    } catch (err) {
        console.log(err.message)
        if(err.kind === 'ObjectId') {
            return res.status(404).json({msg : 'Post not found'})
        }
        res.status(500).send('Server error')
    }
})

// like a post
router.put('/like/:id', auth, async(req,res)=> {
    try {
        const post = await Post.findById(req.params.id)
        // check if the post is already liked
        if(post.likes.filter(like => like.user.toString()=== req.user.id).length > 0) {
            return res.status(400).json({msg : 'Post already liked'})
        }
        post.likes.unshift({user : req.user.id})
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// unlike a post
router.put('/unlike/:id', auth, async(req,res)=> {
    try {
        const post = await Post.findById(req.params.id)
        // check if the post is already liked
        if(post.likes.filter(like => like.user.toString()=== req.user.id).length == 0) {
            return res.status(400).json({msg : 'Post is not liked yet'})
        }

        // get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)
        post.likes.splice(removeIndex , 1)
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// create a comment on a post
router.post('/comment/:id',[auth,[
    check('text','Text is required').not().isEmpty()
]],async(req,res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({errors : errors.array()})
    }

    try {
        const user = await User.findById(req.user.id).select('-password')
        const post = await Post.findById(req.params.id)
        const newComment = {
            text : req.body.text,
            name : user.name,
            avatar : user.avatar,
            user : req.user.id
        }
        post.comments.unshift(newComment)
        await post.save()
        res.json(post.comments)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// delete comment
router.delete('/comment/:id/:comment_id', auth, async(req,res)=> {
    try {
        const post = await Post.findById(req.params.id)

        // pull out a comment
        const comment = post.comments.find(
            comment => comment.id === req.params.comment_id
        )

        // make sure comment exists 
        if(!comment) {
            return res.status(404).json({msg : 'comment does not exist'})
        }

        // check user
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({msg : 'user not authorized'})
        }

        // get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id)
        post.comments.splice(removeIndex , 1)
        await post.save()
        res.json(post.comments)
        
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})



module.exports = router

