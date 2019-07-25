var express = require('express');
var request = require('request'); //  npm install request --save


var router = express.Router();

/* GET sites listing. */
router.get('/', function(req, res) {
    request.get("https://api.mercadolibre.com/sites/",
        function (error, response, body) {
            if(error){
                res.send(error)
            } else {
                res.send(JSON.parse(body))
            }
        });
});

/* GET sites listing. */
router.get('/:id', function(req, res) {
    var site_id = req.params.id;
    request.get("https://api.mercadolibre.com/sites/" + site_id,
        function (error, response, body) {
            if(error){
                res.send(error)
            } else {
                res.send(JSON.parse(body))
            }
        });
});

/* GET sites listing. */
router.get('/:id/payment_methods', function(req, res) {
    var site_id = req.params.id;
    request.get("https://api.mercadolibre.com/sites/" + site_id + "/payment_methods",
        function (error, response, body) {
            if(error){
                res.send(error)
            } else {
                res.send(JSON.parse(body))
            }
        });
});


module.exports = router;
