async function createImageFromJSON(data) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = 2000;
    canvas.height = 2000;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player data
    ctx.font = '20px Arial';
    let yOffset = 100;
    ctx.fillStyle = '#000000';
    data.playerData.forEach(player => {
        ctx.fillText(`Player Name: ${player.name}`, 50, yOffset);
        ctx.fillText(`Player Level: ${player.level}`, 50, yOffset + 30);
        ctx.fillText(`Team Name: ${player.teamName}`, 50, yOffset + 60);
        ctx.fillText(`Last Play Date: ${player.lastPlayDate}`, 50, yOffset + 90);
        ctx.fillText(`Title: ${player.title}`, 50, yOffset + 120);
        yOffset += 160;
    });

    // Best songs data
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.fillText('Best Songs Data', 50, yOffset + 30);
    yOffset += 60;
    for (const song of data.best) {
        const jacketImg = new Image();
        jacketImg.crossOrigin="anonymous";
        jacketImg.src = song.jacket; // Set image source
        await new Promise((resolve, reject) => {
            jacketImg.onload = resolve; // Resolve the promise when the image is loaded
            jacketImg.onerror = reject; // Reject the promise if there's an error loading the image
        });
        ctx.drawImage(jacketImg, 0, yOffset); // Draw the image
        ctx.fillText(`${song.title} (${diffToName(parseInt(song.diff))}) - Rating: ${song.rating}`, 50, yOffset + 100);
        yOffset += 150;
    }

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png');

    // Open a new window with the image embedded
    const newWindow = window.open();
    newWindow.document.open();
    newWindow.document.write(`<img src="${imageData}" alt="Chunithm Player Data Image">`);
    newWindow.document.close();
}


function diffToName(diff){
    switch(diff){
        case 0:
            return "Basic";
        case 1:
            return "Advanced";
        case 2:
            return "Expert";
        case 3:
            return "Master";
        case 4:
            return "Ultima";
        default:
            return diff;
    }
}

fetch('http://127.0.0.1:5500/Chunithm-Data.json')
    .then((response) => response.json())
    .then((json) => {
        console.log(json);
        createImageFromJSON(json);
    });
