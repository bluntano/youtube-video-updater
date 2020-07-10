/*
MIT License
-------------------------
Copyright (c) 2020 Bluntano
*/
const { request } = require('https');
const fs = require('fs');
const client_secret = require('./client_secret.json').web;

// for refreshing access token
let refreshToken = (refresh_token, _callback) => {
    request({
        host: 'oauth2.googleapis.com',
        path: `/token?client_id=${client_secret.client_id}&client_secret=${client_secret.client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`,
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            data = JSON.parse(data);
            _callback(data);
        });
    }).end();
};

// for getting access token
let getAccessToken = (_callback) => {
    let tokens = require('./tokens.json');

    // NOTE: redirect URI value in path is 'http://localhost/oauth2callback'
    request({
        host: "oauth2.googleapis.com",
        path: `/token?code=${tokens.auth_code}&client_id=${client_secret.client_id}&client_secret=${client_secret.client_secret}&redirect_uri=http://localhost/oauth2callback&grant_type=authorization_code`,
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        },
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            data = JSON.parse(data);
            console.log(data);

            // on first time launching the code
            // stores refresh token into tokens.json file
            // for next time
            if (data.refresh_token && !data.error) {

                let refresh_token = data.refresh_token;
    
                fs.readFile('tokens.json', 'utf-8', (err, str) => {
                    if (err) throw err;
    
                    let tokens = JSON.parse(str);
                    tokens['authorized'] = { refresh_token: refresh_token };
    
                    fs.writeFile('tokens.json', JSON.stringify(tokens, null, 4), 'utf-8', err => {
                        if (err) throw err;
                        console.log('New refresh token now in tokens.json file.');
                        _callback(data);
                    });
                });

            // bad request when access token already exists
            // then refreshes token, gets new access token
            } else if (data.error == "invalid_grant" && data.error_description == "Bad Request") {
                tokens = require('./tokens.json');
                refreshToken(tokens.authorized.refresh_token, (data) => {
                    _callback(data);
                });
            };
        });
    }).end();
};

// updates video metadata
exports.updateVideoInfo = (videoID) => {
    getAccessToken((data) => {
        console.log(data);
        let accessToken = data.access_token

        // requests video data first
        request({
            host: "www.googleapis.com",
            path: `/youtube/v3/videos?part=id,snippet,statistics&id=${videoID}`,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                data = JSON.parse(data);

                let video_data = data.items[0];
                console.log(video_data);
                let newTitle = `This video has ${video_data.statistics.viewCount} views! WOHOOO`;

                let bodyString = JSON.stringify({
                    "id": videoID,
                    "kind": "youtube#video",
                    "snippet": {
                        "title": newTitle,
                        "description": "#CodingForLife",
                        "categoryId": 24
                    }
                });

                let headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': bodyString.length
                };

                // puts new metadata to the video
                request({
                    host: 'www.googleapis.com',
                    path: `/youtube/v3/videos?part=id%2Csnippet&access_token=${accessToken}`,
                    method: 'PUT',
                    headers: headers
                }, (res) => {
                    let str = '';
                    res.on('data', (chunk) => {
                        str += chunk;
                    });
                    res.on('end', () => {
                        str = JSON.parse(str);
                        console.log(str);

                        // error occurs when token lacks permission to
                        // edit video metadata
                        if (str.error && str.error.code === 403) {
                            console.log('FORBIDDEN!!!');
                        } else {
                            console.log(`Updated!`);
                            console.log(`Title: ${str.snippet.title}`);
                        };
                    });
                }).write(bodyString);
            });
        }).end();
    });
};

// for revoking token
// just in case!
let revokeToken = (token) => {
    request({
        host: "oauth2.googleapis.com",
        path: `/revoke?token=${token}`,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
    }, (res) => {
        let str = '';
        res.on('data', (chunk) => {
            str += chunk;
        });
        res.on('end', () => {
            str = JSON.parse(str);
            console.log(str);
        });
    }).end();
};
