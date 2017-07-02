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

        this.cats = {
            "all": "All industries",
            "low": "Low wage industries",
            "middle": "Middle wage industries",
            "high": "High wage industries"
        }

        this.catsArray = Object.keys(this.cats);

        this.theScatterplot = new scatterplot({
            element: document.querySelector(`.scatterplot.chart`),
            data: monthsData,
            lookup: industryLookup
        });
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

        this.nav = d3.select("#arrowNav");
        this.nav.selectAll(".total-count").html(this.catsArray.length);
        this.nav.selectAll(".nav-increment").on("click", function() {
        	let dir = d3.select(this).attr("data-direction") === "forward" ? 1 : -1;
        	_this.updateCat(dir);
        });

        //this.updateMonth();
        this.timer.start();
    }


   	updateCat(dir) {
   		this.curr += dir;

   		if (this.curr >= this.catsArray.length -1) {
   			this.curr = this.catsArray.length - 1;
   		} else if (this.curr <= 0) {
   			this.curr = 0;
   		}

   		this.currCat = this.catsArray[this.curr];

   		this.nav.selectAll(".chart-hed").html(this.cats[this.currCat]);
   		this.nav.selectAll(".current-index").html(this.curr+1);

   		this.catsArray.forEach(c=>{
   			d3.select(".chart").classed(c, false);
   		});

   		d3.select(".chart").classed(this.currCat, true);
   		
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