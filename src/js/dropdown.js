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

    // let optGroups = d3.select(vizConfig.selector)
    //     .insert("div", ":first-child")
    //     .attr("class", "header-search")
    //     .append("select")
    //     .attr("id", "state-select")
    //     .html(d=> {
    //         return `<option value="default">${vizConfig.placeholder}</option>`;
    //     })
    //     //.classed("chosen-select", true)
    //     .selectAll("optgroup")
    //     .data(sectors)
    //     .enter().append("optgroup")
    //     .attr("label", sector=> {
    //         return sector;
    //     });

    // let opts = optGroups.selectAll("option")
    //     .data(sector => {
    //         return vizConfig.vizData.filter(d=> {
    //             return d.sector === sector;
    //         })
    //     })
    //     .enter().append("option")
    //     .attr("value", "default")
    //     .text(function(d) {
    //         if (d) {
    //             return d.val;
    //         } else {
    //             return placeholder;
    //         }
    //     })
    //     .attr('value', function(d) {
    //         if (d) {
    //             return d.id;
    //         } else {
    //             return "default";
    //         }
    //     });
        

    d3.select(vizConfig.selector)
        .insert("div", ":first-child")
        .attr("class", "header-search")
        .append("select")
        .attr("id", "state-select")
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
            console.log(d);

            return d.desc;
        })
        .attr('value', function(d) {
            return d.sector;
        })

    d3.select("#state-select")
        .on("change", function() {
            let val = d3.select(this).property('value');
            val = val === "default" ? null : val;

            let sel = vizConfig.context.plot.selectAll(".dot").filter(d => {
                return d.sector === val;
            });

            vizConfig.context.highlight(sel, val);
        });

    d3.select("button.clear").on("click", d => {

        d3.select("#state-select").property('value', 'default');

        vizConfig.context.highlight(null, null);
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