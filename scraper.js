const fs = require("fs");
const http = require("http");
const cheerio = require("cheerio");

const entryUrl = "http://shirts4mike.com/";
const shirts = [];

const checkFolder = () => {
    if (fs.existsSync('./data')) {
        // Folder is here
        return true;
    } else {
        // Folder is not here
        try {
            fs.mkdirSync('./data');
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

const getHtmlFromUrl = (url) => {
    return new Promise((resolve, reject) => {
        try {
            const request = http.get(url, (response) => {
                if (response.statusCode == 200) {
                    let body = '';

                    response.on('data', (data) => {
                        body += data.toString();
                    });

                    response.on('end', () => {
                        return resolve(body);
                    });
                } else {
                    return reject(new Error(response.statusCode));
                }
            });
            request.on("error", (error) => {
                return reject(new Error(error.message));
            });
        } catch (error) {
            return reject(new Error(error));
        }
    });
}

const allShirts = (urls) => {
    return Promise.all(urls.map(scrapeUrl))
        .then(shirts => {
            // console.log(shirts);
            return shirts;
        });
}

const scrapeUrl = (url) => {
    let shirtsObject = {};

    shirtsObject.url = `${entryUrl}${url}`;
    return new Promise((resolve, reject) => {
        getHtmlFromUrl(shirtsObject.url)
            .then(body => {
                const $ = cheerio.load(body);

                shirtsObject.imageUrl = $('.shirt-picture img').attr('src');
                shirtsObject.price = $('.shirt-details h1 span').text();
                shirtsObject.title = $('.shirt-details h1').text();

                return resolve(shirtsObject);
            })
            .catch(error => {
                return reject(new Error(error));
            });
    });

}

getHtmlFromUrl(`${entryUrl}shirts.php`)
    .then(body => {
        const $ = cheerio.load(body);

        $('.products li a').each(function (i, elem) {
            shirts[i] = $(this).attr('href');
        });

        return allShirts(shirts)
    })
    .then(shirts => {
        console.log(shirts);
    })
    .catch(error => {
        console.log(error.message);
    });