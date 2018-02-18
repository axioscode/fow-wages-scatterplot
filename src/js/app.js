let setupVisualsGoogleAnalytics = require('./analytics.js').setupVisualsGoogleAnalytics();
let trackEvent = require('./analytics.js').trackEvent;

let pym = require('pym.js');
let pymChild = null;

import {
    timeParse,
    timeFormat,
    select
} from "d3";


import lineChart from "./lineChart";
import scatterplot from "./scatterplot";
// import indeedData from '../data/output.json';
import makeTimer from "./makeTimer";
import searchBar from "./sectorsDropdown";
import industryLookup from '../data/industryLookup.json';
import monthsData from '../data/monthsData.json';


const sectorLookup = {
    "11": "Agriculture, Forestry, Fishing and Hunting",
    "21": "Mining, Quarrying, and Oil and Gas Extraction",
    "22": "Utilities",
    "23": "Construction",
    "31": "Manufacturing",
    "32": "Manufacturing",
    "33": "Manufacturing",
    "42": "Wholesale Trade",
    "44": "Retail Trade",
    "45": "Retail Trade",
    "48": "Transportation and Warehousing",
    "49": "Transportation and Warehousing",
    "51": "Information",
    "52": "Finance and Insurance",
    "53": "Real Estate and Rental and Leasing",
    "54": "Professional, Scientific, and Technical Services",
    "55": "Management of Companies and Enterprises",
    "56": "Administrative and Support and Waste Management and Remediation Services",
    "61": "Educational Services",
    "62": "Health Care and Social Assistance",
    "71": "Arts, Entertainment, and Recreation",
    "72": "Accommodation and Food Services",
    "81": "Other Services (except Public Administration)",
    "92": "Public Administration",
    "PART 238": "Specialty Trade Contractors",
    "-": "Federal, State or Local Government (no wage data available)"
};




document.addEventListener("DOMContentLoaded", main());

function main() {

    let pymChild = new pym.Child();

    class makeChart {

        constructor(opts) {

            this.index = 0;
            this.defaultSector = sectorLookup[checkParam("sector")] ? sectorLookup[checkParam("sector")] : null;

            this.init();
            this._setNav();

        }

        init() {

            let _this = this;

            //Initiate the scatterplot.
            this.theScatterplot = new scatterplot({
                element: document.querySelector(`.scatterplot.chart`),
                data: monthsData,
                lookup: industryLookup,
                currCat: "Construction",
                aspectHeight: .6,
                onReady: function() {
                    pymChild.sendHeight();
                }
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

            //select(".search-container").classed("active", true);
            // ***** //

            //DRAW CIRCLES TO SCALE FOR AI KEY
            //console.log(this.theScatterplot.circleScale.domain());

            // let thisVals = [1000, 5000, 10000];

            // select("svg.test").selectAll(".kc")
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

            if (this.defaultSector) {
                this.setDefault();
            }



        }

        _setNav() {
            let _this = this;

            this.sliderDiv = select('.interface-bar');
            this.sliderDiv.classed('is-playing', true);

            let months = this.theScatterplot.months; //Pull months array from scatterplot

            this.slider = select('#slider').attr("max", months.length - 2).attr("value", 0);

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

            select('.ac-start').on('click', () => {
                if (_this.index >= (months.length - 2)) {
                    _this.index = 0;
                }
                startTimer();
                trackEvent('start-button', 'single');
            });

            select('.ac-pause').on('click', () => {
                pauseTimer();
                trackEvent('pause-button', 'single');
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
                _this.updateMonth(true); //boolean indicates whether update is coming from slider.
            });

            this.parseTime = timeParse("%Y%m");
            this.formatDate = timeFormat("%b %Y");

            this.timer.start();

        }


        updateMonth(slider) {

            let str = this.theScatterplot.months[this.index];
            let dateObj = this.parseTime(str);

            select("#time").html(this.formatDate(dateObj));

            this.slider.node().value = this.index;
            this.theScatterplot.index = this.index;
            this.theScatterplot.updateDots(slider);

        }



        setDefault() {

            let sel = this.theScatterplot.plot.selectAll(".dot").filter(d => {
                return d.sector === this.defaultSector;
            });

            let params = {
                sel: sel,
                id: this.defaultSector,
                type: "desc",
                persist: false
            }

            this.theScatterplot.setHighlight(params);
        }



    }


    function checkParam(name, url) {

        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }






    let theChart = new makeChart();
    pymChild.sendHeight();


    select(window).on("resize", d => {
        theChart.theScatterplot.update();

        if (theChart.defaultSector) {
            theChart.setDefault();
        }
    });

}


