var express = require('express');
var path = require('path');
var session = require('express-session');
var upload = require('express-fileupload');
const con = require('./models/Db');

var app = express();

app.listen(8080, () => {
	console.log('Server started..');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.use(session( {secret: "1234567"} ));

app.use(upload());

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/signUp', (req, res) => {
	res.render('register');
});

app.get('/login', (req, res) => {
	res.render('index');
});

app.post('/register', (req, res) => {
	var sql = "insert into user(name, email, password) values (?, ?, ?)";
	con.query(sql, [req.body.uname, req.body.email, req.body.password], (err, result) => {
		if (err) throw err;
		else 
			res.render('register', { msg: 'Your account created successully..' });
	});
});

app.post('/login', (req, res) => {
	var uid = req.body.email;
	var sql = "select * from user where email = ? and password = ?";
	con.query(sql, [uid, req.body.password], (err, result) => {
		if (err) throw err;
		else if (result.length > 0) {
			req.session.uid = uid; 
			res.redirect('/home');
		} else 
			res.render('login', { msg: 'Login fail' });
	});
});

app.get('/home', (req, res) => {
	if (req.session.uid) {
		var sql = 'select * from news';
		con.query(sql, (err, result) => {
			if (err) throw err;
			else
				res.render('home', { layout: 'layouts/loginLayout', news: result });
		});
	} else
		res.redirect('/');
});

app.get('/addNews', (req, res) => {
	if (req.session.uid) 
		res.render('addNews', { layout: 'layouts/loginLayout' })
	else
		res.redirect('/');
});

app.post('/addNews', (req, res) => {
	if (req.session.uid) {
		// console.log('inside Add News');
		if(req.files) {
			var alldata = req.files.newsPic;
			var filename = alldata.name;
			var pwd = Math.random().toString(36).slice(-8);
			var altfname = pwd + filename;
			alldata.mv('./public/upload/' +altfname, (err) => {
				if(err) throw err;
				else {
					var today = new Date();
					var sql = 'insert into news(headline, description, user, pic, creationDate) values (?, ?, ?, ?, ?)';
					con.query(sql, [req.body.headline, req.body.content, req.session.uid, altfname, today], (err, result) => {
						if (err) throw err;
						else {
							res.render('addNews', { layout: 'layouts/loginLayout', msg: 'News added successully..' });
						}
					});
				}
			});
		} 
	} else
		res.redirect('/');
});

app.get('/logout', (req, res) => {
	if (req.session.uid) 
		req.session.destroy();
	res.redirect('/');
});

app.use((req, res) => {
	res.status(404);
	res.render('error');
});