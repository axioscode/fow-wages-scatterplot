'use strict';

const d3 = require("d3");
// const $ = require("jQuery");
// window.$ = $;
// window.jQuery = $;
// require("chosen-js");

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
            return `<option value="default">${vizConfig.placeholder}</option>`;
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

            let sel = vizConfig.context.plot.selectAll(".dot").filter(d => {
                return d.sector === val;
            });

            let ttParams = {
                sel : sel,
                id : val,
                type : "desc",
                persist : false
            }

            if (!val) {
                vizConfig.context.clearHighlight();
            } else {
                vizConfig.context.setHighlight(ttParams);
            }

        });

    d3.select("button.clear").on("click", d => {
        d3.select("#state-select").property('value', 'default');
        vizConfig.context.clearHighlight(null, null);
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