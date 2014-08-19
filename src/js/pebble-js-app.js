var stopurl = "http://bybussen.api.tmn.io/rt/";
var allstops = "http://bybussen.api.tmn.io/stops";

var xmlreq = function(url, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log('Callback called in xhr');
            callback(this.responseText);
        } else {
            console.log('Error with xmlreq');
        }
    };
    xhr.open(type, url);
    xhr.send();
}

function getPosition() {
    navigator.geolocation.getCurrentPosition(
        locationSuccess,
        locationFailed,
        {timeout: 15000, maximumAge: 60000}
    );
}

function locationFailed(err) {
    console.log("JS could not get location");
}

function locationSuccess(pos) {
    console.log('Position: ' + pos.coords.latitude + ' / ' + pos.coords.longitude);

    xmlreq(allstops, 'GET', 
        function(responseText) {
            //parse and send
            var json = JSON.parse(responseText);
            console.log('All stops: ' + json[0].locationId);
            
            var closestStop = haversine(json, pos);

            var dict = {
                "0": closestStop
            }

            Pebble.sendAppMessage(dict, 
                function(e) {
                    console.log("Bus info sent");
                },
                function(e) {
                    console.log("Error while sending bus info");
                }
            );
        }
    );
}

Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}

function haversine(stops, pos) {
    var currentNearest = 100;
    var currentStop = 'begin';
    var currentStopName = 'begin';

    for (var i = 0; i < stops.length; i++) {
        var lat1 = pos.coords.latitude;
        var lat2 = stops[i]['latitude'];

        var lon1 = pos.coords.longitude;
        var lon2 = stops[i]['longitude'];

        var R = 6371;
        var x1 = lat2 - lat1;
        var dLat = x1.toRad();
        var x2 = lon2 - lon1;
        var dLon = x2.toRad();
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;

        if (d < currentNearest) {
            currentNearest = d;
            currentStop = stops[i]['locationId'];
            currentStopName = stops[i]['name'];
            console.log(currentStopName);
        }
    }
    return currentStopName;
}


Pebble.addEventListener('ready',
    function(e) {
        console.log("JS ready to recieve");

        // initial fetch here
        getPosition();
    }        
);

Pebble.addEventListener('appmessage', 
    function(e) {
        console.log("AppMessage received from Pebble");
        // fetch here
        getPosition();
    }      
);
