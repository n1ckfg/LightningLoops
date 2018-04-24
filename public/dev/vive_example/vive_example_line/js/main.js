"use strict";

function main() {

	if (WEBVR.isLatestAvailable() === false) {
		document.body.appendChild(WEBVR.getMessage());
	}

	//

	var container;
	var camera, scene, renderer;
	var effect, controls;
	var controller1, controller2;
	var gamepad1, gamepad2;

	var room;

	// ~ ~ ~ 
	var geometry, line;
    var line_mtl, red_mtl, text_mtl;
    var textMesh;
	var debugPos = false;

    // http://threejs.org/examples/webgl_materials_blending_custom.html
    var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
    var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
    var blending = "CustomBlending";

    line_mtl = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,//999fff,
        opacity: 0.5,
        linewidth: 3,
        transparent: true,
        blending: THREE[blending],
        blendSrc: THREE[blendSrc[4]],
        blendDst: THREE[blendDst[1]],
        blendEquation: THREE.AddEquation
    });

    text_mtl = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: true 
    });

    red_mtl = line_mtl;
    red_mtl.color.setHex(0xffaaaa);
	
	var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];
	
    var frames = [];
	var strokes = [];
	var strokeCounter = 0;
	var isDrawing = false;
    // ~ ~ ~ 
	
	init();
	animate();

	// ~ ~ ~ 
	function beginStroke(x, y, z) {
		isDrawing = true;
        geometry = new THREE.Geometry();
        line = new THREE.Line(geometry, red_mtl);
		line.name = "stroke" + strokeCounter;
		strokes.push(line);
		addVertex(strokes[strokeCounter], x, y, z);
		console.log("Begin " + strokes[strokeCounter].name + ".");
	}
	
	function updateStroke(x, y, z) {
		addVertex(strokes[strokeCounter], x, y, z);
		console.log("Update " + strokes[strokeCounter].name + ": " + strokes[strokeCounter].geometry.vertices.length + " points.");
	}
	
	function addVertex(obj, x, y, z) {
		obj.geometry.dynamic = true;
		obj.geometry.vertices.push(new THREE.Vector3(x, y, z));
        obj.geometry.verticesNeedUpdate = true;
		obj.geometry.__dirtyVertices = true;		
	}
	
	function endStroke() {
		scene.add(strokes[strokeCounter]);
		isDrawing = false;
		console.log("End " + strokes[strokeCounter].name + ".");
		strokeCounter++;
	}
	// ~ ~ ~ 
	
	function init() {
		container = document.createElement("div");
		document.body.appendChild(container);

		var info = document.createElement("div");
		info.style.position = "absolute";
		info.style.top = "10px";
		info.style.width = "100%";
		info.style.textAlign = "center";
		info.innerHTML = "<a href=\"http://threejs.org\" target=\"_blank\">three.js</a> webgl - htc vive";
		container.appendChild(info);

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
		scene.add(camera);

		room = new THREE.Mesh(
			new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
			new THREE.MeshBasicMaterial({ color: 0x202020, wireframe: true })
		);
		room.position.y = 3;
		scene.add(room);

		scene.add(new THREE.HemisphereLight(0x404020, 0x202040, 0.5));

		var light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1, 1, 1).normalize();
		scene.add(light);

		var geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);

		for (var i = 0; i < 200; i ++) {
			var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

			object.position.x = Math.random() * 4 - 2;
			object.position.y = Math.random() * 4 - 2;
			object.position.z = Math.random() * 4 - 2;

			object.rotation.x = Math.random() * 2 * Math.PI;
			object.rotation.y = Math.random() * 2 * Math.PI;
			object.rotation.z = Math.random() * 2 * Math.PI;

			object.scale.x = Math.random() + 0.5;
			object.scale.y = Math.random() + 0.5;
			object.scale.z = Math.random() + 0.5;

			object.userData.velocity = new THREE.Vector3();
			object.userData.velocity.x = Math.random() * 0.01 - 0.005;
			object.userData.velocity.y = Math.random() * 0.01 - 0.005;
			object.userData.velocity.z = Math.random() * 0.01 - 0.005;

			room.add(object);
		}

		var material = new THREE.MeshStandardMaterial();

		var path = "./models/cerberus/";
		var loader = new THREE.OBJLoader();
		loader.load(path + "Cerberus.obj", function(group) {
			// var material = new THREE.MeshBasicMaterial({ wireframe: true });

			var loader = new THREE.TextureLoader();

			material.roughness = 1;
			material.metalness = 1;

			material.map = loader.load(path + "Cerberus_A.jpg");
			material.roughnessMap = loader.load(path + "Cerberus_R.jpg");
			material.metalnessMap = loader.load(path + "Cerberus_M.jpg");
			material.normalMap = loader.load(path + "Cerberus_N.jpg");

			material.map.wrapS = THREE.RepeatWrapping;
			material.roughnessMap.wrapS = THREE.RepeatWrapping;
			material.metalnessMap.wrapS = THREE.RepeatWrapping;
			material.normalMap.wrapS = THREE.RepeatWrapping;

			group.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.material = material;
				}
			});

			group.position.y = - 2;
			group.rotation.y = - Math.PI / 2;
			room.add(group);
		});

		var loader = new THREE.CubeTextureLoader();
		loader.setPath("./textures/pisa/");
		material.envMap = loader.load([
			"px.png", "nx.png",
			"py.png", "ny.png",
			"pz.png", "nz.png"
		]);

		//

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor(0x101010);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.sortObjects = false;
		container.appendChild(renderer.domElement);

		controls = new THREE.VRControls(camera);
		controls.standing = true;

		// controllers
		controller1 = new THREE.ViveController(0);
		controller1.standingMatrix = controls.getStandingMatrix();
		scene.add(controller1);
		gamepad1 = navigator.getGamepads()[0];

		controller2 = new THREE.ViveController(1);
		controller2.standingMatrix = controls.getStandingMatrix();
		scene.add(controller2);
		gamepad2 = navigator.getGamepads()[1];

		var vivePath = "./models/vive-controller/";
		var loader = new THREE.OBJLoader();
		loader.load(vivePath + "vr_controller_vive_1_5.obj", function(object) {
			var loader = new THREE.TextureLoader();

			var controller = object.children[0];
			controller.material.map = loader.load(vivePath + "onepointfive_texture.png");
			controller.material.specularMap = loader.load(vivePath + "onepointfive_spec.png");

			controller1.add(object.clone());
			controller2.add(object.clone());
		});

		effect = new THREE.VREffect(renderer);

		if (WEBVR.isAvailable() === true) {
			document.body.appendChild(WEBVR.getButton(effect));
		}

		//

		window.addEventListener("resize", onWindowResize, false);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		effect.setSize(window.innerWidth, window.innerHeight);
	}

	//

	function animate() {
		requestAnimationFrame(animate);
		updateControllers();
		render();
	}

	function updateControllers() {
		if (gamepad1 !== undefined) {
			var pos = controller1.position.applyMatrix4(controller1.standingMatrix);
			if (debugPos) {
				console.log(
				"ctl1 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
				"ctl1 pad: "  + gamepad1.buttons[0].pressed + "\n" +
				"ctl1 trigger: "  + gamepad1.buttons[1].pressed + "\n" +
				"ctl1 grip: "  + gamepad1.buttons[2].pressed + "\n" +
				"ctl1 menu: "  + gamepad1.buttons[3].pressed
				);
			}
			// ~ ~ ~
			if (gamepad1.buttons[1].pressed && !isDrawing) {
				beginStroke(pos.x, pos.y, pos.z);
			} else if (gamepad1.buttons[1].pressed && isDrawing) {
				updateStroke(pos.x, pos.y, pos.z);
			} else if (!gamepad1.buttons[1].pressed && isDrawing) {
				endStroke();
			}
			
			if (gamepad1.buttons[0].pressed && strokes[2]) {
				var target = scene.getObjectByName(strokes[2].name);
				scene.remove(target);
			}
		}
		if (gamepad2 !== undefined) {
			var pos = controller2.position.applyMatrix4(controller2.standingMatrix);
			if (debugPos) {
				console.log(
				"ctl2 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
				"ctl2 pad: "  + gamepad2.buttons[0].pressed + "\n" +
				"ctl2 trigger: "  + gamepad2.buttons[1].pressed + "\n" +
				"ctl2 grip: "  + gamepad2.buttons[2].pressed + "\n" +
				"ctl2 menu: "  + gamepad2.buttons[3].pressed
				);
			}
			// ~ ~ ~
		}		
	}
	
	function render() {
		controls.update();

		for (var i = 0; i < room.children.length; i ++) {
			var cube = room.children[ i ];

			if (cube.geometry instanceof THREE.BoxGeometry === false) continue;
			// cube.position.add(cube.userData.velocity);

			if (cube.position.x < - 3 || cube.position.x > 3) {
				cube.position.x = THREE.Math.clamp(cube.position.x, - 3, 3);
				cube.userData.velocity.x = - cube.userData.velocity.x;
			}

			if (cube.position.y < - 3 || cube.position.y > 3) {
				cube.position.y = THREE.Math.clamp(cube.position.y, - 3, 3);
				cube.userData.velocity.y = - cube.userData.velocity.y;
			}

			if (cube.position.z < - 3 || cube.position.z > 3) {
				cube.position.z = THREE.Math.clamp(cube.position.z, - 3, 3);
				cube.userData.velocity.z = - cube.userData.velocity.z;
			}

			cube.rotation.x += 0.01;
		}

		effect.render(scene, camera);
	}

}

window.onload = main;
