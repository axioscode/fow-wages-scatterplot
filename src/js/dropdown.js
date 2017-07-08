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

    vizConfig.vizData.forEach(d=> {
        if (sectors.indexOf(d.sector) < 0) {
            sectors.push(d.sector);
        }
    });

    sectors.sort((a,b) => {
        return sortArray(a,b);
    });

    vizConfig.vizData.sort(function(a, b) {
        return sortArray(a.val, b.val);
    });

    let optGroups = d3.select(vizConfig.selector)
        .insert("div", ":first-child")
        .attr("class", "header-search")
        .append("select")
        .attr("id", "industry-select")
        .html(d=> {
            return `<option value="default">${vizConfig.placeholder}</option>`;
        })
        //.classed("chosen-select", true)
        .selectAll("optgroup")
        .data(sectors)
        .enter().append("optgroup")
        .attr("label", sector=> {
            return sector;
        });

    let omit = [];

    let opts = optGroups.selectAll("option")
        .data(sector => {
            return vizConfig.vizData.filter(d=> {
                return d.sector === sector;
            })
        })
        .enter().append("option")
        .attr("value", "default")
        .text(function(d) {
            if (d) {
                return d.val;
            } else {
                return placeholder;
            }
        })
        .attr('value', function(d) {
            if (d) {
                return d.id;
            } else {
                return "default";
            }
        });

    d3.select("#industry-select")
        .on("change", function() {
            let val = d3.select(this).property('value');
            val = val === "default" ? null : val;

            let sel = vizConfig.context.plot.selectAll(".dot").filter(d => {
                return d.id === val;
            });

            vizConfig.context.setHighlight(sel, val, true);
        });

    d3.select("button.clear").on("click", d => {
        d3.select("#industry-select").property('value', 'default');
        vizConfig.context.ttLive = false;
        vizConfig.context.clearHighlight();
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