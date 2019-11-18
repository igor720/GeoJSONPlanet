/*
 * Package     : GeoJSONPlanet tool (ver. 0.1.0)
 * Description : Creates a spherical planet model with provided 
 *     equirectangular projection map as a texture.
 *     It allowes to draw arbitrary GeoJSON data on the model.
 * Copyright (c) 2019 Igor Chudaev (http://forgedmaps.com). All rights reserved.
 * License     : MIT. See LICENSE.txt
 * Maintainer  : igor720@gmail.com
 * Stability   : experimental
 * Requires    : ThreeJS 3D Library
 */

// Default material and geometry styles of GeoJSON features
const defaultFtOpts = {
	'Point': {'radius': 0.01, 'widthSegs': 8, 'heightSegs': 6, 'color': '0x000000'},
	'MultiPoint': {'radius': 0.01, 'widthSegs': 8,'heightSegs': 6, 'color': '0x000000'},
	'LineString': {'linewidth': 1, 'color': '0x000000'},
	'MultiLineString': {'linewidth': 1, 'color': '0x000000'},
	'Polygon': {'linewidth': 1, 'color': '0x000000'},
	'MultiPolygon': {'linewidth': 1, 'color': '0x000000'}
};

// Planet model class
const GeoJSONPlanet = function (img, containerId, opts) {
	if (!img) {console.error('Error: undefined image variable');}
	const ctx = {};

	if (!containerId) {
		ctx.canvas = document.body;
	} else {
		ctx.canvas = document.getElementById(containerId);
	}
	ctx.parentElement = ctx.canvas.parentElement;

	if (!opts) opts = {};

	if (!opts.width) opts.width = ctx.canvas.clientWidth;
	if (!opts.height) opts.height = ctx.canvas.clientHeight;
	if (!opts.background) opts.background = '0x000000';
	if (!opts.enableZoom) opts.enableZoom = true;

	if (!opts.cam) opts.cam = {};
	if (!opts.cam.fov) opts.cam.fov = 42;
	if (!opts.cam.near) opts.cam.near = 0.1;
	if (!opts.cam.far) opts.cam.far = 2.7;
	if (!opts.cam.zPos) opts.cam.zPos = 3;

	if (!opts.sphereWidthSegs) opts.sphereWidthSegs = 80;
	if (!opts.sphereHeightSegs) opts.sphereHeightSegs = 60;
	if (!opts.oceanColor) opts.oceanColor = '0xaaaaaa';
	if (!opts.textureFilter) opts.textureFilter =
		THREE.NearestMipmapNearestFilter;

	if (!opts.axisColor) opts.axisColor = '0xffffff';
	if (!opts.axisAngle) {
		opts.axisAngle = 0;
	} else {
		opts.axisAngle = THREE.Math.degToRad(opts.axisAngle);
	}

	const planetGlobeRadius = 1;
	const oceanGlobeRadius = 0.995;
	const dThreshould = THREE.Math.degToRad(2);

    if (opts.dMin) opts.dMin = THREE.Math.degToRad(opts.dMin);
	if (!opts.dFuncN) opts.dFuncN = 0;
	// by default we choose mixed distance function
	ctx.dFunc = function (p1, p2) {
		switch (opts.dFuncN) {
			case 1:
				return dMaxFunc(p1, p2);
			case 2:
				return dSqrFunc(p1, p2);
			case 3:
				return dArcFunc(p1, p2);
			default:
				if (opts.dMin>dThreshould) {return dArcFunc(p1, p2);}
				else {return dMaxFunc(p1, p2);}
		}
	};
   
	ctx.camera = new THREE.PerspectiveCamera(
		opts.cam.fov, opts.width/opts.height, opts.cam.near, opts.cam.far);
	ctx.camera.position.z = opts.cam.zPos;

	ctx.scene = new THREE.Scene();
	ctx.scene.background = new THREE.Color(parseInt(opts.background));

	// globe's axis
	ctx.axisVectorX = Math.cos(Math.PI/2 - opts.axisAngle);
	ctx.axisVectorY = Math.sin(Math.PI/2 - opts.axisAngle);
	const lineMaterial = new THREE.LineBasicMaterial(
		{color: parseInt(opts.axisColor)});
	const lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push(
		new THREE.Vector3(-1.2*ctx.axisVectorX, -1.2*ctx.axisVectorY, 0));
	lineGeometry.vertices.push(
		new THREE.Vector3(1.2*ctx.axisVectorX, 1.2*ctx.axisVectorY, 0));
	const line = new THREE.Line(lineGeometry, lineMaterial);
	ctx.scene.add(line);

	// ocean's globe
	const oceanMaterial = new THREE.MeshBasicMaterial({
		color: parseInt(opts.oceanColor)
	});
	const oceanGeometry = new THREE.SphereGeometry(
		oceanGlobeRadius, opts.sphereWidthSegs, opts.sphereHeightSegs);
	ctx.ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
	ctx.ocean.geometry.rotateZ(-opts.axisAngle);
	ctx.scene.add(ctx.ocean);

    // planet's globe
	const plTexture = new THREE.TextureLoader().load(
		img, function () {ctx.render();}
	);
    plTexture.minFilter = opts.textureFilter;
	const plMaterial = new THREE.MeshBasicMaterial({
		map: plTexture, transparent: true
	});
	const plGeometry = new THREE.SphereGeometry(
		planetGlobeRadius, opts.sphereWidthSegs, opts.sphereHeightSegs);
	ctx.planet = new THREE.Mesh(plGeometry, plMaterial);
	ctx.planet.geometry.rotateZ(-opts.axisAngle);
	ctx.scene.add(ctx.planet);

	// renderer
	ctx.renderer = new THREE.WebGLRenderer({
		antialias: true, canvas: ctx.canvas
	});
	ctx.renderer.setSize(opts.width, opts.height);
	ctx.renderer.setPixelRatio(window.devicePixelRatio);

	ctx.render = function(){
		if (needResizeRenderer()) {
			ctx.camera.aspect = ctx.canvas.clientWidth / ctx.canvas.clientHeight;
			ctx.camera.updateProjectionMatrix();
		}
 		ctx.renderer.render(ctx.scene, ctx.camera);
	};

	window.addEventListener('resize', resizeCanvas, false);
	window.addEventListener('orientationchange', resizeCanvas, false);
	
	ctx.opts = opts;
	ctx.objs = [];

	ctx.control = control;
	ctx.rotate = rotate;

	ctx.drawPoints = drawPoints;
	ctx.drawStringss = drawStringss;
	ctx.drawGeometry = drawGeometry;
	ctx.drawGeoJSON = drawGeoJSON;

// Resize canvas if parent element size changed
function resizeCanvas() {
	const pWidth = ctx.parentElement.clientWidth;
	const pHeight = ctx.parentElement.clientHeight;
	ctx.canvas.style.width = `${pWidth}px`;
	ctx.canvas.style.height = `${pHeight}px`;
	ctx.parentWidth = pWidth;
	ctx.parentHeight = pHeight;
	ctx.render();
}

// Set new renderer size and return the flag
function needResizeRenderer() {
	const width = ctx.canvas.clientWidth;
	const height = ctx.canvas.clientHeight;
	const needResize =
		ctx.canvas.width !== width || ctx.canvas.height !== height;
	if (needResize) ctx.renderer.setSize(width, height, false);
	return needResize;
  }

// Allow a user to rotate the globe model manually
function control(speed) {
	const ctx = this;
	if (!ctx) {console.error('Error: undefined context object');}

	if (!speed) speed = 0.2;
    
	const controls =
		new THREE.OrbitControls(ctx.camera, ctx.renderer.domElement);
	controls.addEventListener('change', ctx.render);
	controls.enableZoom = ctx.opts.enableZoom;
	controls.rotateSpeed = speed;

	return;
}

// Make the globe model rotating
function rotate(speed) {
	if (!ctx) {console.error('Error: undefined context object');}

	if (!speed) speed = 0.001;

	const quaternion = new THREE.Quaternion();
	quaternion.setFromAxisAngle(
		new THREE.Vector3(ctx.axisVectorX, ctx.axisVectorY, 0),
		speed
	);

	const animate = function(){
		requestAnimationFrame(animate);
		ctx.planet.applyQuaternion(quaternion);
		ctx.objs.forEach((obj) => {
			obj.applyQuaternion(quaternion);
		});    
		ctx.render();
	};

	animate();

	return;
}

// Draw array of points
function drawPoints(pointsDeg, ftOpts) {
	const ctx = this;
	if (!ctx) {console.error('Error: undefined context object');}
	if (!pointsDeg) {console.error('Error: undefined pointDeg array');}

	const matStyle = {color: parseInt(ftOpts.color)};

	const pGeometries = [];
	const pMaterial = new THREE.MeshBasicMaterial(matStyle);

	let pointsRad = pointsDeg.map(([lonDeg, latDeg]) => {
		return [THREE.Math.degToRad(-lonDeg), THREE.Math.degToRad(latDeg)];
	});

	pointsRad.forEach(([lonRad, latRad]) => {
		const xz = Math.cos(latRad);
		const [x, y] = zRotation(
			ctx.opts.axisAngle, [xz*Math.cos(lonRad), Math.sin(latRad)]
		);
		const pGeometry = new THREE.SphereBufferGeometry(
			ftOpts.radius, ftOpts.widthSegs, ftOpts.heightSegs
		);
		pGeometry.translate(x, y, xz*Math.sin(lonRad));
		pGeometries.push(pGeometry);
	});

	const pointsGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
		pGeometries, false);
	const points = new THREE.Mesh(pointsGeometry, pMaterial);
	ctx.scene.add(points);

	ctx.objs.push(points);
    
	return ctx;
}

