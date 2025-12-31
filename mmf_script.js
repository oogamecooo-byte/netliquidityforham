/*jshint -W069 */
/*jshint -W117 */
//"use strict";

function updatePopovers() {
        //apply the popovers to all of the keywords
        $('.info-keyword').each(function () {
            var $pElem = $(this);
            $pElem.popover(
                {
                    trigger: 'hover',
                    template: '<div class="popover info-popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
                    "html": true,
                    container: 'body',
                     delay: {
                           hide: 500
                    },
                    content: function () {
                        var $source = $('#popover-source-'+$(this).data('sourceid'));
                        return $source.html();
                    }

                }
            );
        });
}

function loadDates(name){
    // Function makes an Ajax call to load As-of and Updated dates to footnote text.
    $.ajax({
        url: "/money-market-funds/data/"+name+".json",
        dataType: 'json',
        crossDomain: true,
        async: false,
        type: "GET",
        success: function (data) {
            if(name=='asof'){
                $('#'+name).html(data[name]); // Added MMF data As-of date to #asof
            }else if(name=='updated'){
                $('#'+name).html(data[name]); // Added MMF data updated date to #updated
            }
        },
        error: function(xhr){
            throw new Error("An error occurred:"+ " " + name + " " + xhr.status + " " + xhr.statusText);
        },
    });
}

//extend bootstrap popover to stay open when mouseover
(function () {
    var originalLeave = $.fn.popover.Constructor.prototype.leave;
    $.fn.popover.Constructor.prototype.leave = function(obj){
        var self = obj instanceof this.constructor ?
            obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type);
        var container, timeout;

        originalLeave.call(this, obj);

        if(obj.currentTarget) {
            container = $('.popover');
            timeout = self.timeout;
            container.one('mouseenter', function(){
                //We entered the actual popover so call off the dogs
                clearTimeout(timeout);
                //Let's monitor popover content instead
                container.one('mouseleave', function(){
                    $.fn.popover.Constructor.prototype.leave.call(self, self);
                });
            });
        }
    };
})();

function subtitleMaker(mmfBlock) {
    if (!mmfBlock.metadata.subtitles) {
        return;
    }
    var subs = mmfBlock.metadata.subtitles;
    var currLevel = mmfBlock.metadata.currentDrilldownLevel;

    var txt = subs[currLevel];
    var rTxt = '';

    //find the curly braces and there values
    var startPos = 0;
    var endPos = txt.length;
    var rStrings = [];

    while (txt.indexOf('{',startPos) > -1) {
        startPos = txt.indexOf('{', startPos);
        if (startPos == -1) break;
        endPos = txt.indexOf('}',startPos);
        startPos =startPos+1;
        endPos =endPos;
        rStrings.push(txt.slice(startPos,endPos));

    }

    //process the tags in each curly braces
    for (var i = 0; i < rStrings.length; i++) {
        if (rStrings[i].slice(0,1) === '') {continue;}
        var levelInt = parseInt(rStrings[i].slice(0,1));
        rTxt = mmfBlock.metadata.drilldown[levelInt]['filter_values'][0];
        var slash = rStrings[i].indexOf('|');
        if (slash > 0) {
            var tags = rStrings[i].slice(slash).toUpperCase();
            if (tags.indexOf('L') > 0) {rTxt = rTxt.toLowerCase();} //make it lower case
            if (tags.indexOf('U') > 0) {rTxt = rTxt.toUpperCase();} //make it upper case
            if (tags.indexOf('T') > 0) {rTxt = toTitleCase(rTxt);} //make it title case
            if (tags.indexOf('S') > 0) { //make it possessive
                if (rTxt.slice(rTxt.length-1,rTxt.length) == 's') {rTxt = rTxt+'‘'; } //if the last character is a lowercase s then just apostrophe, acronyms get 's
                else {rTxt = rTxt+'‘s';}
            }
            if (tags.indexOf('P') > 0) { //make it plural
                 if (rTxt.slice(rTxt.length-1,rTxt.length).toLowerCase() == 's') {rTxt = rTxt+'es';}
                 else if (rTxt.toLowerCase() == 'municipal') {rTxt = 'municipalities';} //specific muni exception
                 else if (rTxt.toLowerCase() == 'other') {rTxt = 'miscellaneous sectors';}
                    else {rTxt = rTxt+'s';}
            }
            if (tags.indexOf('D') > 0) { //add a definite article to an abbreviation
                if (rTxt == rTxt.toUpperCase()) {rTxt = 'the '+rTxt;}
            }
        }
        txt = txt.replace('{'+rStrings[i]+'}',rTxt);
    }

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    return txt;
}

