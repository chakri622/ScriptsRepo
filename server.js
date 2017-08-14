var config = require('./server/configure');
var mongoose = require('mongoose');
var app = config(app);
mongoose.connect('mongodb://localhost:27017/imgPloadr');
mongoose.connection.on('open', function () {
	console.log('Mongoose DB is connected');
});

app.set('port', process.env.PORT || 3300);
app.set('views', __dirname + '/views');

//routes
//app.get('/', function (req, res) {
//	res.send("Hello World");
//});

app.listen(app.get('port'), function () {
	console.log('Server up http://localhost:'+app.get('port'));
});

