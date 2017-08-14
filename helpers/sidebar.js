var Stats = require('./stats'),
    Images = require('./images'),
    Comments = require('./comments'),
    async = require('async');

module.exports = function(viewModel, callback) {
    async.parallel([
        function(next) {
			Stats(next);
        },
		function (next) {
			console.log('calling images.popular');
            Images.popular(next);
        },
		function (next) {
			console.log('comments.newest');
            Comments.newest(next);
        }
    ], function(err, results) {
        if (err) throw err;
        console.log(results);
        viewModel.sidebar = {
            stats: results[0],
            popular: results[1],
            comments: results[2]
        };

        callback(viewModel);
    });
};