function updateExtras(mmfBlock) {
    var extrasDiv = $("<div/>");
    var dataButton = $('<button/>');
    var csvData = [].concat(mmfBlock.allSeries).reverse();

    dataButton.append("Download Chart Data");
    dataButton.css("margin-right","5px");
    dataButton.addClass("btn btn-primary btn-sm data-button");
    dataButton.click(function (e) {
        e.stopImmediatePropagation();
        saveData(csvData, 'ofrdata.csv');
    });
    var helpButton = $('<span/>', {
        "aria-label": "Help"});
    helpButton.addClass("help-button glyphicon glyphicon-question-sign");
    helpButton.click(function () {
        $('#myModal').modal('show');
    });

    extrasDiv.append(dataButton, helpButton);
    $('#' + mmfBlock.extrasElement).html(extrasDiv);

 /* // Entire dataset download button
    var extrasDiv = $("<div style='display:inline;'/>");
    var dataDiv = $("<div class='dropdown' id='dropdownMenu3' style='display:inline;'/>");
    var dataButton = $('<button data-toggle="dropdown" class="btn btn-info"><span id="dropdown_title3">Download data </span><span class="caret"></span></button><ul class="dropdown-menu" ><li><a id="chart-data" tabindex="-1" href="#">Chart Data</a></li><li><a id="complete-dataset" tabindex="-1" href="/money-market-funds/data/mmf_data.zip">Complete Dataset</a></li></ul>');
    var csvData = [].concat(mmfBlock.allSeries).reverse();

    dataButton.css("margin-right","15px");
    var helpButton = $('<span style="float:right;display:inline;"/>', {
            "aria-label": "Help"});
    helpButton.addClass("help-button glyphicon glyphicon-question-sign");
    helpButton.click(function () {
        $('#myModal').modal('show');
    });
    dataDiv.append(dataButton);
    extrasDiv.append(dataDiv, helpButton);
    $('#' + mmfBlock.extrasElement).html(extrasDiv);
    $('#chart-data').click(function (e) {
        e.preventDefault();
        saveData(csvData, 'ofrdata.csv');
    }); */
}

function applyInputTextFilter(mmfBlock) {
    let searchElement = $('#' + mmfBlock.searchElement);
    let searchClear = searchElement.find('[data-clear-input = true]');
    let searchInput = searchElement.find('[name ="searchInput"]');

    searchClear.on('click', function() {
        searchInput.val('');
        searchInput.trigger("keyup");
    });

    //add a search filter to key up pause
    var timer = 0;
    searchInput.keyup('keyup', function (e) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            filterSeriesLegendItems(mmfBlock, searchInput.val());
            if(searchInput.val().length >= 1){
                searchClear.css("display", "inline");
            }else{
                searchClear.css("display", "none");
            }
        }, 200);
    });


    // Add a mouse event listener for IE10 clear search box event
    // There are 2 events fired on input element when clicking on the clear button:
    // mousedown and mouseup.
    searchInput.bind("mouseup", function (e) {
        var thisBox = $(this),
            oldValue = thisBox.val();

        if (oldValue === "") return;

        // When this event is fired after clicking on the clear button
        // the value is not cleared yet. We have to wait for it.
        setTimeout(function () {
            var newValue = thisBox.val();

            if (newValue === "") {
                // Gotcha
                searchInput.trigger("keyup");
            }
        }, 1);
    });



}

function eventResetZoom(event) {
    mmfBlock = event.data.mmfBlock;
    mmfBlock["chartedSeries"] = mmfBlock["legendSeries"];
    $("#buttonResetZoom").remove();
    redrawChart(mmfBlock, true);
}

