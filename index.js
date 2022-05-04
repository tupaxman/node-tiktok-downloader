const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const chalk = require('chalk');
const fs = require('fs');
const randomuseragent = require('random-useragent');
const rs = require('readline-sync');

(async () => {

    // set console title to "Tiktok Downloader"
    process.title = 'Tiktok Downloader No Watermark';

    console.log('\n[+] Tiktok Downloader No Watermark');
    var username = rs.question('\n[+] Enter username : ');

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-notifications',
            '--no-sandbox',
            '--disable-cache',
            '--disable-application-cache'
        ]
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setUserAgent(randomuseragent.getRandom());
    await page.goto('https://www.tiktok.com/@' + username);

    console.log(chalk.blue('\n[+] Trying to get all posts ...\n'));
    await autoScroll(page);

    // get all the posts
    let posts = await page.$x('/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/div/div');
    console.log('[+] Found : ' + posts.length + ' posts\n');
    if (!fs.existsSync('result')) fs.mkdirSync('result')
    if (!fs.existsSync('result/' + username)) fs.mkdirSync('result/' + username)
    for (let i = 1; i <= posts.length; i++) {

        const url = await page.evaluate(el => el.href, (await page.$x('/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/div/div['+ i +']/div[1]/div/div/a'))[0])
        console.log(i + '. ' + url);

        let filename = url.split('/')[url.split('/').length - 1] + '.mp4';
        let tryDownload = await fetch('https://dkmpostor.herokuapp.com/tiktok-no-watermark?url='+ url, 
        {
            method: 'GET'
        })
        .then(res => res.json())
        .then(data => {
            if(data.status == 200) return data.url[Math.floor(Math.random() * data.url.length)];
            else return data.message;
        })

        if(tryDownload)
        {
            await fetch(tryDownload)
            .then(res => {
                res.body.pipe(fs.createWriteStream('result/' + username + '/' + filename));
                console.log(chalk.green('> Downloaded : ' + filename + '\n'));
            })
            .catch(err => {
                console.log(chalk.red('> Failed to download : ' + filename + '\n'));
                console.log(err);
            });
        } else {
            console.log(chalk.yellow('> No download url found !' + '\n'));
        }

    }

    await browser.close();

})();

// please create function to scroll down until can't scroll anymore
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}