// Draw array of array of strings
function drawStringss(stringss, ftOpts) {
	const ctx = this;
	if (!ctx) {console.error('Error: undefined context object');}
	if (!stringss) {console.error('Error: undefined stringss array');}

	const matStyle = {};
	if (ftOpts.color) matStyle.color = parseInt(ftOpts.color);
	if (ftOpts.linewidth) matStyle.linewidth = ftOpts.linewidth;
	if (ftOpts.scale) matStyle.scale = ftOpts.scale;
	if (ftOpts.dashSize) matStyle.dashSize = ftOpts.dashSize;
	if (ftOpts.gapSize) matStyle.gapSize = ftOpts.gapSize;

	let sMaterial;
	if (matStyle.scale || matStyle.dashSize || matStyle.gapSize) {
		sMaterial = new THREE.LineDashedMaterial(matStyle);
	} else {
		sMaterial = new THREE.LineBasicMaterial(matStyle);
	}

	stringss.forEach((strings) => {
		strings.forEach((string) => {
			let pointsRad = string.map(([lonDeg, latDeg]) => {
				return [THREE.Math.degToRad(-lonDeg), THREE.Math.degToRad(latDeg)];
			});
			if (ctx.opts.dMin)
				pointsRad = doFillout(pointsRad, ctx.opts.dMin, ctx.dFunc);

			const sGeometry = new THREE.BufferGeometry();
			const positions = [];
			pointsRad.forEach(([lonRad, latRad]) => {
				const xz = Math.cos(latRad);
				const [x, y] = zRotation(
					ctx.opts.axisAngle, [xz*Math.cos(lonRad), Math.sin(latRad)]
				);
				positions.push(x, y, xz*Math.sin(lonRad));
			});

			sGeometry.addAttribute(
				'position', new THREE.Float32BufferAttribute( positions, 3 ));
			const line = new THREE.Line(sGeometry, sMaterial);
			line.computeLineDistances();
			ctx.scene.add(line);

			ctx.objs.push(line);
		});
	});

	return ctx;
}