function redrawChart(mmfBlock, reset, zoom) {
    if (zoom === undefined) {
        delete mmfBlock['chartOptions']['yAxis']['min'];
        delete mmfBlock['chartOptions']['yAxis']['max'];

    }
    var allSeries = aggregateSeries(mmfBlock['chartedSeries'],100);
    mmfBlock['chartOptions']['series'] = allSeries.reverse();
    if ( ( chartObject = $('#' + mmfBlock.chartElement).highcharts() === undefined) || (reset === true) ) {
        $('#' + mmfBlock.chartElement).highcharts(mmfBlock.chartOptions);
        $('#' + mmfBlock.chartElement).highcharts()['mmfBlock'] = mmfBlock;
    }
    else {
        chartObject = $('#' + mmfBlock.chartElement).highcharts();
        chartObject['mmfBlock'] = mmfBlock;
        while(chartObject.series.length > 0)
            chartObject.series[0].remove(true);
        allSeries.map( function(series) {
            chartObject.addSeries(series, false);
        });
        chartObject['userOptions']['chart']['events']['selection'] = eventChartZoom;
        if (zoom !== undefined) {
            chartObject.xAxis[0].setExtremes(zoom[0],zoom[1]);
            chartObject.yAxis[0].setExtremes(zoom[2],zoom[3]);

        }
        chartObject.redraw();
    }
    if (zoom !== undefined) {
        $("#buttonResetZoom").remove();
        buttonResetZoom = $("<button>", {
                "id": "buttonResetZoom"
        });
        buttonResetZoom.css("margin-top", "10px");
        buttonResetZoom.append("Reset Zoom");
        buttonResetZoom.click({"mmfBlock": mmfBlock}, eventResetZoom);
        $('#' + mmfBlock.extrasElement).append(buttonResetZoom);

    }


}

function updateCaption(mmfBlock) {
    $('#' + mmfBlock.captionElement).html('<p>' + mmfBlock.caption + '</p>');
}

function buildRequestObject(mmfBlock) {
    //create the json object for the drilldown filters
    var filters = [];
    for (var i = 0; i < mmfBlock.metadata.currentDrilldownLevel; i++) {
        filters.push({
            'name': mmfBlock.metadata.drilldown[i]['mnemonic'],
            'values': mmfBlock.metadata.drilldown[i]['filter_values']
        });
    }

    //Add filter for current level if it exists
    if (mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel]['filter_values'].length > 0) {
        filters.push({
            'name': mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel]['mnemonic'],
            'values': mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel]['filter_values']
        });
    }

    //setup json db request object
    var requestObj = {
        index: mmfBlock.metadata.index,
        measure: mmfBlock.metadata.measure,
        function: mmfBlock.metadata.func,
        series: mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel]["mnemonic"],
        filter: JSON.stringify(filters),
        dataset: mmfBlock.metadata.dataset
    };
    return requestObj;

}

function updateChartObject(mmfBlock, seriesData) {
    var seriesLegend = [];
    var colorIndex = 0;
    for (let i=0; i < seriesData['highcharts'].length; i++) {
        var tmp = {};
        tmp['color'] = defaultColorPalette[colorIndex];
        tmp['name'] = seriesData['highcharts'][i]['name'];
        tmp['data'] = seriesData['highcharts'][i]['data'];
        colorIndex = (colorIndex + 1) % defaultColorPalette.length;
        seriesLegend.push(tmp);


    }
          if (mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel].mnemonic == 'MFS002' || mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel].mnemonic == 'MFR012') {
            var mySeries = seriesLegend;
            for (let i=0; i<mySeries.length; i++) {
                mySeries[i].borderWidth = 1;
                mySeries[i].borderColor ='White';
                if (mySeries[i].name == 'Prime') {
                    mySeries[i].index = 2;
                    mySeries[i].color = '#FFB6C1';
                }

                if (mySeries[i].name == 'Prime Institutional') {
                    mySeries[i].index = 2;
                    mySeries[i].color = '#FF0066';

                }
                if (mySeries[i].name == 'Prime Retail') {
                    mySeries[i].index = 2;
                    mySeries[i].color = '#cc618c';
                }
               if (mySeries[i].name == 'Government') {
                    mySeries[i].index = 1;
                    mySeries[i].color = '#91e8e1';
                }
                if (mySeries[i].name == 'Government (Fees & Gates)') {
                    mySeries[i].index = 1;
                    mySeries[i].color = '#336699';

                }
                if (mySeries[i].name == 'Government (No Fees & Gates)') {
                    mySeries[i].index = 1;
                    mySeries[i].color = '#5C88DA';

                }
                if (mySeries[i].name == 'Tax Exempt') {
                    mySeries[i].index = 0;
                    mySeries[i].color = '#b1df9f';
                }
                if (mySeries[i].name  == "Tax Exempt Institutional") {
                    mySeries[i].index = 0;
                    mySeries[i].color = '#6CC24A';
                }
                if (mySeries[i].name == 'Tax Exempt Retail') {
                    mySeries[i].index = 0;
                    mySeries[i].color = '#509E2F';
                }

            }
              seriesLegend =   mySeries.sort(function(a, b) {
                  return  parseFloat(a.index) - parseFloat(b.index);
              });
        }
    seriesLegend = seriesLegend.reverse();
    mmfBlock["allSeries"] = seriesLegend;
    mmfBlock["legendSeries"] = seriesLegend;
    mmfBlock["chartedSeries"] = seriesLegend;
    mmfBlock.chartOptions['series'] = mmfBlock["chartedSeries"];
    mmfBlock.chartOptions['legendSeries'] = seriesLegend;
    redrawLegend(mmfBlock["legendElement"], mmfBlock, mmfBlock["legendSeries"]);
    return mmfBlock;


}

