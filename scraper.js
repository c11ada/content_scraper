const fs = require("fs");
const http = require("http");

// Chosen scraping and CSV packages meet the following requirements on npm:
// 1,000 downloads
// Updated in the last 6 months
const cheerio = require("cheerio");
const Json2csvParser = require("json2csv").Parser;

const entryUrl = "http://shirts4mike.com/";
const shirts = [];

// check to see if data folder is there
// if not create folder
// throw error if for some reason you cant create folder (permission)
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


// generic function using promises that takes URL and returns body text
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
                    // console.log(http.STATUS_CODES[response.statusCode]);
                    const errorMessage = `There was an error ( ${response.statusCode} - ${http.STATUS_CODES[response.statusCode]} )`;
                    return reject(new Error(errorMessage));
                }
            });
            request.on("error", (error) => {
                let errorMessage = '';
                if(error.code == "ENOTFOUND") {
                    errorMessage = `There was an error ( ${error.code} - Cant connect to ${url} )`;
                } else {
                    errorMessage = error.message;
                }
                return reject(new Error(errorMessage));
            });
        } catch (error) {
            return reject(new Error(error.message));
        }
    });
}

// function takes in array of URLS and uses promise.all method to return an array of promises
const allShirts = (urls) => {
    return Promise.all(urls.map(scrapeUrl))
        .then(shirts => {
            // console.log(shirts);
            return shirts;
        });
}

// function takes single url to call the getHtmlFromUrl function
// cheerio package is used to scrape the html body for needed fields
const scrapeUrl = (url) => {
    let shirtsObject = {};

    shirtsObject.URL = `${entryUrl}${url}`;
    return new Promise((resolve, reject) => {
        getHtmlFromUrl(shirtsObject.URL)
            .then(body => {
                const $ = cheerio.load(body);

                shirtsObject["Image URL"] = entryUrl + $('.shirt-picture img').attr('src');
                shirtsObject.Price = $('.shirt-details h1 span').text();
                shirtsObject.Title = $('.shirt-details h1').text();
                shirtsObject.Time = new Date().toUTCString();

                console.log(shirtsObject);
                return resolve(shirtsObject);
            })
            .catch(error => {
                return reject(new Error(error));
            });
    });

}

// function takes in json structure and creates csv
const writeCsv = (json) => {
    const now = new Date();
    const csv_filename = "./data/" + now.toISOString().substring(0, 10) + ".csv";
    const fields = ["Title", "Price", "Image URL", "URL", "Time"];

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(json);

    fs.writeFileSync(csv_filename, csv);

};

// Main entry
// check to see if folder is there
if(checkFolder()) {
    // get body from entry url
    getHtmlFromUrl(`${entryUrl}shirts.php`)
    .then(body => {
        const $ = cheerio.load(body);
        // get a list of shirst from the inital shirts page and store them in array
        $('.products li a').each(function (i, elem) {
            shirts[i] = $(this).attr('href');
        });
        // get data for each shirt
        return allShirts(shirts)
    })
    .then(shirts => {
        // write output to csv
        writeCsv(shirts);
    })
    .catch(error => {
        console.log(error.message);
        const now = new Date().toUTCString();

        fs.appendFileSync('scraper-error.log', `${now} - ${error.message}\n`);
    });
} else {
    console.log("cant make folder");
    const now = new Date().toUTCString();
    fs.appendFileSync('scraper-error.log', `${now} - cant make folder \n`);
}

