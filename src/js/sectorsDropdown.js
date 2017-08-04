'use strict';

const d3 = require("d3");
let trackEvent = require('./analytics.js').trackEvent;

function searchBar(vizConfig) {

    //let selector = "select.chosen-select"
    let options = vizConfig.options || []; // array of strings for the dropdown
    let placeholder = vizConfig.placeholder || "Search for industry..."; // string for placeholder
    let noResultsText = vizConfig.placeholder || "No match found";

    let sectors = [];
    let sectorsObj = {};

    vizConfig.vizData.forEach(d=> {

        let obj = {
            desc : d.sector,
            sector : d.sector
        }
        
        if (!sectorsObj[d.sector]) {
            sectorsObj[d.sector] = obj;
        }
        
    });

    Object.keys(sectorsObj).forEach(d=>{
        sectors.push(sectorsObj[d]);
    })

    sectors.sort((a,b) => {
        return sortArray(a.desc,b.desc);
    });

    vizConfig.vizData.sort(function(a, b) {
        return sortArray(a.val, b.val);
    });

    d3.select(vizConfig.selector)
        .insert("div", ":first-child")
        .attr("class", "header-search")
        .append("select")
        .attr("id", "industry-select")
        .html(d=> {
            return `<option value="default">${vizConfig.placeholder}</option>
                    <option value="pos">Projected to gain jobs, 2014-2024</option>
                    <option value="neg">Projected to lose jobs, 2014-2024</option>`
        })
        // .attr("data-placeholder", placeholder)
        //.classed("chosen-select", true)
        .selectAll("option.sector")
        .data(sectors)
        .enter().append("option")
        .attr("class", "sector")
        .attr("value", "default")
        .text(d=> {
            return d.desc;
        })
        .attr('value', function(d) {
            return d.sector;
        })

    d3.select("#industry-select")
        .on("change", function() {
            let val = d3.select(this).property('value');
            val = val === "default" ? null : val;

            trackEvent('dropdown-selection',val);

            let sel = vizConfig.context.plot.selectAll(".dot").filter(d => {
                return d.sector === val;
            });

            let ttParams = {
                sel : sel,
                id : val,
                type : "desc",
                persist : false
            }
            
            console.log(ttParams);

            if (!val) {
                vizConfig.context.currCat = "all";
                vizConfig.context.clearHighlight();
                vizConfig.context.updateCat("button");
            } else if (val === "pos" || val === "neg") {
                vizConfig.context.currCat = val;
                vizConfig.context.updateCat("button");
                d3.select("button.clear").classed("active", true);
            } else {
                vizConfig.context.currCat = "all";
                vizConfig.context.updateCat("button");
                vizConfig.context.setHighlight(ttParams);
            }

        });

    d3.select("button.clear").on("click", d => {
        d3.select("#state-select").property('value', 'default');
        vizConfig.context.clearHighlight(null, null);        
        vizConfig.context.currCat = "all";
        vizConfig.context.updateCat("button");
    });

    function sortArray(a,b) {
        a = a.toUpperCase(); // ignore upper and lowercase
        b = b.toUpperCase(); // ignore upper and lowercase

        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }

        // names must be equal
        return 0;
    }


}


module.exports = searchBar;