function updateFilteredPills(mmfBlock) {

    var filteredDrilldowns = mmfBlock.metadata.drilldown.slice(0,mmfBlock.metadata.currentDrilldownLevel);

    var filteredHTMLFunction = function(metadata) {
        var filter = metadata["filter_values"][0];
        var displayName = metadata["display_name"];

        var filteredDiv = $('<div/>');
        var buttonDiv = $('<div/>', {
            "class": "label-filter-old has-popover",
            "title": displayName
        });

        var innerP = $('<p/>');
        innerP.css("font-weight","normal");
        innerP.append(displayName + " = ");
        var innerSpan = $('<span/>', {
            "class": "filter-value fix-txt-overflow",
            "title": metadata["filter_values"][0],
        });
        innerSpan.css("font-size","14");
        innerSpan.css("font-family","'Prompt', sans-serif");
        innerSpan.append(filter);

        innerP.append(innerSpan);
        buttonDiv.append(innerP);
        filteredDiv.append(buttonDiv);

        $("#sizecalc").html("");
        $("#sizecalc").append($("<div/>").append(filteredDiv).html());
        if ($("#sizecalc").width() > 190) {
            var size = 10;
            do {
                var tmpFilter = filter.slice(0, (size - displayName.length) - filter.length);
                tmpFilter += '...';
                var tmpFilteredDiv = $('<div/>');
                var tmpButtonDiv = $('<div/>', {
                    "class": "label-filter-old has-popover",
                    "title": displayName
                });

                var tmpInnerP = $('<p/>');
                tmpInnerP.css("font-weight","normal");
                tmpInnerP.append(displayName + " = ");
                var tmpInnerSpan = $('<span/>', {
                    "class": "filter-value fix-txt-overflow",
                    "title": metadata["filter_values"][0],
                });
                tmpInnerSpan.css("font-size","14");
                tmpInnerSpan.css("font-family","'Prompt', sans-serif");
                tmpInnerSpan.append(tmpFilter);

                tmpInnerP.append(tmpInnerSpan);
                tmpButtonDiv.append(tmpInnerP);
                tmpFilteredDiv.append(tmpButtonDiv);
                $("#sizecalc").html("");
                $("#sizecalc").append(tmpFilteredDiv);
                filteredDiv = tmpFilteredDiv;
                size += 1;
            }
            while ($("#sizecalc").width() < 190);
        }

        return filteredDiv;
    };

    $('#' + mmfBlock.filteredPillsElement).html(filteredDrilldowns.map(filteredHTMLFunction));


}


