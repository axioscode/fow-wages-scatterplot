var setupVisualsGoogleAnalytics = require('./analytics.js').setupVisualsGoogleAnalytics;
var trackEvent = require('./analytics.js').trackEvent;

var pym = require('pym.js');
var pymChild = null;


let d3 = require("d3");
import lineChart from "./lineChart";
import scatterplot from "./scatterplot";
// import indeedData from '../data/output.json';
import makeTimer from "./makeTimer";
import searchBar from "./dropdown";
import industryLookup from '../data/industryLookup.json';
import monthsData from '../data/monthsData.json';


document.addEventListener("DOMContentLoaded", main());

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

        let jobsArray = [];

        Object.keys(industryLookup).forEach(d => {
            let obj = {
                id: d,
                val: industryLookup[d].industry_name
            }
            jobsArray.push(obj);
        });

        let dropdown = new searchBar({
            vizData: jobsArray,
            selector: ".header-search",
            placeholder: "All industries",
            noResultsText: "No match found",
            context: this.theScatterplot
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

        this.sliderDiv = d3.select('.interface-bar');
        this.sliderDiv.classed('is-playing', true);

        let months = this.theScatterplot.months;

        this.slider = d3.select('#slider').attr("max", months.length - 2).attr("value", 0);

        this.timer = new makeTimer({
            speed: 200,
            onUpdate: function() {
                _this.index++;

                if (_this.index >= (months.length - 2)) {
                    pauseTimer();
                }

                _this.updateMonth();
            }
        });

        d3.select('.ac-start').on('click', () => {
            if (_this.index >= (months.length - 2)) {
                _this.index = 0;
            }
            startTimer();
        });

        d3.select('.ac-pause').on('click', () => {
            pauseTimer();
        });

        function startTimer() {
            _this.sliderDiv.classed('is-playing', true);
            _this.timer.start();
        }

        function pauseTimer() {
            _this.sliderDiv.classed('is-playing', false);
            _this.timer.pause();

            // if (_this.index >= (months.length - 2)) {
            // 	_this.timer.pause();
            // }


        }

        this.slider.on('click change input', function() {
            pauseTimer();
            _this.index = +this.value;
            _this.updateMonth(true);
        });

        this.parseTime = d3.timeParse("%Y%m");
        this.formatDate = d3.timeFormat("%b %Y");

        let cats = ["wages", "projections"];

        this.buttons = d3.selectAll(".cat-nav button").on("click", function() {
            let val = d3.select(this).attr("val");

            _this.theScatterplot.currCat = val;
            _this.theScatterplot.updateCat();

            _this.buttons.classed("active", false);
            d3.select(this).classed("active", true);

            cats.forEach(c => {
                d3.select(".scatterplot.chart").classed(c, false);
            })

            d3.select(".scatterplot.chart").classed(val, true);

        });

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



function main() {
    var pymChild = new pym.Child();

    let theChart = new makeChart();

    d3.select(window).on("resize", d => {
        theChart.theScatterplot.update();
    });

}