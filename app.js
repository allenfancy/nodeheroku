//express
var express = require('express');
//http����
var http = require('http');
//·��
var path = require('path');
//��ͼ
var ejs = require('ejs');

var multer = require('multer');

var session = require('express-session');

var bodyParser = require('body-parser');
// ͼ��
var favicon = require('serve-favicon');
//
var cookieParser = require('cookie-parser');
//
var flash = require('connect-flash');
// �ļ�
var fs = require('fs');
// ��־
var logger = require('morgan');
var Travelnotes = require('./models/travelnotes');
//���ı��༭
var ueditor = require("ueditor");
var app = express();

var mongodb = require('./common/db.js');

var config = require('./common/config')

// ���ö˿�
app.set('port', process.env.PORT || 3000);
//var port = process.env.PORT || 3000;
//�趨views��������˼����ͼ��ŵ�Ŀ¼
app.set('views',path.join(__dirname,'views'));

//�趨views��������Ϊ��ҳģ������
app.set('view engine','html');
app.engine('.html',require('ejs').__express);


// ��ž�̬�ļ�Ŀ¼�����籾���ļ�
app.use(express.static(path.join(__dirname, 'public')));
//����ͼ��
app.use(favicon(__dirname + '/public/images/favicon.ico'));
//
app.use(bodyParser.urlencoded({
	extended : false
}));


mongodb.connect(function(err){
	if(err){
		console.log(err);
		throw err;
	}
});

app.on('colse',function(err){
	mongodb.disconnect(function(err){
		if(err){
			console.log(err);
			throw err;
		}
	})
});



app.use(cookieParser());
app.use(session({
	secret:config.session_secret,
	key:config.email,
	cookie:{maxAge:1000*60*60*24*30}//30day
}));
app.use(flash());
app.use(function(req,res,next){
	res.locals.user = req.session.user;
	var err = req.session.error;
	res.locals.message = '';
	if(err){
		res.locals.message =  '<div class="alert alert-danger" style="margin-bottom: 20px;color:red;">' + err + '</div>';
	}
	next();
});

//ͼƬ���ϴ�·��
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function(req, res, next) {
    // ueditor �ͻ������ϴ�ͼƬ����
    if (req.query.action === 'uploadimage') {
        var foo = req.ueditor;
        
        var imgname = req.ueditor.filename;
        console.log(req.ueditor);
        console.log('imgname:'+imgname);
        var img_url = '/images/ueditor/' ;
        res.ue_up(img_url); //��ֻҪ����Ҫ����ĵ�ַ �������������ueditor����
    }
    //  �ͻ��˷���ͼƬ�б�����
    else if (req.query.action === 'listimage') {
        var dir_url = '/images/ueditor/';
        res.ue_list(dir_url); // �ͻ��˻��г� dir_url Ŀ¼�µ�����ͼƬ
    }
    // �ͻ��˷�����������
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}));




// ��־��Ϣ
var accessLog = fs.createWriteStream('access.log', {
	flags : 'a'
});
//������־��Ϣ
var errorLog = fs.createWriteStream('error.log', {
	flags : 'a'
});

// ��־
app.use(logger({
	stream : accessLog
}));
// multer
app.use(multer({
	dest : './public/images',
	rename : function(fieldname, filename) {
		return filename;
	}
}));

// ������Ϣ
app.use(function(err, req, res, next) {
	var meta = '[' + new Date() + '] ' + req.url + '\n';
	errorLog.write(meta + err.stack + '\n');
	next();
});

require('./routes')(app);

app.get('/', function(req, res) {
	console.log('come into home page ....');
	var sessionUser = req.session.user;
	console.log('user :  '+ sessionUser);
	if (!sessionUser || sessionUser=='undefined') {
		console.log('user is not exist');
		var sid = req.cookies.sid;
		console.log(sid);
		if (!sid || sid =='undefined') {
			console.log('come into sid undefined');
			res.setHeader("Set-Cookie", [ "sid="
					+ Math.floor(Math.random() * 10000) ]);
			Travelnotes.find({}, null, {
				limit : 10,
				sort : {
					update_time : -1
				}
			}, function(err, docs) {
				console.log('query docs:'+docs)
				res.render('home', {
					title : '��ҳ',
					user : req.session.user,
					travelnotes : docs
				});
			});
		}else{
			Travelnotes.find({}, null, {
				limit : 10,
				sort : {
					update_time : -1
				}
			}, function(err, docs) {
				res.render('home', {
					title : '��ҳ',
					user : req.session.user,
					travelnotes : docs
				});
			});
		}
	} else {
		console.log('user login');
		res.setHeader("Set-Cookie", [ "sid="
		          					+ Math.floor(Math.random() * 10000) ]);
		Travelnotes.find({}, null, {
			limit : 10,
			sort : {
				update_time : -1
			}
		}, function(err, docs) {
			res.render('home', {
				title : '��ҳ',
				user : req.session.user,
				travelnotes : docs
			});
		});
	}
});

// �˿�
http.createServer(app).listen(app.get('port'), function(req,res) {
	
	console.log('lookersup server listening on port : ' + app.get('port'));
});