function updateCurrentPill(mmfBlock) {
    var currentDrilldown = mmfBlock.metadata.drilldown[mmfBlock.metadata.currentDrilldownLevel];
    var currentHTMLFunction = function(metadata, drillUp) {
            var display_name = metadata["display_name"];
            var filteredDiv = $('<div/>');
            var buttonDiv = $('<div/>', {
                "class": "label-filter-active has-popover",
                "title": display_name
            });

            if (drillUp) {
                var drillUpSpan = $('<span/>', {
                    "class": "drillUpButton pull-right glyphicon glyphicon-circle-arrow-up",
                    "title": "Roll Up"
                });
                drillUpSpan.click({'mmfBlock': mmfBlock}, eventDrillUp);
                buttonDiv.append(drillUpSpan);
            }

            buttonDiv.append($('<p/>', {
                "text": display_name
            }));

            var searchDiv = $("<div/>", {"class": "clearable-input"});

            var searchLabel = $("<label/>", {
                "class": "hidden",
                "for": "search_" + display_name.split(' ').join('_'),
                "text": "Search " + display_name
            });

            var searchInput = $("<input/>", {
                "class": "form-control input-sm",
                "name": "searchInput",
                "type": "search",
                "id": "search_" + display_name.split(' ').join('_'),
                "placeholder": "Search " + display_name,
                "aria-label": "Search " + display_name
            });

            let searchClear = $("<span/>", {
                "data-clear-input": true
            });
            searchClear.append('&times;');
            searchDiv.append(searchLabel, searchInput, searchClear);
            $('#' + mmfBlock.currentPillHeaderElement).html(buttonDiv);
            $('#' + mmfBlock.searchElement).html(searchDiv);
            applyInputTextFilter(mmfBlock);
    };
    var drillUp = ((mmfBlock.metadata.currentDrilldownLevel > 0) ? true : false);
    var currentHTML = currentHTMLFunction(currentDrilldown, drillUp);
}

function updateUnfilteredPills(mmfBlock) {
    var unfilteredDrilldowns = mmfBlock.metadata.drilldown.slice(mmfBlock.metadata.currentDrilldownLevel + 1);

    var unfilteredHTMLFunction = function(metadata, currentDrilldown, index) {
        var displayName = metadata["display_name"];
        
        var filteredDiv = $('<div/>');

        var buttonDiv = $("<div/>", {
            "class": "label-filter-inactive",
            "title": displayName
        });
        var popover = $("<span/>", {
            "class": "help-popover",
            "data-sourceid": "2"
        });
        popover.append("&nbsp".repeat((currentDrilldown + index + 1)*5) + "&#x21B3&nbsp;" + metadata["display_name"]);
        buttonDiv.append(popover);
        filteredDiv.append(buttonDiv);
        return filteredDiv;
    };
    $('#' + mmfBlock.unfilteredPillsElement).html(unfilteredDrilldowns.map(function(x, index) {return unfilteredHTMLFunction(x, mmfBlock.metadata.currentDrilldownLevel, index);}));
}

function updateTitle(mmfBlock) {
    var title = $('<div/>');
    title.append($("<div/>").append($("<h2/>").append(mmfBlock.title)));
    $('#' + mmfBlock.titleElement).html(title.html());
}

function updateSubtitle(mmfBlock) {
    $('#' + mmfBlock.subtitleElement).html('<p>' + subtitleMaker(mmfBlock) + '</p>');
}

function updateCaption(mmfBlock) {
    $('#' + mmfBlock.captionElement).html('<p>' + mmfBlock.caption + '</p>');
}

function updateCredits(mmfBlock) {
    $('#' + mmfBlock.creditsElement).html(mmfBlock.credits);
}

function updateMMFChart(mmfBlock) {
    var requestObj = buildRequestObject(mmfBlock);

    var uris = mmfBlock.metadata.dir_list;
    var dir_path = "";
    for (var i = 0; i < uris.length; i++) {

         dir_path = dir_path + encodeURIComponent(uris[i]) + "/";
    }
    //$.post("portfolio/alchemy.highchart", requestObj, function (result) {
    $.get("/money-market-funds/data/" + dir_path + "data.json", function (result) {
        //post the request to the api

        //var jsonData = JSON.parse(result);
        var jsonData = result;
        var csvData = [].concat(mmfBlock.allSeries).reverse();

        updateFilteredPills(mmfBlock);
        updateCurrentPill(mmfBlock);
        updateUnfilteredPills(mmfBlock);

        mmfBlock = updateChartObject(mmfBlock, jsonData);

        var start = new Date().getTime();
        redrawChart(mmfBlock, true);
        var end = new Date().getTime();
        var time = end - start;
        $('#' + mmfBlock.chartElement).highcharts()['mmfBlock'] = mmfBlock;

        updateTitle(mmfBlock);
        updateSubtitle(mmfBlock);
        updateExtras(mmfBlock);
        updateCaption(mmfBlock);
        updateCredits(mmfBlock);
        updatePopovers();
        loadDates('asof');  //Load As-of date to MMF footnote text from /money-market-funds/data/asof.json
        loadDates('updated');  //Load updated date to MMF footnote text from /money-market-funds/data/updated.json
        mmfBlock.done = true;

        $('#' + mmfBlock.chartElement).find('.data-button').click(function (e) {
            e.stopImmediatePropagation();
            saveData(csvData, 'ofrdata.csv');
        });

    });
}

