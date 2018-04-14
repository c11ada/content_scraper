const fs = require("fs");
const http = require("http");

const cheerio = require("cheerio");
const Json2csvParser = require("json2csv").Parser;

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

    shirtsObject["url"] = `${entryUrl}${url}`;
    return new Promise((resolve, reject) => {
        getHtmlFromUrl(shirtsObject.url)
            .then(body => {
                const $ = cheerio.load(body);

                shirtsObject["Image URL"] = entryUrl + $('.shirt-picture img').attr('src');
                shirtsObject.Price = $('.shirt-details h1 span').text();
                shirtsObject.Title = $('.shirt-details h1').text();

                return resolve(shirtsObject);
            })
            .catch(error => {
                return reject(new Error(error));
            });
    });

}

const writeCsv = (json) => {
    const now = new Date();
    const csv_filename = "./data/" + now.toISOString().substring(0, 10) + ".csv";
    const fields = ["Title", "Price", "Image URL", "url"];

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(json);

    console.log(csv);
    // const shirtscsv = json2csv({ data: json, fields: fields });
    fs.writeFileSync(csv_filename, csv);

};

getHtmlFromUrl(`${entryUrl}shirts.php`)
    .then(body => {
        const $ = cheerio.load(body);

        $('.products li a').each(function (i, elem) {
            shirts[i] = $(this).attr('href');
        });

        return allShirts(shirts)
    })
    .then(shirts => {
        writeCsv(shirts);
    })
    .catch(error => {
        console.log(error.message);
    });