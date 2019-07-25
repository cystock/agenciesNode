var express = require('express');
var request = require('request');
var fs = require("fs");
var util = require('util');

var router = express.Router();

function orderBySort (orderBy, body) {
    switch (orderBy) {
        case "address_line":
            var body_parser = JSON.parse(body);
            var result = body_parser.results.sort(function (itemA, itemB) {
                return itemA.address.address_line.localeCompare(itemB.address.address_line)
                });
            return result;

        case "agency_code":
            var body_parser = JSON.parse(body);
            var results = body_parser.results;
            var result = Object.keys(results).map(function (orderBy) {
                return results[orderBy];
            }).sort(function (itemA, itemB) {
                return itemA.agency_code - itemB.agency_code
            });
            return result;


        case "distance":
            var body_parser = JSON.parse(body);
            var results = body_parser.results;
            //return sortJsonArray(results, 'distance');
            var result = Object.keys(results).map(function (orderBy) {
                return results[orderBy];
            }).sort(function (itemA, itemB) {
                return itemA.distance - itemB.distance
            });
            return result;

    }
}


/* GET agencies by near geolocation */
router.get('/sites/:site_id/payment_methods/:payment_mth_id/near_to', function(req, res) {
    var site_id = req.params.site_id;
    var paymet_mth = req.params.payment_mth_id;
    var latitude = req.query.latitude;
    var longitude = req.query.longitude;
    var radio = req.query.radio;

    if (latitude == null || longitude == null || radio == null){
        res.status(400).send('Cannot parse empty query params. Some of them are required');
    }
    agencies_url = util.format("https://api.mercadolibre.com/sites/%s/payment_methods/%s/agencies?near_to=", site_id, paymet_mth)
    url = agencies_url.concat(latitude, ",", longitude, ",", radio);

    var limit = req.query.limit;
    var offset = req.query.offset;

    var orderBy = req.query.orderBy;
    if (orderBy == null) {
        orderBy = 'distance'
    }

    if (limit){
        url = url.concat("&limit=", limit);
    }
    if (offset){
        url = url.concat("&offset=", offset);
    }

    request.get(url,
        function (error, response) {
            if(error){
                res.send(error)
            } else {
                var body = orderBySort(orderBy, response.body);
                var jsonString = JSON.stringify(body);
                fs.writeFileSync("agencies.json", jsonString, function (err) {
                    if (err) {
                        res.status(400).send(err.toString());
                    }
                });
                res.status(200).send(body);
            }
        });

});


/* GET all agencies */
router.get('/', function(req, res) {
    recommended_path = "./recommended_agencies.json";
    if (fs.existsSync(recommended_path)){
        var readAgenciesFile = JSON.parse(fs.readFileSync(recommended_path).toString());
        res.send(readAgenciesFile);
    } else {
        res.send('Do not have a previous Search Agencies.')
    }

});


/* PUT like agency */
router.put('/:agency_id/like', function(req, res) {
    var agency_id = req.params.agency_id;
    if (agency_id == null) {
        res.sendStatus(400)
    }

    var recommended_path = "./recommended_agencies.json";
    var agencies_path = "./agencies.json";
    var agency = [];

    if (fs.existsSync(recommended_path)) {
        var readRecommendedAgenciesFile = JSON.parse(fs.readFileSync(recommended_path).toString());
        var exits = false;
        readRecommendedAgenciesFile.forEach(function (elem) {
            if (elem.id == agency_id) {
                exits = true;
                res.sendStatus(304);
            }
        });
        if (exits == false) {
            agency = readRecommendedAgenciesFile.slice(0);

            var readAgenciesFile = JSON.parse(fs.readFileSync(agencies_path).toString());
            readAgenciesFile.forEach(function (elem) {
                if (elem.id == agency_id) {
                    agency.push(elem);
                }
            });

            writeFile(recommended_path, agency);
            res.sendStatus(200);
        }
    } else {
        var readAgenciesFile = JSON.parse(fs.readFileSync(agencies_path).toString());
        readAgenciesFile.forEach(function (elem) {
            if (elem.id == agency_id) {
                agency.push(elem);
            }
        });
        writeFile(recommended_path, agency);
        res.sendStatus(200)
    }

});

function writeFile(recommended_path, agency){
    var jsonString = JSON.stringify(agency);
    fs.writeFileSync(recommended_path, jsonString, function (err) {
        if (err) {
            res.send(err);
        }
    });
}


/* PUT unlike agency*/
router.put('/:agency_id/unlike', function(req, res) {
    var agency_id = req.params.agency_id;
    if (agency_id == null ){
        res.send('Cannot parse empty query params. Some of them are required');
    }

    var recommended_path = "./recommended_agencies.json";

    if (fs.existsSync(recommended_path)) {
        var readRecommendedAgenciesFile = JSON.parse(fs.readFileSync(recommended_path).toString());
        var exits = false;
        readRecommendedAgenciesFile.forEach(function (elem) {
            if (elem.id == agency_id) {
                readRecommendedAgenciesFile.pop(elem);
                exits = true;
                writeFile(recommended_path, readRecommendedAgenciesFile);
                res.sendStatus(200);
            }}
            );
        if (exits == false){
            res.sendStatus(304);
        }
    }else{
        res.sendStatus(409);
    }


});


module.exports = router;
