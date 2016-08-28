"use strict";

var laScale = 10;
var laOffset = new THREE.Vector3(0, -1.5, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
var laRot = new THREE.Vector3(300, 0, 0);//145, 10, 0);

// http://threejs.org/examples/webgl_materials_blending_custom.html
var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
var blending = "CustomBlending";
	
var line_mtl, red_mtl, text_mtl;

var line_mtl = new THREE.LineBasicMaterial({
	color: 0xaaaaaa,//999fff,
	opacity: 0.5,
	linewidth: 5,
	transparent: true,
	blending: THREE[blending],
	blendSrc: THREE[blendSrc[4]],
	blendDst: THREE[blendDst[1]],
	blendEquation: THREE.AddEquation
});

var text_mtl = new THREE.MeshBasicMaterial({ 
	color: 0xffff00,
	depthTest: false,
	depthWrite: true 
});

var red_mtl = line_mtl;
var blue_mtl = line_mtl;

red_mtl.color.setHex(0xffaaaa);
blue_mtl.color.setHex(0xaaaaff);