function eventChartZoom(e) {
    if (e['xAxis']) {
        
        var allSeries = this["mmfBlock"]["legendSeries"];
        var xmin = e['xAxis'][0]['min'];
        var xmax = e['xAxis'][0]['max'];
        var ymin = e['yAxis'][0]['min'];
        var ymax = e['yAxis'][0]['max'];
        validSeriesDates = [];

        //Find all the dates that exist in this zoom by only including the dates within the xmin and xmax date range.
        allSeries.map( function(x) {
            validDates = [];
            x['data'].map( function(x) {
                if ( (x[0] > xmin) && (x[0] < xmax) ) {
                    validDates.push(x);
                }
            });
            if (validDates != []) {
                tmpSeries = {};
                tmpSeries['color'] = x['color'];
                tmpSeries['name'] = x['name'];
                tmpSeries['data'] = validDates;
                validSeriesDates.push(tmpSeries);
            }
        });

        //A hash of all the sums for each date
        var currentSums = {};
        //The series that are still valid for plotting
        var validSeries = [];
        //A hash of the values to feed into the nullSeries so the plot looks correct while only plotting the visible series
        var nullSeries = {};
        nullSeries['color'] = "#000000";
        nullSeries['name'] = "Null";
        nullSeries['data'] = [];
        var allNullSeries = [];
        nullDateDone = {};
        seriesAdded = {};
        validSeriesDates.map( function(x, index) {
            seriesData = x['data'];
            for (var i = 0; i < seriesData.length; i++) {
                var chartDate = seriesData[i][0];
                var seriesSize = seriesData[i][1]; 
                
                if ( !(chartDate in currentSums) ) {
                    currentSums[chartDate] = 0;
                }
                var currentSum = currentSums[chartDate];
                var newSum = currentSums[chartDate] + seriesSize;
                currentSums[chartDate] = newSum;
                if ( ( (currentSum < ymin) && (newSum > ymax) ) || ( (currentSum >= ymin) && (currentSum <= ymax) ) || ( (newSum >= ymin) && (newSum <= ymax) ) ) {
                    if ( !(x["name"] in seriesAdded) ) {
                        var tmpSeries = {};
                        tmpSeries["name"] = x["name"];
                        tmpSeries["color"] = x["color"];
                        tmpSeries["data"] = [];
                        tmpSeries["data"].push([chartDate, seriesSize]);

                        seriesAdded[x["name"]] = tmpSeries;
                        validSeries.push(x);
                    }
                    else {
                        seriesAdded[x["name"]]["data"].push([chartDate, seriesSize]);

                    }
                    if ( !(chartDate in nullDateDone) ) {
                        nullPair = [chartDate,currentSum];
                        var date = new Date(chartDate);
                        var nullSeries = {};
                        if (index === 0) {
                            nullSeries['color'] = "#000000";
                            nullSeries['name'] = "Null";
                        }
                        else {
                            nullSeries['color'] = validSeriesDates[index-1]["color"];
                            nullSeries['name'] = "Aggregated Series";
                        }
                        nullSeries['data'] = [];
                        nullSeries['data'].push(nullPair);
                        allNullSeries.unshift(nullSeries);
                        nullDateDone[chartDate] = currentSum;
                    }
                } 
            }

        });
        newValidSeries = [];
        Object.keys(seriesAdded).forEach( function(key) {
            newValidSeries.push(seriesAdded[key]);
        });
        allNullSeries.map( function(nullSeries) {
            newValidSeries.unshift(nullSeries);
        });

        validSeries.unshift(nullSeries);

        var newYMin = ymin;
        nullSeries["data"].map( function(x) {
            var yVal = x[1];
            newYMin = Math.max(newYMin, yVal);
        });

        var newnewYMin = ((ymax - newYMin) / 20.0) + newYMin;
        mmfBlock = this['mmfBlock'];
        mmfBlock['chartedSeries'] = newValidSeries;
        mmfBlock['chartOptions']['yAxis']['min'] = newnewYMin;
        mmfBlock['chartOptions']['yAxis']['max'] = ymax;
        redrawChart(mmfBlock, true, [xmin, xmax, newnewYMin, ymax]);
    }
    return false;
}


