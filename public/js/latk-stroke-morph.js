"use strict";


class LatkStrokeMorph extends LatkStroke {

    constructor(points, color, fill_color) {
        super(points, color, fill_color);

        this.numCmds = 60;
		this.globalSpeedFactor = 4;
		this.globalScale = new THREE.Vector3(50, -50, 50);
		//this.globalOffset = new THREE.Vector3(-20, 60, -350); 
		this.globalSpread = 7;
		this.now = 0;
		this.maxComplexity = this.numCmds*3;
        this.lexicon = "FfXxYyZz<>(.".split("");
        this.cmds = this.createCmds(this.numCmds);
		this.turtleStep = 0.5;
		this.size = 35;
		this.axisX = new THREE.Vector3(1, 0, 0);
		this.axisY = new THREE.Vector3(0, 1, 0);
		this.axisZ = new THREE.Vector3(0, 0, 1);
		this.angleChange = 1.25;
		this.timeShift = Math.random() * 0.2;
		this.pos = new THREE.Vector3(0,0,0);
    }

	createCmds(size) {
		let geno = [];
		for (let i=0; i<size; i++) {
			geno.push(this.lexicon[parseInt(Math.random() * this.lexicon.length)]);	
		}
		return geno;
	}

	getTimeShift(val) {
		return val * (Math.sin(this.now) + this.timeShift);
	}

	turtledraw(t, cmds) {
		let lines = [];
		this.now = clock.getElapsedTime() / this.globalSpeedFactor;

		for (let i=0; i<cmds.length; i++) {
			let cmd = cmds[i];
			
			if (cmd == "F") {
				// move forward, drawing a line:
				lines.push(t.pos.clone());  
				t.pos.add(t.dir); // move
				lines.push(t.pos.clone());
			} else if (cmd == "f") {
				// move forward, drawing a line:
				lines.push(t.pos.clone());  
				t.pos.add(t.dir.clone().multiplyScalar(this.turtleStep));//0.5)); // move
				lines.push(t.pos.clone());
			} else if (cmd == "X") {
				// rotate +x:
				t.dir.applyAxisAngle(this.axisX, this.getTimeShift(t.angle));
			} else if (cmd == "x") {
				// rotate -x:
				t.dir.applyAxisAngle(this.axisX, this.getTimeShift(-t.angle));
			} else if (cmd == "Y") {
				// rotate +y:
				t.dir.applyAxisAngle(this.axisY, this.getTimeShift(t.angle));
			} else if (cmd == "y") {
				// rotate -y:
				t.dir.applyAxisAngle(this.axisY, this.getTimeShift(-t.angle));
			} else if (cmd == "Z") {
				// rotate +z:
				t.dir.applyAxisAngle(this.axisZ, this.getTimeShift(t.angle));
			} else if (cmd == "z") {
				// rotate -z:
				t.dir.applyAxisAngle(this.axisZ, this.getTimeShift(-t.angle));
			} else if (cmd == "<") {
				t.angle *= this.angleChange;
			} else if (cmd == ">") {
				t.angle /= this.angleChange;
			} else if (cmd == "(") {
				// spawn a copy of the turtle:
				let t1 = new Turtle(t.pos.clone(), t.dir.clone(), -t.angle);

				let morelines = this.turtledraw(t1, cmds.slice(i+1));
				lines = lines.concat(morelines);
			}
		}

		if (lines.length > this.maxComplexity) lines.length = this.maxComplexity;

		return lines;
	}


	doTurtle() {
		let pos = this.points[0].co;
		let turtle = new Turtle(new THREE.Vector3(pos[0], pos[1], pos[2]), new THREE.Vector3(0, 0.1, 0), Math.PI/4);

		let turtlePoints = this.turtledraw(turtle, this.cmds);	

		this.points = this.points.concat(convertVec3ToLatkArray(turtlePoints));
	}
}


class Turtle {

	constructor(pos, dir, angle) {
		this.pos = pos;
		this.dir = dir;
		this.angle = angle;
	}

}