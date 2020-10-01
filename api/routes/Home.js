import express from 'express'
import request from 'request'
import path from 'path'
import say from 'say'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const route = express.Router();
const intervals = [];

export default (app, io) => {
	app.use('/', route);

	const requestCurrentlyPlaying = (accessToken, res, socketId) => {
		if (intervals[socketId] && !intervals[socketId].initialized) {
			io.emit('trackChanged');
			intervals[socketId].initialized = true;
		}
	
		request('https://api.spotify.com/v1/me/player/currently-playing', {
			json: true,
			headers: { 'Authorization': 'Bearer ' + accessToken }
		}, (err, res, body) => {
			if (err) { return console.log(err); }
			if (!intervals[socketId]) return;
	
			const trackName = body.item?.name;
			const artistsName = body.item?.artists.map(artist => artist.name);
	
			// say.getInstalledVoices((err, voices) => console.log(voices))
	
			let toSay = trackName + ' by ' + artistsName;
			toSay = toSay == "undefined by undefined" ? "fucking ads" : toSay;
			
			if (shouldUpdateCurrentTrack(socketId, toSay)) {
				const path = '/says/' + socketId + '_' + generateId(5) + '.wav';
				say.export(toSay, 'Microsoft David Desktop', 0.85, process.cwd() + path, (err) => {
					if (err) return console.error(err);
					if (!intervals[socketId]) return;
	
					addCurrentlyPlayingTrackToJson(socketId, toSay, socketId + '_' + generateId(5))
	
					io.emit('trackChanged', path);
					console.log('saved at ', process.cwd() + path);
				});
			}
		})
	}

	function generateId(length) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
		   result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	 }
	
	const getFilePath = (socketId) => {
		const currentlyPlayingTracks = getCurrentlyPlayingTracksJson();
		
		const track = currentlyPlayingTracks.tracks[socketId];
		if (!track) return null;
		
		const fileName = track.url + '.wav';
		const path = '/says/' + fileName;
	
		return path;
	}
	
	const shouldUpdateCurrentTrack = (socketId, currentlyPlayingTrackName) => {
		const currentlyPlayingTracks = getCurrentlyPlayingTracksJson();
		// console.log(!currentlyPlayingTracks.tracks[socketId] || currentlyPlayingTracks.tracks[socketId] !== currentlyPlayingTrackName);
		return currentlyPlayingTracks.tracks[socketId]?.toSay !== currentlyPlayingTrackName;
	}
	
	const getCurrentlyPlayingTracksJson = () => {
		const rawdata = fs.readFileSync(process.cwd() + '/says/currentlyPlayingTracks.json');
		return JSON.parse(rawdata);
	}
	
	const updateCurrentlyPlayingTracksJson = (tracks) => {
		const data = JSON.stringify(tracks);
		fs.writeFileSync(process.cwd() + '/says/currentlyPlayingTracks.json', data);
	}
	
	const addCurrentlyPlayingTrackToJson = (socketId, toSay, url) => {
		const currentlyPlayingTracks = getCurrentlyPlayingTracksJson();
		currentlyPlayingTracks.tracks[socketId] = {};
		currentlyPlayingTracks.tracks[socketId].toSay = toSay;
		currentlyPlayingTracks.tracks[socketId].url = url;
	
		updateCurrentlyPlayingTracksJson(currentlyPlayingTracks);
	}
	
	route.get('/', (req, res) => {
		const accessToken = req.query.access_token;
		
		io.on('connection', (socket) => {
			if (!intervals[socket.id]) {
				const newInterval = setInterval(() => requestCurrentlyPlaying(accessToken, res, socket.id), 2000);
				intervals[socket.id] = { interval: newInterval, initialized: false, accessToken: accessToken };
				console.log(socket.id + ' connected');
			}
	
			socket.on('disconnect', (_reason) => {
				console.log(socket.id + ' has disconnected');
				const interval = intervals[socket.id];
				
				// removeCurrentlyPlayingTrackToJson(accessToken);
				// deleteCurrentlyPlayingTrackWavFile(accessToken);
	
				if (interval) {
					clearInterval(interval.interval);
					delete intervals[socket.id];
				}
			});
		});
	})

	const removeCurrentlyPlayingTrackToJson = (socketId) => {
		const currentlyPlayingTracks = getCurrentlyPlayingTracksJson();
		delete currentlyPlayingTracks.tracks[socketId];
	
		updateCurrentlyPlayingTracksJson(currentlyPlayingTracks);
	}
	
	const deleteCurrentlyPlayingTrackWavFile = (socketId) => {
		fs.unlinkSync(getFilePath(socketId));
	}
}