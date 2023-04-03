const fs = require('fs');
// const cron = require('node-cron');
// const shell = require('shelljs');
const FormData = require("form-data");
const { getBanks, uploadBank, login } = require('./config/api');

const bot = require("./app/bot");

const delay = (ms) => {
    return new Promise(function(resolve) { 
        setTimeout(resolve, ms)
    });
}

(async () => {
    console.log(`[${new Date().toLocaleString()}]: Running Cron Job Mandiri MCM 2`);

    // let postingDate = [];
    // const date = new Date();
    // const args = {
    //     hours: date.getHours(),
    //     minutes: date.getMinutes()
    // };

    // if (args.hours === 7 && args.minutes === 30) {
    //     postingDate.push(1, 4);
    // } else {
    //     postingDate.push(4);
    // }
    
    // await bot.init();
    // await bot.start();
    // await bot.login();
    // await bot.scrape(postingDate);
    // await bot.close();

    const auth = await login();
    const token = auth?.data?.data?.access_token;
    const banks = await getBanks(token);

    fs.readdir('downloads', function(err, filenames) {
        if (err) { 
            console.log(err)
            return;
        }

        filenames.forEach(async function (filename) {
            const accountNumber = filename.split("_")[2];

            let id;
            let i = 0;
            const iMax = banks.length;

            for (; i < iMax; i++) {
                if (banks[i].accountNumber === accountNumber) {
                    id = banks[i]._id;
                    break;
                }
            }

            if (id) {
                const form = new FormData();
    
                form.append("bankId", id);
                form.append("file", fs.createReadStream(`downloads/${filename}`));
                await uploadBank(form, token, form.getHeaders());
                await delay(1000);
            }
        });
    });
})()