// TODO: Function for removing a geometry
function removeGeometry(n) {
}

// Draw a geometry from GeoJSON data
function drawGeometry(geometry, ftOpts) {
	const ctx = this;
	if (!ctx) {console.error('Error: undefined context object');}
	if (!geometry.type) return ctx;
	if (!geometry.coordinates) return ctx;

	const coords = geometry.coordinates;

	switch (geometry.type) {
		case "Point":
			ctx.drawPoints([coords], ftOpts);
			break;
		case "MultiPoint":
			ctx.drawPoints(coords, ftOpts);
			break;
		case "LineString":
			ctx.drawStringss([[coords]], ftOpts);
			break;
		case "MultiLineString":
		case "Polygon":
			ctx.drawStringss([coords], ftOpts);
			break;
		case "MultiPolygon":
			ctx.drawStringss(coords, ftOpts);
			break;
		case "GeometryCollection":
			coords.forEach((subFt) => {
				ctx.drawGeometry(subFt, ftOpts);
			});
			break;
		default:
		  break;
	}

	return ctx;
}

// Merge defaultFtOpts with subsFtOpts
function mergeFtOpts(subsFtOpts) {
	let mergedOpts = {};
	for (var opt in defaultFtOpts) {
		if (typeof defaultFtOpts[opt] === 'object') {
			mergedOpts[opt] = Object.assign({}, defaultFtOpts[opt]);
			mergedOpts[opt] = Object.assign(mergedOpts[opt], subsFtOpts[opt]);
		}
	}
	return mergedOpts;
}

