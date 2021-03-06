const puppeteer = require('puppeteer-extra');
const fetch = require('node-fetch');
const chalk = require('chalk');
const fs = require('fs');
const randomuseragent = require('random-useragent');
const rs = require('readline-sync');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {

    console.log(chalk.bgBlue('\nTiktok Downloader No Watermark'));
    console.log(chalk.bgMagenta('\nAuthor: @dkmpostor'));

    var username = rs.question('\n> Enter username : ');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-notifications',
            '--no-sandbox',
            '--disable-cache',
            '--disable-application-cache'
        ]
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setUserAgent(randomuseragent.getRandom(function (ua) {
        // set user agent using windows
        return ua.osName === 'Windows';
    }));
    console.log(chalk.bgGrey("\n> Scraping "+ username +"'s tiktok videos ... \n"));
    await page.goto('https://www.tiktok.com/@' + username);

    await page.evaluate(scrollToBottom);

    // get all the posts
    let posts = await page.$x('/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/div/div');
    console.log(chalk.bgGreen('> Found : ' + posts.length + ' posts\n'));
    if (!fs.existsSync('result')) fs.mkdirSync('result')
    if (!fs.existsSync('result/' + username)) fs.mkdirSync('result/' + username)
    for (let i = 1; i <= posts.length; i++) {

        const url = await page.evaluate(el => el.href, (await page.$x('/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/div/div['+ i +']/div[1]/div/div/a'))[0])
        console.log(i + '. ' + url);

        let filename = url.split('/')[url.split('/').length - 1] + '.mp4';
        let tryDownload = await fetch('https://dkmpostor.herokuapp.com/tiktok-no-watermark?url='+ url)
        .then(res => res.json())
        .then(data => {
            if(data.status == 200) return data.url[Math.floor(Math.random() * data.url.length)];
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

// please create a function to scroll down until can't scroll anymore
async function scrollToBottom() {
    await new Promise(resolve => {
      const distance = 300; // should be less than or equal to window.innerHeight
      const delay = 300;
      const timer = setInterval(() => {
        document.scrollingElement.scrollBy(0, distance);
        if (document.scrollingElement.scrollTop + window.innerHeight >= document.scrollingElement.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
}
