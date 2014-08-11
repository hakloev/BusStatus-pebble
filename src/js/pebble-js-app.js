var xmlreq = function(url, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        callback(this.responseText);
    };
    xhr.open(type, url);
    xhr.send();
}

function getWeather() {
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
    var url = "http://api.openweathermap.org/data/2.5/weather?lat=" + pos.coords.latitude + "&lon=" + pos.coords.longitude;
    console.log(url);
    
    xmlreq(url, 'GET', 
        function(responseText) {
            //parse and send
            var json = JSON.parse(responseText);
            var temp = Math.round(json.main.temp - 273.15);
            console.log(temp);
            var dict = {
                "0":temp
            }

            Pebble.sendAppMessage(dict, 
                function(e) {
                    console.log("Weather info sent");
                },
                function(e) {
                    console.log("Error while sending weather info");
                }
            );
        }
    );
}

Pebble.addEventListener('ready',
    function(e) {
        console.log("JS ready to recieve");

        // initial fetch here
        getWeather();
    }        
);

Pebble.addEventListener('appmessage', 
    function(e) {
        console.log("AppMessage received from Pebble");
        // fetch here
        getWeather();
    }      
);
