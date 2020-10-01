import express from 'express'
import querystring from 'querystring'
import request from 'request'
import fs from 'fs'

const route = express.Router();

export default (app) => {
	app.use('/SpotifyAuthentification', route);
	
	const rawConfig = fs.readFileSync(process.cwd() + '/config/SpotifyClientAuthentification.json');
	const config = JSON.parse(rawConfig);

	route.get('/login', function(req, res) {
		res.redirect('https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: config.clientId,
				scope: 'user-read-private user-read-email user-read-currently-playing user-read-playback-state user-modify-playback-state streaming',
				redirect_uri: config.redirectUri
		}))
	});

	route.get('/callback', function(req, res) {
		let code = req.query.code || null
		let authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: config.redirectUri,
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + (new Buffer.from(config.clientId + ':' + config.clientSecret).toString('base64'))
			},
			json: true
		}
		request.post(authOptions, function(error, response, body) {
			var access_token = body.access_token;
			let uri = '/';
			res.redirect(uri + '?access_token=' + access_token);
		})
	});
};