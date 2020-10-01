import express from 'express'
import spotifyAuthentifaction from './routes/SpotifyAuthentification.js';
import home from './routes/Home.js';

export default (io) => {
	const app = express.Router();
	
	spotifyAuthentifaction(app);
	home(app, io);

	return app
}