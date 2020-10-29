"use strict";

class Util {

    constructor() {
        //
    }

    lerp (start, end, value){
        return (1 - value) * start + value * end
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    map(s, a1, a2, b1, b2) {
        return b1 + (s - a1) * (b2 - b1) / (a2 - a1);
    }

    millis() {
        return parseInt(now * 1000);
    }

    diceHandler(value) {
        return Math.random() < value;
    }

    random(value) {
        return Math.random() * value;
    }

    randomRange(value1, value2) {
        return this.map(Math.random(), 0, 1, value1, value2);
    }

    randomInt(value) {
        return parseInt(Math.random() * value);
    }

    randomRangeInt(value1, value2) {
        return parseInt(this.map(Math.random(), 0, 1, value1, value2));
    }

    checkQueryInUrl(key) {
        let query = window.location.search.substring(1);
        let pairs = query.split("&");
        for (let i=0; i<pairs.length; i++) {
            let pair = pairs[i].split("=");
            if (pair[0] == key) { 
                return true;
            }
        }
        
        return(false);
    }

	getQueryFromUrl(key) {
		let query = window.location.search.substring(1);
		let pairs = query.split("&");
		for (let i=0; i<pairs.length; i++) {
			let pair = pairs[i].split("=");
			if (pair[0] == key) { 
				return pair[1];
			}
		}
		
		return(false);
	}

}

const util = new Util();

