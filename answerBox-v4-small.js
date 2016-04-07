// ==UserScript==
// @name        knowledgeGraph-small
// @namespace   Chen Chunyang
// @require     http://d3js.org/d3.v3.min.js
// @require     https://d3js.org/d3.v3.min.js
// @require     https://code.jquery.com/jquery-2.1.4.min.js
// @require     http://labratrevenge.com/d3-tip/javascripts/d3.tip.v0.6.3.js
// @require     http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js
// @resource kg_css  https://graphofknowledge.appspot.com/dist/plugin.css
// @include     https://www.google.com*
// @version     4.0
// @grant    GM_addStyle
// @grant    GM_getResourceText
// ==/UserScript==

//var kg_cssSrc = GM_getResourceText ("kg_css");     //add external css file for tip event
//GM_addStyle (kg_cssSrc);

// All css files should appear in the end of the document, so as to load the document content faster

// function definition, used for drawing trend graph
function tagTrend(data, width_raw, height_raw, top_margin, position){
    if (top_margin < 8){
        top_margin = 8;
    }
    var margin = {
        top: top_margin, // if there is graph title, set this number = x + 20
        right: 12, // if there is line chart tag (line tag), set this number = 80
        bottom: 22,
        left: 45
    },
	width = width_raw - margin.left - margin.right,
	height = height_raw - margin.top - margin.bottom;

	var border = 0;
	var bordercolor = 'gray';

	var parseDate = d3.time.format("%Y%m%d").parse;

	var x = d3.time.scale()
		.range([0, width]);
	var y = d3.scale.linear()
		.range([height, 0]);

	var color = d3.scale.category10();
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	var line = d3.svg.line()
		.interpolate("basis")
		.x(function (d) {
		    return x(d.date);
        })
		.y(function (d) {
            return y(d.popularity);
        });

	var svg = d3.select(position).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("border",border)
	;

	//add border to the svg
	var borderPath = svg.append("rect")
						.attr("x", -45)
						.attr("y", -0) // if this is graph title, set this number = -20
						.attr("height", height_raw - top_margin)
						.attr("width", width_raw)
						.style("stroke", bordercolor)
						.style("fill", "none")
						.style("stroke-width", border);

	color.domain(d3.keys(data[0]).filter(function (key) {
		return key !== "date";
	}));

	data.forEach(function (d) {
		d.date = parseDate(d.date);
	});

	var cities = color.domain().map(function (name) {
		return {
			name: name,
			values: data.map(function (d) {
				return {
					date: d.date,
					popularity: +d[name]
				};
			})
		};
	});

	x.domain(d3.extent(data, function (d) {
		return d.date;
	}));

	y.domain([
	d3.min(cities, function (c) {
		return d3.min(c.values, function (v) {
			return v.popularity;
		});
	}),
	d3.max(cities, function (c) {
		return d3.max(c.values, function (v) {
			return v.popularity;
		});
	})]);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
        .style("font-size", "11px")
		.call(xAxis);

	// add the y axis and y-label
	svg.append("g")
		  .attr("class", "y axis")
		  .attr("transform", "translate(0,0)")
          .style("font-size", "11px")
		  .call(yAxis);
	svg.append("text")
		  .attr("class", "ylabel")
		  .attr("y", 0 - margin.left + 45) // x and y switched due to rotation!!
		  .attr("x", 0 - (height / 2))
		  .attr("dy", "1em")
		  .attr("transform", "rotate(-90)")
		  .style("text-anchor", "middle")
		  .style("font-size", "13px")
		  .text("question number /month");

	//Add title in the graph
    var city = svg.selectAll(".city")
		.data(cities)
		.enter().append("g")
		.attr("class", "city");

	city.append("path")
		.attr("class", "line")
		.attr("d", function (d) {
		return line(d.values);
	})
		.style("stroke", function (d) {
		return color(d.name);
	});
} // end of function tagTrend()

