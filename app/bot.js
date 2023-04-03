require('dotenv').config();

const cheerio = require("cheerio");
const pptr = require("puppeteer");
const path = require('path');
const fs = require("fs");

const logger = (message) => {
    console.info(message + "\n");
}

const delay = (ms) => {
    return new Promise(function(resolve) { 
        setTimeout(resolve, ms)
    });
}

const bot = {
    browser: null,
    page: null,
    client: null,

    init: async () => {
        this.browser = await pptr.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox'], // we can use '--start-fullscreen' || --start-maximized
        });
        this.page = await this.browser.newPage();
        this.client = await this.page.target().createCDPSession();
        
        await this.page.setUserAgent(
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.104 Safari/537.36'
        );
    },

    start: async () => {
        const url = process.env.MDR2_URL;
        logger(`Opening ${url}...`);

        await this.page.goto(url, { waitUntil: 'networkidle2' });

        logger(`Succesfully redirected to ${url}`);
    },
    
    close: async () => {
        logger(`Closing Browser...`);
        await delay(3000);

        await this.browser.close();
        logger(`Browser successfully closed`);
    },

    login: async () => {
        logger(`Start login...`);

        await delay(2000);

        // 1.1 Type Company ID
        await this.page.type(`.form-group .tni-input[placeholder="lang.enter_company"] input`, process.env.MDR2_USER, { delay: 100 });
        await delay(2000);

        // 1.2 Type User ID
        await this.page.type(`.form-group .tni-input[placeholder="lang.enter_user_id"] input`, process.env.MDR2_UNIT, { delay: 100 });
        await delay(2000);

        // 1.2 Type User Password
        await this.page.type(`.form-group .tni-input[placeholder="lang.enter_user_password"] input`, process.env.MDR2_PASS, { delay: 100 });
        await delay(2000);

        // 1.3 Click Button Login
        await this.page.click('button[data-id="btnLogin"]');

        await new Promise((resolve) => {
            const interval = setInterval(async () => {
                const content = await this.page.content();
                const $ = await cheerio.load(content);
                const elem = $("#header > header > div.navbar-menu.yamm > div > ul > li:nth-child(3) > a");

                if (elem.length) {
                    clearInterval(interval);
                    logger("Succesfully Login");
                    resolve();
                }
            }, 1000);
        });
    },

    logout: async () => {
        await delay(5000);

        await this.page.click(`#header > header > div.navbar.navbar-static-top > div > ul > li.nav-logout > button`);

        logger(`Succesfully Logout`);
    },

    scrape: async (postingDate) => {
        console.log("Start Scrape");

        await delay(5000);
        let popupSelector = await this.page.$("#importantNotice > div > div > div.modal-body.clearfix > div.btn-placeholder.pull-right.clearfix.m_t_20 > button.btn.btn-primary");
        await this.page.evaluate((submit) => { submit.click(); }, popupSelector);

        await delay(2000);
        let accountMenuSelector = await this.page.$("#header > header > div.navbar-menu.yamm > div > ul > li:nth-child(3) > a");
        await this.page.evaluate((submit) => { submit.click(); }, accountMenuSelector);

        await delay(2000);
        let accountStatementMenuSelector = await this.page.$("#header > header > div.navbar-menu.yamm > div > ul > li.dropdown.pull-left.yamm-fw.open > ul > li > div > div > ul:nth-child(3) > li:nth-child(2) > a");
        await this.page.evaluate((submit) => { submit.click(); }, accountStatementMenuSelector);

        await this.page.waitForNavigation();
        await this.page.waitForSelector("a[placeholder='Select Account']");

        // Click Account Number Selectbox
        await delay(5000);
        
        const items = [1, 2, 3];

        try {
            if (postingDate) {
                let i = 0;
                const iMax = postingDate.length;

                for (; i < iMax; i++) {
                    await this.page.evaluate((postingDate, i) => {
                        // 1 = Yesterday, 2 = Last Week, 3 = Last Month, 4 = Today

                        document.querySelector(`select[name="postingDate"] > option:nth-child(${postingDate[i]})`).selected = true;
                        element = document.querySelector('select[name="postingDate"]');
                        var event = new Event('change', { bubbles: true });
                        event.simulated = true;
                        element.dispatchEvent(event);
                    }, postingDate, i);

                    await delay(2000);

                    for (const i of items) {
                        await new Promise(async (resolve) => {
                            let accountNumberSelect = await this.page.$("a[placeholder='Select Account']");
                            await this.page.evaluate((submit) => { submit.click(); }, accountNumberSelect);
                    
                            await delay(2000);
                
                            let lists = await this.page.$(`a[placeholder='Select Account'] + div ul[id*=ui-select-choices] li:nth-child(${i})`);
                            await this.page.evaluate((submit) => { submit.click() }, lists);
                            await delay(5000);
                
                            let downloadBtn = await this.page.$("#content > ng-include:nth-child(2) > div.container.custom-container.ng-scope > div > section.no-print > div.content.p_20 > ng-include:nth-child(2) > form > div:nth-child(4) > div > div > button:nth-child(2)");
                            await this.page.evaluate((submit) => { submit.click() }, downloadBtn);
                            await delay(5000);
                
                            let fileTypeBtn = await this.page.$("div[role='formDownload']");
                            await this.page.evaluate((submit) => { submit.click() }, fileTypeBtn);
                            await delay(5000);
                
                            let optFileTypeBtn = await this.page.$(".md-select-menu-container md-content md-option:nth-child(6)");
                            await this.page.evaluate((submit) => { submit.click() }, optFileTypeBtn);
                            await delay(5000);
                
                            let okDownload = await this.page.$("button[ng-click='download()']");
                            await this.page.evaluate((submit) => { submit.click() }, okDownload);
                            await delay(5000);
                
                            let okConfirm = await this.page.$("button[ng-click='ok()']");
                            await this.page.evaluate((submit) => { submit.click() }, okConfirm);
                            await delay(5000);
                            resolve();
                        });
                    }
                }
            }

            // Navigate to Report
            let reportBtn = await this.page.$("#header > header > div.navbar.navbar-static-top > div > ul > li.nav-download.ng-scope > a");
            await this.page.evaluate((submit) => { submit.click(); }, reportBtn);
            await delay(5000);

            const downloadPath = path.resolve("./downloads");

            await this.client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadPath
            });

            await new Promise(async (resolve) => {
                let downloadFileBtn = await this.page.$$("div[st-safe-src='reportOverviewList.data'] a[ng-click='actionDownload(row)']");

                for (const element of downloadFileBtn) {
                    await this.page.evaluate((submit) => { submit.click(); }, element);
                    await delay(5000);
                }

                resolve();
            });

            let checkAllBtn = await this.page.$('input[ng-model="selectAll"]');
            await this.page.evaluate((submit) => { submit.click(); }, checkAllBtn);
            await delay(1000);

            let removeAllBtn = await this.page.$('#content > ng-include > div > div > section:nth-child(3) > div > div.content > button.btn.btn-danger.ng-binding');
            await this.page.evaluate((submit) => { submit.click(); }, removeAllBtn);
            await delay(1000);

            let confirmRemoveAllBtn = await this.page.$('body > div.md-dialog-container.ng-scope > md-dialog > form > md-dialog-actions > button.md-primary.md-button.md-autofocus.md-ink-ripple');
            await this.page.evaluate((submit) => { submit.click(); }, confirmRemoveAllBtn);
            await delay(5000);

            await this.page.click(`#header > header > div.navbar.navbar-static-top > div > ul > li.nav-logout > button`);
    
            logger(`Succesfully Logout`);
        } catch (error) {
            await delay(1000);

            await this.page.click(`#header > header > div.navbar.navbar-static-top > div > ul > li.nav-logout > button`);
    
            logger(`Succesfully Logout`);
            console.log('an expection on page.evaluate ', error);
        }
    },
}

module.exports = bot;