// Draw GeoJSON data
function drawGeoJSON(json, subsFtOptsArr) {
	const ctx = this;
	if (!ctx) {console.error('Error: undefined context object');}
	if (!json) {console.error('Error: undefined geojson object');}

	let glFtOpts = [];
	if (subsFtOptsArr&&subsFtOptsArr.length>0) {
		subsFtOptsArr.forEach((subsFtOpts) => {
			if (typeof subsFtOpts === 'object') {
				glFtOpts.push(mergeFtOpts(subsFtOpts));
			} else {
				console.error('Error: invalid substitution options');
			}
		});
	} else {
		glFtOpts = [defaultFtOpts]; // at least one opts always exists
	}

	// loop on GeoJSON features
	json.features.forEach((ft) => {
		if (ft.geometry) {
			const type = ft.geometry.type;
			const props = ft.properties;
			const threeJSOpts = (props&&props.threeJSOpts)?props.threeJSOpts:[];
			const optsPairs = zipOpts(threeJSOpts, glFtOpts, defaultFtOpts);
			const finalFtOpts = optsPairs.map(([a, b]) => {
				let mergedOpts = {};
				mergedOpts = Object.assign(mergedOpts, b[type]);
				mergedOpts = Object.assign(mergedOpts, a);
				return mergedOpts;
			});
			finalFtOpts.forEach((ftOpts) => {
				ctx.drawGeometry(ft.geometry, ftOpts);
			});
		} else if (ft.geometries) {
			const props = ft.properties;
			const threeJSOpts = (props&&props.threeJSOpts)?props.threeJSOpts:[];
			threeJSOpts.forEach((ftOpts) => {
				ft.geometries.forEach((subFt) => {
					ctx.drawGeometry(subFt, ftOpts);
				});
			});
		}
	});
	
	return ctx;
}

	return ctx;
}; // PlanetView

// In the next three functions: 'phi' is longitude, 'theta' is latitude

// Get arc distance between two points on sphere as the length
// of the longest of the arc's horizontal or vertival projections (fastest)
function dMaxFunc([phi1, theta1], [phi2, theta2]) {
	const rY = Math.cos((Math.abs(theta1)+Math.abs(theta2))/2);
	return Math.max(rY * Math.abs((phi1-phi2)), Math.abs(theta1-theta2));
}

// Get arc distance between two points on sphere
// as the length of the straightened arc between these points
function dSqrFunc([phi1, theta1], [phi2, theta2]) {
	const dy = Math.abs(theta1-theta2);
	const rY = Math.cos((Math.abs(theta1)+Math.abs(theta2))/2);
	const dx = rY * Math.abs(phi1-phi2);
	return Math.sqrt(dx*dx+dy*dy);
}

// Get arc distance between two points on sphere
// calculated by the exact formula (slowest)
function dArcFunc([phi1, theta1], [phi2, theta2]) {
	return Math.acos(
		Math.sin(theta1)*Math.sin(theta2) +
		Math.cos(theta1)*Math.cos(theta2)*Math.cos(phi1-phi2)
	);
}

// Compute coordinates on rotation
function zRotation(alpha, [x0, y0]) {
	const x1 = x0*Math.cos(alpha) + y0*Math.sin(alpha);
	const y1 = -x0*Math.sin(alpha) + y0*Math.cos(alpha);
	return [x1, y1];
}

// Add additional points if distances between points are too large
function doFillout(points, dMax, dFunc) {
	const dMaxRad = dMax*Math.PI/180;
	const segments = zip(points.slice(0,-1), points.slice(1));
	return segments.flatMap(([[phi1, theta1], [phi2, theta2]]) => {
		const dRad = dFunc([phi1, theta1], [phi2, theta2]);
		if (dRad>dMaxRad) {
			const k = Math.ceil(dRad/dMaxRad);
			const dPhi = (phi2-phi1)/k;
			const dTheta = (theta2-theta1)/k;
			return [...Array(k).keys()].map((i) => {
				return [phi1+i*dPhi, theta1+i*dTheta];
			});
		} else {
			return [[phi1, theta1]];
		}
	});
}

// Zipping two arrays of equal length
function zip(arr1, arr2) {
	return (arr1.map((k, i) => [k, arr2[i]]));
}

// Zipping two arrays padding smaller one with {} or 'el' value
function zipOpts(arr1, arr2, el) {
	if (arr1.length>arr2.length) {
		arr2 = arr2.concat(
			Array.from({length: arr1.length-arr2.length}, _ => el)
		);
	} else if (arr1.length<arr2.length) {
		arr1 = arr1.concat(
			Array.from({length: arr2.length-arr1.length}, _ => new Object())
		);
	}
	return zip(arr1, arr2);
}