function ChartBlock(element, datatableElement, title, metadata, defaultOptions, caption, credits) {
    this.element = element;
    this.gridElement = element + "_grid";
    this.gridLeftElement = this.gridElement + "_left";
    this.filteredPillsElement = element + "_filteredPills";
    this.currentPillElement = element + "_currentPill";
    this.currentPillHeaderElement = this.currentPillElement + "_header";
    this.searchElement = element + "_search";
    this.legendElement = element + "_legend";
    this.unfilteredPillsElement = element + "_unfilteredPills";
    this.gridRightElement = this.gridElement + "_right";
    this.titleElement = element + "_title";
    this.subtitleElement = element + "_subtitle";
    this.extrasElement = element + "_extras";
    this.chartElement = element + "_chart";
    this.captionElement = element + "_caption";
    this.creditsElement = element + "_credits";
    this.pageSize = 14;

    var gridDiv = $("<div/>", {
        //"class": "row",
        "class": "mmf-grid",
        "id": this.gridElement
    });
    var gridLeftDiv = $("<div/>", {
        //"class": "col-md-3",
        "class": "mmf-left-grid",
        "id": this.gridLeftElement
    });
    var filteredPillsDiv = $("<div/>", {
        "id": this.filteredPillsElement
    });
    var currentPillDiv = $("<div/>", {
        "id": this.currentPillElement
    });
    var currentPillHeaderDiv = $("<div/>", {
        "id": this.currentPillHeaderElement
    });
    var searchDiv = $("<div/>", {
        "id": this.searchElement
    });
    var legendDiv = $("<div/>", {
        "id": this.legendElement
    });
    var unfilteredPillsDiv = $("<div/>", {
        "id": this.unfilteredPillsElement
    });
    var gridRightDiv = $("<div/>", {
        //"class": "col-md-9",
        "class": "mmf-right-grid",
        "id": this.gridRightElement
    });
    var titleDiv = $("<div/>", {
        "class": "chart-title",
        "id": this.titleElement
    });
    titleDiv.css("font-family","'Prompt', sans-serif");
    var subtitleDiv = $("<div/>", {
        "id": this.subtitleElement
    });
    subtitleDiv.css("position","absolute");
    subtitleDiv.css("color","#001871");
    subtitleDiv.css("width","500px");
    subtitleDiv.css("margin-left","95px");
    subtitleDiv.css("margin-bottom","0px");
    subtitleDiv.css("padding-bottom","0px");
    subtitleDiv.css("font-weight","900");
    subtitleDiv.css("font-size","14px");
    subtitleDiv.css("z-index","5");
    subtitleDiv.css("font-family","'Prompt', sans-serif");
    var extrasDiv = $("<div/>", {
        "id": this.extrasElement
    });
    extrasDiv.css("position","absolute");
    extrasDiv.css("right","2%");
    extrasDiv.css("z-index","5");
    var chartDiv = $("<div/>", {
        "id": this.chartElement
    });
    chartDiv.css("margin-top","20px");
    chartDiv.css("padding-top","0px");
    var captionDiv = $("<div/>", {
        "class": "chart-caption",
        "id": this.captionElement
    });
    var creditsDiv = $("<div/>", {
        "id": this.creditsElement
    });
    currentPillDiv.append(currentPillHeaderDiv, searchDiv, legendDiv);
    gridLeftDiv.append(filteredPillsDiv, currentPillDiv, unfilteredPillsDiv);
    gridRightDiv.append(subtitleDiv, extrasDiv, chartDiv);
    gridDiv.append(gridLeftDiv, gridRightDiv, captionDiv, creditsDiv);
    $('#' + this.element).append(titleDiv);
    $('#' + this.element).append(captionDiv);
    $('#' + this.element).append(gridDiv);
    $('#' + this.element).append(creditsDiv);

    this.title = title;
    this.caption = caption;
    this.credits = credits;
    this.chartOptions = $.extend({}, defaultOptions);
    this.chartOptions['metadata'] = JSON.parse(JSON.stringify(metadata));
    this.chartOptions['legend'] = {'enabled': false};
    this.chartOptions['units'] = metadata.units;
    this.chartOptions['chart']['type'] = 'column';
    this.chartOptions['chart']['events'] = {};
    this.chartOptions['chart']['events']['selection'] = eventChartZoom;
    this.metadata = metadata;

    //All the series for this chart
    this.allSeries = [];
    //Series currently visible in the legend
    this.legendSeries = [];
    //Series currently visible in the chart
    this.chartedSeries = [];
}

