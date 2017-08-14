

var sidebar = require('../helpers/sidebar');
var fs = require('fs'),
    path = require('path'),
    md5 = require('MD5');

Models = require('../models');
module.exports = {

	index: function (req, res) {
		//res.send('The iamge: index controller' + req.params.image_id);
		var viewModel = {
			image: {},
            comments: []
		};
        // find the image by searching the filename matching the url parameter:
        console.log(req.params.image_id);
        Models.Image.findOne({ filename: { $regex: req.params.image_id } },
            function(err, image) {
                if (err) { throw err; }
                if (image) {
                    console.log('Image found');
                    // if the image was found, increment its views counter
                    image.views = image.views + 1;
                    // save the image object to the viewModel:
                    viewModel.image = image;
                    // save the model (since it has been updated):
                    image.save();
                    console.log('finding comments');
                    // find any comments with the same image_id as the image:
                    Models.Comment.find({ image_id: image._id }, {}, { sort: { 'timestamp': 1 } },
                        function(err, comments) {
                            if (err) throw err;
                            // save the comments collection to the viewModel:
                            console.log('retreived comments:' + comments.length);
                            viewModel.comments = comments;
                            // build the sidebar sending along the viewModel:
                            console.log('going to side bar');
                            sidebar(viewModel, function(viewModel) {
                                // render the page view with its viewModel:
                                console.log(viewModel);
                                res.render('image', viewModel);
                            });
                        }
                    );
                } else {
                    // if no image was found, simply go back to the homepage:
                    res.redirect('/');
                }
            });
    },
	create: function (req, res) {
		//res.send('The image: create post controller');
        var saveImage = function() {
            var possible = 'abcdefghijklmnopqrstuvwxyz0123456789',
                imageUrl = '';
            for (var i = 0; i < 6; i++) {
                imageUrl += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            /* Start new code: */
            // search for an image with the same filename by performing a find:
            Models.Image.find({ filename: imageUrl }, function(err, images) {
                if (images.length > 0) {
                    // if a matching image was found, try again (start over):
                    saveImage();
                } else {
                    /* end new code:*/
                    //console.log(req.files.file.path);
                    var tempPath = req.files[0].path,
                        ext = path.extname(req.files[0].originalname).toLowerCase(),
                        targetPath = path.resolve('./public/upload/' + imageUrl + ext);

                    if (ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.bmp') {
                        fs.rename(tempPath, targetPath, function(err) {
                            if (err) throw err;
                            /* Start new code: */
                            // create a new Image model, populate its details:
                            var newImg = new Models.Image({
                                title: req.body.title,
                                filename: imageUrl + ext,
                                description: req.body.description
                            });
                            // and save the new Image
                            console.log('saving to db');
                            newImg.save(function(err, image) {
                                if (err) throw err;
                                console.log("Image Uniqueid="+image.uniqueId);
                                res.redirect('/images/' + image.uniqueId);
                            });
                            /* End new code: */
                        });
                    } else {
                        fs.unlink(tempPath, function() {
                            if (err) { throw err; }

                            res.json(500, { error: 'Only image files are allowed.' });
                        });
                    }
                    /* Start new code: */
                }
            });
            /* End new code: */

        };
		saveImage();
	},
	like: function (req, res) {
        Models.Image.findOne({ filename: { $regex: req.params.image_id } },
            function(err, image) {
                if (!err && image) {
                    image.likes = image.likes + 1;
                    image.save(function(err) {
                        if (err) {
                            res.json(err);
                        } else {
                            res.json({ likes: image.likes });
                        }
                    });
                }
            });
	},
    comment: function(req, res) {
        console.log(req.params.image_id)
        Models.Image.findOne({ filename: { $regex: req.params.image_id } },
            function(err, image) {
                if (err) throw err;
                if (!err && image) {
                    console.log('retreived image');
                    console.log(req.body);
                    console.log('*******');
                    var newComment = new Models.Comment(req.body);
                    console.log(newComment.email);
                    newComment.gravatar = md5(newComment.email);
                    newComment.image_id = image._id;
                    newComment.save(function(err, comment) {
                        if (err) { throw err; }

                        res.redirect('/images/' + image.uniqueId + '#' + comment._id);
                    });
                } else {
                    res.redirect('/');
                }
            });
	},
	remove: function (req, res) {
		Models.Image.findOne({ filename: { $regex: req.params.image_id } },
			function (err, image) {
				if (err) { throw err; }

				fs.unlink(path.resolve('./public/upload/' + image.filename),
					function (err) {
						if (err) { throw err; }

						Models.Comment.remove({ image_id: image._id },
							function (err) {
								image.remove(function (err) {
									if (!err) {
										res.json(true);
									} else {
										res.json(false);
									}
								});
							});
					});
			});
	}
	
}