const puppeteer = require('puppeteer');
const config = require('./Config.json');
const ytdl = require('ytdl-core');
const fs = require('fs');

async function execute(){
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    if(!fs.existsSync("./Downloads")){
        fs.mkdirSync("./Downloads");
    }

    const page = await browser.newPage();

    await page.goto(config.playlistURL , {waitUntil: 'load' });

    console.log("YT Playlist Downloader!");
    const songsURL = await page.evaluate(() => {

        var anchors = document.getElementsByTagName('a');
        var hrefs = [];
        for(var i=0; i < anchors.length; i++){
            if(anchors[i].href.includes("/watch") && anchors[i].href.includes("&index=")){
                if(!hrefs.includes(anchors[i].href)){
                    hrefs.push(anchors[i].href);
                }
            }
        }
        
        return hrefs;
    });

    const songsNames = await page.evaluate(() => {

        var anchors = document.querySelectorAll(`[id^="video-title"]`);
        var names = [];
        for(var i=0; i < anchors.length; i++){
            names.push(anchors[i].title);
        }
        
        return names;
    });

   if(songsURL.length > 0){
    console.log(songsURL.length +" songs founded!");
   }else{
    console.log("No songs founded!");
   }
 
    const downloadFile = (file, name) => new Promise((resolve, reject) => {
         ytdl(file, {
        format: 'mp3',
        quality: 'highestaudio'
        }).pipe(fs.createWriteStream('./Downloads/'+name.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
      //TODO: Join everything in a single regex
    ).replace(/\[|\]/g, '').replace(/ +(?= )/g,'').replace(/\|/g).replace(/  +/g, ' ').replace(/\//g, '')+'.mp3').on('error',reject)).on('finish',resolve).on('error',reject);
    })

    const downloadFiles = async (files) => {
        for(let song in songsURL){
            console.log("Downloading song: "+songsNames[song]);
            await downloadFile(songsURL[song],songsNames[song]);
        }
    }

    await downloadFiles(songsURL);

    console.log("Done!!");
    await page.close();
    await browser.close();
}

execute();