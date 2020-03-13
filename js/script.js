
//test if browser supports webGL

if(Modernizr.webgl) {

	//setup pymjs
	var pymChild = new pym.Child();

	d3.csv("data/msoanames.csv", function(error, data) {
		msoanames_data = data;
	});

	//Load data and config file
	d3.queue()
		.defer(d3.json, "data/config.json")
		.await(ready);

	function ready (error, config){

	// function ready (error, data, config, geog){

		//Set up global variables
		dvc = config.ons;
		oldmsoa11cd = "";
		firsthover = true;



		//set title of page
		//Need to test that this shows up in GA
		document.title = dvc.maptitle;


		//Set up number formats
		// displayformat = GB.format("$,." + dvc.displaydecimals + "%");
		displayformat = d3.format(",." + dvc.displaydecimals + "f");
		legendformat = d3.format(",");

		//set up basemap
		map = new mapboxgl.Map({
		  container: 'map', // container id
		  style: 'data/style.json', //stylesheet location
			//style: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-night/style.json',
		  center: [-0.12, 51.5], // starting position51.5074° N, 0.1278
		  zoom:12, // starting zoom
		  minZoom:4,
			maxZoom: 17, //
		  attributionControl: false
		});
		//add fullscreen option
		map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

		// Add zoom and rotation controls to the map.
		map.addControl(new mapboxgl.NavigationControl(), 'top-left');
		
		//move attribution
		//map.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

		// Disable map rotation using right click + drag
		map.dragRotate.disable();

		// Disable map rotation using touch rotation gesture
		map.touchZoomRotate.disableRotation();


		// Add geolocation controls to the map.
		map.addControl(new mapboxgl.GeolocateControl({
			positionOptions: {
				enableHighAccuracy: true
			}
		}));

		//add compact attribution
		map.addControl(new mapboxgl.AttributionControl({
			compact: true
		}));

		addFullscreen();

		if(config.ons.breaks =="jenks") {
			breaks = [];

			ss.ckmeans(values, (dvc.numberBreaks)).map(function(cluster,i) {
				if(i<dvc.numberBreaks-1) {
					breaks.push(cluster[0]);
				} else {
					breaks.push(cluster[0])
					//if the last cluster take the last max value
					breaks.push(cluster[cluster.length-1]);
				}
			});
		}
		else if (config.ons.breaks == "equal") {
			breaks = ss.equalIntervalBreaks(values, dvc.numberBreaks);
		}
		else {breaks = config.ons.breaks;};


		//round breaks to specified decimal places
		breaks = breaks.map(function(each_element){
			return Number(each_element.toFixed(dvc.legenddecimals));
		});

		//work out halfway point (for no data position)
		midpoint = breaks[0] + ((breaks[dvc.numberBreaks] - breaks[0])/2)

		//Load colours
		if(typeof dvc.varcolour === 'string') {
			colour = colorbrewer[dvc.varcolour][dvc.numberBreaks];
		} else {
			colour = dvc.varcolour;
		}

		//set up d3 color scales
		color = d3.scaleThreshold()
				.domain(breaks.slice(1))
				.range(colour);

		//now ranges are set we can call draw the key
		createKey(config);


		map.on('load', function() {

				R = ['step', ['/', ["number", ["get", "a_median"]], ["number", ["get",'income']]],
				"#7FCDBB", 2,
				"#7FCDBB", 4,
				"#41B6C4", 8,
				"#1D91C0", 12,
				"#225EA8", 14,
				"#0C2C84"
				
				];
				
				
				
				map.addLayer({
					"id": "msoa-outlines",
					"type": "fill",
					"source": {
						"type": "vector",
						"tiles":  ["https://cdn.ons.gov.uk/maptiles/t25/boundaries/{z}/{x}/{y}.pbf"]
					},
					"source-layer": "boundaries",
					"minzoom":9,
					"maxzoom":20,
					"layout": {},
					'paint': {
							'fill-opacity':0.2,
							'fill-outline-color':'rgba(0,0,0,0)',
							'fill-color': R
							// 'fill-color': {
							// 		// Refers to the data of that specific property of the polygon
							// 	'property': "a_median",
							// 	'default': '#666666',
							// 	// Prevents interpolation of colors between stops
							// 	'base': 0,
							//
							// 	'stops': [
							// 		[0, '#15534C'],
							// 		[1, '#15534C'],
							// 		[2, '#30785B'],
							// 		[3, '#5D9D61'],
							// 		[9, '#99C160'],
							// 		[15, '#E2E062']
							//
							// 	]


						}
				});			


				map.addLayer({
					"id": "msoa-outlines2",
					"type": "fill",
					"source": {
						"type": "vector",
						"tiles":  ["https://cdn.ons.gov.uk/maptiles/t25/boundaries/{z}/{x}/{y}.pbf"]
					},
					"source-layer": "boundaries",
					"minzoom":4,
					"maxzoom":9,
					"layout": {},
					'paint': {
							'fill-opacity':0.5,
							'fill-outline-color':'rgba(0,0,0,0)',
							'fill-color': R
							// 'fill-color': {
							// 		// Refers to the data of that specific property of the polygon
							// 	'property': "a_median",
							// 	'default': '#666666',
							// 	// Prevents interpolation of colors between stops
							// 	'base': 0,
							//
							// 	'stops': [
							// 		[0, '#15534C'],
							// 		[1, '#15534C'],
							// 		[2, '#30785B'],
							// 		[3, '#5D9D61'],
							// 		[9, '#99C160'],
							// 		[15, '#E2E062']
							//
							// 	]


						}
				});			


				map.addLayer({
					"id": "income",
					'type': 'fill',
					"source": {
						"type": "vector",
						//"tiles": ["https://cdn.ons.gov.uk/maptiles/t17/{z}/{x}/{y}.pbf"],
						"tiles": ["https://cdn.ons.gov.uk/maptiles/t25/tiles/{z}/{x}/{y}.pbf"],
						"minzoom": 4
					},
					"source-layer": "houseprices",
					"background-color": "#ccc",
					'paint': {
							'fill-opacity':1,
							'fill-outline-color':'rgba(0,0,0,0)',
							'fill-color': R
							// 'fill-color': {
							// 		// Refers to the data of that specific property of the polygon
							// 	'property': "a_median",
							// 	'default': '#666666',
							// 	// Prevents interpolation of colors between stops
							// 	'base': 0,
							//
							// 	'stops': [
							// 		[0, '#15534C'],
							// 		[1, '#15534C'],
							// 		[2, '#30785B'],
							// 		[3, '#5D9D61'],
							// 		[9, '#99C160'],
							// 		[15, '#E2E062']
							//
							// 	]


						}
				},'place_other');
				
				map.addLayer({
					"id": "msoa-outlines-hover",
					"type": "line",
					"source": {
						"type": "vector",
						"tiles":  ["https://cdn.ons.gov.uk/maptiles/t25/boundaries/{z}/{x}/{y}.pbf"]
					},
					"source-layer": "boundaries",
					"minzoom":9,
					"maxzoom":20,
					"layout": {},
					"paint": {
						"line-color": "#FF9933",
						"line-width": 3
					},
					"filter": ["==", "msoa11cd", ""]
				});	
				
				map.addLayer({
					"id": "msoa-outlines2-hover",
					"type": "line",
					"source": {
						"type": "vector",
						"tiles":  ["https://cdn.ons.gov.uk/maptiles/t25/boundaries/{z}/{x}/{y}.pbf"]
					},
					"source-layer": "boundaries",
					"minzoom":4,
					"maxzoom":9,
					"layout": {},
					"paint": {
						"line-color": "#FF9933",
						"line-width": 3
					},
					"filter": ["==", "msoa11cd", ""]
				});	


			//test whether ie or not
			function detectIE() {
			  var ua = window.navigator.userAgent;


			  var msie = ua.indexOf('MSIE ');
			  if (msie > 0) {
				// IE 10 or older => return version number
				return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
			  }

			  var trident = ua.indexOf('Trident/');
			  if (trident > 0) {
				// IE 11 => return version number
				var rv = ua.indexOf('rv:');
				return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
			  }

			  var edge = ua.indexOf('Edge/');
			  if (edge > 0) {
				// Edge (IE 12+) => return version number
				return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
			  }

			  // other browser
			  return false;
			}


			if(detectIE()){
				onMove = onMove.debounce(100);
				onLeave = onLeave.debounce(100);
			};

			//Highlight stroke on mouseover (and show area information)
			map.on("mousemove", "msoa-outlines", onMove);
			map.on("mousemove", "msoa-outlines2", onMove);

			// Reset the msoa-fills-hover layer's filter when the mouse leaves the layer.
			map.on("mouseleave", "msoa-outlines", onLeave);
			map.on("mouseleave", "msoa-outlines2", onLeave);

			map.getCanvasContainer().style.cursor = 'pointer';

			//Add click event
			map.on('click', 'msoa-outlines', onClick);
			map.on('click', 'msoa-outlines2', onClick);

			//get location on click
			d3.select(".mapboxgl-ctrl-geolocate").on("click", geolocate);


			//map.on('zoom', function(){console.log(map.getZoom())});//end mapload

})

		$(".search-control").click(function() {
			d3.select(".search-control").style("text-transform", "uppercase");
			$(".search-control").val('')
		})

		d3.select(".search-control").on("keydown", function() {
    if(d3.event.keyCode === 13){
			event.preventDefault();
			event.stopPropagation();

			myValue=$(".search-control").val();


			getCodes(myValue);
			pymChild.sendHeight();

    }
  })

		$("#submitPost").click(function( event ) {

						event.preventDefault();
						event.stopPropagation();

						myValue=$(".search-control").val();


						getCodes(myValue);
						pymChild.sendHeight();
		});

		function onMove(e) {
				newmsoa11cd = e.features[0].properties.msoa11cd;
				if(firsthover) {
            dataLayer.push({
                'event': 'mapHoverSelect',
                'selected': newmsoa11cd
            })

            firsthover = false;
        }


				if(newmsoa11cd != oldmsoa11cd) {
					oldmsoa11cd = e.features[0].properties.msoa11cd;
					
					if(map.getZoom() <= 9 ){
						console.log("zoomed in "+map.getZoom())
						map.setFilter("msoa-outlines2-hover", ["==", "msoa11cd", e.features[0].properties.msoa11cd]);
						features = map.queryRenderedFeatures(e.point,{layers: ['msoa-outlines2']});
					} else {
						console.log("zoomed out "+map.getZoom())
							map.setFilter("msoa-outlines-hover", ["==", "msoa11cd", e.features[0].properties.msoa11cd]);
							features = map.queryRenderedFeatures(e.point,{layers: ['msoa-outlines']});
					}

					// selectArea(e.features[0].properties.msoa11cd);


				    
				 	if(features.length != 0){

						setAxisVal(features, features[0].properties.msoa11nm, features[0].properties["a_median"]);
					}
					//setAxisVal(e.features[0].properties.msoa11nm, e.features[0].properties["a_median"]);
				}
		};


		function tog(v){return v?'addClass':'removeClass';}
		$(document).on('input', '.clearable', function(){
				$(this)[tog(this.value)]('x');
		}).on('mousemove', '.x', function( e ){
				$(this)[tog(this.offsetWidth-28 < e.clientX-this.getBoundingClientRect().left)]('onX');
		}).on('touchstart click', '.onX', function( ev ){
				ev.preventDefault();
				$(this).removeClass('x onX').val('').change();
			//	console.log("here")
				enableMouseEvents();
				onLeave();
		});



		function onLeave() {
				map.setFilter("msoa-outlines-hover", ["==", "msoa11cd", ""]);
				oldmsoa11cd = "";
				// $("#areaselect").val("").trigger("chosen:updated");
				hideaxisVal();
		};



		 function onClick(e) {
		 		disableMouseEvents();
		 		newmsoa11cd = e.features[0].properties.msoa11cd;
				features = e.features;

		 		if(newmsoa11cd != oldmsoa11cd) {
		 			oldmsoa11cd = e.features[0].properties.msoa11cd;
		 			map.setFilter("msoa-outlines-hover", ["==", "msoa11cd", e.features[0].properties.msoa11cd]);

		 			 //selectArea(e.features[0].properties.msoa11cd);
		 			setAxisVal(e.features, e.features[0].properties.msoa11nm, e.features[0].properties["a_median"]);
		 		}

		 		dataLayer.push({
             'event':'mapClickSelect',
             'selected': newmsoa11cd
         })
		 };

		function disableMouseEvents() {
				map.off("mousemove", "msoa-outlines", onMove);
				map.off("mouseleave", "msoa-outlines", onLeave);
		}

		function enableMouseEvents() {
				map.on("mousemove", "msoa-outlines", onMove);
				map.on("click", "msoa-outlines", onClick);
				map.on("mouseleave", "msoa-outlines", onLeave);
		}


		function setAxisVal(features,areanm,areaval) {


			populatecalculator(features);

			//d3.select("#keyvalue").style("font-weight","bold").text(function(){
				//if(!isNaN(areaval)) {
					//return areanm + " - £" + displayformat(areaval)
					//populate stuff at the top
				//} else {
					//return areanm + " - No data available";
				//}

			//});


		}

		function hideaxisVal() {
			d3.select("#keyvalue").style("font-weight","bold").text("");

		}

		function createKey(config){

			stops = [
				[2, '#7FCDBB'],
				[4, '#7FCDBB'],
				[8, '#41B6C4'],
				[12, '#1D91C0'],
				[14, '#225EA8'],
				[38, '#0C2C84']
			]
			

			
			//draw legend based on stops array
			var j;
			for (j = 0; j <= stops.length-2; j++) { 
			   
			   //sort our legend colours
			   d3.select(".legendblock" + j)
			   	.style("background-color",stops[j+1][1])

			   //sort out text on legend entries
			   d3.select(".legendentry" + j).text(stops[j][0] + "-" + parseInt(stops[j+1][0]));
			}
			



	} // Ends create key

	function addFullscreen() {

		currentBody = d3.select("#map").style("height");
		d3.select(".mapboxgl-ctrl-fullscreen").on("click", setbodyheight)

	}

	function setbodyheight() {
		d3.select("#map").style("height","100%");

		document.addEventListener('webkitfullscreenchange', exitHandler, false);
		document.addEventListener('mozfullscreenchange', exitHandler, false);
		document.addEventListener('fullscreenchange', exitHandler, false);
		document.addEventListener('MSFullscreenChange', exitHandler, false);

	}


	function exitHandler() {
			if (document.webkitIsFullScreen === false)
			{
				shrinkbody();
			}
			else if (document.mozFullScreen === false)
			{
				shrinkbody();
			}
			else if (document.msFullscreenElement === false)
			{
				shrinkbody();
			}
		}

	function shrinkbody() {
		d3.select("#map").style("height",currentBody);
		pymChild.sendHeight();
	}

	function geolocate() {
		dataLayer.push({
								'event': 'geoLocate',
								'selected': 'geolocate'
		})

		var options = {
		  enableHighAccuracy: true,
		  timeout: 5000,
		  maximumAge: 0
		};

		navigator.geolocation.getCurrentPosition(success, error, options);
	}

	function getCodes(myPC)	{

		//first show the remove cross
		d3.select(".search-control").append("abbr").attr("class","postcode");

			dataLayer.push({
								 'event': 'geoLocate',
								 'selected': 'postcode'
							 })

			var myURIstring=encodeURI("https://api.postcodes.io/postcodes/"+myPC);
			$.support.cors = true;
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "jsonp",
				url: myURIstring,
				error: function (xhr, ajaxOptions, thrownError) {
					},
				success: function(data1){
					if(data1.status == 200 ){
						//$("#pcError").hide();
						lat =data1.result.latitude;
						lng = data1.result.longitude;
						//console.log(lat,lng);
						successpc(lat,lng)
					} else {
						$(".search-control").val("Sorry, invalid postcode.");
					}
				}

			});

		}
		
	

	function successpc(lat,lng) {

		map.jumpTo({center:[lng,lat], zoom:12})
		point = map.project([lng,lat]);


		setTimeout(function(){

		var tilechecker = setInterval(function(){
			 features=null
		 	features = map.queryRenderedFeatures(point,{layers: ['msoa-outlines']});
		 	if(features.length != 0){

				//populatecalculator(features);


		 		 //onrender(),
		 		map.setFilter("msoa-outlines-hover", ["==", "msoa11cd", features[0].properties.msoa11cd]);
				//var features = map.queryRenderedFeatures(point);
				disableMouseEvents();
				setAxisVal(features, features[0].properties.msoa11nm, features[0].properties["a_median"]);

		 		clearInterval(tilechecker);
		 	}
		 },500)
		},500);



	};

	function populatecalculator(features) {
		
		console.log(features)
	
		//build the custom variable we want to return for the user
		var returnbuilt = propertytype+"_"+pricepoint;

		if (features[0].properties[returnbuilt] == undefined){
			d3.select("#nostatsmessage").style("display","block")
			d3.select("#successfulstats").style("display","none")
			d3.select("#smallareareadout2").text(filteredMSOAName[0].msoa11hclnm).style("font-weight","700")
			d3.select("#areareadout2").text(features[0].properties.LAname).style("font-weight","700")
		} else {
			d3.select("#nostatsmessage").style("display","none")
			d3.select("#successfulstats").style("display","block")
			d3.select("#nostatsmessage2").style("display","none")
			d3.select("#successfulstats2").style("display","block")		
		}
		
		//determine what measure is selected and state in opening statement
		if(pricepoint == "median"){
			d3.select("#measureofhouseprice").text(", an average")
			d3.select("#measureofhouseprice2").text(", an average")
		} else if(pricepoint == "lowerquartile"){
			d3.select("#measureofhouseprice").text(", an entry level")
			d3.select("#measureofhouseprice2").text(", an entry level")
		} else if(pricepoint == "tenp"){
			d3.select("#measureofhouseprice").text(", a low priced")
			d3.select("#measureofhouseprice2").text(", a low priced")
		};
		
		//populate the house type if one is selected
		if(propertytype == "a"){
			d3.select("#propertytype").text("property")
			d3.select("#propertytype2").text("property")
		}
		else if(propertytype == "d"){
			d3.select("#propertytype").text("detached property")
			d3.select("#propertytype2").text("detached property")
		}
		else if(propertytype == "s"){
			d3.select("#propertytype").text("semi-detached property")
			d3.select("#propertytype2").text("semi-detached property")
		}
		else if(propertytype == "t"){
			d3.select("#propertytype").text("terraced property")
			d3.select("#propertytype2").text("terraced property")
		}
		else if(propertytype == "f"){
			d3.select("#propertytype").text("flat / maisonette")
			d3.select("#propertytype2").text("flat / maisonette")
		}
		
	
			

		//let's set up some number formats
				//1dp
				numformat1=d3.format(",.1f");
				//comma and 0dp
				numformat2=d3.format(",.0f");

		//let's get the area name from the msoa names datacsv
		filteredMSOAName = msoanames_data.filter(function(d) {return d.msoa11cd == features[0].properties.msoa11cd});
		//console.log(filteredMSOAName[0].msoa11hclnm)

		//set the area names throughout the text
		d3.select("#smallareareadout").text(filteredMSOAName[0].msoa11hclnm).style("font-weight","700")
		d3.select("#areareadout").text(features[0].properties.LAname).style("font-weight","700")
		d3.select("#smallareareadout2").text(filteredMSOAName[0].msoa11hclnm).style("font-weight","700")
		d3.select("#areareadout2").text(features[0].properties.LAname).style("font-weight","700")
		
		//work out your deposit
		depositpercentcalculated = 1-(depositamount/100);
			
		
		//work out your deposit
		deposit = features[0].properties[returnbuilt] - (features[0].properties[returnbuilt] * depositpercentcalculated);
		
		//stamp duty stuff
		lacodeget = features[0].properties.LAcode;
        englandorwales = lacodeget.charAt(0);
		
		
		//first if the area is english
		if(englandorwales == "E"){
				if(firsttimebuyer == true && features[0].properties[returnbuilt] < 500001){
					//work out stamp duty if you are a first time buyer
					if (features[0].properties[returnbuilt] < 300001){
						stampduty = 0
					}
					else if (features[0].properties[returnbuilt] > 300000){
						stampduty = (features[0].properties[returnbuilt] -300000) * 0.05;
					}
				} else if(firsttimebuyer == false) {
					//work out stamp duty if you are NOT a first time buyer
					if (features[0].properties[returnbuilt] < 125001){
						stampduty = 0
					}
					else if (features[0].properties[returnbuilt] > 125000 && features[0].properties[returnbuilt] < 250001){
						stampduty = (features[0].properties[returnbuilt] -125000) * 0.02;
					}
					else if (features[0].properties[returnbuilt] > 250000 && features[0].properties[returnbuilt] < 925001){
						stampduty = ((features[0].properties[returnbuilt] - 250000) * 0.05) + 2500;
					}
					else if (features[0].properties[returnbuilt] > 925000 && features[0].properties[returnbuilt] < 1500001){
						stampduty = ((features[0].properties[returnbuilt] - 925000) * 0.1) + 33750 + 2500;
					}
					else if (features[0].properties[returnbuilt] > 1500000){
						stampduty = ((features[0].properties[returnbuilt] - 1500000) * 0.12) + 33750 + 57500 + 2500;
					}
				}else if (firsttimebuyer == true && features[0].properties[returnbuilt] > 500000){
					//work out stamp duty if you are NOT a first time buyer
					if (features[0].properties[returnbuilt] < 125001){
						stampduty = 0
					}
					else if (features[0].properties[returnbuilt] > 125000 && features[0].properties[returnbuilt] < 250001){
						stampduty = (features[0].properties[returnbuilt] -125000) * 0.02;
												
					}
					else if (features[0].properties[returnbuilt] > 250000 && features[0].properties[returnbuilt] < 925001){
						stampduty = ((features[0].properties[returnbuilt] - 250000) * 0.05) + 2500;
					}
					else if (features[0].properties[returnbuilt] > 925000 && features[0].properties[returnbuilt] < 1500001){
						stampduty = ((features[0].properties[returnbuilt] - 925000) * 0.1) + 33750 + 2500;
					}
					else if (features[0].properties[returnbuilt] > 1500000){
						stampduty = ((features[0].properties[returnbuilt] - 1500000) * 0.12) + 33750 + 57500 + 2500;
					}
				}
		}//close if english 
		else if (englandorwales == "W"){
					//work out stamp duty if you are buying in a Welsh area
					if (features[0].properties[returnbuilt] < 180001){
						stampduty = 0
					}
					else if (features[0].properties[returnbuilt] > 180000 && features[0].properties[returnbuilt] < 250001){
						stampduty = (features[0].properties[returnbuilt] -180000) * 0.035;					
					}
					else if (features[0].properties[returnbuilt] > 250000 && features[0].properties[returnbuilt] < 400001){
						stampduty = ((features[0].properties[returnbuilt] - 250000) * 0.05) + 2450;
					}
					else if (features[0].properties[returnbuilt] > 400000 && features[0].properties[returnbuilt] < 750001){
						stampduty = ((features[0].properties[returnbuilt] - 400000) * 0.075) + 7500 + 2450;
					}
					else if (features[0].properties[returnbuilt] > 750000 && features[0].properties[returnbuilt] < 1500001){
						stampduty = ((features[0].properties[returnbuilt] - 750000) * 0.1) + 7500 + 2450 + 26250;
					}
					else if (features[0].properties[returnbuilt] > 1500000){
						stampduty = ((features[0].properties[returnbuilt] - 1500000) * 0.12) + 7500 + 2450 + 26250 + 75000;
					}
					
		}//close stamp duty calculations
		
		//Is this a second property?

		//let's assume a 10% deposit + stamp duty
		d3.select("#yourincomereadout").text("£" + numformat2(((features[0].properties[returnbuilt] - deposit) / lendratio))).style("font-weight","700")
		d3.select("#yourdepositreadout").text("£" + (numformat2(stampduty + deposit + parseInt(addittionalcosts)))).style("font-weight","700")
		d3.select("#depositreadout").text("£" + numformat2(deposit)).style("font-weight","700")
		d3.select("#stampdutyreadout").text(function(){if(stampduty == 0){return "no"} else {return "£" + numformat2(stampduty)}}).style("font-weight","700")
		d3.select("#ratioreadout").text(": " + numformat1(features[0].properties.a_median / features[0].properties.income)).style("font-weight","700")
		d3.select("#housepricereadout").text("£" + numformat2(features[0].properties[returnbuilt])).style("font-weight","700")
		d3.select("#averageincomereadout").text("£" + numformat2(features[0].properties.income)).style("font-weight","700")
		
		d3.select("#yourincomereadout2").text("£" + numformat2(((features[0].properties[returnbuilt] - deposit) / lendratio))).style("font-weight","700")
		d3.select("#yourdepositreadout2").text("£" + (numformat2(stampduty + deposit + parseInt(addittionalcosts)))).style("font-weight","700")
		d3.select("#depositreadout2").text("£" + numformat2(deposit)).style("font-weight","700")
		d3.select("#stampdutyreadout2").text(function(){if(stampduty == 0){return "no"} else {return "£" + numformat2(stampduty)}}).style("font-weight","700")
		d3.select("#ratioreadout2").text(": " + numformat1(features[0].properties.a_median / features[0].properties.income)).style("font-weight","700")
		d3.select("#housepricereadout2").text("£" + numformat2(features[0].properties[returnbuilt])).style("font-weight","700")
		d3.select("#averageincomereadout2").text("£" + numformat2(features[0].properties.income)).style("font-weight","700")


		//select the display box to the side of the map and make it bigger ready for text
		d3.select("#infodiv").style("display","block");
		d3.select("#infodiv2").style("display","block");
		
		//now let's deal with the legend selection/highlight
		var ratiovalue = features[0].properties.a_median / features[0].properties.income;
		     if(ratiovalue >= stops[0][0] && ratiovalue < stops[1][0]){
				 d3.selectAll(".legendblock").style("border","1px solid #fff")
				 d3.select(".legendblock0").style("border","1px solid #323132")
				 d3.selectAll(".legendentry").style("font-weight","400")
				 d3.select(".legendentry0").style("font-weight","bold")
			 }
		else if(ratiovalue >= stops[1][0] && ratiovalue < stops[2][0]){
				 d3.selectAll(".legendblock").style("border","1px solid #fff")
				 d3.select(".legendblock1").style("border","1px solid #323132")
				 d3.selectAll(".legendentry").style("font-weight","400")
				 d3.select(".legendentry1").style("font-weight","bold")
			 }
		else if(ratiovalue >= stops[2][0] && ratiovalue < stops[3][0]){
				 d3.selectAll(".legendblock").style("border","1px solid #fff")
				 d3.select(".legendblock2").style("border","1px solid #323132")
				 d3.selectAll(".legendentry").style("font-weight","400")
				 d3.select(".legendentry2").style("font-weight","bold")
			 }
		else if(ratiovalue >= stops[3][0] && ratiovalue < stops[4][0]){
				 d3.selectAll(".legendblock").style("border","1px solid #fff")
				 d3.select(".legendblock3").style("border","1px solid #323132")
				 d3.selectAll(".legendentry").style("font-weight","400")
				 d3.select(".legendentry3").style("font-weight","bold")
			 }
		else if(ratiovalue >= stops[4][0] && ratiovalue < stops[5][0]){
				 d3.selectAll(".legendblock").style("border","1px solid #fff")
				 d3.select(".legendblock4").style("border","1px solid #323132")
				 d3.selectAll(".legendentry").style("font-weight","400")
				 d3.select(".legendentry4").style("font-weight","bold")
			 }
		
	
		//now make things appear
		d3.selectAll(".displaytextformatting").style("display","block").style("opacity",1);
		d3.selectAll(".displaytextformatting2").style("display","block").style("opacity",1);

	}

	
	
	
	//fire the custom changes
	var features = null;
	function customchangemade(){
		populatecalculator(features)
	};
	
	var customscreenonoff = false;
	
	//deal with custom aspect of the calculator
	d3.select("#custombutton").on("click",function(){
		if (customscreenonoff == false){
			d3.select("#customscreen").style("display","block");
			customscreenonoff = true;
			d3.select("#customtwistytriangle").text("▼ ")
			pymChild.sendHeight();
		} else if (customscreenonoff == true){
			d3.select("#customscreen").style("display","none");
			customscreenonoff = false;
			d3.select("#customtwistytriangle").text("▶ ")
			pymChild.sendHeight();
		}
		pymChild.sendHeight();
	})
	
	//first let's set up some variables for custom things
	var firsttimebuyer = false;
	var pricepoint = "median";
	var propertytype = "a";
	var lendratio = 4.5;
	var depositamount = 10;
	var addittionalcosts = 0;
	
	
	
	//first time buyer
	d3.selectAll(".optionbutton-ftb").on("click",function(){
		d3.selectAll(".optionbutton-ftb").classed("selectedbutton",false);
		d3.select(this).classed("selectedbutton",true);
		
		if(d3.select(this).classed("ys-ft") == true){firsttimebuyer = true; customchangemade();d3.select("#asftb").text(" as a first time buyer"); d3.select("#asftb2").text(" as a first time buyer"); }
		else if(d3.select(this).classed("no-ft") == true){firsttimebuyer = false; customchangemade(); d3.select("#asftb").text(""); d3.select("#asftb2").text(""); }
	})
	
	
	//price points
	d3.selectAll(".optionbutton-prc").on("click",function(){
		d3.selectAll(".optionbutton-prc").classed("selectedbutton",false);
		d3.select(this).classed("selectedbutton",true);
		
		if(d3.select(this).classed("av-pr") == true){pricepoint = "median";  customchangemade(); }
		else if(d3.select(this).classed("lq-pr") == true){pricepoint = "lowerquartile";  customchangemade(); }
		else if(d3.select(this).classed("tp-pr") == true){pricepoint = "tenp";  customchangemade(); }
	})
	
	//property types
	d3.selectAll(".optionbutton-typ").on("click",function(){
		d3.selectAll(".optionbutton-typ").classed("selectedbutton",false);
		d3.select(this).classed("selectedbutton",true);
		
		if(d3.select(this).classed("al-pr") == true){propertytype = "a"; customchangemade(); }
		else if(d3.select(this).classed("dt-pr") == true){propertytype = "d"; customchangemade(); }
		else if(d3.select(this).classed("sm-pr") == true){propertytype = "s"; customchangemade(); }
		else if(d3.select(this).classed("tr-pr") == true){propertytype = "t"; customchangemade(); }
		else if(d3.select(this).classed("fl-pr") == true){propertytype = "f"; customchangemade(); }
	})
	
	
	//lending ratio
	d3.select("#lendingmultiplier").on("change",function(){
		lendratio=$("#lendingmultiplier").val()
		customchangemade();
	})
	
	//deposit amount
	d3.select("#depositpercentage").on("change",function(){
		depositamount=$("#depositpercentage").val()
		d3.select("#depositnumber").text(depositamount)
		customchangemade();
	})
	
	
	//associated costs
	d3.select("#associatedcosts").on("change",function(){
		addittionalcosts=$("#associatedcosts").val()
		customchangemade();
		if(addittionalcosts ==0){d3.select("#additionalincomereadout").text("")}
		else{d3.select("#additionalincomereadout").text(", £" + numformat2(addittionalcosts))}
		
		if(addittionalcosts ==0){d3.select("#additionalextratext").text("")}
		else{d3.select("#additionalextratext").text(" of associated costs ")}

	})
		
	
		function selectlist(datacsv) {

			var areacodes =  datacsv.map(function(d) { return d.msoa11cd; });
			var areanames =  datacsv.map(function(d) { return d.msoa11nm; });
			var menuarea = d3.zip(areanames,areacodes).sort(function(a, b){ return d3.ascending(a[0], b[0]); });

			// Build option menu for occupations
			var optns = d3.select("#selectNav").append("div").attr("id","sel").append("select")
				.attr("id","areaselect")
				.attr("style","width:98%")
				.attr("class","chosen-select");


			optns.append("option")
				.attr("value","first")
				.text("");

			optns.selectAll("p").data(menuarea).enter().append("option")
				.attr("value", function(d){ return d[1]})
				.text(function(d){ return d[0]});

			myId=null;

			$('#areaselect').chosen({width: "98%", allow_single_deselect:true}).on('change',function(evt,params){

					if(typeof params != 'undefined') {

							disableMouseEvents();

							map.setFilter("msoa-outlines-hover", ["==", "msoa11cd", params.selected]);

							selectArea(params.selected);
							setAxisVal(params.selected);

							zoomToArea(params.selected);

							dataLayer.push({
									'event': 'mapDropSelect',
									'selected': params.selected
							})
					}
					else {
							enableMouseEvents();
							hideaxisVal();
							onLeave();
							resetZoom();
					}

			});

	};

	}

} else {

	//provide fallback for browsers that don't support webGL
	d3.select('#map').remove();
	d3.select('body').append('p').html("Unfortunately your browser does not support WebGL. <a href='https://www.gov.uk/help/browsers' target='_blank>'>If you're able to please upgrade to a modern browser</a>")

}
