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
    xhr.open(type, url, false);
    xhr.send();
}

function getPosition() {
    navigator.geolocation.getCurrentPosition(
        locationSuccess,
        locationFailed,
        {enableHighAccuracy: true, timeout: 10000, maximumAge: 0}
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
            
            var stopDict = haversine(json, pos);
            
            var stopTimes;
            xmlreq(stopurl + stopDict["stopid"] , 'GET',
                function(responseText) {
                    stopTimes = JSON.parse(responseText);
                }    
            );

             var dict = {
                "0": stopDict["stopname"],
                "1": stopTimes.next[0].l,
            }
            
            if (stopTimes.next[0]) {
                dict["2"] = 'L' + stopTimes.next[0].l + ': '+ stopTimes.next[0].t.substring(11,16) + ' ' + stopTimes.next[0].d
            }
            if (stopTimes.next[1]) {
                dict["3"] = 'L' + stopTimes.next[1].l + ': '+ stopTimes.next[1].t.substring(11,16) + ' ' + stopTimes.next[1].d
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
            console.log('Curr nearest ' + currentStopName + ' / ' + d);
        }
    }
    return {"stopname": currentStopName.substring(0, 16), 
            "stopid": currentStop, 
            "stopdist": d};
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
