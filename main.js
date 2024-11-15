let json = [];

async function setupFetch() {
    const response = await fetch('https://dp4p6x0xfi5o9.cloudfront.net/chunithm/data.json');
    json = await response.json();
}

async function fetchMusicData(url) {
    console.log("Fetching music data from URL:", url);
    const response = await fetch(url, {
        credentials: 'include'
    });
    console.log("Response received:", response);

    const text = await response.text();
    console.log("Response text fetched:", text);

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    console.log("HTML parsed:", doc);

    const musicList = [];
    const musicBoxes = doc.querySelectorAll('.musiclist_box');
    console.log("Music boxes found:", musicBoxes);

    for (const box of musicBoxes) {
        const title = box.querySelector('.music_title').textContent;
        console.log("Title found:", title);

        const score = box.querySelector('.play_musicdata_highscore .text_b').textContent.replaceAll(",", "");
        console.log("Score found:", score);

        const diff = box.querySelector('input[name="diff"]').value;
        console.log("Difficulty value found:", diff);

        const idx = box.querySelector('input[name="idx"]').value;
        console.log("Index value found:", idx);

        musicList.push({
            title: title.trim(),
            score: score.trim(),
            diff: diff.trim(),
            idx: idx.trim()
        });
        console.log("Music list updated:", musicList);
    }

    const songTitles = musicList.map(song => song.title);
    console.log("Song titles extracted:", songTitles);

    const songIndices = musicList.map(song => song.idx);
    console.log("Song indices extracted:", songIndices);

    // Fetch all song jackets at once
    const jackets = await fetchSongJackets(songIndices);
    console.log("Jackets fetched:", jackets);

    for (let i = 0; i < musicList.length; i++) {
        const song = musicList[i];
        console.log("Processing song:", song);
        let level;
        try{
            level = await fetchSongLevel(song.title, parseInt(song.diff));
        } catch (e){
            console.log(e);
        }   
        console.log("Level fetched for song:", level);
        const rating = get_ra(level, song.score);
        console.log("Rating calculated:", rating);

        const jacket = jackets.find(jacket => jacket.idx === song.idx);
        console.log("Jacket found:", jacket);

        musicList[i] = {
            ...song,
            level: level,
            rating: rating.toFixed(2),
            jacket: jacket ? jacket.url : null
        };
        console.log("Updated song data:", musicList[i]);
    }

    console.log("Final music list:", musicList);
    return musicList;
}

async function fetchSongLevel(songName, difficulty) {
    try {
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
            const playerTeamName = playerProfile.querySelector('.player_team_name')?.textContent.trim() || "";
            const playerLastPlayDate = playerProfile.querySelector('.player_lastplaydate_text').textContent.trim();
            const playerTitle = playerProfile.querySelector('.player_honor_text').textContent.trim();
            const playerChara = playerProfile.querySelector('.player_chara img').getAttribute('src');
            const playerOverPower = playerProfile.querySelector('.player_overpower_text').textContent.trim();
            const playerTitlePlate = playerProfile.querySelector('.player_honor_short').style.backgroundImage.slice(5,-2);

            playerData.push({
                name: playerName,
                level: playerLevel,
                rating: playerRating,
                teamName: playerTeamName,
                lastPlayDate: playerLastPlayDate,
                title: playerTitle,
                plate: playerTitlePlate,
                chara: playerChara,
                overpower: playerOverPower
            });
        } else {
            alert('Player profile not found.');
            document.getElementById("whiteblock").remove();
        }
        return playerData;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}
