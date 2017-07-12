var setupVisualsGoogleAnalytics = require('./analytics.js').setupVisualsGoogleAnalytics;
var trackEvent = require('./analytics.js').trackEvent;

var pym = require('pym.js');
var pymChild = null;


let d3 = require("d3");
import lineChart from "./lineChart";
import scatterplot from "./scatterplot";
// import indeedData from '../data/output.json';
import makeTimer from "./makeTimer";
import searchBar from "./sectorsDropdown";
import industryLookup from '../data/industryLookup.json';
import monthsData from '../data/monthsData.json';


document.addEventListener("DOMContentLoaded", main());

function main() {

    class makeChart {

        constructor(opts) {
            this.init();
            this._setNav();
            //this._setIntro();
            this.curr = 0;
            this.index = 0;
        }

        init() {

            //Initiate the scatterplot.
            this.theScatterplot = new scatterplot({
                element: document.querySelector(`.scatterplot.chart`),
                data: monthsData,
                lookup: industryLookup,
                currCat: "all",
                aspectHeight : .6
            });
            // ***** //

            //Create array of industries for dropdown.
            let industriesArray = [];

            Object.keys(industryLookup).forEach(d => {
                let obj = {
                    id: d,
                    val: industryLookup[d].industry_name,
                    sector: industryLookup[d].sector,
                    sectorKey: industryLookup[d].sectorKey
                }

                if (industryLookup[d].lineArray.length > 0) {
                    industriesArray.push(obj);
                }

            });

            let dropdown = new searchBar({
                vizData: industriesArray,
                selector: ".header-search",
                placeholder: "All industries",
                context: this.theScatterplot
            });

            d3.select(".search-container").classed("active", true);
            // ***** //

            //DRAW CIRCLES TO SCALE FOR AI KEY
            //console.log(this.theScatterplot.circleScale.domain());

            // let thisVals = [1000, 5000, 10000];

            // d3.select("svg.test").selectAll(".kc")
            // 	.data(thisVals).enter().append("circle")
            // 	.classed("kc", true)
            // 	.attr("cx", 100)
            // 	.attr("cy", 100)
            // 	.attr("r", d => {
            //         return this.theScatterplot.circleScale(d / Math.PI) * this.theScatterplot.scaleFactor;
            //     })
            //     .style("stroke", "#ccc")
            //     .style("stroke-width", 1)
            //     .style("fill", "none");
            // ***** //


        }

        _setNav() {
            let _this = this;

            this.sliderDiv = d3.select('.interface-bar');
            this.sliderDiv.classed('is-playing', true);

            let months = this.theScatterplot.months; //Pull months array from scatterplot

            this.slider = d3.select('#slider').attr("max", months.length - 2).attr("value", 0);

            this.timer = new makeTimer({
                speed: 200,
                onUpdate: function() {
                    _this.index++;

                    if (_this.index >= (months.length - 2)) { // - 2 bc wages lag by 1 month.
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
            }

            this.slider.on('click change input', function() {
                pauseTimer();
                _this.index = +this.value;
                _this.updateMonth(true);
            });

            this.parseTime = d3.timeParse("%Y%m");
            this.formatDate = d3.timeFormat("%b %Y");

            this.buttons = d3.selectAll(".cat-nav button").on("click", function() {
                _this.theScatterplot.currCat = d3.select(this).attr("val");
                _this.theScatterplot.updateCat("button");
            });

            this.timer.start();

            // d3.select("button.clear").on("click", d => {
            //     d3.select("#industry-select").property('value', 'default');
            //     this.theScatterplot.ttLive = false;
            //     this.theScatterplot.clearHighlight();
            // });

        }


        _setIntro() {

            let _this = this;
            let cycle = ["Accommodation and Food Services", "Construction", "Manufacturing", "Finance and Insurance"];

            let introIndex = 0;
            this.introTimer = new makeTimer({
                speed: 5000,
                onUpdate: function() {

                    introIndex++;

                    if (introIndex >= cycle.length - 1) {
                        introIndex = 0;
                    }

                    updateIntro();

                }
            });

            updateIntro();

            function updateIntro() {

                let val = cycle[introIndex];
                let sel = _this.theScatterplot.plot.selectAll(".dot").filter(d => {
                    return d.sector === val;
                });

                let ttParams = {
                    sel: sel,
                    id: val,
                    type: "desc",
                    persist: false
                }

                _this.theScatterplot.setHighlight(ttParams);
            }

            this.introTimer.start();

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

    var pymChild = new pym.Child();


    d3.select(window).on("resize", d => {
        theChart.theScatterplot.update();
    });

}