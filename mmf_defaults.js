
var defaultColorPalette = ["#001871", /*dark blue*/
    "#5C88DA", /*light purpleish blue*/
    "#6CC24A", /*bright green*/
    "#D65F00", /*burnt organge*/
    "#4EC3E0", /*bright light blue*/
     "#ff0066", /*bright neon pink*/

    "#99cc99", /*lt green*/
    "gray",
    "#001E62", /*deep navy*/

    "#0078BB", /*medium cyan blue*/
    "#509E2F", /*standard medium green*/
    "#91e8e1", /*light cyan*/
    "#663399", /*purple*/
    "#99ccff", /*lt blue*/
    "#666666", /*dk gray*/
    "#cc99cc", /*lt purple*/

    "#0099cc", /*teal*/
    "#ff9966", /*lt orange*/
];

var defaultChartOptions = {
    "height": 530,
    "spacingLeft": 5,
    "spacingRight": 5,
    "spacingTop": 35,
    "zoomType": 'xy',
    "style": {
        "fontFamily": "'AvenirLTStd-Roman', 'Helvetica', sans-serif ",
        "color": "#000000"
    }
};

function tooltipFormatter() {
    var point = this;
    var dataMax = point.series.chart.yAxis[0].dataMax;
    var dataMin = point.series.chart.yAxis[0].dataMin;
    var units = point.series.chart.userOptions.units;
    var unitSize = getValueOrder(dataMax);

    if (units === undefined) {
        units = '';
    }

    var outerDiv = $('<div/>');

    var date = $('<span/>', {
        text: Highcharts.dateFormat("%B %e, %Y", point.key)
    });
    date.css("text-indent", '1em');
    date.css("font-size", '10px');

    var bullet = $('<span/>', {
        text: '\u25CF'
    });
    bullet.css("font-size", '16px');
    bullet.css("font-weight", 'bold');
    bullet.css("color", point.series.color);

    var name = $('<span/>', {
        text: this.series.name
    });
    name.css("font-size", '12px');
    name.css("font-weight", 'bold');

    var value = $('<span/>', {
        text: formatValue(point.y,1,unitSize)
    });
    value.css("font-size", '14px');
    value.css("font-weight", 'bold');

    var unitSpan = $('<span/>', {
        text: units
    });
    unitSpan.css("font-size", '10px');

    outerDiv.append(date, $("<br/>"), bullet, name, ": ", value, " ", unitSpan);

    if (point.series.chart.options.plotOptions.series.stacking === 'normal') {
        var outerSpan = $('<span/>');

        var percentageSpan = $('<span/>', {
            text: point.percentage.toFixed(2) + "%"
        });
        percentageSpan.css("font-size", "12px");
        percentageSpan.css("font-weight", "bold");
        percentageSpan.css("text-align-last", "right");

        var descSpan = $('<span/>', {
            text: " of total"
        });
        descSpan.css("font-size", "10px");

        outerSpan.append(percentageSpan, descSpan);
        outerDiv.append($('<br/>'), outerSpan);

    }

    return outerDiv.html();
}

function getValueOrder(number) {
    return Math.floor(Math.log(number) / Math.log(1000));
}

function formatValue(number, decimals, forceOrder, stripZeroes) {
    decimals = decimals || 1;
    var units = ['', 'k', 'mn', 'bn', 'tn'];
    var order = forceOrder ? forceOrder : getValueOrder(number);
    var formattedNumber = parseFloat((number / Math.pow(1000, order)).toFixed(decimals));
    if (stripZeroes) {
        formattedNumber = formattedNumber === parseFloat(parseInt(formattedNumber)) ? parseFloat(parseInt(formattedNumber)) : formattedNumber;
    }
    return formattedNumber + units[order];
}

function yAxisLabelMaker() {
    var units = this.axis.chart.userOptions.units;
    if (!units) {
        units = '';
    }
    var extremes = this.axis.getExtremes();
    var dataMax;
    var dataMin;

    /*Check if the user has zoomed the chart and get the new max min*/
    if (extremes.userMax || extremes.userMin) {
        dataMax = extremes.userMax;
        dataMin = extremes.userMin;
    }
    else {
        dataMax = extremes.dataMax;
        dataMin = extremes.dataMin;
    }

    var decimals = 1;
    var forceOrder = getValueOrder(dataMax);

    if (this.isLast) {
        return formatValue(this.value, decimals, forceOrder, true) + ' ' + units;
    } else {
        return formatValue(this.value, decimals, forceOrder, true);
    }

}

var defaultChartTooltip = {
    "enabled": true,
    "crosshairs": false,
    "followPointer": true,
    "hideDelay": 0,
    "changeDecimals": 2,
    "shared": false,
    "formatter": tooltipFormatter,
    "useHTML": true,
    "backgroundColor": '#FFF'
};

