"use strict";

class Util {

    static lerp(start, end, value){
        return (1 - value) * start + value * end
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    static map(s, a1, a2, b1, b2) {
        return b1 + (s - a1) * (b2 - b1) / (a2 - a1);
    }

    static clamp(val, min, max) {
        if (val < min) {
            return min;
        } else if (val > max) {
            return max;
        } else {
            return val;
        }
    }

    static millis() {
        return parseInt(performance.now());
    }

    static diceHandler(value) {
        return Math.random() < value;
    }

    static random(value) {
        return Math.random() * value;
    }

    static randomRange(value1, value2) {
        return this.map(Math.random(), 0, 1, value1, value2);
    }

    static randomInt(value) {
        return parseInt(Math.random() * value);
    }

    static randomRangeInt(value1, value2) {
        return parseInt(this.map(Math.random(), 0, 1, value1, value2));
    }

    // ~ ~ ~   input   ~ ~ ~ 

    static getKeyCode(event) {
        var k = event.charCode || event.keyCode;
        var c = String.fromCharCode(k).toLowerCase();
        return c;
    }

    static checkForMouse() {
    	return !window.matchMedia("(any-pointer:coarse)").matches;
    }

    // ~ ~ ~   browser   ~ ~ ~

    static checkQueryInUrl(key) {
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

    static getQueryFromUrl(key) {
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

    static setCookie(name, value) {
        window.localStorage.setItem(name, value);
    }

    static getCookie(name) {
        return window.localStorage.getItem(name);
    }

    static saveImage() {
        let imgData, imgNode;
        let strMime = "image/jpeg";
        let strDownloadMime = "image/octet-stream";

        try {
            imgData = renderer.domElement.toDataURL(strMime);
            Util.saveFile(imgData.replace(strMime, strDownloadMime), "test.jpg");
        } catch (e) {
            console.log("Error saving image: " + e);
            return;
        }
    }

    static saveFile(strData, filename) {
        let link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); //Firefox requires the link to be in the body
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link); //remove the link when done
        } else {
            location.replace(uri);
        }
    }

    /*
          let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");
      let mouseX = mouseY = pmouseX = pmouseY = 0;
      let mouseIsPressed = false;
      
      canvas.addEventListener("mousemove", function(e) { 
        let cRect = canvas.getBoundingClientRect(); 
        pmouseX = mouseX;
        pmouseY = mouseY;
        mouseX = Math.round(e.clientX - cRect.left);   
        mouseY = Math.round(e.clientY - cRect.top);   
      });
      
      canvas.addEventListener("mousedown", function(e) {
        mouseIsPressed = true;
      });
      
      canvas.addEventListener("mouseup", function(e) {
        mouseIsPressed = false;
      });
      */
}