async function createImageFromJSON(data) {
    let whiteblocktext = document.getElementById("whiteblocktext");
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions (adjust height as needed)
    canvas.width = 1260;
    canvas.height = 1922;

    // Background
    // Draw the background image
    await drawBackground(ctx, canvas.width, canvas.height);
    whiteblocktext.innerText += "\ndownloading Song Jackets";
    renderPlayerData(ctx, data.playerData);
    await renderBestSongsData(ctx, data.best);

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png');

    // Trigger download
    
    
    downloadImage(imageData, 'Chunithm_Player_Data.png');
    whiteblocktext.innerText += "\nDone."
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
    ctx.fillStyle = "rgb(128, 128, 128, 0.7)";
    ctx.fillRect(32, 161, 1196, 1751);
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
            drawTextWithBorder(song, ctx, truncatedText2, x + (imageWidth - ctx.measureText(truncatedText2).width) / 2, y + imageHeight + textYOffset + 20);
            drawTextWithBorder(song, ctx, truncatedText3, x + (imageWidth - ctx.measureText(truncatedText3).width) / 2, y + imageHeight + textYOffset + 40);

        } catch (error) {
            console.error(`Failed to load image: ${song.jacket}`, error);
        }
    }
}
function drawTextWithBorder(song, ctx, text, x, y, font = '20px Arial') {
    ctx.font = font;
    ctx.lineWidth = 3;
    //ctx.strokeStyle = '#000000'; // Black border
    //ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
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

function whiteblock() {
    let whiteBlock = document.createElement('div');
    whiteBlock.style.width = '500px';
    whiteBlock.style.position = 'fixed';
    whiteBlock.style.top = '50%';
    whiteBlock.style.left = '50%';
    whiteBlock.style.transform = 'translate(-50%, -50%)';
    whiteBlock.style.backgroundColor = 'white';
    whiteBlock.style.padding = '20px';
    whiteBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
    whiteBlock.style.borderRadius = '8px';
    whiteBlock.style.zIndex = '1000';
    whiteBlock.innerHTML = '<div id="intro"><h id="title">Chunithm Best 30 Image Generator</h><br><a href="https://github.com/XingYanTW/chunithm-javascript" target="_blank">Chunithm-Javascript</a></div><hr><div id="whiteblocktext"></div> <br> <div id="whiteblockbutton" onClick="document.getElementById(\'whiteblock\').remove()">close</div>'
    whiteBlock.setAttribute("id", "whiteblock");
    document.body.appendChild(whiteBlock);
    let button = document.getElementById("whiteblockbutton");
    button.style.background = 'lime';
    button.style.borderRadius = '8px';
    button.style.width = '100px';
    button.style.marginLeft = '38%';
    button.style.padding = '10px 0';
    button.style.webkitUserSelect = 'none';
    button.style.mozUserSelect = 'none';
    button.style.msUserSelect = 'none';
    button.style.userSelect = 'none';
    button.style.boxShadow = 'rgba(0, 0, 0, 0.5) 0px 0px 5px'
    button.style.textAlign = 'center';
    let intro = document.getElementById("intro");
    intro.style.textAlign = 'left';
    let texts = document.getElementById("whiteblocktext");
    texts.style.textAlign = 'left';
    let title = document.getElementById("title");
    title.style.fontSize= '20px';
}

async function convertToJSON() {

    if (window.location.href.startsWith("https://new.chunithm-net.com/")) {
        alert("Japanese ver. is not supported.");
        return;
    } else if (!window.location.href.startsWith("https://chunithm-net-eng.com/")) {
        alert("This is not Chunithm-Net.");
        return;
    }

    if (document.getElementById("whiteblock")){
        alert("Don't use the script multiply!");
        return;
    }

    whiteblock();
    let whiteblocktext = document.getElementById("whiteblocktext");

    whiteblocktext.innerText = "fetching Songs Data\n";
    await setupFetch();
    
    const bestDataUrl = 'https://chunithm-net-eng.com/mobile/home/playerData/ratingDetailBest/';
    //const recentDataUrl = 'https://chunithm-net-eng.com/mobile/home/playerData/ratingDetailRecent/';
    
    const playerDataUrl = 'https://chunithm-net-eng.com/mobile/home/';

    whiteblocktext.innerHTML += "\n fetching Player Data";
    const playerData = await fetchPlayerData(playerDataUrl);
    whiteblocktext.innerHTML += "<br>fetching Best Songs";
    let bestData;
    try{
        bestData = await fetchMusicData(bestDataUrl);
    } catch (e){
        whiteblocktext.innerHTML += "<br>"+e;
    }
    //const recentData = await fetchMusicData(recentDataUrl);
    //console.log(await fetchPlayerData(playerDataUrl));

    const musicData = {
        playerData: playerData,
        best: bestData,
        //recent: recentData
    };

    //const jsonData = JSON.stringify(musicData, null, 2);
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
    points.some(function (v, i) {
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