function ChartMetadata(dataset, index, measure, units, yAxisDesc, drilldown, subtitles, dir_list, startLevel) {
    if (startLevel === undefined) {
        startLevel = 0;
    }

    this.drilldown = drilldown;
    this.currentDrilldownLevel = startLevel;
    this.dataset = dataset;
    this.index = index;
    this.measure = measure;
    this.func = "sum";
    this.units = units;
    this.yAxisDesc = yAxisDesc;
    this.subtitles = subtitles;
    this.dir_list = dir_list;
}




//we will need this for IE
String.prototype.repeat = function (n) {
    n = n || 1;
    return Array(n + 1).join(this);
};

function GetIEVersion() {
    var sAgent = window.navigator.userAgent;
    var Idx = sAgent.indexOf("MSIE");

    // If IE, return version number.
    if (Idx > 0)
        return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));

    // If IE 11 then look for Updated user agent string.
    else if (!!navigator.userAgent.match(/Trident\/7\./))
        return 11;

    else
        return 0; //It is not IE
}

// data is passed in as an ordered array which can be iterated over to create the column names and 
// values.  For the data button in the popover, it is a single element array.  For the data button
// on the actual highchart, mmfBlock.allSeries is the array over which we iterate.
function saveData(data, filename) {
    if (filename === undefined || filename === '') {
        filename = 'ofrdata.csv';
    }
    //prepare the header of the csv file

    var csvContent = '';

    csvContent += 'OFR MMF Monitor Data' + "\n" + "\n";

    //initialize the data matrix matrix

    var dataMatrix = [];
    var colNames = ['Date'];
    var i,j,k;
    var series;
    var datumDate;
    var datumValue;

    for (j = data.length-1; j >= 0; j--) {
        series = data[j];
        colNames.push('"' + series.name + '"');
    }

    var validDates = [];
    for (j = data.length-1; j >= 0; j--) {
        series = data[j];
        for (k = 0; k < series.data.length; k++) {
            datumDate = series.data[k][0];
            datumValue = series.data[k][0];
            //newly encoutered dates need to be added to array
            if (validDates.indexOf(datumDate) == -1) {
                validDates.push(datumDate);
                //
            }

        }
    }
    for (i = 0; i < validDates.length; i++) {
        var currentRow = [validDates[i]];
        for (j = data.length-1; j >= 0; j--) {
            series = data[j];
            var found = 0;
            for (k = 0; k < series.data.length; k++) {
                datumDate = series.data[k][0];
                datumValue = series.data[k][1];
                if (validDates[i] == datumDate) {
                    currentRow.push(datumValue);
                    found = 1;
                    break;
                }
            }
            if (found === 0) {
                currentRow.push('');
            }


        }
        dataMatrix.push(currentRow);
    }

    csvContent += colNames.join(",") + "\n";

    //we need a different loop if we are using IE

    if (GetIEVersion() > 0) {
        //the IE loop
        dataMatrix.forEach(function (a, i, e) {
            var myDate = new Date(a[0]);
            a[0] = '' + (myDate.getMonth() + 1) + '/' + (myDate.getUTCDate()) + '/' + myDate.getFullYear();
            var dataString = a.join(",");
            csvContent += i < dataMatrix.length ? dataString + "\n" : dataString;

        });
    } else {
        //Chrome and everything else loop
        dataMatrix.forEach(function (a, i, e) {
            var myDate = new Date(a[0]);
            a[0] = '' + (myDate.getMonth() + 1) + '/' + (myDate.getUTCDate()) + '/' + myDate.getFullYear();
            var dataString = a.join(",");
            csvContent += i < dataMatrix.length ? dataString + "\n" : dataString;

        });
    }

    var blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

}