var defaultPlotOptions = {
    "series": {
        "stacking": 'normal',
        "showCheckbox": false,
        "stickyTracking": false,
        "marker": {
            "enabled": false
        },
        "events": {
            "legendItemClick": function (e) {
                return false;
            }
        },
        "point": {
            "events": {}
        }
    },
    "column": {
        "stickyTracking": false,
        "borderWidth": 0
    }
};

var defaultTitle = {
    "floating": "false",
    x: 5,
    y: 10,
    "align": "left",
    "style": {
        "color": "#001871",
        "fontStyle": "Bold",
        "fontFamily": "'AvenirLTStd-Roman', 'Helvetica'",
        "fontSize": "16px"
    },
    text: ""
};

var defaultLabelFormatter = function () {
    var outerDiv = $('<div/>');
    var link = $('<a/>', {
        'data-contentcall': "legenditem",
        'data-trigger': "click",
        'class': 'has-popover pull-right moreLabel',
        'data-seriesindex': this.index,
        'text': "details"
    });

    var innerSpan = $('<span/>', {
        'class': 'fix-txt-overflow',
        '_i': this.index,
        'title': this.name,
        'text': this.name
    });
    var wrapper = $('<div/>', {
        'class': "legend-item-warpper"
    });

    wrapper.append(innerSpan);
    outerDiv.append(link, wrapper);

    return outerDiv.html();
};

var defaultLegend = {
    layout: 'vertical',
    enabled: true,
    floating: false,
    align: "left",
    "verticalAlign": "top",
    margin: 10,
    padding: 10,
    itemWidth: 175,
    itemMarginBottom: 2,
    itemMarginTop: 1,
    reversed: true,
    useHTML: true,
    "itemStyle": {
        "fontFamily": "'AvenirLTStd-Book', Helvetica",
        "fontSize": "12px",
        "fontWeight": "normal"
    },
    symbolHeight: 8,
    symbolWidth: 8,
    //labelFormatter: defaultLabelFormatter,
    navigation: {
        arrowSize: 20,
        style: {
            fontWeight: 'bold',
            fontSize: 15
        }
    }
};

var defaultYAxis = {
    "opposite": false,
    "showLastLabel": true,
    "lineWidth": 1,
    "lineColor": "#000000",
    "gridLineWidth": 0,
    "tickWidth": 1,
    "tickPosition": "inside",
    "tickColor": "#000000",
    "title": {
        "text": null
    },
    "labels": {
        "style": {
            "color": "#000000",
            "fontFamily": "'AvenirLTStd-Roman', Helvetica"
        },
        "align": 'right',
        "y": 3,
        "x": -5,
        "formatter": yAxisLabelMaker
    }
};

var defaultXAxisTickPositioner = function(){
    var new_values = [];
    $.each(this.tickPositions, function(index, timestamp) {
        var d = new Date(timestamp);
        var month = d.getUTCMonth();
        var year = d.getUTCFullYear();
        new_values.push(new Date(year, month + 1, 0).getTime());
    });
    return new_values;
};

var defaultXAxisLabelFormatter = function(){
    return Highcharts.dateFormat("%b '%y", this.value);
};

var defaultXAxis = {
    "ordinal": false,
    "type": 'datetime',
    "lineWidth": 1,
    "lineColor": "#000000",
    "gridLineWidth": 0,
    "tickWidth": 1,
    "tickPosition": "outside",
    "tickColor": "#000000",
    "title": {
        "text": null
    },
    /* A callback function to compute on what values the ticks should be placed. Returns an array of numbers.
    The min and max of the axis are passed in as the first and second parameter. Options like tickInterval can be
     accessed by this.options.tickInterval. The automatic tick positions are accessible through this.tickPositions
     and can be modified by the callback.Note that in stock charts, the last label is hidden by default by the showLastLabel option.
     Here we take the tickPositions that Highcharts computes for us, and just move them to the last day of each month instead of the first day.
     An issue with highcharts means we also have to include a custom label formatter function, otherwise the labels show up as large numbers
     instead of dates
      */
    "tickPositioner": defaultXAxisTickPositioner,
    "labels": {
        "style": {
            "color": "#000000",
            "fontFamily": "'AvenirLTStd-Roman', Helvetica"
        },
        "formatter": defaultXAxisLabelFormatter
    },
    "dateTimeLabelFormats": { 
        month: '%b \'%y',
        year: '%b \'%y'
    }

};

var ofrMMFChartOptions = {
    "colors": defaultColorPalette,
    "chart": defaultChartOptions,
    "tooltip": defaultChartTooltip,
    "plotOptions": defaultPlotOptions,
    "title": defaultTitle,
    "legend": defaultLegend,
    "yAxis": defaultYAxis,
    "xAxis": defaultXAxis,
    rangeSelector: {
        selected: 5
    },
    navigator: {
        enabled: false
    },
    scrollbar: {
        enabled: false
    },
    credits: {
        enabled: false
    },
    exporting: {
        enabled: true
    }
};
