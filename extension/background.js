const socket = io.connect('http://localhost:8888');
console.log('test');
var callNumber = 0;
var accessToken = null;

fetch('http://localhost:8888/SpotifyAuthentification/login').then((result => {
	accessToken = result.url.split('access_token=')[1];
	console.log(accessToken);
}));

function getAccessToken() {
	return accessToken;
}

function playAudio() {
	callNumber++;
	getSoundUrl();
} 

socket.on('trackChanged', (url) => {
	if (!url) return;
	url = 'http://localhost:8888' + url;
	console.log(url);

	const sourceElement = document.getElementById("mySource");
	var source = sourceElement ? sourceElement : document.createElement("source");
	source.id = "mySource";
	source.type = "audio/wav";
	source.src = url;

	const audioElement = document.getElementById("myAudio");
	var audio = audioElement ? audioElement : document.createElement("audio");
	audio.id = "myAudio";
	audio.appendChild(source);

	document.body.appendChild(audio);

	audio.load();
	audio.play(); 
});