var fireOnHashChangesToo    = true;
var pageURLCheckTimer       = setInterval (
    function () {
        if (this.lastPathStr  !== location.pathname || this.lastQueryStr !== location.search || (fireOnHashChangesToo && this.lastHashStr !== location.hash)
        ) {
            this.lastPathStr  = location.pathname;
            this.lastQueryStr = location.search;
            this.lastHashStr  = location.hash;
            gmMain ();
        }
    }, 200
);

function gmMain () {
    console.log ('A "New" page has loaded.');           //for debugging
    // DO WHATEVER YOU WANT HERE.

    var checkRightColumn = document.getElementById("rightColumn");
    if (checkRightColumn != null) {    //delete the dom if exists
        checkRightColumn.parentElement.removeChild(checkRightColumn);
    }

    var input = document.getElementById("lst-ib").value.toLowerCase();                //Get the content in the search bar as the tag (lowercase and replace blank)

    // Insert Answering Box (right column) into the Google search page
    // There are 2 sections in answering-box. If there is no content in certain section, then do not appendChild to answering-box.
    var str_HTML;

    var baseHeight = 120 + $('#rhs').height();    //Align our answer box behind Google's direct answer or ads. Google's navigation bar height = 120
    var winWidth = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
    if (winWidth < 1300) {
        winWidth = 1300;
    }
    var rightColumn = document.createElement("div");
    rightColumn.id = "rightColumn";
    rightColumn.style = 'font-size:16px; position:absolute; top:'+ (baseHeight-10) +'px; left:'+ (winWidth/2) +'px; width: '+ (winWidth/2-30) +'px';
    document.body.appendChild(rightColumn);

    // initial analysis of input
    var tomTask = 0;
    var tag, graphResult;
    var inputList = [];
    var languageList = ['c#', 'java', 'python', 'c++', 'javascript', 'php']; // for Analogies
    var rsLanguage = '';
    var keywordList = ['library', 'libraries', 'lib', 'libs', 'tool', 'tools', 'software', 'softwares', 'language', 'languages'];
    var showConcept = true;
    var showLibrary = true;
    var showLanguage = true;
    if (input.replace(/\+\+/g,"@@@").indexOf("+") > 0){
        // (+)sign exists -----> do switch 1 only
        tomTask = 1;
    }
    else {
        // (+)sign is not founded
        input = input.replace(/\+\+/g, '@@@').replace(/\+/g, ' ').replace(/@@@/g, '++');
        inputList = input.split(" ");

        if (inputList.length<6) { // no more than 5 spaces in the input
            // check whether there is language name in the inputs
            for (i=0; i<inputList.length; i++){
                for (j=0; j<languageList.length; j++){
                    if (inputList[i] == languageList[j]){
                        rsLanguage = inputList[i];
                        input = input.replace(rsLanguage, '').replace(/ +/g, ' ').replace(/^ */g, '').replace(/ *$/g, '');
                        j = languageList.length; // for break purpose (quit for-loop)
                        i = inputList.length; // for break purpose (quit for-loop)
                    }
                }
            }
            if (rsLanguage) { // rsLanguage is not null
                // ------> do switch 2
                tomTask = 2;
            }
            else {
                // ------> do switch default
                tomTask = 0; // default value

                // check whether there is keyword (initial defined) in the inputs
                for (i=0; i<inputList.length; i++){
                    for (j=0; j<keywordList.length; j++){
                        if (inputList[i] == keywordList[j]){
                            showConcept = false;
                            input = input.replace(keywordList[j], '').replace(/ +/g, ' ').replace(/^ */g, '').replace(/ *$/g, '');
                            if (keywordList[j] == 'lib' || keywordList[j] == 'libs' || keywordList[j] == 'library' || keywordList[j] == 'libraries') {
                                showLanguage = false;
                                for (k=0; k<inputList.length; k++){
                                    // examine if input contains (similar,equivalent)
                                    if (inputList[k] == 'similar' || inputList[k] == 'equivalent'){
                                        // -----> do switch 2
                                        tomTask = 2;
                                        input = input.replace(inputList[k], '').replace(/ +/g, ' ').replace(/^ */g, '').replace(/ *$/g, '');
                                        k = inputList.length; // quit for-loop
                                    }
                                }
                            } // if contains (lib||library)
                            else {
                                if (keywordList[j] == 'language' || keywordList[j] == 'languages'){
                                    showLibrary = false;
                                }
                            }

                            j = keywordList.length; // for break purpose (quit for-loop)
                            i = inputList.length; // for break purpose (quit for-loop)
                        } // if contains (keywords)
                    } // for j
                } // for i
            }

            // get tag (graph content)
            console.log('---'+ input +'---');
            console.log(input.replace(/#/g,"+++").replace(/ /g,"&&"));                    //"replace" method can only replace the first occurrence, so we use regex here
            var result = $.ajax({type: "GET", url: "https://graphofknowledge.appspot.com/tagidjson/"+input.replace(/#/g,"+++").replace(/ /g,"&&"), async: false}).responseText;
            tag = result.split("&&")[0];                         //the tag
            graphResult = result.split("&&")[1];                 //the kg
            if (tag == ""){
                // no tag returned
                if (rsLanguage) { // rsLanguage is not null
                    input = input + '&&' + rsLanguage; // retrieve the initial input
                    console.log('---'+ input +'---');
                    result = $.ajax({type: "GET", url: "https://graphofknowledge.appspot.com/tagidjson/"+input.replace(/#/g,"+++").replace(/ /g,"&&"), async: false}).responseText;
                    tag = result.split("&&")[0];                         //the tag
                    graphResult = result.split("&&")[1];
                    if (tag == ''){
                        // still no tag returned
                        tomTask = -1;
                    }
                }
                else {
                    // no rsLanguage (and also no tag)
                    tomTask = -1;
                }
            }
        }
        else {
            // ------> do switch -1 only (do nothing)
            tomTask = -1; // more than 6 spaces in the input, do nothing
            console.log('the input is too long');
        }
    }

    for (tom_i=0; tom_i<1; tom_i++){ // i_control may be changed, then do switch again
        switch(tomTask){
            case -1:
                // do nothing
                break;
            default:
                // wiki and top-questions (right panels)
                // (1) Get tagWiki content
                var wikiResult = JSON.parse($.ajax({type: "GET", url: "https://api.stackexchange.com/2.2/tags/"+tag.split("_").pop().replace(/#/g,"%23")+"/wikis?site=stackoverflow", async: false}).responseText);
                str_HTML = '';

                if (wikiResult["items"] && wikiResult["items"].length != 0 && graphResult != "") { // the first term means xxx is not null, and both wiki data and graph data exists
                    // Insert tagWiki into right column
                    str_HTML += '<div class="panel-heading"><div class="row"><div class="col-md-5">'+ tag +'</div><div class="col-md-1"> </div><div class="col-md-6">Asking trend in Stack Overflow</div></div></div><div style="font-size:0.875em;"><div class="row"><div class="col-md-5" id="wikiPanelL"><div class="panel-body">';
                    str_HTML += '<p>'+ wikiResult["items"][0]["excerpt"] +'</p>';

                    // Insert a link to knowledge graph website
                    var linkURL = "";
                    // Direct to techGraph or techTask pages
                    if (tag.indexOf("_") == -1)
                       {linkURL = "https://graphofknowledge.appspot.com/tagid/" +tag.replace(/#/g,"+++");}
                    else
                       {linkURL = "https://graphofknowledge.appspot.com/techtask/" +tag.replace(/#/g,"+++").replace("_","&");}

                    str_HTML += '<span style="font-style:italic;font-size:0.875em;">Refer to <a href="'+ linkURL +'" target="_blank">'+ linkURL.substr(0,37) +' <span class="glyphicon glyphicon-option-horizontal"></span> <span class="glyphicon glyphicon-arrow-right"></span></a></span>';
                    //buttonPosition.onclick = redirectToUrl(tag.replace("#","+++"));

                    str_HTML += '</div></div><div class="col-md-7" id="wikiPanelR"><svg id="trendGraph"></svg></div></div></div>'; // add trend graph panel<html>, only after rendering drawing function could be called

                    var wikiPanel = document.createElement("div");
                    wikiPanel.id = "wiki";
                    wikiPanel.className = "panel panel-primary";
                    wikiPanel.innerHTML = str_HTML;
                    rightColumn.appendChild(wikiPanel);

                    // rendering(drawing) trend graph
                    var trendData = {};
                    trendData = $.ajax({
                        type: "GET",
                        url: 'https://128.199.241.136:9001/tagTrend/' + tag.replace(/#/g,"+++").replace(/ /g,"&&"),
                        async: false,
                        dataType: 'json',
                    });
                    console.log(trendData); // for debug purpose

                    if (trendData['readyState'] == 4 && trendData['status'] == 200) {
                        if (trendData.responseJSON['tag_trend'].length > 0) { // returned value is not null
                            var chartWidth = parseInt((winWidth/2-30) * (7/12) - 27);
                            var chartHeight = parseInt((winWidth/2-30) * (7/12) * (5/11));
                            var chartTopMargin = parseInt(document.getElementById('wikiPanelL').offsetHeight - document.getElementById('wikiPanelR').offsetHeight);
                            if (chartTopMargin > 0){
                                chartTopMargin = parseInt((document.getElementById('wikiPanelL').offsetHeight - chartHeight) / 2);
                                chartHeight += chartTopMargin;
                            }
                            else {
                                chartTopMargin = 0;
                            }
                            document.getElementById('trendGraph').style.height = chartHeight + 'px';
                            document.getElementById('trendGraph').style.width = chartWidth + 'px';
                            tagTrend(trendData.responseJSON['tag_trend'], chartWidth, chartHeight, chartTopMargin, "#trendGraph");
                        }
                    } // if (trend data exist and returned correctly)
                } // if (wiki and graph exist)

                // (2) insert [A]insert related content and knowledge graph
                // and get [C-A]related technologies/tools/libraries (from inside of knowledge graph); (C-A1) add to top panel; (C-A2) add to right panel
                // and get [C-B]related languages (from inside of knowledge graph); (C-B1) add to top panel; (C-B2) add to right panel
                // and get [C-C]other concepts from knowledge graph (AllTags = Lib + Language + Other); (C-C1) add to top panel; (C-C2) add to right panel
                var relatedLib = {};
                relatedLib = $.ajax({
                    type: "GET",
                    url: 'https://128.199.241.136:9001/similarLib/' + tag.replace(/#/g,"+++").replace(/ /g,"&&"),
                    async: false,
                    dataType: 'json',
                });
                console.log(relatedLib); // for debug purpose
                if (relatedLib['readyState'] == 4 && relatedLib['status'] == 200) {
                    if (relatedLib.responseJSON['lib_list'].length > 0) { // returned value is not null
                        var kgWidth = parseInt((winWidth/2-30) * (7/12) - 20);
                        var kgHeight = parseInt((winWidth/2-30) * (7/12) - 20);
                        var numForDisplay = parseInt((kgHeight - 90) / 35); // used to measure related-lib/concepts panel (341px display 7; 381px--8; 413--9; 522--12)

                        // (A)
                        str_HTML = '';
                        str_HTML += '<div class="panel-heading"><div class="row"><div class="col-md-5">Related';
                        if (relatedLib.responseJSON['lib_list'].length >= numForDisplay || relatedLib.responseJSON['language_list'].length >= numForDisplay || relatedLib.responseJSON['concept_list'].length >= numForDisplay){
                            str_HTML += '<button id="hideRightBtn" type="button" class="btn btn-xs pull-right" style="background-color:#AABBCC; color:white;">show more <span class="glyphicon glyphicon-chevron-down"></span></button>';
                        }
                        str_HTML += '</div><div class="col-md-1"> </div><div class="col-md-6">Knowledge Graph</div></div></div>';
                        str_HTML += '<div class="row"><div class="col-md-5" id="kgGraphPanelL">';
                        str_HTML += '<ul class="nav nav-tabs"><li class="active"><a data-toggle="tab" href="#kgTab1" style="line-height:8px;font-size:0.75em;">Libraries</a></li><li><a data-toggle="tab" href="#kgTab2" style="line-height:8px;font-size:0.75em;">Languages</a></li><li><a data-toggle="tab" href="#kgTab3" style="line-height:8px;font-size:0.75em;">Concepts</a></li></ul><div class="tab-content">';
                        str_HTML += '<div id="kgTab1" class="tab-pane fade in active"></div>';
                        str_HTML += '<div id="kgTab2" class="tab-pane fade"><p>tom2</p></div>';
                        str_HTML += '<div id="kgTab3" class="tab-pane fade"><p>snoopy 3</p></div>';
                        str_HTML += '</div></div><div class="col-md-7" id="kgGraphPanelR"><svg id="kgGraph"></svg></div></div>';
                        var kgPanel = document.createElement('div');
                        kgPanel.id = "kgPanel";
                        kgPanel.className = "panel panel-info";
                        kgPanel.innerHTML = str_HTML;
                        rightColumn.appendChild(kgPanel);

                        if (graphResult != "") { // knowledge graph data is not null
                            var graphContent =  JSON.parse(graphResult);
                            var edgeDistance = 80*graphContent["links"].length/graphContent["nodes"].length;      //the edge distance depends on the ratio of edge and node number

                            var scaleAdj = kgWidth / 500; // default width of the chart is 500px (500px width is the best fit)
                            var scaleAdj = parseInt(Math.sqrt(scaleAdj*scaleAdj) * 10) / 10; // square scale or linear scale
                            var kgTopMargin = parseInt(document.getElementById('kgGraphPanelL').offsetHeight - document.getElementById('kgGraphPanelR').offsetHeight);
                            if (kgTopMargin > 0){
                                kgTopMargin = parseInt((document.getElementById('wikiPanelL').offsetHeight - kgHeight) / 2);
                                kgHeight += kgTopMargin;
                            }
                            else {
                                kgTopMargin = 0;
                            }
                            document.getElementById('kgGraph').style.height = kgHeight + 'px';
                            document.getElementById('kgGraph').style.width = kgWidth + 'px';

                            knowledgeGraph(graphContent, kgWidth, kgHeight, 0, edgeDistance, "#kgGraph", scaleAdj);
                        } // if (knowledge graph data exists)

                        // (C-A2)
                        if (showLibrary){
                            str_HTML = '';
                            for (var i=0; i<relatedLib.responseJSON['lib_list'].length; i++) {
                                if (i >= numForDisplay) {
                                    str_HTML += '<div id="lib_right_div'+i+'" style="display:none"><abbr title="'+ relatedLib.responseJSON['lib_list'][i][0] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['lib_list'][i][0] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['lib_list'][i][0].substr(0,20) +'</a></pre></abbr></div>';
                                } else {
                                    str_HTML += '<abbr title="'+ relatedLib.responseJSON['lib_list'][i][0] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['lib_list'][i][0] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['lib_list'][i][0].substr(0,20) +'</a></pre></abbr>';
                                }
                            }
                            document.getElementById('kgTab1').innerHTML = str_HTML;
                        }

                        // (C-B2)
                        if (showLanguage){
                            str_HTML = '';
                            for (var i=0; i<relatedLib.responseJSON['language_list'].length; i++) {
                                if (i >= numForDisplay) {
                                    str_HTML += '<div id="lang_right_div'+i+'" style="display:none"><abbr title="'+ relatedLib.responseJSON['language_list'][i] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['language_list'][i] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['language_list'][i].substr(0,20) +'</a></pre></abbr></div>';
                                } else {
                                    str_HTML += '<abbr title="'+ relatedLib.responseJSON['language_list'][i] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['language_list'][i] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['language_list'][i].substr(0,20) +'</a></pre></abbr>';
                                }
                            }
                            document.getElementById('kgTab2').innerHTML = str_HTML;
                        }

                        // (C-C2)
                        if (showConcept){
                            str_HTML = '';
                            for (var i=0; i<relatedLib.responseJSON['concept_list'].length; i++) {
                                if (i >= numForDisplay) {
                                    str_HTML += '<div id="con_right_div'+i+'" style="display:none"><abbr title="'+ relatedLib.responseJSON['concept_list'][i] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['concept_list'][i] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['concept_list'][i].substr(0,20) +'</a></pre></abbr></div>';
                                } else {
                                    str_HTML += '<abbr title="'+ relatedLib.responseJSON['concept_list'][i] +'"><pre style="padding:3px 10px 3px 10px;"><a href="http://stackoverflow.com/tags/'+ relatedLib.responseJSON['concept_list'][i] +'/info" target="_blank" class="btn btn-link" style="padding:0;">'+ relatedLib.responseJSON['concept_list'][i].substr(0,20) +'</a></pre></abbr>';
                                }
                            }
                            document.getElementById('kgTab3').innerHTML = str_HTML;
                        }
                        $('#hideRightBtn').get(0).onclick = function(){
                            if (this.innerHTML.substr(0,1) == 'h'){
                                for (i=numForDisplay; i<relatedLib.responseJSON['lib_list'].length; i++){
                                    $('#lib_right_div'+i).get(0).style.display = 'none';
                                }
                                for (i=numForDisplay; i<relatedLib.responseJSON['language_list'].length; i++){
                                    $('#lang_right_div'+i).get(0).style.display = 'none';
                                }
                                for (i=numForDisplay; i<relatedLib.responseJSON['concept_list'].length; i++){
                                    $('#con_right_div'+i).get(0).style.display = 'none';
                                }
                                this.innerHTML = 'show more <span class="glyphicon glyphicon-chevron-down"></span>';
                            }
                            else {
                                for (i=numForDisplay; i<relatedLib.responseJSON['lib_list'].length; i++){
                                    $('#lib_right_div'+i).get(0).style.display = '';
                                }
                                for (i=numForDisplay; i<relatedLib.responseJSON['language_list'].length; i++){
                                    $('#lang_right_div'+i).get(0).style.display = '';
                                }
                                for (i=numForDisplay; i<relatedLib.responseJSON['concept_list'].length; i++){
                                    $('#con_right_div'+i).get(0).style.display = '';
                                }
                                this.innerHTML = 'hide... <span class="glyphicon glyphicon-chevron-up"></span>';
                            }
                        }; // $('#hideRightBtn')
                    }
                } // if (tag returned correctly, i.e. not null)
        } // switch
    } // for

} // function gmMain


//Draw knowledge graph
function knowledgeGraph(featureContent, width_raw, height_raw, offset, distance, position, scaleAdjust) {

var margin = {
		top: 0,
		right: 0,
		bottom: 0,
		left: offset
             },
 width = width_raw - margin.left - margin.right,
 height = height_raw - margin.top - margin.bottom;

var border=0;
var bordercolor='gray';

var color = d3.scale.category20();

var svg = d3.select(position).append("svg")
	.attr("border", border)
    .attr("id", "kgInside")
	;

//add border to the svg
var borderPath = svg.append("rect")
       			.attr("x", margin.left)
       			.attr("y", 0)
       			.attr("height", height)
       			.attr("width", width)
       			.style("stroke", bordercolor)
       			.style("fill", "none")
       			.style("stroke-width", border);

    var force = d3.layout.force()
    .gravity(Math.max(Math.min((0.1 - 0.06 / 1.2 * scaleAdjust), 0.07), 0.03)) // (larger scale --> wider/smaller number) 100%-->0.05; 140%-->0.03; 60%-->0.07 (0.03<= x <=0.07)
    .charge(-130)
	  .linkDistance(distance)
    .size([width, height]);

//Set up tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-3, 0])
    .html(function (d) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", "https://api.stackexchange.com/2.2/tags/"+d.name.replace("#","%23")+"/wikis?site=stackoverflow&key=IQXyZwA1rHRM4rguoGZ)xQ((", false );
    xmlHttp.send();
	return  JSON.parse(xmlHttp.responseText)["items"][0]["excerpt"].split(". ")[0] + ".</span>";
});
svg.call(tip);

var json = featureContent;


  force
	  //.alpha(10)
      .nodes(json.nodes)
      .links(json.links)
      .start();

  var link = svg.selectAll(".link")
      .data(json.links)
    .enter().append("line")
	 .style("stroke", function(d) { return color(d.color); })
      .attr("class", "link");


  var node = svg.selectAll(".node")
      .data(json.nodes)
	    .enter().append("g")
      .attr("class", "node")
      .call(force.drag)
	    .on('dblclick', reDirect)
	    .on('mouseover', connectedNodes)
	    .on('mouseout', allNodes)
	    .on('contextmenu', function(d){d3.event.preventDefault();tip.show(d);})
      .on('mouseleave', tip.hide)
	  ;

    node.append("circle")
    //.attr("r", function(d) { return parseInt(d.degree * scaleAdjust);})
      .attr("r", function(d) { return parseInt(d.degree);})
      .style("fill", function (d) {return color(d.group);});

  node.append("text")
      .attr("dx", 3)           //It means the offset of label and circle
      .attr("dy", ".35em")
      .text(function(d) { return d.name; })
      //.style("stroke", "gray")
      .style("font-weight", "bold")
      .style("font-family", "Arial")
      .style("font-size",function(d) { return (Math.max(10,parseInt(d.degree*1.6)))+'px'; });

  force.on("tick", function() {
	var radius = 10;
	//node.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
    //   .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
    if (scaleAdjust>1){
        scaleAdjust = 1; // no need to increase the edge length (even if it is zoomed-in), but it should decrease the edge length if it is zoomed-out
    }
    node.attr("transform", function(d) { return "translate(" + (Math.max(radius, Math.min(width - radius, d.x)) * scaleAdjust) + "," + (Math.max(radius, Math.min(height - radius, d.y)) * scaleAdjust) + ")"; });

	link.attr("x1", function(d) { return (d.source.x * scaleAdjust); })
        .attr("y1", function(d) { return (d.source.y * scaleAdjust); })
        .attr("x2", function(d) { return (d.target.x * scaleAdjust); })
        .attr("y2", function(d) { return (d.target.y * scaleAdjust); });

	//node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });

  var linkedByIndex = {};
  for (i = 0; i < json.nodes.length; i++)
  {
     linkedByIndex[i + "," + i] = 1;
  };

  json.links.forEach(
   function (d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
   });

   //This function looks up whether a pair are neighbours
  function neighboring(a, b) {

    return linkedByIndex[a.index + "," + b.index];
  }

    function connectedNodes() {
        //Reduce the opacity of all but the neighbouring nodes
        d = d3.select(this).node().__data__;
        //console.log(d.name);
		node.style("opacity", function (o) {
            return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
        });
        link.style("opacity", function (o) {
            return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
        });

    }

  function allNodes()
  { node.style("opacity", 1);
    link.style("opacity", 1);}

  function reDirect()
  {
  d = d3.select(this).node().__data__;
  //console.log(d.name.replace("#", "%23"));
  window.location.assign("http://graphofknowledge.appspot.com/tagid/"+d.name.replace("#", "+++"));  //c# --> c%23
  //document.getElementById('tag').value= d.name;
  }
} // function knowledgeGraph


//------------------------------------
// All css files should appear in the end of the document, so as to load the document content faster
// add bootstrap css
$("head").append (
    '<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" type="text/css">'
);

// css for trend graph
var cssTrendGraph = '<style type="text/css">';
cssTrendGraph += '.axis path, .axis line { fill: none; stroke: #000; shape-rendering: crispEdges; }';
cssTrendGraph += '.line { fill: none; stroke: steelblue; stroke-width: 2px; }';
cssTrendGraph += '</style>';
$("head").append(cssTrendGraph);
