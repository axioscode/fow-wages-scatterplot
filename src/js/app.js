var setupVisualsGoogleAnalytics = require('./analytics.js').setupVisualsGoogleAnalytics;
var trackEvent = require('./analytics.js').trackEvent;

var pym = require('pym.js');
var pymChild = null;


let d3 = require("d3");
import lineChart from "./lineChart";
import scatterplot from "./scatterplot";
// import indeedData from '../data/output.json';
import makeTimer from "./makeTimer";

import industryLookup from '../data/industryLookup.json';
import monthsData from '../data/monthsData.json';


document.addEventListener("DOMContentLoaded", main());

function main() {
    var pymChild = new pym.Child();
}





d3.select(window).on("resize", d => {
    //theScatterplot.update();
});



class makeChart {

    constructor(opts) {
        this.init();
        this._setNav();
        this.curr = 0;
        this.index = 0;
    }

    init() {

        this.theScatterplot = new scatterplot({
            element: document.querySelector(`.scatterplot.chart`),
            data: monthsData,
            lookup: industryLookup,
            currCat: "wages"
        });



        //DRAW CIRCLES TO SCALE FOR AI KEY
        //console.log(this.theScatterplot.circleScale.domain());

        // let thisVals = [100, 1000, 5000, 10000];

        // d3.select("svg.test").selectAll(".kc")
        // 	.data(thisVals).enter().append("circle")
        // 	.classed("kc", true)
        // 	.attr("cx", 100)
        // 	.attr("cy", 100)
        // 	.attr("r", d => {
        // 		//return 4;
        //         return this.theScatterplot.circleScale(d / Math.PI);
        //     })
        //     .style("stroke", "#ccc")
        //     .style("stroke-width", 1)
        //     .style("fill", "none");



    }

    _setNav() {
        let _this = this;

        this.interfaceContainer = d3.select('.interface-bar');
        this.interfaceContainer.classed('is-playing', true);

        let months = this.theScatterplot.months;

        this.slider = d3.select('#slider').attr("max", months.length - 2).attr("value", 0);

        this.timer = new makeTimer({
            speed: 200,
            onUpdate: function() {
                _this.index++;
              
                if (_this.index >= (months.length - 2)) {
                	_this.timer.pause();
                }

                _this.updateMonth();
            }
        });

        d3.select('.ac-start').on('click', () => {
            //analytics.trackEvent('playButton','single');
            this.interfaceContainer.classed('is-playing', true);
            this.timer.start();
        })

        d3.select('.ac-pause').on('click', () => {
            //analytics.trackEvent('pauseButton','single');
            this.interfaceContainer.classed('is-playing', false);
            this.timer.pause();
        })

        this.slider.on('click change input', function() {
            _this.interfaceContainer.classed('is-playing', false);
            _this.timer.pause();
            _this.index = +this.value;
            _this.updateMonth(true);
        });

        this.parseTime = d3.timeParse("%Y%m");
        this.formatDate = d3.timeFormat("%b %Y");

        //this.updateMonth();

        let cats = ["wages", "projections"];

        this.buttons = d3.selectAll("button").on("click", function() {
        	let val = d3.select(this).attr("val");

        	_this.theScatterplot.currCat = val;
        	_this.theScatterplot.updateCat();

        	_this.buttons.classed("active", false);
        	d3.select(this).classed("active", true);

        	cats.forEach(c=> {
        		d3.select(".scatterplot.chart").classed(c, false);
        	})

        	d3.select(".scatterplot.chart").classed(val, true);
        	


        })


        this.timer.start();


    }



    updateMonth(slider) {

        let str = this.theScatterplot.months[this.index];
        let dateObj = this.parseTime(str);

        d3.select("#time").html(this.formatDate(dateObj));

        this.slider.node().value = this.index;
        this.theScatterplot.index = this.index;
        this.theScatterplot.updateDots(slider);

    }







}


let theChart = new makeChart();