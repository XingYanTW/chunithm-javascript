function extractMusicData() {
    const musicList = [];
    const musicBoxes = document.querySelectorAll('.musiclist_box');

    musicBoxes.forEach(box => {
        const title = box.querySelector('.music_title').textContent;
        const score = box.querySelector('.play_musicdata_highscore .text_b').textContent.replaceAll(",", "");
        const diff = box.querySelector('input[name="diff"]').value;
        const genre = box.querySelector('input[name="genre"]').value;
        const idx = box.querySelector('input[name="idx"]').value;

        musicList.push({
            title: title.trim(),
            score: score.trim(),
            diff: diff.trim(),
            genre: genre.trim(),
            idx: idx.trim()
        });
    });

    return musicList;
}

function convertToJSON() {
    const musicData = extractMusicData();
    const jsonData = JSON.stringify(musicData, null, 2);
    console.log(jsonData);
    download(jsonData, "songdata.json", "text/plain");
}

convertToJSON();

function download(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
