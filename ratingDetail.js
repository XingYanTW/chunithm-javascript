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
        //const genre = box.querySelector('input[name="genre"]').value;
        //const idx = box.querySelector('input[name="idx"]').value;
        const level = await fetchSongLevel(title, parseInt(diff)); // await here
        const rating = get_ra(level, score);

        musicList.push({
            title: title.trim(),
            score: score.trim(),
            diff: diff.trim(),
            //genre: genre.trim(),
            //idx: idx.trim(),
            level: level,
            rating: rating.toFixed(2)
        });
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
            const playerRating = parseFloat(playerRatingElements[0].getAttribute('src').match(/\d+\.\d+/)[0]);
            const playerTeamName = playerProfile.querySelector('.player_team_name').textContent.trim();
            const playerLastPlayDate = playerProfile.querySelector('.player_lastplaydate_text').textContent.trim();

            playerData.push({
                name: playerName,
                level: playerLevel,
                rating: playerRating,
                teamName: playerTeamName,
                lastPlayDate: playerLastPlayDate
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
    console.log(jsonData);
    download(jsonData, "songdata.json", "application/json");
}

function download(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function get_ra(ds, score) {
    let result = 0;
    switch (true) {
        case score >= 1009000:
            result = Number(ds) + 2.15;
            break;
        case score >= 1007500:
            result = Number(ds) + 2 + parseInt((score - 1007500) / 100) * 0.01;
            break;
        case score >= 1005000:
            result = Number(ds) + 1.5 + parseInt((score - 1005000) / 500) * 0.1;
            break;
        case score >= 1000000:
            result = Number(ds) + 1 + parseInt((score - 1000000) / 1000) * 0.1;
            break;
        case score >= 975000:
            result = Number(ds) + parseInt((score - 975000) / 2500) * 0.1;
            break;
        case score >= 925000:
            result = ds - 3;
            break;
        case score >= 900000:
            result = ds - 5;
            break;
        case score >= 800000:
            result = (ds - 5) / 2;
            break;
        default:
            result = 0;
            break;
    }
    return result;
}

convertToJSON();
