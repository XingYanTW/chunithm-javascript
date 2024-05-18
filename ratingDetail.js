async function fetchMusicData(url) {
    const response = await fetch(url, {
        credentials: 'include'
    });
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const musicList = [];
    const musicBoxes = doc.querySelectorAll('.musiclist_box');

    for (const box of musicBoxes) {
        const title = box.querySelector('.music_title').textContent;
        const score = box.querySelector('.play_musicdata_highscore .text_b').textContent.replaceAll(",", "");
        const diff = box.querySelector('input[name="diff"]').value;
        const idx = box.querySelector('input[name="idx"]').value;

        musicList.push({
            title: title.trim(),
            score: score.trim(),
            diff: diff.trim(),
            idx: idx.trim()
        });
    }

    const songTitles = musicList.map(song => song.title);
    const songIndices = musicList.map(song => song.idx);

    // Fetch all song jackets at once
    const jackets = await fetchSongJackets(songIndices);

    for (let i = 0; i < musicList.length; i++) {
        const song = musicList[i];
        const level = await fetchSongLevel(song.title, parseInt(song.diff));
        const rating = get_ra(level, song.score);
        const jacket = jackets.find(jacket => jacket.idx === song.idx);

        musicList[i] = {
            ...song,
            level: level,
            rating: rating.toFixed(2),
            jacket: jacket ? jacket.url : null
        };
    }

    return musicList;
}
async function fetchSongLevel(songName, difficulty) {
    try {
        const response = await fetch('https://dp4p6x0xfi5o9.cloudfront.net/chunithm/data.json');
        const json = await response.json();
        const songs = json.songs;

        const filteredSongs = songs.filter(song => {
            return song.title === songName;
        });

        if (filteredSongs.length > 0) {
            const difficultyLevel = filteredSongs[0].sheets[difficulty].internalLevelValue;
            return difficultyLevel;
        } else {
            console.error('No songs found matching the criteria');
            return null;
        }
    } catch (error) {
        console.error('Error fetching song data:', error);
        throw error;
    }
}
async function fetchSongJackets(songIndices) {
    try {
        const response = await fetch('https://otoge-db.net/chunithm/data/music-ex.json');
        const json = await response.json();

        const jackets = songIndices.map(idx => {
            const song = json.find(song => song.id === idx);
            return {
                idx: idx,
                url: song ? "https://otoge-db.net/chunithm/jacket/" + song.image : null
            };
        });

        return jackets;
    } catch (error) {
        console.error('Error fetching song jackets:', error);
        throw error;
    }
}
async function fetchPlayerData(url) {
    try {
        const response = await fetch(url, {
            credentials: 'include'
        });
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const playerData = [];
        const playerProfile = doc.querySelector('.box_playerprofile');
        if (playerProfile) {
            const playerName = playerProfile.querySelector('.player_name_in').textContent.trim();
            const playerLevel = playerProfile.querySelector('.player_lv').textContent.trim();
            const playerRatingElements = playerProfile.querySelectorAll('.player_rating_num_block img');
            const playerRating = [];
            playerRatingElements.forEach(rating => {
                playerRating.push(rating.getAttribute('src'));
            })
            const playerTeamName = playerProfile.querySelector('.player_team_name').textContent.trim();
            const playerLastPlayDate = playerProfile.querySelector('.player_lastplaydate_text').textContent.trim();
            const playerTitle = playerProfile.querySelector('.player_honor_text').textContent.trim();
            const playerChara = playerProfile.querySelector('.player_chara img').getAttribute('src');
            const playerOverPower = playerProfile.querySelector('.player_overpower_text').textContent.trim();

            playerData.push({
                name: playerName,
                level: playerLevel,
                rating: playerRating,
                teamName: playerTeamName,
                lastPlayDate: playerLastPlayDate,
                title: playerTitle,
                chara: playerChara,
                overpower: playerOverPower
            });
        } else {
            console.error('Player profile not found.');
        }

        return playerData;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}
async function createImageFromJSON(data) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions (adjust height as needed)
    canvas.width = 1260;
    canvas.height = 1922;

    // Background
    // Draw the background image
    await drawBackground(ctx, canvas.width, canvas.height);

    renderPlayerData(ctx, data.playerData);
    await renderBestSongsData(ctx, data.best);

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png');

    // Trigger download
    downloadImage(imageData, 'Chunithm_Player_Data.png');
}
async function drawBackground(ctx, width, height) {
    const bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";
    bgImage.src = 'https://raw.githubusercontent.com/XingYanTW/chunithm-javascript/main/bg.png';
    
    await new Promise((resolve, reject) => {
        bgImage.onload = () => {
            ctx.drawImage(bgImage, 0, 0, width, height);
            resolve();
        };
        bgImage.onerror = reject;
    });
}
function renderPlayerData(ctx, playerData) {
    ctx.font = '20px Arial';
    let yOffset = 50;
    ctx.fillStyle = '#000000';
    playerData.forEach(player => {
        ctx.fillText(`${player.teamName}`, 50, yOffset);
        ctx.fillText(`${player.title}`, 50, yOffset + 30);
        ctx.fillText(`Lv. ${player.level} ${player.name}`, 50, yOffset + 60);
        ctx.fillText(`Last Play Date: ${player.lastPlayDate}`, 50, yOffset + 90);
        yOffset += 120;
    });
}
async function renderBestSongsData(ctx, bestSongs) {
    let yOffset = 180; // Start the grid a bit lower to avoid overlapping with player data
    const columns = 5;
    const rows = 6;
    const imageWidth = 200;
    const imageHeight = 200;
    const paddingX = 40;
    const paddingY = 60;
    const textYOffset = 30;
    const borderWidth = 5;

    for (let i = 0; i < bestSongs.length; i++) {
        const song = bestSongs[i];
        const jacketImg = new Image();
        jacketImg.crossOrigin = "Anonymous";
        jacketImg.src = song.jacket;

        try {
            await new Promise((resolve, reject) => {
                jacketImg.onload = resolve;
                jacketImg.onerror = reject;
            });

            const column = i % columns;
            const row = Math.floor(i / columns);
            const x = 50 + column * (imageWidth + paddingX);
            const y = yOffset + row * (imageHeight + textYOffset + paddingY);

            // Draw border with color based on difficulty
            ctx.strokeStyle = diffToColor(parseInt(song.diff));
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(x - borderWidth, y - borderWidth, imageWidth + 2 * borderWidth, imageHeight + 2 * borderWidth);

            // Draw image
            ctx.drawImage(jacketImg, x, y, imageWidth, imageHeight);

            // Draw text
            ctx.font = '20px Arial';
            ctx.fillStyle = diffToColor(parseInt(song.diff));

            // Center-align and cut off text if it exceeds image width
            const text1 = `${song.title}`;
            const text2 = `${song.score}`;
            const text3 = `${song.level.toFixed(1)} -> ${song.rating}`;
            const textX1 = x + (imageWidth - ctx.measureText(text1).width) / 2;
            const textX2 = x + (imageWidth - ctx.measureText(text2).width) / 2;
            const textX3 = x + (imageWidth - ctx.measureText(text3).width) / 2;
            const maxTextWidth = imageWidth;

            // Function to cut text and add ellipsis if it exceeds max width
            function cutTextToFit(text, maxWidth) {
                let width = ctx.measureText(text).width;
                if (width <= maxWidth) {
                    return text;
                }
                while (width > maxWidth && text.length > 0) {
                    text = text.slice(0, -1);
                    width = ctx.measureText(text + '...').width;
                }
                return text + '...';
            }

            const truncatedText1 = cutTextToFit(text1, maxTextWidth);
            const truncatedText2 = cutTextToFit(text2, maxTextWidth);
            const truncatedText3 = cutTextToFit(text3, maxTextWidth);

            //ctx.fillText(truncatedText1, x + (imageWidth - ctx.measureText(truncatedText1).width) / 2, y + imageHeight + textYOffset);
            //ctx.fillText(truncatedText2, x + (imageWidth - ctx.measureText(truncatedText2).width) / 2, y + imageHeight + textYOffset + 20);

            drawTextWithBorder(song, ctx, truncatedText1, x + (imageWidth - ctx.measureText(truncatedText1).width) / 2, y + imageHeight + textYOffset);
            drawTextWithBorder(song, ctx, truncatedText2, x + (imageWidth - ctx.measureText(truncatedText2).width) / 2, y + imageHeight + textYOffset+20);
            drawTextWithBorder(song, ctx, truncatedText3, x + (imageWidth - ctx.measureText(truncatedText3).width) / 2, y + imageHeight + textYOffset + 40);

        } catch (error) {
            console.error(`Failed to load image: ${song.jacket}`, error);
        }
    }
}
function drawTextWithBorder(song, ctx, text, x, y, font = '20px Arial') {
    ctx.font = font;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000'; // Black border
    ctx.strokeText(text, x, y);
    ctx.fillStyle = diffToColor(parseInt(song.diff));
    ctx.fillText(text, x, y);
}
function diffToName(diff) {
    const diffNames = ["Basic", "Advanced", "Expert", "Master", "Ultima"];
    return diffNames[diff] || diff;
}
function diffToColor(diff) {
    const diffColors = ["#0e0", "#f7ff00", "#ff0000", "#ac00ce", "#000000"];
    return diffColors[diff] || "#000000";
}
function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
async function convertToJSON() {
    const bestDataUrl = 'https://chunithm-net-eng.com/mobile/home/playerData/ratingDetailBest/';
    const recentDataUrl = 'https://chunithm-net-eng.com/mobile/home/playerData/ratingDetailRecent/';
    const playerDataUrl = 'https://chunithm-net-eng.com/mobile/home/';

    const playerData = await fetchPlayerData(playerDataUrl);
    const bestData = await fetchMusicData(bestDataUrl);
    const recentData = await fetchMusicData(recentDataUrl);

    const musicData = {
        playerData: playerData,
        best: bestData,
        recent: recentData
    };

    const jsonData = JSON.stringify(musicData, null, 2);
    console.log(JSON.stringify(playerData, null, 2));
    //download(jsonData, "Chunithm-Data.json", "application/json");
    createImageFromJSON(musicData)
}
function download(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
function get_ra(ds, score) {
    let c = ds * 100;
    const points = [
        [1010000, c + 215],
        [1009000, c + 215],
        [1007500, c + 200],
        [1005000, c + 150],
        [1000000, c + 100],
        [975000, c],
        [925000, c - 300],
        [900000, c - 500],
        [800000, (c - 500) / 2],
        [500000, 0],
        [0, 0]
    ];
    let p = 1;
    points.some(function(v, i) {
        if (score > v[0]) {
            p = i;
            return true;
        }
    });
    const prev = points[p - 1], cur = points[p];
    const ret = cur[1] + (prev[1] - cur[1]) / (prev[0] - cur[0]) * (score - cur[0]);
    return Math.floor(Math.max(0, ret)) / 100;
}

convertToJSON();
